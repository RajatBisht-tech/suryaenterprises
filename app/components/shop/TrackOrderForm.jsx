"use client";

import Link from "next/link";
import { useState } from "react";
import { Headset, Mail, Phone, Search } from "lucide-react";
import { SITE, telHref } from "../../config/site";

// There is no self-service tracking API yet. The form validates the two
// identifiers a support agent needs and hands the shopper straight to the
// helpline / a pre-filled email — it never pretends to look anything up.
export default function TrackOrderForm() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(null);

  const cleanId = orderId.trim().toUpperCase();
  const cleanPhone = phone.replace(/\D/g, "").slice(-10);
  const mailto = `mailto:${SITE.email}?subject=${encodeURIComponent(`Track order ${cleanId}`)}&body=${encodeURIComponent(
    `Hello Surya Enterprises,\n\nPlease share the dispatch and tracking details for my order.\n\nOrder ID: ${cleanId}\nMobile used at checkout: ${cleanPhone}\n\nThank you.`
  )}`;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted({ id: cleanId, phone: cleanPhone });
        }}
        className="panel p-5 sm:p-7"
        aria-describedby="track-note"
      >
        <h2 className="font-display text-[18px] font-extrabold text-ink">Find your order</h2>
        <p id="track-note" className="mt-1 text-[13px] text-ink-2">
          Enter the order ID from your payment screen or confirmation message, and the mobile number used at checkout.
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
              placeholder="e.g. SE17280000001234"
              pattern="\s*[Ss][Ee]\d{10,}\s*"
              title="Order IDs start with SE followed by digits"
              autoComplete="off"
              className="input font-mono uppercase tracking-wide"
            />
          </label>
          <label className="block">
            <span className="field-label">Mobile number</span>
            <input
              id="track-phone"
              name="phone"
              required
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile"
              pattern="[\d\s+-]{10,15}"
              autoComplete="tel"
              className="input"
            />
          </label>
        </div>
        <button type="submit" className="btn btn-buy mt-5 h-11 w-full sm:w-auto sm:px-6">
          <Search className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          Get tracking details
        </button>

        {submitted && (
          <div role="status" className="fade-in mt-5 rounded-lg border border-brand/30 bg-brand-tint p-4 text-[13px] text-ink">
            <p className="font-display text-[15px] font-extrabold text-brand-deep">
              Order <span className="font-mono">{submitted.id}</span> — tracked by our support team
            </p>
            <p className="mt-1.5 text-ink-2">
              Live tracking on the website is not available yet. Our team will confirm the dispatch status and share the
              carrier and consignment number for this order. Choose how you’d like to reach us:
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={mailto} className="btn btn-buy h-10">
                <Mail className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                Email with details pre-filled
              </a>
              <a href={telHref} className="btn btn-outline h-10">
                <Phone className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                Call {SITE.helpline.display}
              </a>
            </div>
            <p className="mt-2 text-xs text-ink-2">Helpline hours: {SITE.helpline.hours}. Mention the order ID and mobile number {submitted.phone}.</p>
          </div>
        )}
      </form>

      <aside className="space-y-3">
        <div className="panel p-5">
          <p className="eyebrow">What happens after you pay</p>
          <ol className="mt-3 space-y-3 text-[13px]">
            {[
              ["Payment confirmed", "Your order ID is created and the payment is verified with PayU."],
              ["Packed for dispatch", `Typically within ${SITE.policies.shipping.dispatchWindow}, in sealed manufacturer packaging.`],
              ["Handed to carrier", "We share the carrier and consignment number by SMS or email."],
              ["Delivered", `Check the parcel on arrival and report issues within ${SITE.policies.returns.claimWindowDays} days.`],
            ].map(([title, text], i) => (
              <li key={title} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-tint text-[11px] font-bold text-brand">{i + 1}</span>
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
            <p className="font-semibold text-ink">Need help faster?</p>
            <p className="mt-0.5 text-ink-2">
              Call {SITE.helpline.display} ({SITE.helpline.hours}) or see the{" "}
              <Link href="/faqs#orders" className="font-semibold text-brand hover:underline">
                order FAQs
              </Link>
              .
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
