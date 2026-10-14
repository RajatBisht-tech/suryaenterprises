import Link from "next/link";
import PolicyLayout from "../components/shop/PolicyLayout";
import { SITE } from "../config/site";

const { shipping } = SITE.policies;

const sections = [
  {
    id: "coverage",
    title: "Where we deliver",
    content: (
      <>
        <p>{shipping.serviceableAreas}</p>
        <p>
          You can check a PIN code on any product page before ordering. {SITE.delivery.coverageMessage}
        </p>
      </>
    ),
  },
  {
    id: "dispatch",
    title: "Dispatch and delivery time",
    content: (
      <>
        <ul>
          <li>
            Orders are processed only after the payment is confirmed as successful. Orders are typically dispatched within{" "}
            <strong>{shipping.dispatchWindow}</strong> of payment confirmation, excluding Sundays and public holidays.
          </li>
          <li>
            Transit time depends on the destination and the carrier. Bulky consignments (sprayers, tarpaulins, machinery)
            move by surface transport, so delivery to distant or remote locations takes longer than for small parcels.
          </li>
          <li>We do not promise delivery dates on the Marketplace. Once dispatched, we share the carrier and consignment details by SMS or email so you can follow the shipment.</li>
        </ul>
      </>
    ),
  },
  {
    id: "charges",
    title: "Delivery charges",
    content: (
      <>
        <p>{shipping.charges}</p>
        {SITE.delivery.freeShippingThreshold ? (
          <p>
            Orders of ₹{SITE.delivery.freeShippingThreshold.toLocaleString("en-IN")} or more are delivered free of charge.
          </p>
        ) : null}
        <p>Delivery charges, where applicable, are shown on the invoice and are not refundable once an order has been dispatched, except where the delivery failed for reasons attributable to us.</p>
      </>
    ),
  },
  {
    id: "packaging",
    title: "How orders are packed",
    content: (
      <ul>
        <li>Seed packets travel in sealed manufacturer packs inside a padded outer box or courier bag, away from moisture.</li>
        <li>Traps, lures and repellents are packed in their original sealed packs; liquids are packed upright with absorbent material.</li>
        <li>Sprayers, tarpaulins, tools and machinery ship in the manufacturer&apos;s carton, strapped or crated where the carrier requires it, with the warranty card and manual inside.</li>
        <li>Delivery staff are not trained to assemble or demonstrate equipment. Please do not ask them to open or test a product.</li>
      </ul>
    ),
  },
  {
    id: "restricted",
    title: "Restricted and non-serviceable areas",
    content: (
      <>
        <p>{shipping.restrictedAreas}</p>
        <p>
          A few seed varieties are not notified for sale in particular states; the product page lists those states. If a
          product in your order cannot be shipped to your address, we will cancel that item and refund it in full.
        </p>
      </>
    ),
  },
  {
    id: "receiving",
    title: "Receiving your order",
    content: (
      <>
        <ul>
          <li>Please check the outer packaging for damage before signing for the consignment. If it is visibly damaged, note this with the delivery staff or refuse delivery.</li>
          <li>Open the parcel soon after delivery and check that the products, quantities, pack sizes and (for seeds) lot numbers and expiry dates match your order.</li>
          <li>
            Report damage, shortage, wrong items, defective equipment or expired stock within{" "}
            <strong>{SITE.policies.returns.claimWindowDays} days of delivery</strong> with photographs, as explained in our{" "}
            <Link href="/return-refund-policy">Return &amp; Refund Policy</Link>.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "failed-delivery",
    title: "Failed or returned deliveries",
    content: (
      <p>
        If a consignment cannot be delivered because the address is incomplete, the recipient is unavailable after
        attempts by the carrier, or delivery is refused without a valid reason, it is returned to us. We will contact you
        to re-dispatch (re-shipping charges may apply) or cancel the order and refund the product value in line with our{" "}
        <Link href="/cancellation-policy">Cancellation Policy</Link>.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Delivery queries",
    content: (
      <p>
        For any delivery question, use <Link href="/track-order">Track order</Link> or call {SITE.helpline.display} (
        {SITE.helpline.hours}) with your order ID.
      </p>
    ),
  },
];

export default function ShippingPolicyPage() {
  return (
    <PolicyLayout
      eyebrow="Customer service"
      title="Shipping & Delivery Policy"
      intro="Where we deliver, how long dispatch takes, what it costs, how seeds and equipment are packed, and what to check when your order arrives."
      sections={sections}
    />
  );
}
