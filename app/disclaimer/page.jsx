import Link from "next/link";
import PolicyLayout from "../components/shop/PolicyLayout";
import { SITE } from "../config/site";

const sections = [
  {
    id: "general",
    title: "General",
    content: (
      <p>
        The information on www.suryaenter.in is published by {SITE.legalName} in good faith and for general information
        only. While we work to keep product listings accurate and current, we make no representation or warranty,
        express or implied, about the completeness, accuracy or reliability of any content, and we may change it
        without notice.
      </p>
    ),
  },
  {
    id: "products",
    title: "Product descriptions and images",
    content: (
      <ul>
        <li>Product names, active ingredients, formulations and pack sizes are stated as provided on the manufacturer’s label. Images are indicative; packaging designs change from time to time.</li>
        <li>Ratings shown on product pages are the ratings available to us at the time of listing and are not a guarantee of performance.</li>
        <li>Stock levels and prices are updated regularly but may lag actual availability. An order is confirmed only on successful payment and our acceptance (see <Link href="/terms">Terms of Use</Link>).</li>
      </ul>
    ),
  },
  {
    id: "no-advice",
    title: "No agronomic, legal or medical advice",
    content: (
      <p>
        Nothing on this website — including category descriptions, “shop by need” groupings, search results, FAQs or
        helpline guidance — is a recommendation to sow a particular variety or use a particular trap or machine on a
        particular crop, field or pest. Use only as directed on the packet, label or manual supplied by the
        manufacturer, and consult a qualified agronomist or your local Krishi Vigyan Kendra for field-specific advice.
      </p>
    ),
  },
  {
    id: "results",
    title: "No guarantee of results",
    content: (
      <p>
        Crop-protection outcomes depend on correct identification of the pest or disease, timing, dose, application
        method, weather, soil and resistance levels. We do not guarantee any level of pest control, disease control,
        growth response or yield.
      </p>
    ),
  },
  {
    id: "external",
    title: "External links and third-party services",
    content: (
      <p>
        The website links to third-party services such as PayU, UPI apps and courier tracking pages. We do not control
        these services and are not responsible for their content, availability or privacy practices.
      </p>
    ),
  },
  {
    id: "availability",
    title: "Website availability",
    content: (
      <p>
        We aim to keep the website available at all times but do not guarantee uninterrupted access. Maintenance,
        maintenance or events outside our control may make the site temporarily unavailable.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    content: (
      <p>
        To the fullest extent permitted by Indian law, {SITE.legalName} is not liable for any loss or damage arising from
        reliance on information on this website, from use of a product contrary to its label, or from the use or
        inability to use the website. Nothing in this disclaimer limits rights that cannot be limited under the Consumer
        Protection Act, 2019.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    content: (
      <p>
        Questions about this disclaimer: <a href={`mailto:${SITE.email}`}>{SITE.email}</a> or {SITE.helpline.display}.
      </p>
    ),
  },
];

export default function DisclaimerPage() {
  return (
    <PolicyLayout
      eyebrow="Legal"
      title="Disclaimer"
      intro="What the information on this marketplace is — and is not — and the limits of our responsibility for it."
      sections={sections}
      related={[
        { name: "Terms of use", href: "/terms" },
        { name: "Return & refund policy", href: "/return-refund-policy" },
        { name: "Privacy policy", href: "/privacy" },
        { name: "Intellectual property", href: "/intellectual-property" },
      ]}
    />
  );
}
