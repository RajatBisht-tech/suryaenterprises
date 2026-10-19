"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Clock3, AlertCircle, Headset, Mail, Phone, Search, ShieldCheck } from "lucide-react";
import { SITE, telHref } from "../../config/site";

export default function TrackOrderForm() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const cleanId = orderId.trim();
  const cleanPhone = phone.replace(/\D/g, "").slice(-10);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cleanId) return;

    setLoading(true);
    setErrorMessage("");
    setOrderResult(null);

    try {
      const response = await fetch("/api/track-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: cleanId, phone: cleanPhone }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setErrorMessage(data.error || "Order not found. Please verify the Order ID.");
      } else {
        setOrderResult(data.order);
      }
    } catch (_) {
      setErrorMessage("Unable to connect to order tracking service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const mailto = `mailto:${SITE.email}?subject=${encodeURIComponent(`Track order ${cleanId}`)}&body=${encodeURIComponent(
    `Hello Surya Enterprises,\n\nPlease share the dispatch and tracking details for my order.\n\nOrder ID: ${cleanId}\nMobile: ${cleanPhone}\n\nThank you.`
  )}`;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <form onSubmit={handleSubmit} className="panel p-5 sm:p-7" aria-describedby="track-note">
        <h2 className="font-display text-[18px] font-extrabold text-ink">Find your order</h2>
        <p id="track-note" className="mt-1 text-[13px] text-ink-2">
          Enter the order ID from your payment confirmation screen, and the mobile number used at checkout.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">Order ID</span>
            <input
              id="track-order-id"
              name="orderId"
              required
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g. SE17922233272061ef9f3b14e"
              autoComplete="off"
              className="input font-mono uppercase tracking-wide"
            />
          </label>
          <label className="block">
            <span className="field-label">Mobile number (Optional)</span>
            <input
              id="track-phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile"
              autoComplete="tel"
              className="input"
            />
          </label>
        </div>

        <button type="submit" disabled={loading} className="btn btn-buy mt-5 h-11 w-full sm:w-auto sm:px-6">
          <Search className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          {loading ? "Looking up order..." : "Get tracking details"}
        </button>

        {/* Live Order Result Found */}
        {orderResult && (
          <div role="status" className="fade-in mt-6 rounded-xl border border-brand/40 bg-brand-tint/20 p-5 text-[13px] text-ink">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand/20 pb-3">
              <div>
                <span className="text-xs uppercase font-bold text-ink-2 tracking-wider">Surya Enterprise Order</span>
                <p className="font-mono text-[16px] font-extrabold text-brand-deep">{orderResult.orderId}</p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                  orderResult.paymentStatus === "paid"
                    ? "bg-green-100 text-green-800"
                    : orderResult.paymentStatus === "failed"
                    ? "bg-red-100 text-red-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {orderResult.paymentStatus === "paid" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Clock3 className="h-4 w-4 text-amber-600" />
                )}
                {orderResult.paymentStatus === "paid" ? "Payment Confirmed" : "Payment Pending"}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
              <div>
                <span className="text-ink-2">Amount</span>
                <p className="mt-0.5 text-sm font-bold text-ink">₹{Number(orderResult.amount).toFixed(2)}</p>
              </div>
              <div>
                <span className="text-ink-2">Gateway Provider</span>
                <p className="mt-0.5 text-sm font-semibold uppercase text-brand">
                  {orderResult.provider || "PayU"}
                </p>
              </div>
              <div>
                <span className="text-ink-2">Customer</span>
                <p className="mt-0.5 text-sm font-medium text-ink truncate">{orderResult.customerName}</p>
              </div>
              <div>
                <span className="text-ink-2">Order Date</span>
                <p className="mt-0.5 text-sm font-medium text-ink">
                  {new Date(orderResult.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {orderResult.utr && (
              <div className="mt-3 rounded-lg bg-white/70 p-2.5 text-xs text-ink-2 border border-brand/10">
                <span className="font-medium text-ink">Bank UTR / Reference: </span>
                <span className="font-mono font-bold text-ink">{orderResult.utr}</span>
              </div>
            )}
          </div>
        )}

        {/* Error / Not Found Message */}
        {errorMessage && (
          <div role="alert" className="fade-in mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-[13px] text-red-800 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold">{errorMessage}</p>
              <p className="mt-1 text-xs text-red-600">
                Check that you copied the full Order ID (e.g. starting with SE...). Need help? Email us below.
              </p>
            </div>
          </div>
        )}
      </form>

      <aside className="space-y-3">
        <div className="panel p-5">
          <p className="eyebrow">Order Lifecycle</p>
          <ol className="mt-3 space-y-3 text-[13px]">
            {[
              ["Payment confirmed", "Your order ID is created and verified by Surya Enterprises MoR."],
              ["Bank Settlement", "Acquiring bank settles transaction securely through the integrated gateway."],
              ["Merchant Notification", "Instant automated webhook notification is delivered to the merchant."],
            ].map(([title, text], i) => (
              <li key={title} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-tint text-[11px] font-bold text-brand">
                  {i + 1}
                </span>
                <span>
                  <span className="block font-semibold text-ink">{title}</span>
                  <span className="block text-ink-2">{text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="panel flex gap-3 p-5 text-[13px]">
          <Headset className="h-5 w-5 shrink-0 text-brand" strokeWidth={1.75} aria-hidden="true" />
          <div>
            <p className="font-semibold text-ink">Need assistance?</p>
            <p className="mt-0.5 text-ink-2">
              Email <a href={mailto} className="font-semibold text-brand hover:underline">{SITE.email}</a> or call {SITE.helpline.display}.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
