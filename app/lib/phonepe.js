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

function isProdEnv(isProduction = false) {
  if (isProduction) return true;
  const envVal = String(process.env.PHONEPE_ENV || "").toLowerCase().trim();
  return envVal === "production" || envVal === "prod" || envVal === "live";
}

function getPhonePeBaseUrl(isProduction = false) {
  return isProdEnv(isProduction)
    ? "https://api.phonepe.com/apis/hermes"
    : "https://api-preprod.phonepe.com/apis/pg-sandbox";
}

// OAuth Token Cache for PhonePe PG V2 (Standard Checkout)
let cachedOAuthToken = null;
let cachedTokenExpiry = 0;

async function getPhonePeOAuthToken({ clientId, clientSecret, clientVersion = 1, isProduction = false }) {
  const now = Math.floor(Date.now() / 1000);
  if (cachedOAuthToken && cachedTokenExpiry > now + 60) {
    return cachedOAuthToken;
  }

  const tokenUrl = isProdEnv(isProduction)
    ? "https://api.phonepe.com/apis/identity-manager/v1/oauth/token"
    : "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token";

  const body = new URLSearchParams({
    client_id: clientId,
    client_version: String(clientVersion || 1),
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
    cache: "no-store",
  });

  const rawText = await response.text();
  let data;
  try {
    data = JSON.parse(rawText);
  } catch (_) {
    throw new Error(`PhonePe OAuth returned non-JSON (HTTP ${response.status})`);
  }

  if (!response.ok || !data?.access_token) {
    const errorMsg = data?.message || data?.error || `PhonePe OAuth failed (HTTP ${response.status})`;
    throw new Error(errorMsg);
  }

  const tokenType = data.token_type || "O-Bearer";
  cachedOAuthToken = `${tokenType} ${data.access_token}`;
  cachedTokenExpiry = data.expires_at || (now + (data.expires_in || 3600));

  return cachedOAuthToken;
}

/**
 * Creates PhonePe payment intent
 * Supports both:
 * 1) PhonePe Standard Checkout (V2 / OAuth) - modern client_id & client_secret
 * 2) PhonePe Custom Integration (V1) - legacy merchant_id & salt_key
 */
export async function createPhonePeIntent({
  merchantId,
  saltKey,
  saltIndex = 1,
  clientId,
  clientSecret,
  clientVersion = 1,
  amount,
  transactionId,
  customerPhone = "9999999999",
  redirectUrl,
  callbackUrl,
  merchantVpa,
  isProduction = false,
  flow = "UPI_QR",
}) {
  const activeClientId =
    clientId ||
    process.env.PHONEPE_CLIENT_ID ||
    (merchantId && (merchantId.includes("_") || merchantId.startsWith("SU") || merchantId.length > 20) ? merchantId : null) ||
    process.env.PHONEPE_MERCHANT_ID;

  const activeClientSecret =
    clientSecret ||
    process.env.PHONEPE_CLIENT_SECRET ||
    saltKey ||
    process.env.PHONEPE_SALT_KEY;

  const activeClientVersion =
    clientVersion ||
    process.env.PHONEPE_CLIENT_VERSION ||
    saltIndex ||
    1;

  const activeMid = merchantId || process.env.PHONEPE_MERCHANT_ID;
  const activeSalt = saltKey || process.env.PHONEPE_SALT_KEY;
  const activeIndex = saltIndex || process.env.PHONEPE_SALT_INDEX || 1;
  const activeIsProd = isProdEnv(isProduction);

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Invalid payment amount");
  }

  const amountInPaise = Math.round(numericAmount * 100);

  // Check if credentials match V2 OAuth format
  const isV2 = Boolean(
    (activeClientId && (activeClientId.includes("_") || activeClientId.startsWith("SU") || activeClientId.length > 20)) ||
    process.env.PHONEPE_CLIENT_SECRET ||
    process.env.PHONEPE_CLIENT_ID ||
    (activeClientSecret && (activeClientSecret.length >= 32 || activeClientSecret.includes("-")))
  );

  if (isV2) {
    try {
      const authHeader = await getPhonePeOAuthToken({
        clientId: activeClientId,
        clientSecret: activeClientSecret,
        clientVersion: activeClientVersion,
        isProduction: activeIsProd,
      });

      const payUrl = activeIsProd
        ? "https://api.phonepe.com/apis/pg/checkout/v2/pay"
        : "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay";

      const payPayload = {
        merchantOrderId: String(transactionId).slice(0, 63),
        amount: amountInPaise,
        expireAfter: 300,
        paymentFlow: {
          type: "PG_CHECKOUT",
          message: "Surya Enterprises Payment",
          merchantUrls: {
            redirectUrl: redirectUrl || `https://www.suryaenter.in/pay/${transactionId}`,
          },
          paymentModeConfig: {
            version: "V2",
            enabledPaymentModes: [
              {
                type: "UPI",
              },
            ],
          },
        },
      };

      const response = await fetch(payUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
          Accept: "application/json",
        },
        body: JSON.stringify(payPayload),
        cache: "no-store",
      });

      const rawText = await response.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (_) {
        throw new Error(`PhonePe V2 returned non-JSON response (HTTP ${response.status})`);
      }

      if (!response.ok || (data.code && data.code !== "SUCCESS" && !data.redirectUrl)) {
        const error = new Error(data.message || "PhonePe payment initiation failed");
        error.statusCode = response.status;
        error.providerResponse = data;
        throw error;
      }

      const checkoutUrl = data.redirectUrl || null;
      const resolvedVpa =
        (merchantVpa && String(merchantVpa).trim()) ||
        (process.env.PHONEPE_MERCHANT_VPA && String(process.env.PHONEPE_MERCHANT_VPA).trim()) ||
        null;

      const upiDeepLink = resolvedVpa
        ? `upi://pay?pa=${resolvedVpa}&pn=Surya%20Enterprises&am=${numericAmount.toFixed(2)}&cu=INR&tr=${transactionId}`
        : checkoutUrl;

      return {
        paymentId: data.orderId || transactionId,
        txnId: transactionId,
        intentUri: upiDeepLink,
        checkoutUrl,
        merchantVpa: resolvedVpa,
        merchantName: "Surya Enterprises",
        raw: data,
      };
    } catch (v2Err) {
      if (!activeSalt || activeSalt === activeClientSecret) {
        throw v2Err;
      }
      // If V2 fails and there's a separate V1 salt, fallback to V1 below
      console.warn("PhonePe V2 failed, attempting V1 fallback:", v2Err.message);
    }
  }

  // Fallback to PhonePe V1 Integration
  if (!activeMid || !activeSalt) {
    throw new Error("PhonePe Merchant ID and Salt Key are required");
  }

  const basePayload = {
    merchantId: activeMid,
    merchantTransactionId: String(transactionId).slice(0, 36),
    merchantUserId: `U_${String(customerPhone).replace(/\D/g, "").slice(-10) || "GUEST"}`,
    amount: amountInPaise,
    redirectUrl: redirectUrl || `https://www.suryaenter.in/checkout/receipt?txnId=${transactionId}`,
    redirectMode: "REDIRECT",
    callbackUrl: callbackUrl || `https://www.suryaenter.in/api/payin/phonepe-callback`,
    mobileNumber: String(customerPhone).replace(/\D/g, "").slice(-10) || "9999999999",
  };

  const baseUrl = getPhonePeBaseUrl(activeIsProd);
  const endpoint = "/pg/v1/pay";
  const targetUrl = `${baseUrl}${endpoint}`;

  async function executeRequest(instrumentType) {
    const fullPayload = {
      ...basePayload,
      paymentInstrument: { type: instrumentType },
    };
    const base64Payload = encodePayload(fullPayload);
    const xVerify = `${sha256(`${base64Payload}${endpoint}${activeSalt}`)}###${activeIndex}`;

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
        Accept: "application/json",
      },
      body: JSON.stringify({ request: base64Payload }),
      cache: "no-store",
    });

    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (_) {
      throw new Error(`PhonePe returned non-JSON response (HTTP ${response.status})`);
    }

    return { response, data };
  }

  let data = null;
  try {
    const attempt1 = await executeRequest(flow || "UPI_QR");
    if (attempt1.response.ok && attempt1.data?.success) {
      data = attempt1.data;
    } else if (flow !== "PAY_PAGE") {
      const attempt2 = await executeRequest("PAY_PAGE");
      if (attempt2.response.ok && attempt2.data?.success) {
        data = attempt2.data;
      } else {
        data = attempt1.data || attempt2.data;
      }
    } else {
      data = attempt1.data;
    }
  } catch (err) {
    const attempt2 = await executeRequest("PAY_PAGE");
    if (attempt2.response.ok && attempt2.data?.success) {
      data = attempt2.data;
    } else {
      throw err;
    }
  }

  if (!data?.success) {
    const errorMsg = data?.message || "PhonePe payment initiation failed";
    const error = new Error(errorMsg);
    error.statusCode = 400;
    error.providerResponse = data;
    throw error;
  }

  const instrumentResp = data?.data?.instrumentResponse || {};
  const qrData = instrumentResp.qrData || null;
  const intentUrl = instrumentResp.intentUrl || null;
  const redirectUrlResp = instrumentResp.redirectInfo?.url || null;
  const checkoutUrl = redirectUrlResp || intentUrl || qrData || null;

  const upiDeepLink =
    qrData ||
    intentUrl ||
    (merchantVpa
      ? `upi://pay?pa=${merchantVpa}&pn=Surya%20Enterprises&am=${numericAmount.toFixed(2)}&cu=INR&tr=${transactionId}`
      : checkoutUrl);

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
 * Supports both PG V2 and PG V1
 */
export async function checkPhonePeStatus({
  merchantId,
  merchantTransactionId,
  saltKey,
  saltIndex = 1,
  clientId,
  clientSecret,
  clientVersion = 1,
  isProduction = false,
}) {
  const activeClientId =
    clientId ||
    process.env.PHONEPE_CLIENT_ID ||
    (merchantId && (merchantId.includes("_") || merchantId.startsWith("SU") || merchantId.length > 20) ? merchantId : null) ||
    process.env.PHONEPE_MERCHANT_ID;

  const activeClientSecret =
    clientSecret ||
    process.env.PHONEPE_CLIENT_SECRET ||
    saltKey ||
    process.env.PHONEPE_SALT_KEY;

  const activeClientVersion =
    clientVersion ||
    process.env.PHONEPE_CLIENT_VERSION ||
    saltIndex ||
    1;

  const activeMid = merchantId || process.env.PHONEPE_MERCHANT_ID;
  const activeSalt = saltKey || process.env.PHONEPE_SALT_KEY;
  const activeIndex = saltIndex || process.env.PHONEPE_SALT_INDEX || 1;
  const activeIsProd = isProdEnv(isProduction);

  const isV2 = Boolean(
    (activeClientId && (activeClientId.includes("_") || activeClientId.startsWith("SU") || activeClientId.length > 20)) ||
    process.env.PHONEPE_CLIENT_SECRET ||
    process.env.PHONEPE_CLIENT_ID ||
    (activeClientSecret && (activeClientSecret.length >= 32 || activeClientSecret.includes("-")))
  );

  if (isV2) {
    try {
      const authHeader = await getPhonePeOAuthToken({
        clientId: activeClientId,
        clientSecret: activeClientSecret,
        clientVersion: activeClientVersion,
        isProduction: activeIsProd,
      });

      const statusUrl = activeIsProd
        ? `https://api.phonepe.com/apis/pg/checkout/v2/order/${merchantTransactionId}/status`
        : `https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/order/${merchantTransactionId}/status`;

      const response = await fetch(statusUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
          Accept: "application/json",
        },
        cache: "no-store",
      });

      if (response.status === 204) {
        return { success: false, state: "PENDING", isPaid: false, isFailed: false };
      }

      const data = await response.json();
      const isCompleted = data?.state === "COMPLETED";
      const isFailed = data?.state === "FAILED";
      const payment = Array.isArray(data?.paymentDetails) ? data.paymentDetails[0] : null;
      const utr = payment?.transactionId || payment?.utr || data?.orderId || null;

      return {
        success: isCompleted,
        code: data?.state,
        state: data?.state,
        isPaid: isCompleted,
        isFailed,
        utr,
        amount: data?.amount ? data.amount / 100 : null,
        raw: data,
      };
    } catch (err) {
      console.warn("PhonePe V2 status check error:", err.message);
    }
  }

  // Fallback to V1 status check
  if (!activeMid || !merchantTransactionId || !activeSalt) {
    throw new Error("merchantId, merchantTransactionId, and saltKey are required");
  }

  const endpoint = `/pg/v1/status/${activeMid}/${merchantTransactionId}`;
  const xVerify = `${sha256(`${endpoint}${activeSalt}`)}###${activeIndex}`;
  const baseUrl = getPhonePeBaseUrl(activeIsProd);
  const targetUrl = `${baseUrl}${endpoint}`;

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
        "X-MERCHANT-ID": activeMid,
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
