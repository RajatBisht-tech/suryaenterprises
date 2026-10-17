import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/mongodb";
import Order from "../../../models/Order";
import { verifyPayUCallbackHash, verifyPayUPayment } from "../../../lib/payu";
import { refreshOrderPayment, verifiedPaymentUpdate } from "../../../lib/paymentStatus";
import { enqueuePaymentRecovery } from "../../../lib/paymentRecoveryQueue";

export const dynamic = "force-dynamic";

/**
 * Optionally relay the verified PayU payload to the Pay-In platform backend so
 * merchant transactions created through it are updated and merchant webhooks fire.
 * The backend re-verifies the PayU hash with the shared salt.
 */
async function forwardToPayinBackend(rawBody) {
  const target = process.env.PAYIN_BACKEND_WEBHOOK_URL;

  if (!target) return true;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: rawBody,
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`Pay-In backend webhook returned HTTP ${response.status}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Pay-In backend webhook forward failed:", error.name);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(request) {
  try {
    const raw = await request.text();
    const params = new URLSearchParams(raw);
    const data = Object.fromEntries(params.entries());

    await connectDB();
    let order = await Order.findOne({ transactionId: data.txnid });
    if (!order) return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });

    const activeSalt = order.payuSalt || process.env.PAYU_SALT;
    if (!verifyPayUCallbackHash(data, activeSalt)) {
      return NextResponse.json({ success: false, error: "Invalid PayU callback hash" }, { status: 400 });
    }

    const expectedAmount = Number(order.subtotal || 0).toFixed(2);
    const receivedAmount = Number(data.amount || 0).toFixed(2);
    if (expectedAmount !== receivedAmount) {
      return NextResponse.json({ success: false, error: "Amount mismatch" }, { status: 400 });
    }

    // The response hash does not cover bank references. Obtain authoritative
    // status and UTR from PayU rather than trusting callback-only fields.
    const provider = await verifyPayUPayment(order.transactionId, {
      key: order.payuKey,
      salt: order.payuSalt,
    });
    const verified = verifiedPaymentUpdate(order, provider);
    const claimsSuccess = ["success", "captured", "paid", "completed"].includes(String(data.status || "").toLowerCase());
    if (!verified || (claimsSuccess && verified.paymentStatus !== "paid" && order.paymentStatus !== "paid")) {
      return NextResponse.json({ success: false, error: "Payment verification unavailable" }, { status: 503 });
    }
    order = await refreshOrderPayment(order, { verify: async () => provider, model: Order });
    // A durable repair also covers PayU->gateway relay timeouts, independently
    // of whether PayU retries its callback or the customer keeps polling.
    await enqueuePaymentRecovery(order.orderId, { kind: "payment",
      eventId: `${order.orderId}:${order.paymentStatus === "paid" ? "success" : "failed"}` });
    if (!await forwardToPayinBackend(raw)) {
      // Do not acknowledge a dropped relay: PayU can retry this idempotent event.
      return NextResponse.json({ success: false, error: "Payment recorded; gateway delivery pending" }, { status: 503 });
    }

    return NextResponse.json({ success: true, order_id: order.orderId, payment_status: order.paymentStatus });
  } catch (error) {
    console.error("PayU callback error:", error);
    return NextResponse.json({ success: false, error: "Callback processing failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ success: true, message: "PayU callback endpoint is active" });
}
