import { NextResponse } from "next/server";
import { connectDB } from "../../lib/mongodb";
import Order from "../../models/Order";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { orderId, phone } = await request.json();

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 });
    }

    const cleanId = String(orderId).trim();
    const cleanPhone = String(phone || "").replace(/\D/g, "").slice(-10);

    await connectDB();

    const order = await Order.findOne({
      $or: [
        { orderId: cleanId },
        { orderId: new RegExp(`^${cleanId}$`, "i") },
        { transactionId: cleanId },
        { transactionId: new RegExp(`^${cleanId}$`, "i") },
      ],
    }).lean();

    if (!order) {
      return NextResponse.json(
        { success: false, error: "No order found matching that Order ID" },
        { status: 404 }
      );
    }

    // Optional phone validation if phone provided
    if (cleanPhone && order.customer?.phone) {
      const orderPhone = String(order.customer.phone).replace(/\D/g, "").slice(-10);
      if (orderPhone && orderPhone !== cleanPhone) {
        return NextResponse.json(
          { success: false, error: "The mobile number does not match this order" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        orderId: order.orderId,
        transactionId: order.transactionId,
        amount: order.subtotal,
        paymentStatus: order.paymentStatus,
        provider: order.provider || "payu",
        customerName: `${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`.trim() || "Customer",
        phone: order.customer?.phone || null,
        createdAt: order.createdAt,
        paymentMethod: order.paymentMethod,
        utr: order.payuBankRefNum || order.razorpayPaymentId || order.phonepeTransactionId || null,
      },
    });
  } catch (error) {
    console.error("Track order error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to look up order details" },
      { status: 500 }
    );
  }
}
