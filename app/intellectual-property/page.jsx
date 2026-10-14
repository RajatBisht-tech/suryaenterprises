import Link from "next/link";
import PolicyLayout from "../components/shop/PolicyLayout";
import { SITE } from "../config/site";

const takedown = SITE.legal.takedownEmail;

const sections = [
  {
    id: "ownership",
    title: "What we own",
    content: (
      <p>
        The Surya Enterprises name, logo and wordmark, product names and descriptions written by us, photographs,
        illustrations, page layouts, the catalogue database and the software that runs www.suryaenter.in are owned by or
        licensed to {SITE.legalName} and protected under the Copyright Act, 1957, the Trade Marks Act, 1999 and other
        applicable law. Third-party brand names that appear on product labels belong to their respective owners.
      </p>
    ),
  },
  {
    id: "permitted-use",
    title: "What you may do",
    content: (
      <ul>
        <li>View, print or save pages for your own, non-commercial use in connection with buying from us.</li>
        <li>Share links to product pages.</li>
        <li>Quote short extracts of product information for a review or comparison, with attribution and a link.</li>
      </ul>
    ),
  },
  {
    id: "prohibited-use",
    title: "What you may not do",
    content: (
      <ul>
        <li>Copy, scrape or bulk-download product listings, images, prices or the catalogue, or use them to build another catalogue or price-comparison service without written permission.</li>
        <li>Use the Surya Enterprises name, logo or packaging artwork on your own products, websites, social media or advertising, or in a way that suggests endorsement.</li>
        <li>Re-label, re-pack or sell our products under another name.</li>
        <li>Modify, reverse-engineer or create derivative works from the website or its content.</li>
      </ul>
    ),
  },
  {
    id: "counterfeits",
    title: "Counterfeit and look-alike products",
    content: (
      <p>
        Counterfeit seeds and spare parts endanger crops and people. If you come across a product that imitates a product
        or packaging sold by Surya Enterprises, or a website or seller claiming to be us, please tell us at{" "}
        <a href={`mailto:${takedown}`}>{takedown}</a>. Genuine products are sold by us directly through this website and
        through our authorised channels.
      </p>
    ),
  },
  {
    id: "takedown",
    title: "Reporting infringement (takedown requests)",
    content: (
      <>
        <p>
          If you believe content on this website infringes your copyright, trade mark or other rights, send a notice to{" "}
          <a href={`mailto:${takedown}?subject=${encodeURIComponent("IP infringement notice")}`}>{takedown}</a> with the
          subject “IP infringement notice” and include:
        </p>
        <ol>
          <li>your name, organisation, address, email and phone number;</li>
          <li>a description of the work or mark you own and proof of ownership (for example, a registration number);</li>
          <li>the URL(s) of the content you believe infringes it and why;</li>
          <li>a statement that the information in the notice is accurate and that you are the owner or authorised to act for the owner; and</li>
          <li>your physical or electronic signature.</li>
        </ol>
        <p>
          We acknowledge notices within 48 hours and act on valid notices within the timelines in our{" "}
          <Link href="/grievance-redressal">Grievance Redressal Policy</Link>, which may include removing or disabling
          the content and informing the party who posted it.
        </p>
      </>
    ),
  },
  {
    id: "permissions",
    title: "Asking for permission",
    content: (
      <p>
        Dealers, distributors and media who wish to use our brand assets or product images can request permission at{" "}
        <a href={`mailto:${SITE.email}`}>{SITE.email}</a>. Please describe the intended use, medium and duration.
      </p>
    ),
  },
];

export default function IntellectualPropertyPage() {
  return (
    <PolicyLayout
      eyebrow="Legal"
      title="Intellectual Property Policy"
      intro="Ownership of the content on this marketplace, what you may and may not do with it, and how to report infringement."
      sections={sections}
      related={[
        { name: "Terms of use", href: "/terms" },
        { name: "Disclaimer", href: "/disclaimer" },
        { name: "Seller policy", href: "/seller-policy" },
        { name: "Grievance redressal", href: "/grievance-redressal" },
      ]}
    />
  );
}
