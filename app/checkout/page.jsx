"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { getProduct, formatINR } from "../products/data/products";
import { ArrowLeft, ChevronDown, CircleCheckBig, Lock, Phone, ShieldCheck, ShoppingBag, Smartphone } from "lucide-react";
import CheckoutHeader, { PaymentStatus } from "../components/shop/CheckoutHeader";
import ProductImage from "../components/shop/ProductImage";
import PaymentPartners from "../components/shop/PaymentPartners";
import { SITE, telHref } from "../config/site";
import { useCheckoutAccount } from "../lib-account/use-checkout-account";

function readCart() {
  if (typeof window === "undefined") return {};

  const savedCart = window.localStorage.getItem("surya-cart");

  try {
    return savedCart ? JSON.parse(savedCart) : {};
  } catch {
    return {};
  }
}

const initialDetails = {
  firstName: "",
  lastName: "",
  address: "",
  apartment: "",
  city: "",
  state: "Delhi",
  pinCode: "",
  phone: "",
  email: "",
  notes: "",
};

export default function CheckoutPage() {
  const [cart] = useState(readCart);
  const [details, setDetails] = useState(initialDetails);

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // PayU payment information
  const [payment, setPayment] = useState(null);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paymentChecking, setPaymentChecking] = useState(false);

  // Customer account glue (pre-fill, saved addresses, order id, save after
  // success). Wraps the state above; the PayU calls below are untouched.
  const account = useCheckoutAccount({ details, setDetails, payment, orderPlaced });

  const cartItems = Object.entries(cart)
    .map(([sku, quantity]) => ({
      product: getProduct(sku),
      quantity,
    }))
    .filter((item) => item.product);

  const subtotal = cartItems.reduce(
    (total, item) =>
      total + item.product.price * item.quantity,
    0
  );

  const updateDetails = (event) => {
    setDetails((currentDetails) => ({
      ...currentDetails,
      [event.target.name]: event.target.value,
    }));
  };

  // --------------------------------------------------
  // CREATE PAYU PAYMENT
  // --------------------------------------------------

  const placeOrder = async (event) => {
    event.preventDefault();

    if (cartItems.length === 0 || isLoading) {
      return;
    }

    setIsLoading(true);
    setPaymentMessage("");

    try {
      const customerName =
        `${details.firstName} ${details.lastName}`.trim();

      const response = await fetch(
        "/api/checkout/payin/create",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            amount: Number(subtotal),

            items: cartItems.map(item => ({ sku: item.product.sku, quantity: item.quantity })),
            shipping: { address: details.address, apartment: details.apartment, city: details.city, state: details.state, pinCode: details.pinCode, notes: details.notes },

            name: customerName,

            email: details.email.trim(),

            mobile: details.phone.trim(),

            productinfo:
              "Surya Enterprises Product Purchase",

            // Optional values
            customer_ip: "",

            device_info:
              typeof navigator !== "undefined"
                ? navigator.userAgent
                : "Surya-Enterprise-Web",

            expiry_seconds: 1800,
          }),
        }
      );

      const data = await response.json();

      console.log("PayU create response:", data);

      if (!response.ok || data.status !== "success") {
        throw new Error(
          data.error ||
          "Unable to create payment"
        );
      }

      // The API returns the UPI intent as qr_string (and deep_link);
      // accept either so older/newer responses both work.
      const qrString =
        data.data?.qr_string ||
        data.data?.deep_link ||
        data.data?.upi_intent;

      if (!qrString) {
        throw new Error(
          "PayU did not return a payment QR."
        );
      }

      // IMPORTANT:
      // This changes the page from checkout
      // to the payment screen.
      setPayment({ ...data.data, qr_string: qrString });
    } catch (error) {
      console.error("Pay-In error:", error);

      alert(
        error.message ||
        "Unable to start payment. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------
  // CHECK PAYMENT STATUS
  // --------------------------------------------------

  const checkPaymentStatus = async () => {
    if (!payment?.order_id || paymentChecking) {
      return;
    }

    setPaymentChecking(true);
    setPaymentMessage(
      "Checking payment status..."
    );

    try {
      const response = await fetch(
        "/api/checkout/payin/status",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            order_id: payment.order_id,
          }),
        }
      );

      const data = await response.json();

      console.log(
        "PayU status response:",
        data
      );

      if (
        !response.ok ||
        data.status !== "success"
      ) {
        throw new Error(
          data.error ||
          "Unable to check payment"
        );
      }

      const paymentStatus =
        data.data?.payment_status;

      // Your backend may return "paid"
      // or "success". Support both.
      if (
        paymentStatus === "paid" ||
        paymentStatus === "success"
      ) {
        setPaymentMessage(
          "Payment successful!"
        );

        // Clear cart
        window.localStorage.removeItem(
          "surya-cart"
        );

        window.dispatchEvent(
          new Event("surya-cart-updated")
        );

        // Show confirmation page
        setPayment(null);
        setOrderPlaced(true);

        return;
      }

      if (
        paymentStatus === "failed" ||
        paymentStatus === "failure"
      ) {
        setPaymentMessage(
          "Payment failed. Please start a new payment."
        );

        return;
      }

      setPaymentMessage(
        "Payment is still pending. Complete the UPI payment and check again."
      );
    } catch (error) {
      console.error(
        "Payment status error:",
        error
      );

      setPaymentMessage(
        error.message ||
        "Unable to check payment status."
      );
    } finally {
      setPaymentChecking(false);
    }
  };

  // --------------------------------------------------
  // ORDER SUCCESS PAGE
  // --------------------------------------------------

  if (orderPlaced) {
    return (
      <>
        <CheckoutHeader step="done" />
        <main className="shell py-6 sm:py-10">
          <div
            className="mx-auto max-w-xl rounded-lg border border-line bg-white px-5 py-10 text-center sm:px-10"
            data-testid="order-confirmation"
          >
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-tint text-brand">
              <CircleCheckBig className="h-9 w-9" strokeWidth={1.75} aria-hidden="true" />
            </span>

            <p className="eyebrow mt-5 text-brand">
              Order confirmed
            </p>

            <h1 className="mt-1 font-display text-[26px] font-extrabold leading-tight text-ink sm:text-[32px]">
              Thank you for your order
            </h1>

            <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-ink-2">
              Your payment has been successfully
              received. We have received your order
              and will contact you shortly to confirm
              delivery details.
            </p>

            {account.lastOrderId && (
              <div className="mx-auto mt-5 inline-flex flex-col items-center rounded-lg border border-line bg-canvas px-6 py-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-2">Order ID</span>
                <span className="mt-0.5 font-mono text-[20px] font-bold tracking-wide text-ink sm:text-[22px]">
                  {account.lastOrderId}
                </span>
                <span className="mt-1 text-xs text-ink-2">Keep this for tracking and support.</span>
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {account.customer ? (
                <Link href="/account?tab=orders" className="btn btn-buy h-11 px-6">
                  View my orders
                </Link>
              ) : (
                <Link href="/track-order" className="btn btn-buy h-11 px-6">
                  Track this order
                </Link>
              )}
              <Link
                href="/"
                className="btn btn-outline h-11 px-6"
              >
                Return to home
              </Link>
            </div>

            {account.customer ? (
              <p className="mt-4 text-xs text-ink-2">The delivery address has been saved to your account.</p>
            ) : (
              <p className="mt-4 text-xs text-ink-2">
                <Link href="/register" className="font-semibold text-brand hover:underline">Create an account</Link> to see your orders and save addresses for next time.
              </p>
            )}

            <p className="mt-6 text-xs text-ink-2">
              Questions about your order? Call{" "}
              <a href={telHref} className="font-semibold text-brand hover:underline">
                {SITE.helpline.display}
              </a>{" "}
              ({SITE.helpline.hours}) or email {SITE.email}.
            </p>
          </div>
        </main>
      </>
    );
  }

  // --------------------------------------------------
  // PAYU PAYMENT PAGE
  // --------------------------------------------------

  if (payment) {
    const qrUrl =
      `https://api.qrserver.com/v1/create-qr-code/` +
      `?size=320x320&margin=12&data=${encodeURIComponent(
        payment.qr_string
      )}`;

    return (
      <>
        <CheckoutHeader step="payment" />
        <main className="shell pb-24 pt-3 sm:pt-6 lg:pb-10">
          <div className="mx-auto grid max-w-4xl gap-3 lg:grid-cols-[minmax(0,1fr)_336px] lg:items-start">

            <section
              aria-labelledby="pay-title"
              className="rounded-lg border border-line bg-white px-5 py-7 text-center sm:px-10"
            >
              {/* Header */}
              <p className="eyebrow text-brand">
                Secure UPI Payment
              </p>

              <h1 id="pay-title" className="mt-1 font-display text-[24px] font-extrabold leading-tight text-ink sm:text-[28px]">
                Complete your payment
              </h1>

              <p className="mt-2 text-[14px] text-ink-2">
                Scan the QR code using any supported
                UPI app and approve the payment.
              </p>

              {/* Amount */}
              <div className="mx-auto mt-5 inline-flex flex-col items-center rounded-lg bg-canvas px-8 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink-2">
                  Amount payable
                </p>

                <p className="mt-0.5 font-display text-[32px] font-extrabold leading-none tabular-nums text-ink">
                  {formatINR(payment.amount)}
                </p>
              </div>

              {/* QR */}
              <div className="relative mx-auto mt-6 w-fit rounded-xl border border-line bg-white p-3 shadow-[0_8px_24px_rgba(20,33,26,0.08)]">
                <span aria-hidden="true" className="absolute -left-px -top-px h-6 w-6 rounded-tl-xl border-l-[3px] border-t-[3px] border-brand" />
                <span aria-hidden="true" className="absolute -right-px -top-px h-6 w-6 rounded-tr-xl border-r-[3px] border-t-[3px] border-brand" />
                <span aria-hidden="true" className="absolute -bottom-px -left-px h-6 w-6 rounded-bl-xl border-b-[3px] border-l-[3px] border-brand" />
                <span aria-hidden="true" className="absolute -bottom-px -right-px h-6 w-6 rounded-br-xl border-b-[3px] border-r-[3px] border-brand" />
                <Image
                  src={qrUrl}
                  alt="UPI payment QR code"
                  width={320}
                  height={320}
                  unoptimized
                  className="h-60 w-60 rounded-md sm:h-72 sm:w-72"
                />
              </div>

              {/* Order ID */}
              <p className="mt-4 text-xs text-ink-2">
                Order ID{" "}
                <span className="break-all font-mono font-semibold text-ink">
                  {payment.order_id}
                </span>
              </p>

              {/* Open UPI App */}
              {payment.qr_string && (
                <a
                  href={payment.qr_string}
                  className="btn btn-cart mt-5 h-11 w-full sm:w-auto sm:px-8"
                >
                  <Smartphone className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  Open UPI app
                </a>
              )}

              {/* Check Payment */}
              <button
                type="button"
                disabled={paymentChecking}
                onClick={checkPaymentStatus}
                className="btn btn-buy mt-3 h-12 w-full text-[15px]"
              >
                {paymentChecking
                  ? "Checking payment…"
                  : "I have paid — check payment"}
              </button>

              {/* Status message */}
              {paymentMessage && (
                <PaymentStatus message={paymentMessage} />
              )}

              <p className="mt-5 text-xs text-ink-3">
                Payment status is confirmed by Surya
                Enterprises using PayU. Do not close this
                page until your payment is confirmed.
              </p>

              {/* Back */}
              <button
                type="button"
                onClick={() => {
                  setPayment(null);
                  setPaymentMessage("");
                }}
                className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded px-2 text-[13px] font-semibold text-ink-2 hover:text-brand"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                Back to checkout
              </button>
            </section>

            <aside className="space-y-3">
              {/* Instructions */}
              <div className="rounded-lg border border-line bg-white p-5">
                <p className="eyebrow">
                  How to pay
                </p>

                <ol className="mt-3 space-y-3 text-[13px] text-ink-2">
                  {[
                    "Open Google Pay, PhonePe, Paytm or another supported UPI app.",
                    "Scan the QR code, or tap “Open UPI app” on this phone.",
                    "Check the amount and approve the payment with your UPI PIN.",
                    "Return here and tap “I have paid — check payment”.",
                  ].map((text, i) => (
                    <li key={text} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-tint text-[11px] font-bold tabular-nums text-brand">
                        {i + 1}
                      </span>
                      <span>{text}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <PaymentPartners />

              <ul className="space-y-2.5 rounded-lg border border-line bg-white p-5 text-[13px] text-ink-2">
                <li className="flex gap-2.5">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={1.75} aria-hidden="true" />
                  Your UPI PIN is entered only in your UPI app — never on this site.
                </li>
                <li className="flex gap-2.5">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={1.75} aria-hidden="true" />
                  No card or bank details are stored by Surya Enterprises.
                </li>
                <li className="flex gap-2.5">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={1.75} aria-hidden="true" />
                  <span>
                    Stuck? Call{" "}
                    <a href={telHref} className="font-semibold text-brand hover:underline">
                      {SITE.helpline.display}
                    </a>{" "}
                    with your order ID.
                  </span>
                </li>
              </ul>
            </aside>
          </div>
        </main>
      </>
    );
  }

  // --------------------------------------------------
  // NORMAL CHECKOUT PAGE
  // --------------------------------------------------

  return (
    <>
      <CheckoutHeader step="details" />
      <main className="shell pb-28 pt-3 lg:pb-8 lg:pt-4">

        <form
          onSubmit={placeOrder}
          className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start"
        >

          {/* =========================
              ORDER SUMMARY
              (first in DOM so it is the collapsible bar on phones;
               sticky right column from lg up)
          ========================== */}

          <aside aria-label="Order summary" suppressHydrationWarning className="lg:sticky lg:top-[76px] lg:order-2">
            <div className="rounded-lg border border-line bg-white">
              {/* Phone: CSS-only expand/collapse — no extra state */}
              <input type="checkbox" id="summary-toggle" className="peer sr-only lg:hidden" />
              <label
                htmlFor="summary-toggle"
                className="flex cursor-pointer select-none items-center justify-between gap-3 px-4 py-3 text-[14px] font-semibold text-ink peer-focus-visible:outline-2 peer-focus-visible:outline-brand peer-checked:[&_svg.chev]:rotate-180 lg:hidden"
              >
                <span className="inline-flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-brand" strokeWidth={1.75} aria-hidden="true" />
                  Order summary
                  <span suppressHydrationWarning className="font-normal text-ink-2">
                    · {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
                  </span>
                </span>
                <span suppressHydrationWarning className="inline-flex items-center gap-1.5 tabular-nums">
                  {formatINR(subtotal)}
                  <ChevronDown className="chev h-4 w-4 text-ink-3 transition-transform" strokeWidth={1.75} aria-hidden="true" />
                </span>
              </label>

              <h2 className="hidden border-b border-line px-4 py-3 text-xs font-bold uppercase tracking-wider text-ink-2 lg:block">
                Order summary
              </h2>

              <div className="hidden border-t border-line peer-checked:block lg:block lg:border-t-0">
                {cartItems.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-ink-2">
                    Your cart is empty.{" "}

                    <Link
                      href="/products"
                      className="font-semibold text-brand underline"
                    >
                      Browse products
                    </Link>
                  </p>
                ) : (
                  <ul className="divide-y divide-line px-4">
                    {cartItems.map((item) => (
                      <li
                        key={item.product.sku}
                        className="flex gap-3 py-3 text-sm"
                      >
                        <span className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-md border border-line bg-white">
                          <ProductImage src={item.product.image} category={item.product.category} sizes="56px" frameClassName="h-full w-full" className="p-1" />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 text-[13px] font-medium leading-snug text-ink">
                            {item.product.name}
                          </span>
                          <span className="mt-0.5 block text-xs text-ink-2">
                            {item.product.unit} · Qty {item.quantity}
                          </span>
                        </span>

                        <span className="shrink-0 text-[14px] font-semibold tabular-nums text-ink">
                          {formatINR(
                            item.product.price *
                            item.quantity
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <dl className="space-y-2 border-t border-line px-4 py-4 text-[14px] tabular-nums">
                  <div className="flex justify-between">
                    <dt className="text-ink-2">Subtotal</dt>
                    <dd>
                      {formatINR(subtotal)}
                    </dd>
                  </div>

                  <div className="flex justify-between">
                    <dt className="text-ink-2">Delivery</dt>
                    <dd className="text-ink-2">{SITE.delivery.cartDeliveryLabel}</dd>
                  </div>

                  <div className="flex justify-between border-t border-dashed border-line pt-3 text-base font-bold text-ink">
                    <dt>Total</dt>
                    <dd>
                      {formatINR(subtotal)}
                    </dd>
                  </div>
                </dl>

                {/* PAYMENT METHOD */}

                <div className="border-t border-line px-4 py-4">

                  <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                    <Smartphone className="h-4 w-4 text-brand" strokeWidth={1.75} aria-hidden="true" />
                    Pay with UPI via PayU
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-ink-2">
                    Pay securely using UPI. After
                    placing your order, a secure UPI
                    payment QR code will appear.
                  </p>
                  <PaymentPartners compact className="mt-3" />
                </div>

                <ul className="space-y-2 border-t border-line px-4 py-4 text-xs text-ink-2">
                  <li className="flex gap-2">
                    <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" strokeWidth={1.75} aria-hidden="true" />
                    Your UPI PIN is entered only in your UPI app. We never store card or bank details.
                  </li>
                  <li className="flex gap-2">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" strokeWidth={1.75} aria-hidden="true" />
                    Genuine products from leading brands and Surya&apos;s own range — sold and shipped by Surya Enterprises.
                  </li>
                  <li className="flex gap-2">
                    <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" strokeWidth={1.75} aria-hidden="true" />
                    Helpline {SITE.helpline.display} · {SITE.helpline.hours}
                  </li>
                </ul>
              </div>

              {/* PLACE ORDER — fixed bar above the bottom nav on phones, inline from lg up */}

              <div className="fixed inset-x-0 bottom-[var(--bottom-nav-h)] z-40 flex items-center gap-3 border-t border-line bg-white px-3 py-2 lg:static lg:border-t lg:px-4 lg:py-4">
                <div className="tabular-nums lg:hidden">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-2">Total</p>
                  <p className="text-lg font-bold leading-tight text-ink">{formatINR(subtotal)}</p>
                </div>

                <button
                  type="submit"
                  disabled={
                    cartItems.length === 0 ||
                    isLoading
                  }
                  data-testid="place-order-btn"
                  className="btn btn-buy h-12 flex-1 text-[15px] lg:w-full"
                >
                  {isLoading
                    ? "Creating Payment..."
                    : `Pay ${formatINR(subtotal)}`}
                </button>
              </div>
            </div>
          </aside>

          {/* =========================
              BILLING DETAILS
          ========================== */}

          <section className="space-y-3 lg:order-1">
            <div className="rounded-lg border border-line bg-white">
              <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
                <div>
                  <p className="eyebrow">
                    Checkout
                  </p>

                  <h1 className="font-display text-[20px] font-extrabold leading-tight text-ink sm:text-[22px]">
                    Delivery details
                  </h1>
                </div>
                <Link href="/cart" className="text-[13px] font-semibold text-brand hover:underline">
                  Edit cart
                </Link>
              </div>

              <div className="px-4 py-4 sm:px-6 sm:py-5">

                <fieldset>
                  <legend className="mb-3 text-[12px] font-bold uppercase tracking-wider text-ink-2">
                    Contact
                  </legend>

                  <div className="grid gap-4 sm:grid-cols-2">

                    <label className="block">
                      <span className="field-label">
                        Phone{" "}
                        <span className="text-danger">
                          *
                        </span>
                      </span>

                      <input
                        required
                        type="tel"
                        name="phone"
                        value={details.phone}
                        onChange={updateDetails}
                        autoComplete="tel"
                        className="input"
                      />
                    </label>

                    <label className="block">
                      <span className="field-label">
                        Email address{" "}
                        <span className="text-danger">
                          *
                        </span>
                      </span>

                      <input
                        required
                        type="email"
                        name="email"
                        value={details.email}
                        onChange={updateDetails}
                        autoComplete="email"
                        className="input"
                      />
                    </label>
                  </div>
                </fieldset>

                <fieldset className="mt-6 border-t border-line pt-5">
                  <legend className="sr-only">
                    Delivery address
                  </legend>
                  <p aria-hidden="true" className="mb-3 text-[12px] font-bold uppercase tracking-wider text-ink-2">
                    Delivery address
                  </p>

                  {/* Account: saved addresses / sign-in prompt (guest checkout always allowed) */}
                  {account.customer ? (
                    account.addresses.length > 0 && (
                      <div className="mb-4 rounded-md border border-brand/30 bg-brand-tint/40 p-3 text-[13px]">
                        {account.savedAddress ? (
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="text-ink">
                              <span className="font-semibold">Delivering to {account.savedAddress.label}:</span>{" "}
                              {account.savedAddress.address}
                              {account.savedAddress.apartment ? `, ${account.savedAddress.apartment}` : ""}, {account.savedAddress.city} — {account.savedAddress.pinCode}
                            </p>
                            <button type="button" onClick={account.useDifferentAddress} className="font-semibold text-brand hover:underline">
                              Use a different address
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-ink-2">Use a saved address:</span>
                            {account.addresses.map((a) => (
                              <button key={a.id} type="button" onClick={() => account.applyAddress(a)} className="chip hover:border-brand hover:text-brand">
                                {a.label} · {a.city} {a.pinCode}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  ) : account.sessionReady ? (
                    <p className="mb-4 text-[13px] text-ink-2">
                      Have an account?{" "}
                      <Link href="/login?next=/checkout" className="font-semibold text-brand hover:underline">
                        Sign in
                      </Link>{" "}
                      to fill these details from your saved address. Guest checkout works too.
                    </p>
                  ) : null}

                  <div className="grid gap-4 sm:grid-cols-2">

                    <label className="block">
                      <span className="field-label">
                        First name{" "}
                        <span className="text-danger">
                          *
                        </span>
                      </span>

                      <input
                        required
                        name="firstName"
                        value={details.firstName}
                        onChange={updateDetails}
                        autoComplete="given-name"
                        className="input"
                      />
                    </label>

                    <label className="block">
                      <span className="field-label">
                        Last name{" "}
                        <span className="text-danger">
                          *
                        </span>
                      </span>

                      <input
                        required
                        name="lastName"
                        value={details.lastName}
                        onChange={updateDetails}
                        autoComplete="family-name"
                        className="input"
                      />
                    </label>
                  </div>

                  <label className="mt-4 block">
                    <span className="field-label">
                      House number and street name{" "}
                      <span className="text-danger">
                        *
                      </span>
                    </span>

                    <input
                      required
                      name="address"
                      value={details.address}
                      onChange={updateDetails}
                      autoComplete="address-line1"
                      className="input"
                    />
                  </label>

                  <label className="mt-4 block">
                    <span className="field-label">
                      Apartment, suite, etc.{" "}
                      <span className="font-normal text-ink-3">
                        (optional)
                      </span>
                    </span>

                    <input
                      name="apartment"
                      value={details.apartment}
                      onChange={updateDetails}
                      autoComplete="address-line2"
                      className="input"
                    />
                  </label>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">

                    <label className="block">
                      <span className="field-label">
                        Town / City{" "}
                        <span className="text-danger">
                          *
                        </span>
                      </span>

                      <input
                        required
                        name="city"
                        value={details.city}
                        onChange={updateDetails}
                        autoComplete="address-level2"
                        className="input"
                      />
                    </label>

                    <label className="block">
                      <span className="field-label">
                        State{" "}
                        <span className="text-danger">
                          *
                        </span>
                      </span>

                      <select
                        name="state"
                        value={details.state}
                        onChange={updateDetails}
                        autoComplete="address-level1"
                        className="input"
                      >
                        <option>Delhi</option>
                        <option>Gujarat</option>
                        <option>Maharashtra</option>
                        <option>Rajasthan</option>
                        <option>Uttar Pradesh</option>
                      </select>
                    </label>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">

                    <label className="block">
                      <span className="field-label">
                        PIN Code{" "}
                        <span className="text-danger">
                          *
                        </span>
                      </span>

                      <input
                        required
                        inputMode="numeric"
                        name="pinCode"
                        value={details.pinCode}
                        onChange={updateDetails}
                        autoComplete="postal-code"
                        className="input"
                      />
                    </label>

                    <label className="block">
                      <span className="field-label">
                        Country / Region
                      </span>

                      <input
                        readOnly
                        value="India"
                        autoComplete="country-name"
                        className="input"
                      />
                    </label>
                  </div>
                </fieldset>

                <fieldset className="mt-6 border-t border-line pt-5">
                  <legend className="sr-only">
                    Additional information
                  </legend>
                  <p aria-hidden="true" className="mb-3 text-[12px] font-bold uppercase tracking-wider text-ink-2">
                    Additional information
                  </p>

                  <label className="block">
                    <span className="field-label">
                      Order notes{" "}
                      <span className="font-normal text-ink-3">
                        (optional)
                      </span>
                    </span>

                    <textarea
                      name="notes"
                      value={details.notes}
                      onChange={updateDetails}
                      placeholder="Notes about your order, e.g. special notes for delivery."
                      rows={4}
                      className="input"
                    />
                  </label>
                </fieldset>
              </div>
            </div>

            <p className="px-1 text-xs text-ink-2">
              By placing this order you agree to our{" "}
              <Link href="/terms" className="font-semibold text-brand hover:underline">Terms of Use</Link>,{" "}
              <Link href="/shipping-policy" className="font-semibold text-brand hover:underline">Shipping Policy</Link> and{" "}
              <Link href="/return-refund-policy" className="font-semibold text-brand hover:underline">Return &amp; Refund Policy</Link>.
              Use every product only as directed on its label or manual.
            </p>
          </section>
        </form>
      </main>
    </>
  );
}
