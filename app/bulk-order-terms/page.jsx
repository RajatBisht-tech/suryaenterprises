import Link from "next/link";
import PolicyLayout from "../components/shop/PolicyLayout";
import { SITE } from "../config/site";

const { bulk } = SITE.policies;

const sections = [
  {
    id: "scope",
    title: "Who these terms are for",
    content: (
      <>
        <p>
          These terms apply to quotation-based orders from co-operatives, FPOs, dealer networks, plantations, universities,
          government and institutional buyers for bulk seeds, sprayers, tarpaulins and equipment — see our{" "}
          <Link href="/products/institutional">Bulk &amp; institutional</Link> page. Retail orders placed through the
          cart are governed by our <Link href="/terms">Terms of Use</Link>.
        </p>
        {bulk.minOrderValue ? (
          <p>Institutional pricing applies to orders of ₹{bulk.minOrderValue.toLocaleString("en-IN")} or more.</p>
        ) : null}
      </>
    ),
  },
  {
    id: "quotations",
    title: "Requesting and accepting a quotation",
    content: (
      <>
        <ol>
          <li>Send your requirement (product, variety or model, quantity, packaging, delivery location and timeline) to <a href={`mailto:${SITE.email}`}>{SITE.email}</a> or call {SITE.helpline.display}.</li>
          <li>We issue a written quotation stating price, GST, packaging, delivery terms, lead time and payment terms.</li>
          <li>A quotation is valid for <strong>{bulk.quoteValidityDays} days</strong> from its date unless stated otherwise.</li>
          <li>An order is confirmed when you accept the quotation in writing (email or purchase order) and the payment terms below are met.</li>
        </ol>
      </>
    ),
  },
  {
    id: "payment",
    title: "Payment and credit terms",
    content: (
      <>
        <p>{bulk.creditTerms}</p>
        <ul>
          <li>Payment is by bank transfer (NEFT/RTGS/IMPS) or UPI against our proforma invoice; a GST tax invoice follows on dispatch.</li>
          <li>Where credit is agreed in writing, invoices are payable within the credit period stated in the agreement; overdue amounts may attract interest at the rate stated there and may pause further dispatches.</li>
          <li>Prices in a quotation are firm for the quoted quantity and validity period. Statutory changes in GST or duties after quotation are passed through.</li>
        </ul>
      </>
    ),
  },
  {
    id: "licences",
    title: "Licences and compliance",
    content: (
      <ul>
        <li>Buyers who stock or resell seeds must hold the seed licence required by their State Agriculture Department under the Seeds (Control) Order, 1983, and provide a copy before dispatch.</li>
        <li>Products are supplied for lawful use in India only. Export requires separate written agreement and compliance with export regulations.</li>
        <li>The buyer is responsible for compliance with state-level restrictions on seed varieties, storage conditions and safe operation of equipment at its premises.</li>
      </ul>
    ),
  },
  {
    id: "delivery",
    title: "Packaging, delivery and risk",
    content: (
      <ul>
        <li>Standard packaging is stated in the quotation; custom packaging and private labelling are available on request and may extend lead time.</li>
        <li>Delivery terms (ex-works, FOR destination, etc.) and freight responsibility are stated in the quotation. Unless stated otherwise, risk passes on delivery to the carrier for ex-works terms and on delivery at destination for FOR terms.</li>
        <li>A packing list and GST invoice accompany every consignment; machinery ships with the manufacturer&apos;s warranty cards and manuals.</li>
        <li>Shortages or transit damage must be noted on the carrier’s delivery document and reported within 48 hours with photographs.</li>
      </ul>
    ),
  },
  {
    id: "quality",
    title: "Quality, samples and claims",
    content: (
      <ul>
        <li>Seed lots are supplied in the manufacturer&apos;s sealed packs with the lot number, germination percentage, physical purity and validity printed on the pack as the Seeds Act, 1966 requires.</li>
        <li>Machinery and equipment are supplied new, in the manufacturer&apos;s carton, with the warranty card and manual; warranty service is provided through the manufacturer&apos;s network.</li>
        <li>Pre-shipment samples can be provided on request; acceptance of the sample constitutes acceptance of the specification.</li>
        <li>Quality claims must be raised within 15 days of delivery with the lot or serial number and a retained sample or the unit itself. Disputed seed-quality results are referred to a notified seed-testing laboratory, whose finding is final.</li>
        <li>Our liability for a quality claim is limited to replacement of the non-conforming goods or refund of their price.</li>
      </ul>
    ),
  },
  {
    id: "cancellation",
    title: "Cancellation of bulk orders",
    content: (
      <p>
        Because goods may be procured or packed to order, a confirmed bulk order can be cancelled only with our written
        agreement. Costs already incurred for custom packaging, labels or procurement may be deducted from any refund.
      </p>
    ),
  },
  {
    id: "law",
    title: "Governing law",
    content: (
      <p>
        These terms are governed by Indian law and the courts at {SITE.legal.jurisdiction.city}, {SITE.legal.jurisdiction.state}{" "}
        have exclusive jurisdiction, as set out in our <Link href="/terms#governing-law">Terms of Use</Link>.
      </p>
    ),
  },
];

export default function BulkOrderTermsPage() {
  return (
    <PolicyLayout
      eyebrow="Institutional"
      title="Bulk Order Terms"
      intro="Quotations, payment and credit, licences, delivery and quality terms for bulk orders of seeds, sprayers, tarpaulins and equipment."
      sections={sections}
      related={[
        { name: "Bulk & institutional range", href: "/products/institutional" },
        { name: "Seller policy", href: "/seller-policy" },
        { name: "Shipping policy", href: "/shipping-policy" },
        { name: "Terms of use", href: "/terms" },
      ]}
    />
  );
}
