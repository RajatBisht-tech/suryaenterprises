import crypto from "crypto";

const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

/**
 * Creates a Razorpay Order and returns checkout & UPI details
 */
export async function createRazorpayIntent({
  key,
  salt,
  amount,
  transactionId,
  orderId,
  name,
  email,
  mobile,
  merchantVpa,
  notes = {},
}) {
  if (!key || !salt) {
    throw new Error("Razorpay Key ID and Secret are required");
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Invalid payment amount");
  }

  // Razorpay amount in paise (₹1 = 100 paise)
  const amountInPaise = Math.round(numericAmount * 100);

  const authHeader = `Basic ${Buffer.from(`${key}:${salt}`).toString("base64")}`;

  const payload = {
    amount: amountInPaise,
    currency: "INR",
    receipt: String(transactionId || orderId).slice(0, 40),
    payment_capture: 1,
    notes: {
      orderId: String(orderId || ""),
      transactionId: String(transactionId || ""),
      customerName: String(name || "").slice(0, 50),
      customerEmail: String(email || "").slice(0, 50),
      customerPhone: String(mobile || "").slice(0, 15),
      ...notes,
    },
  };

  const response = await fetch(`${RAZORPAY_API_BASE}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();
  let data;
  try {
    data = JSON.parse(rawText);
  } catch (_) {
    throw new Error(`Razorpay returned non-JSON response (HTTP ${response.status})`);
  }

  if (!response.ok || !data.id) {
    const errorMsg = data.error?.description || data.message || `Razorpay order creation failed (HTTP ${response.status})`;
    const error = new Error(errorMsg);
    error.statusCode = response.status;
    error.providerResponse = data;
    throw error;
  }

  const checkoutUrl = `https://api.razorpay.com/v1/checkout/hosted?order_id=${data.id}`;
  const activeVpa =
    merchantVpa ||
    process.env.RAZORPAY_MERCHANT_VPA ||
    "suryaenterprise391259.rzp@rxairtel";

  // Use Razorpay order ID (data.id) as the 'tr' parameter so the sponsor bank (@rxairtel)
  // and NPCI UPI switch can resolve and accept the payment. tn carries the internal transactionId.
  const upiDeepLink = `upi://pay?pa=${activeVpa}&pn=Surya%20Enterprises&am=${numericAmount.toFixed(2)}&cu=INR&tr=${data.id}&tn=${encodeURIComponent(String(transactionId || ""))}`;

  return {
    orderId: data.id,
    paymentId: data.id,
    txnId: transactionId,
    intentUri: upiDeepLink,
    checkoutUrl,
    merchantVpa: activeVpa,
    merchantName: "Surya Enterprises",
    raw: data,
  };
}

/**
 * Verifies Razorpay payment signature
 * Formula: HMAC_SHA256(order_id + "|" + payment_id, secret) === signature
 */
export function verifyRazorpayPaymentSignature({ orderId, paymentId, signature, secret }) {
  if (!orderId || !paymentId || !signature || !secret) return false;
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf8"),
      Buffer.from(signature, "utf8")
    );
  } catch (_) {
    return false;
  }
}

/**
 * Verifies Razorpay webhook signature
 * Formula: HMAC_SHA256(rawBody, webhookSecret) === x-razorpay-signature
 */
export function verifyRazorpayWebhookSignature({ rawBody, signature, secret }) {
  if (!rawBody || !signature || !secret) return false;
  try {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(typeof rawBody === "string" ? rawBody : JSON.stringify(rawBody))
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(signature, "utf8")
    );
  } catch (_) {
    return false;
  }
}

/**
 * Reconciles/fetches Razorpay Order status
 */
export async function fetchRazorpayOrder({ key, salt, orderId }) {
  if (!key || !salt || !orderId) return null;
  const authHeader = `Basic ${Buffer.from(`${key}:${salt}`).toString("base64")}`;

  try {
    const res = await fetch(`${RAZORPAY_API_BASE}/orders/${orderId}`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    return {
      status: data.status, // "created", "attempted", "paid"
      isPaid: data.status === "paid",
      amount: data.amount ? data.amount / 100 : null,
      amountPaid: data.amount_paid ? data.amount_paid / 100 : null,
      raw: data,
    };
  } catch (_) {
    return null;
  }
}

/**
 * Fetches Razorpay Payment details (UTR, method, status)
 */
export async function fetchRazorpayPayment({ key, salt, paymentId }) {
  if (!key || !salt || !paymentId) return null;
  const authHeader = `Basic ${Buffer.from(`${key}:${salt}`).toString("base64")}`;

  try {
    const res = await fetch(`${RAZORPAY_API_BASE}/payments/${paymentId}`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    return {
      status: data.status, // "captured", "authorized", "failed"
      isCaptured: data.status === "captured",
      utr: data.acquirer_data?.rrn || data.acquirer_data?.bank_transaction_id || data.acquirer_data?.upi_transaction_id || paymentId,
      method: data.method,
      amount: data.amount ? data.amount / 100 : null,
      raw: data,
    };
  } catch (_) {
    return null;
  }
}

/**
 * Fetches all payment attempts and captured UTRs for a Razorpay Order
 */
export async function fetchRazorpayOrderPayments({ key, salt, orderId }) {
  if (!key || !salt || !orderId) return null;
  const authHeader = `Basic ${Buffer.from(`${key}:${salt}`).toString("base64")}`;

  try {
    const res = await fetch(`${RAZORPAY_API_BASE}/orders/${orderId}/payments`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    return {
      count: data.count || (Array.isArray(data.items) ? data.items.length : 0),
      items: Array.isArray(data.items) ? data.items : [],
      raw: data,
    };
  } catch (_) {
    return null;
  }
}
