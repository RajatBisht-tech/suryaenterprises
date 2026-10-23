import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { connectDB } from "../../../lib/mongodb";
import Order from "../../../models/Order";
import { createPayUIntent } from "../../../lib/payu";
import { createRazorpayIntent } from "../../../lib/razorpay";
import { createPhonePeIntent } from "../../../lib/phonepe";
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
      provider = "payu",
      gateway_key,
      gateway_salt,
      gateway_credential_provider,
      merchant_vpa,
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

    const reqProvider = String(provider || "payu").toLowerCase().trim();
    const credentialProvider = String(gateway_credential_provider || "").toLowerCase().trim();
    const hasCompatibleGatewayCredentials = !credentialProvider || credentialProvider === reqProvider;
    const configuredGatewayKey = hasCompatibleGatewayCredentials ? gateway_key : undefined;
    const configuredGatewaySalt = hasCompatibleGatewayCredentials ? gateway_salt : undefined;

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

      paymentMethod: `${String(provider || "payu").toLowerCase().trim()}_dynamic_qr`,

      provider: String(provider || "payu").toLowerCase().trim(),

      gatewayKey: configuredGatewayKey || null,

      gatewaySalt: configuredGatewaySalt || null,

      // IMPORTANT:
      // No redirectUrl for internal Surya checkout.
      redirectUrl: null,
    });

    // ---------------------------------
    // 11. Create Gateway Payment
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

      let paymentResult = null;

      if (reqProvider === "razorpay") {
        const rzp = await createRazorpayIntent({
          key: configuredGatewayKey || process.env.RAZORPAY_KEY,
          salt: configuredGatewaySalt || process.env.RAZORPAY_SECRET,
          amount: numericAmount,
          transactionId,
          orderId: finalOrderId,
          name: `${firstName} ${lastName}`.trim(),
          email: customerEmail,
          mobile: customerMobile,
          merchantVpa: merchant_vpa,
          notes: { productinfo: String(productinfo || "Surya Enterprise Purchase") },
        });

        order.razorpayOrderId = rzp.orderId;
        order.razorpayPaymentLinkId = rzp.paymentLinkId;
        order.gatewayKey = configuredGatewayKey || process.env.RAZORPAY_KEY;
        order.gatewaySalt = configuredGatewaySalt || process.env.RAZORPAY_SECRET;
        order.razorpayResponse = rzp.raw;
        await order.save();

        paymentResult = {
          paymentId: rzp.orderId,
          merchantName: rzp.merchantName,
          razorpayOrderId: rzp.orderId,
          razorpayKey: configuredGatewayKey || process.env.RAZORPAY_KEY,
          checkoutUrl: rzp.checkoutUrl,
        };
      } else if (reqProvider === "phonepe") {
        const phonepe = await createPhonePeIntent({
          merchantId: configuredGatewayKey || process.env.PHONEPE_MERCHANT_ID,
          saltKey: configuredGatewaySalt || process.env.PHONEPE_SALT_KEY,
          saltIndex: 1,
          amount: numericAmount,
          transactionId,
          customerPhone: customerMobile,
          // The Pay-In backend owns the hosted page lookup by transaction ID.
          redirectUrl: `${baseUrl}/pay/${transactionId}`,
          callbackUrl: `${baseUrl}/api/payin/phonepe-callback`,
          merchantVpa: merchant_vpa,
          isProduction: String(process.env.PHONEPE_ENV || "").toLowerCase() === "production",
        });

        order.phonepeTransactionId = phonepe.paymentId;
        order.phonepeMerchantId = configuredGatewayKey || process.env.PHONEPE_MERCHANT_ID;
        order.upiIntent = phonepe.intentUri;
        order.upiString = phonepe.intentUri;
        order.gatewayKey = configuredGatewayKey || process.env.PHONEPE_MERCHANT_ID;
        order.gatewaySalt = configuredGatewaySalt || process.env.PHONEPE_SALT_KEY;
        order.phonepeResponse = phonepe.raw;
        await order.save();

        paymentResult = {
          paymentId: phonepe.paymentId,
          merchantVpa: phonepe.merchantVpa,
          merchantName: phonepe.merchantName,
          deepLink: phonepe.intentUri,
          intentData: phonepe.checkoutUrl,
        };
      } else {
        // Default: PayU
        const payu = await createPayUIntent({
          txnid: transactionId,
          amount: numericAmount,
          productinfo: String(productinfo || "Surya Enterprise Payment"),
          firstname: firstName,
          email: customerEmail,
          phone: customerMobile,
          successUrl: callbackUrl,
          failureUrl: callbackUrl,
          clientIp,
          deviceInfo: userAgent,
          udf1: finalOrderId,
          key: configuredGatewayKey,
          salt: configuredGatewaySalt,
        });

        order.payuTxnId = payu.txnId;
        order.payuPaymentId = payu.paymentId;
        order.payuMerchantVpa = payu.merchantVpa;
        order.payuQrString = payu.intentUri;
        order.upiIntent = payu.intentUri;
        order.payuKey = configuredGatewayKey || process.env.PAYU_KEY;
        order.payuSalt = configuredGatewaySalt || process.env.PAYU_SALT;
        order.payuResponse = payu.raw;
        await order.save();

        paymentResult = {
          paymentId: payu.paymentId,
          merchantVpa: payu.merchantVpa,
          merchantName: payu.merchantName,
          deepLink: payu.intentUri,
          intentData: payu.intentURIData,
        };
      }

      // Start independent verification while the customer uses the UPI app.
      await enqueuePaymentRecovery(finalOrderId);

      // ---------------------------------
      // 13. Return Unified Payload
      // ---------------------------------
      return NextResponse.json({
        status: "success",
        data: {
          transaction_id: transactionId,
          order_id: finalOrderId,
          amount: Number(numericAmount.toFixed(2)),
          currency: "INR",
          payment_status: "pending",
          provider: reqProvider,
          payment_id: paymentResult.paymentId,
          merchant_vpa: paymentResult.merchantVpa,
          merchant_name: paymentResult.merchantName,
          deep_link: paymentResult.deepLink,
          upi_intent: paymentResult.deepLink,
          qr_string: paymentResult.deepLink,
          intent_data: paymentResult.intentData || paymentResult.checkoutUrl,
          checkout_url: paymentResult.checkoutUrl || null,
          razorpay_order_id: paymentResult.razorpayOrderId || null,
          razorpay_key: paymentResult.razorpayKey || null,
          expires_in: expiry,
        },
        error: null,
      });
    } catch (providerError) {
      // ---------------------------------
      // 14. Provider failed
      // ---------------------------------
      await Order.updateOne(
        { _id: order._id },
        {
          $set: {
            paymentStatus: "failed",
            paymentError:
              providerError.message ||
              `${reqProvider.toUpperCase()} payment creation failed`,
            paymentErrorCode: providerError.providerDiagnostics
              ? providerError.code
              : (providerError.statusCode ? `HTTP_${providerError.statusCode}` : null),
            paymentErrorDetails: providerError.providerDiagnostics || providerError.providerResponse || null,
          },
        }
      );

      throw providerError;
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
