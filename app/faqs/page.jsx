import Link from "next/link";
import { ChevronDown } from "lucide-react";
import PolicyLayout from "../components/shop/PolicyLayout";
import { SITE } from "../config/site";

const { returns, payment, cancellation, shipping } = SITE.policies;

// Native <details> accordion: keyboard accessible, no JS, prints expanded.
function Faq({ q, children }) {
  return (
    <details className="group border-b border-line py-1 last:border-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-2.5 text-[14px] font-semibold text-ink marker:hidden [&::-webkit-details-marker]:hidden">
        {q}
        <ChevronDown className="h-4 w-4 shrink-0 text-ink-3 transition-transform group-open:rotate-180" strokeWidth={1.75} aria-hidden="true" />
      </summary>
      <div className="policy-prose pb-3 pr-6">{children}</div>
    </details>
  );
}

const sections = [
  {
    id: "orders",
    title: "Orders",
    content: (
      <div className="-mt-2">
        <Faq q="How do I place an order?">
          <p>
            Search or browse for a product, choose the pack size, add it to your cart and go to checkout. Enter your
            delivery details, then pay by UPI. Your order is confirmed as soon as the payment is successful.
          </p>
        </Faq>
        <Faq q="Do I need an account?">
          <p>No. Accounts are not available yet; orders are placed as a guest with your mobile number and email, which we use for all updates.</p>
        </Faq>
        <Faq q="Is there a minimum order value?">
          <p>No minimum applies to retail orders. For institutional pricing see our <Link href="/bulk-order-terms">Bulk Order Terms</Link>.</p>
        </Faq>
        <Faq q="Can I change or cancel an order?">
          <p>
            You can cancel {cancellation.window} by calling {SITE.helpline.display} with your order ID. Once dispatched, it
            can no longer be changed. See the <Link href="/cancellation-policy">Cancellation Policy</Link>.
          </p>
        </Faq>
        <Faq q="How do I track my order?">
          <p>
            Use <Link href="/track-order">Track order</Link>. Tracking is currently handled by our support team, who will
            share the carrier and consignment details for your order ID.
          </p>
        </Faq>
        <Faq q="Will I get a GST invoice?">
          <p>Yes. A GST invoice is sent with every order. To have it in your business name, add your GSTIN to the order notes at checkout.</p>
        </Faq>
      </div>
    ),
  },
  {
    id: "payments",
    title: "Payments",
    content: (
      <div className="-mt-2">
        <Faq q="Which payment methods do you accept?">
          <p>{SITE.payments.join(", ")}. Scan the QR with any UPI app, or tap “Open UPI app” on your phone. Cash on delivery and cards are not available at present.</p>
        </Faq>
        <Faq q="My money was debited but the order isn't confirmed.">
          <p>
            Don’t pay again. Tap “check payment” on the payment screen after a minute. If it still shows pending, send us
            the order ID and the UPI transaction reference (UTR) and we will reconcile it with PayU — either confirming
            the order or refunding you.
          </p>
        </Faq>
        <Faq q="The payment failed. When will I get my money back?">
          <p>
            Failed payments are reversed automatically by your bank, usually within {payment.autoReversalTimeline}. See
            the <Link href="/payment-policy">Payment Policy</Link>.
          </p>
        </Faq>
        <Faq q="Is paying on this site safe?">
          <p>
            Yes. Your UPI PIN is entered only in your UPI app, never on our site, and we do not store any bank or card
            details. Payments are processed by PayU, an RBI-regulated payment aggregator.
          </p>
        </Faq>
        <Faq q="How long does the payment QR stay valid?">
          <p>{payment.pendingWindowMinutes} minutes. After that, simply place the order again.</p>
        </Faq>
      </div>
    ),
  },
  {
    id: "delivery",
    title: "Delivery",
    content: (
      <div className="-mt-2">
        <Faq q="Where do you deliver?">
          <p>{shipping.serviceableAreas} You can check your PIN on any product page.</p>
        </Faq>
        <Faq q="How soon will my order ship?">
          <p>Orders are typically dispatched within {shipping.dispatchWindow} of payment confirmation. Transit time depends on the destination; bulky items such as sprayers and tarpaulins travel by surface transport.</p>
        </Faq>
        <Faq q="What are the delivery charges?">
          <p>{shipping.charges}</p>
        </Faq>
        <Faq q="Why can't some products be delivered to my area?">
          <p>{shipping.restrictedAreas} Some molecules are also restricted in particular states. If an item cannot be shipped to you, we cancel and refund it.</p>
        </Faq>
        <Faq q="What should I check when the parcel arrives?">
          <p>Check the outer box for damage or leakage before accepting it, then verify products, pack sizes, quantities and expiry dates against your order. Report any issue within {returns.claimWindowDays} days with photos.</p>
        </Faq>
      </div>
    ),
  },
  {
    id: "returns",
    title: "Returns & refunds",
    content: (
      <div className="-mt-2">
        <Faq q="Can I return a product?">
          <p>
            For safety, opened chemicals and seeds cannot be returned. Damaged, leaking, wrong, short or expired-on-arrival
            items are replaced or refunded. See the <Link href="/return-refund-policy">Return &amp; Refund Policy</Link>.
          </p>
        </Faq>
        <Faq q="How do I raise a claim?">
          <p>
            Within {returns.claimWindowDays} days of delivery, email <a href={`mailto:${SITE.email}`}>{SITE.email}</a> or
            call {SITE.helpline.display} with your order ID and photographs of the issue.
          </p>
        </Faq>
        <Faq q="How and when will I get my refund?">
          <p>Refunds go back to the original UPI account through PayU and normally arrive within {returns.refundTimeline} of approval.</p>
        </Faq>
        <Faq q="I ordered the wrong product by mistake.">
          <p>If the order has not been dispatched, call us to cancel or change it. Once delivered, a sealed wrong-choice product cannot be returned, so please check the label and crop suitability before ordering.</p>
        </Faq>
      </div>
    ),
  },
  {
    id: "restricted",
    title: "Products not sold online",
    content: (
      <div className="-mt-2">
        <Faq q="Why can't I buy pesticides or urea online?">
          <p>
            Pesticides and agrochemicals (insecticides, fungicides, herbicides, bio-controls and plant growth regulators) are
            regulated goods under the Insecticides Act, 1968, and urea and other subsidised fertilisers may be sold only
            through licensed outlets under the Fertiliser (Control) Order, 1985. Payment gateways also list pesticides and
            agricultural chemicals among regulated categories. We therefore do not sell them through the website: they are
            marked “Not for online sale”, cannot be added to the cart, and are available at our Jaipur store (
            {SITE.offices[0].address}) and through the <Link href="/products/institutional">institutional desk</Link> against a
            valid requirement.
          </p>
        </Faq>
        <Faq q="Which other products are store-only?">
          <p>
            Animal-husbandry products (cattle feed, milking equipment, poultry and fish care), adjuvants and other
            agricultural chemicals, ammonium-nitrate products and knives are also sold only at the store and by quotation.
            Seeds, traps &amp; lures, animal repellents, fertilisers, bio-fertilisers, biostimulants and farm machinery can
            be bought online.
          </p>
        </Faq>
        <Faq q="How do I buy a store-only product?">
          <p>
            Open the product page and use <strong>Institutional desk</strong> to send an enquiry quoting the SKU, call{" "}
            {SITE.helpline.display} ({SITE.helpline.hours}), or visit the Jaipur store. Pesticides are handed over only in
            sealed manufacturer packs with the CIB&amp;RC-approved label.
          </p>
        </Faq>
      </div>
    ),
  },
  {
    id: "product-safety",
    title: "Product safety",
    content: (
      <div className="-mt-2">
        <Faq q="Which product should I use for my crop or pest?">
          <p>
            We cannot give field-specific recommendations. Use only the crops, pests and doses stated on the
            CIB&amp;RC-approved label, and consult an agricultural extension officer or Krishi Vigyan Kendra when unsure.
            Our helpline can help you find a product by active ingredient or pack size.
          </p>
        </Faq>
        <Faq q="Are your products genuine?">
          <p>Yes. {SITE.name} is a licensed agro-inputs marketplace selling genuine products from leading brands and Surya&apos;s own range; nothing is sourced from unknown resellers. Products made by Surya are marked “Manufacturer direct” on their page. Each pack carries the manufacturer&apos;s registration, batch number and expiry where applicable.</p>
        </Faq>
        <Faq q="How should I store pesticides at home or on the farm?">
          <p>In the original, closed container; in a cool, dry, locked place; away from children, animals, food, feed and water. Details are in our <Link href="/product-safety-disclaimer">Product Safety Disclaimer</Link>.</p>
        </Faq>
        <Faq q="What do I do in case of accidental exposure or poisoning?">
          <p>Follow the first-aid instructions on the label, and call a doctor or go to the nearest hospital immediately, taking the label with you. The AIIMS Poison Information Centre helpline is 1800-116-117.</p>
        </Faq>
        <Faq q="Can I resell products bought here?">
          <p>Resale of seeds, fertilisers and pesticides requires the relevant licence from your State Agriculture Department. Buy for resale only if you hold one. See our <Link href="/terms">Terms of Use</Link>.</p>
        </Faq>
      </div>
    ),
  },
];

export default function FaqsPage() {
  return (
    <PolicyLayout
      eyebrow="Help"
      title="Frequently Asked Questions"
      intro="Quick answers about ordering, paying, delivery, returns, products that are sold only at our store, and product safety on the Surya Enterprises marketplace."
      sections={sections}
      related={[
        { name: "Track order", href: "/track-order" },
        { name: "Contact us", href: "/contact" },
        { name: "Shipping policy", href: "/shipping-policy" },
        { name: "Return & refund policy", href: "/return-refund-policy" },
        { name: "Payment policy", href: "/payment-policy" },
        { name: "Grievance redressal", href: "/grievance-redressal" },
      ]}
    />
  );
}
