import Link from "next/link";
import PolicyLayout from "../components/shop/PolicyLayout";
import { SITE } from "../config/site";

const sections = [
  {
    id: "status",
    title: "Current status of the marketplace",
    content: (
      <>
        <div className="callout">
          Today every product on www.suryaenter.in is <strong>sold by {SITE.legalName} itself</strong>. We do not yet
          host third-party sellers. This policy sets out the terms that will apply to supplier and brand partners when
          marketplace selling opens, and how to register interest now.
        </div>
      </>
    ),
  },
  {
    id: "who",
    title: "Who can become a seller",
    content: (
      <ul>
        <li>Manufacturers, importers and authorised distributors of seeds, traps &amp; repellents and farm machinery registered in India.</li>
        <li>For seeds: entities complying with the Seeds Act, 1966, the Seeds (Control) Order, 1983 and state seed-licensing rules, selling only varieties notified or truthfully labelled as the law requires.</li>
        <li>For farm machinery and equipment: manufacturers or authorised distributors able to honour the manufacturer&apos;s warranty through a service network in India, with BIS certification where the product category requires it.</li>
        <li>For traps, lures and repellents: entities able to document the composition and intended use of each product and to supply it in sealed, labelled packs.</li>
        <li>GST-registered businesses able to issue tax invoices in the buyer’s name.</li>
      </ul>
    ),
  },
  {
    id: "onboarding",
    title: "Onboarding and documents",
    content: (
      <>
        <p>Prospective sellers will be asked for:</p>
        <ul>
          <li>Certificate of incorporation or partnership/proprietorship proof, PAN and GSTIN;</li>
          <li>Regulatory licences and registrations relevant to each product category;</li>
          <li>Product master data: name, brand, variety or model, pack sizes, MRP, label or packet artwork, and for machinery the warranty terms and user manual;</li>
          <li>Bank account details for settlements, and a signed seller agreement.</li>
        </ul>
        <p>We verify documents before any listing goes live and may re-verify periodically or on complaint.</p>
      </>
    ),
  },
  {
    id: "listing-standards",
    title: "Listing standards",
    content: (
      <ul>
        <li>Only seeds, traps &amp; repellents and farm machinery permitted for sale in India may be listed; state-level restrictions on seed varieties must be respected.</li>
        <li>Listings must match the packet, label or manual exactly — no claims of yield, crops, catches or benefits beyond what the manufacturer states.</li>
        <li>Selling price must not exceed the printed MRP. Discounts, if any, must be genuine.</li>
        <li>Images must show the actual product and packaging; stock photos of crops or unrelated products are not allowed.</li>
        <li>Expiry: only seed lots with adequate remaining validity may be dispatched; the lot number, germination and expiry details must be visible on the packet.</li>
      </ul>
    ),
  },
  {
    id: "fulfilment",
    title: "Fulfilment and service levels",
    content: (
      <ul>
        <li>Sellers must dispatch within the dispatch window published in our <Link href="/shipping-policy">Shipping Policy</Link>, in the manufacturer&apos;s sealed packaging, and provide tracking details.</li>
        <li>Sellers honour the <Link href="/return-refund-policy">Return &amp; Refund Policy</Link> and <Link href="/cancellation-policy">Cancellation Policy</Link> for their products, including replacement of damaged, wrong, defective or expired items.</li>
        <li>Customer complaints are routed through our <Link href="/grievance-redressal">Grievance Redressal</Link> process; sellers must respond to a referred complaint within 2 working days.</li>
      </ul>
    ),
  },
  {
    id: "commercials",
    title: "Commercial terms",
    content: (
      <p>
        Commission or listing fees, settlement cycles and payment-gateway charges will be stated in the seller agreement.
        Settlements are made by bank transfer against GST-compliant invoices, net of agreed fees and any refunds or
        chargebacks attributable to the seller.
      </p>
    ),
  },
  {
    id: "conduct",
    title: "Prohibited conduct and termination",
    content: (
      <>
        <p>We may suspend or delist a seller for:</p>
        <ul>
          <li>selling counterfeit, adulterated, expired or unapproved products;</li>
          <li>packet, label or pricing claims that breach the law or our standards;</li>
          <li>repeated late dispatch, poor packaging or unresolved complaints;</li>
          <li>contacting buyers to divert orders off the platform; or</li>
          <li>any breach of the seller agreement or applicable law.</li>
        </ul>
      </>
    ),
  },
  {
    id: "register",
    title: "Register your interest",
    content: (
      <p>
        Suppliers and brand partners can write to{" "}
        <a href={`mailto:${SITE.email}?subject=${encodeURIComponent("Seller / brand partner enquiry")}`}>{SITE.email}</a>{" "}
        with the subject “Seller enquiry”, including your company name, product categories, registrations held and the
        states you can serve. We will contact you when onboarding opens.
      </p>
    ),
  },
];

export default function SellerPolicyPage() {
  return (
    <PolicyLayout
      eyebrow="Partners"
      title="Seller Policy"
      intro="Terms for suppliers and brand partners who wish to sell seeds, traps & repellents or farm machinery through the Surya Enterprises marketplace in future."
      sections={sections}
      related={[
        { name: "Bulk order terms", href: "/bulk-order-terms" },
        { name: "Intellectual property", href: "/intellectual-property" },
        { name: "Disclaimer", href: "/disclaimer" },
        { name: "Terms of use", href: "/terms" },
      ]}
    />
  );
}
