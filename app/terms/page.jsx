import Link from "next/link";
import PolicyLayout from "../components/shop/PolicyLayout";
import { SITE } from "../config/site";

const { jurisdiction } = SITE.legal;

const sections = [
  {
    id: "acceptance",
    title: "Acceptance of these terms",
    content: (
      <>
        <p>
          These Terms of Use (“Terms”) govern your access to and use of <strong>www.suryaenter.in</strong> and any
          purchase made through it (together, the “Marketplace”), operated by <strong>{SITE.legalName}</strong>{" "}
          (“Surya Enterprises”, “we”, “us”). By browsing the Marketplace or placing an order you agree to these Terms,
          our <Link href="/privacy">Privacy Policy</Link> and the other policies linked in the footer. If you do not
          agree, please do not use the Marketplace.
        </p>
        <p>
          These Terms are an electronic record under the Information Technology Act, 2000 and do not require a physical
          signature.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "Eligibility and lawful purchase of agri-inputs",
    content: (
      <>
        <ul>
          <li>You must be at least 18 years old and competent to contract under the Indian Contract Act, 1872.</li>
          <li>
            The Marketplace sells seeds, traps &amp; repellents and farm machinery. Seeds are regulated under the Seeds
            Act, 1966 and the Seeds (Control) Order, 1983. By buying from us you confirm that you are buying for bona fide
            agricultural use, or that you hold any licence required for resale or commercial stocking in your state.
          </li>
          <li>
            Products must be used only as directed on the packet, label or manual supplied by the manufacturer. See our{" "}
            <Link href="/disclaimer">Disclaimer</Link>.
          </li>
          <li>You are responsible for ensuring that the product you order is legal to possess and use in your state or district (some seed varieties are not notified for sale in every state).</li>
        </ul>
      </>
    ),
  },
  {
    id: "orders",
    title: "Orders, acceptance and payment",
    content: (
      <>
        <ul>
          <li>
            An order is placed when you submit the checkout form and complete payment. We confirm the order only when
            the payment is reported as successful by our payment partner. Until then, no contract of sale exists.
          </li>
          <li>
            Payments are accepted through UPI via PayU. Details, including failed and pending payments, are in our{" "}
            <Link href="/payment-policy">Payment Policy</Link>.
          </li>
          <li>
            We may refuse or cancel an order for reasons including unavailability of stock, regulatory restrictions in
            the delivery area, suspected fraud or misuse, or an inability to verify your details. Any amount already
            paid for a cancelled order is refunded in full to the original payment method.
          </li>
          <li>Quantities per order may be limited by available stock. Bulk requirements are handled under our <Link href="/bulk-order-terms">Bulk Order Terms</Link>.</li>
        </ul>
      </>
    ),
  },
  {
    id: "pricing",
    title: "Pricing, taxes and pricing errors",
    content: (
      <>
        <ul>
          <li>Prices are shown in Indian Rupees. Applicable GST is stated on your invoice. Delivery charges, if any, are shown or confirmed before you pay.</li>
          <li>
            Where a maximum retail price (MRP) is shown, our selling price will never exceed it, in line with the Legal
            Metrology (Packaged Commodities) Rules, 2011.
          </li>
          <li>
            Despite our efforts, a product may occasionally be listed at an incorrect price or with incorrect
            information. If the correct price is higher than the price charged, we will contact you to either confirm
            the order at the correct price or cancel it with a full refund. We are not obliged to supply a product at an
            incorrectly listed price.
          </li>
          <li>Prices and availability may change without notice; the price at the time of successful payment applies.</li>
        </ul>
      </>
    ),
  },
  {
    id: "product-information",
    title: "Product information",
    content: (
      <>
        <p>
          We take care to describe each product accurately, including the brand, variety or model, and pack size.
          Images are indicative; packaging may vary from lot to lot. Information on the Marketplace is not agronomic
          advice: crop suitability, sowing time and placement must be taken from the product packet or manual and,
          where needed, from a qualified agricultural extension officer or agronomist.
        </p>
      </>
    ),
  },
  {
    id: "delivery-returns",
    title: "Delivery, cancellations and returns",
    content: (
      <p>
        Delivery timelines and charges are governed by our <Link href="/shipping-policy">Shipping Policy</Link>; order
        cancellation by our <Link href="/cancellation-policy">Cancellation Policy</Link>; and damaged, wrong or
        expired-on-arrival items by our <Link href="/return-refund-policy">Return &amp; Refund Policy</Link>. Opened seed
        packets and used equipment cannot be returned.
      </p>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use of the Marketplace",
    content: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>use the Marketplace for any unlawful purpose, or to buy products for prohibited uses;</li>
          <li>submit false, misleading or someone else’s details at checkout;</li>
          <li>scrape, copy or republish product listings, images or data without written permission;</li>
          <li>interfere with the security or operation of the website, or attempt to access data that is not yours;</li>
          <li>place orders with no intention of paying, or raise claims you know to be false.</li>
        </ul>
      </>
    ),
  },
  {
    id: "intellectual-property",
    title: "Intellectual property",
    content: (
      <p>
        All content on the Marketplace — the Surya Enterprises name and logo, product names, descriptions, images,
        illustrations, layout and software — is owned by or licensed to {SITE.legalName} and protected under Indian
        copyright and trade-mark law. Our <Link href="/intellectual-property">Intellectual Property Policy</Link>{" "}
        explains permitted use and how to report infringement.
      </p>
    ),
  },
  {
    id: "warranties",
    title: "Warranties and disclaimers",
    content: (
      <>
        <p>
          Products are supplied in sealed manufacturer packaging and conform to the specification stated on the label
          at the time of dispatch. Beyond this, and to the extent permitted by law, the Marketplace and its content are
          provided “as is” without warranties of any kind. In particular, we do not warrant crop yield, trap catches or
          suitability for a specific field condition — results depend on weather, timing, sowing or placement, soil and
          pest pressure, which are outside our control. Machinery carries the manufacturer&apos;s warranty as stated in
          the box.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    content: (
      <>
        <p>
          Nothing in these Terms limits liability that cannot be limited under Indian law, including under the Consumer
          Protection Act, 2019. Subject to that, our total liability for any claim arising from an order is limited to
          the amount paid for that order, and we are not liable for indirect or consequential loss such as loss of crop,
          profit or goodwill, or for losses caused by use of a product contrary to its packet, label or manual.
        </p>
      </>
    ),
  },
  {
    id: "indemnity",
    title: "Indemnity",
    content: (
      <p>
        You agree to indemnify Surya Enterprises against claims, losses and costs arising from your breach of these
        Terms or of applicable law, including use of a product in a manner not permitted by its packet, label or manual,
        or resale without the required licence.
      </p>
    ),
  },
  {
    id: "governing-law",
    title: "Governing law and jurisdiction",
    content: (
      <p>
        These Terms are governed by the laws of India. Subject to the rights of consumers under the Consumer Protection
        Act, 2019 to approach the appropriate consumer commission, the courts at{" "}
        <strong>
          {jurisdiction.city}, {jurisdiction.state}
        </strong>{" "}
        have exclusive jurisdiction over any dispute arising from these Terms or your use of the Marketplace.
      </p>
    ),
  },
  {
    id: "grievances",
    title: "Grievances and contact",
    content: (
      <p>
        Complaints about the Marketplace, an order or these Terms can be raised with our Grievance Officer as described
        in the <Link href="/grievance-redressal">Grievance Redressal Policy</Link>, by email at{" "}
        <a href={`mailto:${SITE.grievanceEmail}`}>{SITE.grievanceEmail}</a> or by phone on {SITE.helpline.display}{" "}
        ({SITE.helpline.hours}).
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    content: (
      <p>
        We may revise these Terms from time to time. The version in force when you place an order applies to that order.
        Continued use of the Marketplace after a change means you accept the revised Terms.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <PolicyLayout
      eyebrow="Legal"
      title="Terms of Use"
      intro="The rules for using the Surya Enterprises marketplace and buying seeds, traps and farm machinery from us."
      sections={sections}
    />
  );
}
