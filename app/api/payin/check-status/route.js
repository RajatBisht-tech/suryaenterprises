import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/mongodb";
import Order from "../../../models/Order";
import { verifyPayUPayment } from "../../../lib/payu";
import { fetchRazorpayOrder, fetchRazorpayPayment, fetchRazorpayOrderPayments } from "../../../lib/razorpay";
import { checkPhonePeStatus } from "../../../lib/phonepe";
import { refreshOrderPayment } from "../../../lib/paymentStatus";

export const dynamic = "force-dynamic";

function bearer(request) {
  const value = request.headers.get("authorization") || "";
  return value.startsWith("Bearer ") ? value.slice(7).trim() : "";
}

function toResponse(order) {
  const paymentId =
    order.payuPaymentId ||
    order.razorpayPaymentId ||
    order.phonepeTransactionId ||
    null;

  const utr =
    order.payuBankRefNum ||
    order.razorpayPaymentId ||
    order.phonepeTransactionId ||
    null;

  const deepLink =
    order.upiIntent ||
    order.payuQrString ||
    null;

  return {
    status: "success",
    data: {
      order_id: order.orderId,
      transaction_id: order.transactionId,
      payment_status: order.paymentStatus,
      amount: order.subtotal,
      currency: "INR",
      provider: order.provider,
      payment_id: paymentId,
      payu_payment_id: paymentId,
      utr,
      deep_link: deepLink,
      qr_string: deepLink,
    },
    error: null,
  };
}

export async function POST(request) {
  try {
    if (!process.env.PAYIN_API_TOKEN || bearer(request) !== process.env.PAYIN_API_TOKEN) {
      return NextResponse.json({ status: "error", error: "Unauthorized" }, { status: 401 });
    }

    const { order_id } = await request.json();
    if (!order_id) return NextResponse.json({ status: "error", error: "order_id is required" }, { status: 400 });

    await connectDB();
    let order = await Order.findOne({
      $or: [{ orderId: String(order_id) }, { transactionId: String(order_id) }],
    });
    if (!order) return NextResponse.json({ status: "error", error: "Order not found" }, { status: 404 });

    const providerType = String(order.provider || "payu").toLowerCase();

    // 1. Razorpay verification
    if (providerType === "razorpay" && order.paymentStatus !== "paid") {
      try {
        const key = order.gatewayKey || process.env.RAZORPAY_KEY;
        const salt = order.gatewaySalt || process.env.RAZORPAY_SECRET;
        if (key && salt && order.razorpayOrderId) {
          const [rzpOrder, payments] = await Promise.all([
            fetchRazorpayOrder({ key, salt, orderId: order.razorpayOrderId }).catch(() => null),
            fetchRazorpayOrderPayments({ key, salt, orderId: order.razorpayOrderId }).catch(() => null),
          ]);
          const captured = payments?.items?.find((p) => p.status === "captured");
          if (rzpOrder?.isPaid || captured) {
            order.paymentStatus = "paid";
            order.paidAt = new Date();
            const payItem = captured || payments?.items?.[0];
            if (payItem?.id) order.razorpayPaymentId = payItem.id;
            const utr =
              payItem?.acquirer_data?.rrn ||
              payItem?.acquirer_data?.bank_transaction_id ||
              payItem?.acquirer_data?.upi_transaction_id ||
              payItem?.id;
            if (utr) order.payuBankRefNum = utr;
            await order.save();
          }
        }
      } catch (err) {
        console.error("Razorpay verification unavailable:", err.name);
      }
    }
    // 2. PhonePe verification
    else if (providerType === "phonepe" && order.paymentStatus !== "paid") {
      try {
        const merchantId = order.phonepeMerchantId || order.gatewayKey || process.env.PHONEPE_MERCHANT_ID;
        const saltKey = order.gatewaySalt || process.env.PHONEPE_SALT_KEY;
        if (merchantId && saltKey && order.transactionId) {
          const phonepeRes = await checkPhonePeStatus({
            merchantId,
            merchantTransactionId: order.transactionId,
            saltKey,
            isProduction: String(process.env.PHONEPE_ENV || "").toLowerCase() === "production",
          });
          if (phonepeRes?.isPaid) {
            order.paymentStatus = "paid";
            order.paidAt = new Date();
            if (phonepeRes.utr) order.phonepeTransactionId = phonepeRes.utr;
            await order.save();
          } else if (phonepeRes?.isFailed) {
            order.paymentStatus = "failed";
            await order.save();
          }
        }
      } catch (err) {
        console.error("PhonePe verification unavailable:", err.name);
      }
    }
    // 3. PayU verification
    else if (order.transactionId && (order.paymentStatus !== "paid" || !order.payuBankRefNum)) {
      try {
        order = await refreshOrderPayment(order, { verify: verifyPayUPayment, model: Order });
      } catch (error) {
        console.error("PayU verification unavailable:", error.name);
      }
    }

    return NextResponse.json(toResponse(order));
  } catch (error) {
    console.error("Check-status error:", error);
    return NextResponse.json({ status: "error", error: "Unable to check payment status" }, { status: 500 });
  }
}
