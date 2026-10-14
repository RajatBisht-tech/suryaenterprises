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
          <p>Orders are typically dispatched within {shipping.dispatchWindow} of payment confirmation. Transit time depends on the destination; bulky items such as sprayers, tarpaulins and machinery travel by surface transport.</p>
        </Faq>
        <Faq q="What are the delivery charges?">
          <p>{shipping.charges}</p>
        </Faq>
        <Faq q="Why can't some products be delivered to my area?">
          <p>{shipping.restrictedAreas} A few seed varieties are also not notified for sale in particular states, and the product page lists those states. If an item cannot be shipped to you, we cancel and refund it.</p>
        </Faq>
        <Faq q="What should I check when the parcel arrives?">
          <p>Check the outer box for damage before accepting it, then verify products, pack sizes, quantities and (for seeds) the lot number and expiry date against your order. Report any issue within {returns.claimWindowDays} days with photos.</p>
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
            Opened seed packets cannot be returned, and machinery can be returned only if it is unused and in its original
            packaging. Damaged, wrong, short, defective or expired-on-arrival items are replaced or refunded. See the{" "}
            <Link href="/return-refund-policy">Return &amp; Refund Policy</Link>.
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
          <p>If the order has not been dispatched, call us to cancel or change it. Once delivered, a sealed wrong-choice seed pack cannot be returned, so please check the crop, variety and pack size before ordering. Unused machinery in its original packaging can be returned within the claim window; return shipping is charged.</p>
        </Faq>
        <Faq q="Does machinery come with a warranty?">
          <p>Sprayers, brush cutters, tillers, pumps and other equipment carry the manufacturer&apos;s warranty printed on the warranty card or manual in the box. Keep the invoice; warranty claims are handled with the manufacturer&apos;s service network, and our helpline can point you to the nearest one.</p>
        </Faq>
      </div>
    ),
  },
  {
    id: "products",
    title: "Products",
    content: (
      <div className="-mt-2">
        <Faq q="What do you sell?">
          <p>
            Three categories: <Link href="/c/seeds">seeds</Link> (vegetable, fruit, flower, field and forage seeds by crop and pack size),{" "}
            <Link href="/c/traps-and-repellents">traps &amp; repellents</Link> (pheromone traps and lures, sticky traps and animal repellents) and{" "}
            <Link href="/c/farm-machinery">farm machinery</Link> (sprayers, brush cutters, tillers, hand tools, tarpaulins, mulches, irrigation
            and solar equipment). Every pack size is its own listing with its own price.
          </p>
        </Faq>
        <Faq q="Which seed or trap should I use for my crop?">
          <p>
            We cannot give field-specific recommendations. Choose varieties suited to your region and season as printed on the
            packet, place traps as the manufacturer directs, and consult an agricultural extension officer or Krishi Vigyan Kendra
            when unsure. Our helpline can help you find a product by crop, brand or pack size.
          </p>
        </Faq>
        <Faq q="Are your products genuine?">
          <p>Yes. {SITE.name} is a licensed agri-inputs marketplace selling genuine products from leading brands; nothing is sourced from unknown resellers. Each pack carries the manufacturer&apos;s name, batch or lot number and, for seeds, the germination and expiry details required by law.</p>
        </Faq>
        <Faq q="How should I store seeds?">
          <p>Keep unopened packets in a cool, dry place away from direct sunlight, moisture and rodents, and use them before the expiry date printed on the pack. Treated seeds are not for food, feed or oil extraction.</p>
        </Faq>
        <Faq q="Can I resell products bought here?">
          <p>Resale of seeds requires a seed licence from your State Agriculture Department. Buy for resale only if you hold one. Dealers and co-operatives can order in volume through our <Link href="/products/institutional">institutional desk</Link>. See our <Link href="/terms">Terms of Use</Link>.</p>
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
      intro="Quick answers about ordering, paying, delivery, returns and the seeds, traps and farm machinery sold on the Surya Enterprises marketplace."
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
