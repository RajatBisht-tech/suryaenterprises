import Link from "next/link";
import PolicyLayout from "../components/shop/PolicyLayout";
import { SITE } from "../config/site";

const { returns } = SITE.policies;

const sections = [
  {
    id: "overview",
    title: "Our approach",
    content: (
      <>
        <p>
          Seeds are living, perishable goods: once a packet is opened its germination can no longer be guaranteed, so we
          cannot take opened seed packets back. Machinery and equipment can be returned when unused and in the original
          packaging. What we promise in every case is this: if a product reaches you damaged, wrong, short, defective or
          expired, we will replace it or refund it.
        </p>
        <div className="callout">
          Claims must be raised within <strong>{returns.claimWindowDays} days of delivery</strong>, with photographs.
          Approved refunds are returned to the original UPI account within <strong>{returns.refundTimeline}</strong>.
        </div>
      </>
    ),
  },
  {
    id: "seeds",
    title: "Seeds, traps and repellents",
    content: (
      <>
        <ul>
          <li>Seed packets whose seal has been opened, punctured or tampered with cannot be returned.</li>
          <li>Sealed seed packets can be returned for a change of mind only while the order is still cancellable under our <Link href="/cancellation-policy">Cancellation Policy</Link>.</li>
          <li>Traps, lures and repellents can be returned only if the pack is sealed and unused; opened lures and sticky sheets cannot be returned.</li>
          <li>Products bought for one crop or season but found unsuitable for another cannot be returned — check the crop, variety and season on the packet before ordering.</li>
          <li>Germination complaints are handled under the Seeds Act, 1966: keep the packet, lot number and purchase invoice, and report within the claim window with photographs of the sowing.</li>
        </ul>
      </>
    ),
  },
  {
    id: "machinery",
    title: "Farm machinery and equipment",
    content: (
      <>
        <ul>
          <li>Sprayers, tools, tarpaulins, irrigation and other equipment can be returned within {returns.claimWindowDays} days of delivery if unused, complete with all accessories, manuals and warranty cards, and in the original packaging. Return shipping for change-of-mind returns is charged.</li>
          <li>Equipment that has been fuelled, filled, assembled beyond inspection or used in the field cannot be returned as unused; manufacturing defects are then handled under the manufacturer&apos;s warranty, and our helpline will connect you with the service network.</li>
          <li>Tarpaulins, mulch film and nets that have been cut or fitted cannot be returned.</li>
          <li>Products damaged after delivery by improper storage, weather or handling are not eligible.</li>
        </ul>
      </>
    ),
  },
  {
    id: "eligible-claims",
    title: "Eligible claims",
    content: (
      <>
        <table>
          <thead>
            <tr>
              <th>Issue</th>
              <th>What we need from you</th>
              <th>Resolution</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Damaged on arrival</td>
              <td>Photos of the outer box, the damaged pack or part and the shipping label; do not use the product.</td>
              <td>Replacement, or refund if stock is unavailable.</td>
            </tr>
            <tr>
              <td>Wrong product, variety, pack size or quantity</td>
              <td>Photo of the product label and the invoice/packing slip.</td>
              <td>Correct item dispatched, or refund of the affected item.</td>
            </tr>
            <tr>
              <td>Seeds expired or near-expiry on arrival</td>
              <td>Photo of the lot number and expiry date on the packet.</td>
              <td>Replacement from a fresh lot, or refund.</td>
            </tr>
            <tr>
              <td>Equipment defective out of the box</td>
              <td>Photo or short video of the fault, the model label and the invoice.</td>
              <td>Replacement, repair under warranty, or refund.</td>
            </tr>
            <tr>
              <td>Missing items or parts</td>
              <td>Photo of everything received alongside the packing slip.</td>
              <td>Missing item dispatched, or refund.</td>
            </tr>
          </tbody>
        </table>
        <p>Where a replacement is agreed, the damaged or wrong item is collected by our carrier in its original packaging; please keep it sealed and stored safely until pickup.</p>
      </>
    ),
  },
  {
    id: "how-to-claim",
    title: "How to raise a claim",
    content: (
      <>
        <ol>
          <li>
            Within {returns.claimWindowDays} days of delivery, email <a href={`mailto:${SITE.email}`}>{SITE.email}</a> or
            call {SITE.helpline.display} ({SITE.helpline.hours}) with your <strong>order ID</strong>.
          </li>
          <li>Attach clear photographs as listed above. For equipment faults, a short video helps us resolve the claim faster.</li>
          <li>We acknowledge the claim within 48 hours and may ask for additional photos.</li>
          <li>Once approved, we arrange pickup (if needed) and dispatch the replacement or initiate the refund.</li>
        </ol>
      </>
    ),
  },
  {
    id: "refunds",
    title: "Refund method and timeline",
    content: (
      <>
        <ul>
          <li>Refunds are made only to the <strong>original UPI account</strong> used for payment, through PayU. We cannot refund to a different account or in cash.</li>
          <li>Approved refunds are initiated within 2 working days and normally reach your account within <strong>{returns.refundTimeline}</strong>, depending on your bank.</li>
          <li>The refund covers the product value and GST for the affected item. Delivery charges are refunded when the whole order is affected or the issue is attributable to us.</li>
          <li>If a refund has not arrived after the stated period, share the UPI transaction reference with us and we will raise it with PayU.</li>
        </ul>
      </>
    ),
  },
  {
    id: "disputes",
    title: "If you disagree with a decision",
    content: (
      <p>
        You may escalate to our Grievance Officer under the <Link href="/grievance-redressal">Grievance Redressal Policy</Link>.
        Consumers also retain their rights under the Consumer Protection Act, 2019.
      </p>
    ),
  },
];

export default function ReturnRefundPolicyPage() {
  return (
    <PolicyLayout
      eyebrow="Customer service"
      title="Return & Refund Policy"
      intro="Opened seed packets cannot be returned and machinery must be unused — but damaged, wrong, short, defective or expired-on-arrival items are always replaced or refunded."
      sections={sections}
    />
  );
}
