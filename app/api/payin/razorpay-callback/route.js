import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/mongodb";
import Order from "../../../models/Order";
import {
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
  fetchRazorpayOrder,
} from "../../../lib/razorpay";
import { enqueuePaymentRecovery } from "../../../lib/paymentRecoveryQueue";

export const dynamic = "force-dynamic";

/**
 * Relays the verified Razorpay event to Payin-Backend webhook
 */
async function forwardToPayinBackend(payload, signature) {
  const target =
    process.env.PAYIN_BACKEND_RAZORPAY_WEBHOOK_URL ||
    `${(process.env.PAYIN_BACKEND_WEBHOOK_URL || "http://localhost:8001/api/webhooks/payu/payment").replace(/\/payu\/payment$/, "")}/razorpay/payment`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(target, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(signature ? { "x-razorpay-signature": signature } : {}),
      },
      body: typeof payload === "string" ? payload : JSON.stringify(payload),
      signal: controller.signal,
      cache: "no-store",
    });

    return response.ok;
  } catch (err) {
    console.error("Payin backend Razorpay forward error:", err.message);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";

    let bodyData = {};
    try {
      bodyData = JSON.parse(rawBody);
    } catch (_) {
      // In case of URL encoded form
      const params = new URLSearchParams(rawBody);
      bodyData = Object.fromEntries(params.entries());
    }

    await connectDB();

    // Check if this is a standard webhook or checkout callback
    const paymentEntity = bodyData?.payload?.payment?.entity;
    const orderEntity = bodyData?.payload?.order?.entity;
    const rzpOrderId =
      orderEntity?.id ||
      paymentEntity?.order_id ||
      bodyData?.razorpay_order_id ||
      bodyData?.order_id;
    const rzpPaymentId =
      paymentEntity?.id ||
      bodyData?.razorpay_payment_id ||
      bodyData?.payment_id;

    let order = null;
    if (rzpOrderId) {
      order = await Order.findOne({ razorpayOrderId: rzpOrderId });
    }
    if (!order && bodyData?.notes?.transactionId) {
      order = await Order.findOne({ transactionId: bodyData.notes.transactionId });
    }
    if (!order && bodyData?.notes?.orderId) {
      order = await Order.findOne({ orderId: bodyData.notes.orderId });
    }

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const secret = order.gatewaySalt || process.env.RAZORPAY_SECRET;

    // Verify signature if secret is available
    let isValid = true;
    if (secret) {
      if (bodyData.razorpay_signature) {
        isValid = verifyRazorpayPaymentSignature({
          orderId: rzpOrderId,
          paymentId: rzpPaymentId,
          signature: bodyData.razorpay_signature,
          secret,
        });
      } else if (signature) {
        isValid = verifyRazorpayWebhookSignature({
          rawBody,
          signature,
          secret,
        });
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid Razorpay signature" },
        { status: 400 }
      );
    }

    // Update order status
    order.paymentStatus = "paid";
    order.paidAt = new Date();
    if (rzpPaymentId) order.razorpayPaymentId = rzpPaymentId;
    if (bodyData.razorpay_signature || signature) {
      order.razorpaySignature = bodyData.razorpay_signature || signature;
    }
    const utr =
      paymentEntity?.acquirer_data?.rrn ||
      paymentEntity?.acquirer_data?.bank_transaction_id ||
      paymentEntity?.acquirer_data?.upi_transaction_id ||
      rzpPaymentId;
    if (utr) order.payuBankRefNum = utr;
    order.razorpayResponse = bodyData;
    await order.save();

    await enqueuePaymentRecovery(order.orderId, {
      kind: "payment",
      eventId: `${order.orderId}:success`,
    });

    // Relay to Payin-Backend
    await forwardToPayinBackend(bodyData, signature);

    return NextResponse.json({
      success: true,
      order_id: order.orderId,
      payment_status: "paid",
    });
  } catch (error) {
    console.error("Razorpay callback error:", error);
    return NextResponse.json(
      { success: false, error: "Callback processing failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Razorpay callback endpoint is active",
  });
}
