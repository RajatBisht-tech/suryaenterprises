import Link from "next/link";
import PolicyLayout from "../components/shop/PolicyLayout";
import { SITE } from "../config/site";

const { cancellation, returns } = SITE.policies;

const sections = [
  {
    id: "by-you",
    title: "Cancelling an order you placed",
    content: (
      <>
        <p>
          You can cancel a paid order <strong>{cancellation.window}</strong>. Once a consignment has been handed to the
          carrier it can no longer be cancelled, because consignments cannot be recalled or re-routed in transit.
        </p>
        <ol>
          <li>
            Call {SITE.helpline.display} ({SITE.helpline.hours}) or email <a href={`mailto:${SITE.email}`}>{SITE.email}</a>{" "}
            with your <strong>order ID</strong> and the mobile number used at checkout.
          </li>
          <li>We confirm whether the order is still cancellable and send you a written confirmation.</li>
          <li>The full amount paid is refunded to the original UPI account within {returns.refundTimeline}.</li>
        </ol>
        <p>
          Online self-service cancellation is not available yet; the helpline is the fastest route. If the order has
          already been dispatched, you may refuse delivery, in which case it is treated as a returned delivery under our{" "}
          <Link href="/shipping-policy">Shipping Policy</Link> and the product value is refunded after the consignment
          reaches us intact.
        </p>
      </>
    ),
  },
  {
    id: "partial",
    title: "Partial cancellation",
    content: (
      <p>
        Individual items can be removed from an order before dispatch. The refund for removed items is processed the same
        way as a full cancellation. Delivery charges, if any, are recalculated for the remaining items only if the
        cancellation changes the shipping weight class.
      </p>
    ),
  },
  {
    id: "by-us",
    title: "Cancellation by Surya Enterprises",
    content: (
      <>
        <p>We may cancel an order, in whole or in part, when:</p>
        <ul>
          <li>the product is out of stock or the batch does not meet our quality checks at dispatch;</li>
          <li>the product cannot lawfully be shipped to or sold in the delivery area;</li>
          <li>there is a pricing or listing error (see <Link href="/terms">Terms of Use</Link>);</li>
          <li>the delivery address or contact details cannot be verified; or</li>
          <li>we suspect fraud, misuse or purchase for a prohibited purpose.</li>
        </ul>
        <p>In every such case we inform you by SMS or email and refund the full amount paid for the cancelled items.</p>
      </>
    ),
  },
  {
    id: "payment-pending",
    title: "Orders with pending or failed payment",
    content: (
      <p>
        An order exists only once payment is successful. If a UPI payment stays pending beyond{" "}
        {SITE.policies.payment.pendingWindowMinutes} minutes or fails, no order is created and nothing needs to be
        cancelled. Any amount debited for a failed payment is reversed by your bank as explained in our{" "}
        <Link href="/payment-policy">Payment Policy</Link>.
      </p>
    ),
  },
  {
    id: "refund-timeline",
    title: "Refund timeline",
    content: (
      <p>
        Refunds for cancellations are initiated within 2 working days of confirmation and normally reach the original UPI
        account within <strong>{returns.refundTimeline}</strong>. Refunds cannot be made to a different account or in cash.
      </p>
    ),
  },
  {
    id: "bulk",
    title: "Bulk and institutional orders",
    content: (
      <p>
        Cancellation of quotation-based institutional orders is governed by the quotation and our{" "}
        <Link href="/bulk-order-terms">Bulk Order Terms</Link>, since custom packaging and made-to-order quantities may be
        prepared specifically for the order.
      </p>
    ),
  },
];

export default function CancellationPolicyPage() {
  return (
    <PolicyLayout
      eyebrow="Customer service"
      title="Cancellation Policy"
      intro="How to cancel an order before it ships, when we may cancel one ourselves, and how refunds are returned."
      sections={sections}
    />
  );
}
