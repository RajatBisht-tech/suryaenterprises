import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { connectDB } from "../../../lib/mongodb";
import Order from "../../../models/Order";
import { createPayUIntent } from "../../../lib/payu";
import { enqueuePaymentRecovery } from "../../../lib/paymentRecoveryQueue";
import { prepareStorefrontPurchase } from "../../../lib/checkoutOrder.mjs";
import catalog from "../../../products/data/products.json";

export const dynamic = "force-dynamic";

function getBearerToken(request) {
  const value = request.headers.get("authorization") || "";
  return value.startsWith("Bearer ")
    ? value.slice(7).trim()
    : "";
}

function makeOrderId() {
  return `SE${Date.now()}${crypto.randomBytes(4).toString("hex")}`;
}

export async function POST(request) {
  try {
    // ---------------------------------
    // 1. Authenticate Surya Pay-In API
    // ---------------------------------
    const expectedToken = process.env.PAYIN_API_TOKEN;
    const providedToken = getBearerToken(request);

    if (!expectedToken || providedToken !== expectedToken) {
      return NextResponse.json(
        {
          status: "error",
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // ---------------------------------
    // 2. Read request
    // ---------------------------------
    const body = await request.json();

    const {
      order_id,
      amount,
      name,
      email,
      mobile,
      productinfo,
      customer_ip,
      device_info,
      expiry_seconds,
      gateway_key,
      gateway_salt,
    } = body;

    // ---------------------------------
    // 3. Validate amount
    // ---------------------------------
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        {
          status: "error",
          error: "amount must be greater than 0",
        },
        { status: 400 }
      );
    }

    // ---------------------------------
    // 4. Validate customer
    // ---------------------------------
    if (!name || !email || !mobile) {
      return NextResponse.json(
        {
          status: "error",
          error: "name, email and mobile are required",
        },
        { status: 400 }
      );
    }

    let purchase = null;
    if (body.items !== undefined) {
      try { purchase = prepareStorefrontPurchase(body, catalog); }
      catch (error) { return NextResponse.json({ status: "error", error: error.message }, { status: 400 }); }
    }

    // ---------------------------------
    // 5. Order ID
    // ---------------------------------
    const finalOrderId = String(order_id || makeOrderId());

    // PayU's _payment transaction id is limited to 25 characters.
    const transactionId = `SP${Date.now()}${crypto.randomBytes(5).toString("hex")}`;

    // ---------------------------------
    // 6. Connect database
    // ---------------------------------
    await connectDB();

    // ---------------------------------
    // 7. Check duplicate order
    // ---------------------------------
    const existingOrder = await Order.findOne({
      orderId: finalOrderId,
    }).lean();

    if (existingOrder) {
      return NextResponse.json(
        {
          status: "error",
          error: "order_id already exists",
        },
        { status: 409 }
      );
    }

    // ---------------------------------
    // 8. Prepare customer information
    // ---------------------------------
    const [firstName, ...lastParts] = String(name)
      .trim()
      .split(/\s+/);

    const lastName = lastParts.join(" ");

    const customerEmail = String(email).trim();
    const customerMobile = String(mobile).trim();

    // ---------------------------------
    // 9. Internal PayU callback URL
    // ---------------------------------
    // Must be the exact public host (the apex domain redirects to www, and
    // PayU will not follow a redirect when posting the callback).
    const baseUrl = String(
      process.env.PUBLIC_BASE_URL || "https://www.suryaenter.in"
    ).replace(/\/+$/, "");

    const callbackUrl =
      `${baseUrl}/api/payin/payu-callback`;

    // ---------------------------------
    // 10. Create local order
    // ---------------------------------
    const order = await Order.create({
      orderId: finalOrderId,

      transactionId,

      customer: {
        firstName,
        lastName,
        email: customerEmail,
        phone: customerMobile,
        ...(purchase?.customer || {}),
      },

      ...(purchase ? { items: purchase.items, orderSource: "storefront" } : { orderSource: "gateway" }),

      subtotal: Number(numericAmount.toFixed(2)),

      paymentStatus: "pending",

      paymentMethod: "payu_dynamic_qr",

      provider: "payu",

      // IMPORTANT:
      // No redirectUrl for internal Surya checkout.
      redirectUrl: null,
    });

    // ---------------------------------
    // 11. Create PayU Dynamic QR
    // ---------------------------------
    try {
      const clientIp =
        customer_ip ||
        request.headers
          .get("x-forwarded-for")
          ?.split(",")[0]
          ?.trim() ||
        request.headers.get("x-real-ip") ||
        "127.0.0.1";

      const userAgent =
        device_info ||
        request.headers.get("user-agent") ||
        "Surya-Enterprise-Payin";

      const expiry =
        Number(expiry_seconds) > 0
          ? Number(expiry_seconds)
          : 1800;

      const payu = await createPayUIntent({
        txnid: transactionId,

        amount: numericAmount,

        productinfo:
          String(
            productinfo ||
            "Surya Enterprise Payment"
          ),

        firstname: firstName,

        email: customerEmail,

        phone: customerMobile,

        successUrl: callbackUrl,

        failureUrl: callbackUrl,

        clientIp,

        deviceInfo: userAgent,

        udf1: finalOrderId,

        key: gateway_key,

        salt: gateway_salt,
      });

      // ---------------------------------
      // 12. Save PayU response
      // ---------------------------------
      order.payuTxnId = payu.txnId;

      order.payuPaymentId = payu.paymentId;

      order.payuMerchantVpa = payu.merchantVpa;

      // The UPI intent URI doubles as the QR payload.
      order.payuQrString = payu.intentUri;

      order.payuKey = gateway_key || process.env.PAYU_KEY;

      order.payuSalt = gateway_salt || process.env.PAYU_SALT;

      order.payuResponse = payu.raw;

      await order.save();

      // Start independent verification while the customer uses the UPI app.
      // Queue outages must never turn a successfully created UPI into FAILED.
      await enqueuePaymentRecovery(finalOrderId);

      // ---------------------------------
      // 13. Return QR to checkout
      // ---------------------------------
      return NextResponse.json({
        status: "success",

        data: {
          transaction_id: transactionId,

          order_id: finalOrderId,

          amount: Number(
            numericAmount.toFixed(2)
          ),

          currency: "INR",

          payment_status: "pending",

          payment_id:
            payu.paymentId,

          merchant_vpa:
            payu.merchantVpa,

          merchant_name:
            payu.merchantName,

          // IMPORTANT: the UPI deep link. Also exposed as qr_string /
          // upi_intent because a UPI intent URI is a valid QR payload.
          deep_link:
            payu.intentUri,

          upi_intent:
            payu.intentUri,

          qr_string:
            payu.intentUri,

          // Optional
          intent_data:
            payu.intentURIData,

          expires_in:
            expiry,
        },

        error: null,
      });
    } catch (payuError) {
      // ---------------------------------
      // 14. PayU failed
      // ---------------------------------
      await Order.updateOne(
        { _id: order._id },
        {
          $set: {
            paymentStatus: "failed",
            paymentError:
              payuError.message ||
              "PayU payment creation failed",
            paymentErrorCode: payuError.providerDiagnostics ? payuError.code : null,
            paymentErrorDetails: payuError.providerDiagnostics || null,
          },
        }
      );

      throw payuError;
    }
  } catch (error) {
    console.error(
      "PayU Pay-In create-order error:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        error:
          error.message ||
          "Unable to create Pay-In order",
        ...(error.providerDiagnostics ? { code: error.code } : {}),
        ...(Number.isSafeInteger(error.retryAfterSeconds) ? { retry_after: error.retryAfterSeconds } : {}),
      },
      { status: 500 }
    );
  }
}
