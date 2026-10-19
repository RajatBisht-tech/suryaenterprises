import crypto from "crypto";

function sha256(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex").toLowerCase();
}

function encodePayload(payload) {
  const jsonStr = typeof payload === "string" ? payload : JSON.stringify(payload);
  return Buffer.from(jsonStr, "utf8").toString("base64");
}

function decodeResponse(base64Str) {
  if (!base64Str || typeof base64Str !== "string") return null;
  try {
    const decoded = Buffer.from(base64Str, "base64").toString("utf8");
    return JSON.parse(decoded);
  } catch (_) {
    return null;
  }
}

function getPhonePeBaseUrl(isProduction = false, merchantId = "") {
  const isProdMid =
    typeof merchantId === "string" &&
    merchantId.startsWith("M") &&
    !merchantId.toUpperCase().includes("UAT") &&
    !merchantId.toUpperCase().includes("TEST");

  return isProduction || isProdMid
    ? "https://api.phonepe.com/apis/hermes"
    : "https://api-preprod.phonepe.com/apis/pg-sandbox";
}

/**
 * Creates PhonePe payment intent (Pay Page / UPI Intent)
 */
export async function createPhonePeIntent({
  merchantId,
  saltKey,
  saltIndex = 1,
  amount,
  transactionId,
  customerPhone = "9999999999",
  redirectUrl,
  callbackUrl,
  merchantVpa,
  isProduction = false,
}) {
  if (!merchantId || !saltKey) {
    throw new Error("PhonePe Merchant ID and Salt Key are required");
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Invalid payment amount");
  }

  const amountInPaise = Math.round(numericAmount * 100);

  const payload = {
    merchantId,
    merchantTransactionId: String(transactionId).slice(0, 36),
    merchantUserId: `U_${String(customerPhone).replace(/\D/g, "").slice(-10) || "GUEST"}`,
    amount: amountInPaise,
    redirectUrl: redirectUrl || `https://www.suryaenter.in/checkout/receipt?txnId=${transactionId}`,
    redirectMode: "REDIRECT",
    callbackUrl: callbackUrl || `https://www.suryaenter.in/api/payin/phonepe-callback`,
    mobileNumber: String(customerPhone).replace(/\D/g, "").slice(-10) || "9999999999",
    paymentInstrument: {
      type: "PAY_PAGE",
    },
  };

  const base64Payload = encodePayload(payload);
  const endpoint = "/pg/v1/pay";
  const xVerify = `${sha256(`${base64Payload}${endpoint}${saltKey}`)}###${saltIndex}`;

  const baseUrl = getPhonePeBaseUrl(isProduction, merchantId);
  const targetUrl = `${baseUrl}${endpoint}`;

  const response = await fetch(targetUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-VERIFY": xVerify,
      Accept: "application/json",
    },
    body: JSON.stringify({ request: base64Payload }),
  });

  const rawText = await response.text();
  let data;
  try {
    data = JSON.parse(rawText);
  } catch (_) {
    throw new Error(`PhonePe returned non-JSON response (HTTP ${response.status})`);
  }

  if (!response.ok || !data?.success) {
    const errorMsg = data?.message || `PhonePe payment initiation failed (HTTP ${response.status})`;
    const error = new Error(errorMsg);
    error.statusCode = response.status;
    error.providerResponse = data;
    throw error;
  }

  const redirectInfo = data?.data?.instrumentResponse?.redirectInfo;
  const intentUrl = data?.data?.instrumentResponse?.intentUrl;
  const checkoutUrl = redirectInfo?.url || intentUrl || null;

  const upiDeepLink = merchantVpa
    ? `upi://pay?pa=${merchantVpa}&pn=Surya%20Enterprises&am=${numericAmount.toFixed(2)}&cu=INR&tr=${transactionId}`
    : checkoutUrl;

  return {
    paymentId: data?.data?.merchantTransactionId || transactionId,
    txnId: transactionId,
    intentUri: upiDeepLink,
    checkoutUrl,
    merchantVpa: merchantVpa || null,
    merchantName: "Surya Enterprises",
    raw: data,
  };
}

/**
 * Checks PhonePe status via Server-to-Server status API
 */
export async function checkPhonePeStatus({
  merchantId,
  merchantTransactionId,
  saltKey,
  saltIndex = 1,
  isProduction = false,
}) {
  if (!merchantId || !merchantTransactionId || !saltKey) {
    throw new Error("merchantId, merchantTransactionId, and saltKey are required");
  }

  const endpoint = `/pg/v1/status/${merchantId}/${merchantTransactionId}`;
  const xVerify = `${sha256(`${endpoint}${saltKey}`)}###${saltIndex}`;
  const baseUrl = getPhonePeBaseUrl(isProduction, merchantId);
  const targetUrl = `${baseUrl}${endpoint}`;

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
        "X-MERCHANT-ID": merchantId,
        Accept: "application/json",
      },
    });

    const data = await response.json();
    const isSuccess = data?.success && (data?.code === "PAYMENT_SUCCESS" || data?.data?.state === "COMPLETED");
    const isFailed = data?.code === "PAYMENT_ERROR" || data?.data?.state === "FAILED";

    return {
      success: data?.success || false,
      code: data?.code,
      state: data?.data?.state,
      isPaid: isSuccess,
      isFailed,
      utr: data?.data?.paymentInstrument?.utr || data?.data?.transactionId,
      amount: data?.data?.amount ? data.data.amount / 100 : null,
      raw: data,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
    };
  }
}

/**
 * Verifies PhonePe S2S Callback signature
 */
export function verifyPhonePeCallbackSignature({ base64Response, saltKey, xVerifyHeader }) {
  if (!base64Response || !saltKey || !xVerifyHeader) return false;
  try {
    const parts = String(xVerifyHeader).split("###");
    const receivedHash = parts[0];
    const computedHash = sha256(`${base64Response}${saltKey}`);

    return crypto.timingSafeEqual(
      Buffer.from(computedHash, "utf8"),
      Buffer.from(receivedHash.toLowerCase(), "utf8")
    );
  } catch (_) {
    return false;
  }
}

export { decodeResponse, encodePayload };
