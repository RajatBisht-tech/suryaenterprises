import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/mongodb";
import Order from "../../../models/Order";
import {
  decodeResponse,
  verifyPhonePeCallbackSignature,
} from "../../../lib/phonepe";
import { enqueuePaymentRecovery } from "../../../lib/paymentRecoveryQueue";

export const dynamic = "force-dynamic";

/**
 * Relays the verified PhonePe event to Payin-Backend webhook
 */
async function forwardToPayinBackend(rawBody, xVerify) {
  const target =
    process.env.PAYIN_BACKEND_PHONEPE_WEBHOOK_URL ||
    `${(process.env.PAYIN_BACKEND_WEBHOOK_URL || "http://localhost:8001/api/webhooks/payu/payment").replace(/\/payu\/payment$/, "")}/phonepe/payment`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(target, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(xVerify ? { "x-verify": xVerify } : {}),
      },
      body: rawBody,
      signal: controller.signal,
      cache: "no-store",
    });

    return response.ok;
  } catch (err) {
    console.error("Payin backend PhonePe forward error:", err.message);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const xVerify = request.headers.get("x-verify") || "";

    let bodyData = {};
    try {
      bodyData = JSON.parse(rawBody);
    } catch (_) {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const base64Response = bodyData.response;
    if (!base64Response) {
      return NextResponse.json({ success: false, error: "Missing base64 response" }, { status: 400 });
    }

    const decoded = decodeResponse(base64Response);
    if (!decoded || !decoded.data) {
      return NextResponse.json({ success: false, error: "Malformed PhonePe payload" }, { status: 400 });
    }

    const merchantTxnId = decoded.data.merchantTransactionId;
    await connectDB();

    const order = await Order.findOne({ transactionId: merchantTxnId });
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const salt = order.gatewaySalt || process.env.PHONEPE_SALT_KEY;
    if (salt && xVerify) {
      const isValid = verifyPhonePeCallbackSignature({
        base64Response,
        saltKey: salt,
        xVerifyHeader: xVerify,
      });

      if (!isValid) {
        return NextResponse.json({ success: false, error: "Invalid PhonePe signature" }, { status: 401 });
      }
    }

    const isSuccess =
      decoded.code === "PAYMENT_SUCCESS" ||
      decoded.data?.state === "COMPLETED";

    if (isSuccess) {
      order.paymentStatus = "paid";
      order.paidAt = new Date();
    } else {
      order.paymentStatus = "failed";
    }

    order.phonepeResponse = decoded;
    if (decoded.data?.transactionId) {
      order.phonepeTransactionId = decoded.data.transactionId;
    }
    await order.save();

    await enqueuePaymentRecovery(order.orderId, {
      kind: "payment",
      eventId: `${order.orderId}:${order.paymentStatus === "paid" ? "success" : "failed"}`,
    });

    // Relay to Payin-Backend
    await forwardToPayinBackend(rawBody, xVerify);

    return NextResponse.json({
      success: true,
      order_id: order.orderId,
      payment_status: order.paymentStatus,
    });
  } catch (error) {
    console.error("PhonePe callback error:", error);
    return NextResponse.json(
      { success: false, error: "Callback processing failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "PhonePe callback endpoint is active",
  });
}
