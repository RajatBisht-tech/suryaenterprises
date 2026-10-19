import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true, required: true },
    transactionId: { type: String, unique: true, sparse: true },
    customer: {
      firstName: String, lastName: String, email: String, phone: String,
      address: String, apartment: String, city: String, state: String, pinCode: String, notes: String,
    },
    items: [{ sku: String, name: String, quantity: Number, price: Number }],
    subtotal: Number,
    orderSource: { type: String, enum: ["storefront", "gateway"] },
    paidAt: Date,
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    paymentMethod: { type: String, default: "payu_dynamic_qr" },
    provider: { type: String, default: "payu" },
    payuTxnId: String,
    payuPaymentId: String,
    payuBankRefNum: String,
    payuMerchantVpa: String,
    payuQrString: String,
    payuKey: String,
    payuSalt: String,
    payuResponse: mongoose.Schema.Types.Mixed,
    paymentError: String,
    paymentErrorCode: String,
    paymentErrorDetails: mongoose.Schema.Types.Mixed,
    redirectUrl: String,
    gatewayKey: String,
    gatewaySalt: String,
    upiIntent: String,
    upiString: String,
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    razorpayResponse: mongoose.Schema.Types.Mixed,
    phonepeTransactionId: String,
    phonepeMerchantId: String,
    phonepeResponse: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
