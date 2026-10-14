import Link from "next/link";
import PolicyLayout from "../components/shop/PolicyLayout";
import { SITE } from "../config/site";

const officer = SITE.legal.grievanceOfficer;

const sections = [
  {
    id: "scope",
    title: "Who we are and what this policy covers",
    content: (
      <>
        <p>
          This Privacy Policy explains how <strong>{SITE.legalName}</strong> (“Surya Enterprises”, “we”, “us”) collects,
          uses, shares and protects personal data when you visit <strong>www.suryaenter.in</strong>, browse the
          marketplace, place an order or contact us. We act as the <strong>Data Fiduciary</strong> for this personal data
          under the Digital Personal Data Protection Act, 2023 (“DPDP Act”) and the rules made under it.
        </p>
        <p>
          It applies to farmers, agri-retailers, institutional buyers and any other visitor to the website. It does not
          cover third-party websites or apps linked from our pages (for example, your UPI app), which have their own
          privacy policies.
        </p>
      </>
    ),
  },
  {
    id: "data-we-collect",
    title: "Personal data we collect",
    content: (
      <>
        <p>We collect only the personal data needed to run the marketplace and fulfil your orders:</p>
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>What we collect</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Placing an order (checkout)</td>
              <td>
                First and last name, delivery address (house/street, apartment, city, state, PIN code), mobile number,
                email address and any order notes you type in.
              </td>
            </tr>
            <tr>
              <td>Paying for an order</td>
              <td>
                A unique order ID, the order amount, your name, email and mobile number are shared with our payment
                partner PayU to generate a UPI payment request. We receive the payment status (pending, paid, failed)
                and a transaction reference. <strong>We never receive or store your UPI PIN, bank account or card
                details.</strong>
              </td>
            </tr>
            <tr>
              <td>Contacting us or requesting a quote</td>
              <td>Name, email, mobile number, company name and the message you send (via email or the helpline).</td>
            </tr>
            <tr>
              <td>Browsing the site</td>
              <td>
                Standard server logs (IP address, browser type, pages requested, time of request) used for security and
                to keep the site running. Your cart, wishlist, recently viewed products and chosen delivery PIN are kept
                <strong> only in your browser’s local storage</strong> and are not sent to us until you place an order.
              </td>
            </tr>
          </tbody>
        </table>
        <p>
          We do not collect sensitive personal data such as financial account numbers, biometric data or health
          information, and we do not knowingly collect personal data from children under 18.
        </p>
      </>
    ),
  },
  {
    id: "purpose",
    title: "Why we use your data (purpose and lawful basis)",
    content: (
      <>
        <p>We process personal data for the following specified purposes, each with your consent or as permitted by the DPDP Act:</p>
        <ul>
          <li><strong>Fulfilling orders</strong> — creating the payment request, confirming payment, packing, dispatching and delivering your products, and issuing a GST invoice.</li>
          <li><strong>Customer support</strong> — answering queries, handling claims for damaged or wrong items, cancellations and refunds.</li>
          <li><strong>Legal and regulatory compliance</strong> — maintaining sale records required under GST law and the Seeds Act, 1966 and rules, and responding to lawful requests from authorities.</li>
          <li><strong>Safety and security</strong> — preventing fraud, misuse and unauthorised access to the website.</li>
          <li><strong>Communications</strong> — order and payment updates by SMS, email or phone. Marketing messages are sent only if you opt in (our newsletter sign-up is not yet live and collects nothing today).</li>
        </ul>
        <p>We do not sell personal data, and we do not use it for automated profiling or targeted advertising.</p>
      </>
    ),
  },
  {
    id: "consent",
    title: "Consent and how to withdraw it",
    content: (
      <>
        <p>
          By entering your details at checkout or when contacting us, you give free, specific and informed consent to the
          processing described above. You can withdraw consent at any time by writing to{" "}
          <a href={`mailto:${SITE.grievanceEmail}`}>{SITE.grievanceEmail}</a>. Withdrawal does not affect processing
          already carried out, and we may still need to retain certain records to meet legal obligations (see Retention).
        </p>
        <p>
          If a withdrawal means we can no longer fulfil an order in progress, we will tell you and process any refund in
          line with our <Link href="/return-refund-policy">Return &amp; Refund Policy</Link>.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Who we share data with",
    content: (
      <>
        <p>We share personal data only with parties needed to serve you, each acting as a Data Processor on our instructions or as an independent regulated entity:</p>
        <ul>
          <li><strong>Payment partner (PayU)</strong> — to generate and verify UPI payments. PayU is regulated by the Reserve Bank of India and processes data under its own privacy policy.</li>
          <li><strong>Courier and transport partners</strong> — name, address and mobile number so the consignment can be delivered and you can be contacted at the doorstep.</li>
          <li><strong>Hosting and infrastructure providers</strong> — servers that run the website and store order records.</li>
          <li><strong>Government authorities</strong> — where required by law, court order or a regulator such as the State Agriculture Department or GST authorities.</li>
        </ul>
        <p>We do not transfer personal data to any party for their own marketing.</p>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep data",
    content: (
      <>
        <ul>
          <li><strong>Order, invoice and payment records</strong> — retained for the period required under GST and other tax laws (currently up to 8 years from the end of the relevant financial year), after which they are deleted or anonymised.</li>
          <li><strong>Support correspondence</strong> — retained for up to 3 years after the query is closed, to handle follow-ups and disputes.</li>
          <li><strong>Server logs</strong> — retained for up to 180 days, in line with Indian cyber-security directions, unless needed for an investigation.</li>
          <li><strong>Browser storage (cart, wishlist, recently viewed, delivery PIN)</strong> — stays on your device until you clear it or remove the items.</li>
        </ul>
        <p>When the purpose is served and no legal retention applies, personal data is erased.</p>
      </>
    ),
  },
  {
    id: "rights",
    title: "Your rights as a Data Principal",
    content: (
      <>
        <p>Under the DPDP Act you have the right to:</p>
        <ul>
          <li><strong>Access</strong> a summary of the personal data we hold about you and how it has been processed;</li>
          <li><strong>Correct, complete or update</strong> inaccurate or outdated data;</li>
          <li><strong>Erase</strong> personal data that is no longer necessary for the purpose it was collected for, subject to legal retention;</li>
          <li><strong>Grievance redressal</strong> through the Grievance Officer named below;</li>
          <li><strong>Nominate</strong> another person to exercise these rights in the event of your death or incapacity.</li>
        </ul>
        <p>
          To exercise a right, email <a href={`mailto:${SITE.grievanceEmail}`}>{SITE.grievanceEmail}</a> from the address
          used for your order, quoting the order ID where relevant. We may ask for information to verify your identity.
          We respond within the timelines set out in our <Link href="/grievance-redressal">Grievance Redressal Policy</Link>.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "How we protect your data",
    content: (
      <>
        <p>
          The website is served over HTTPS. Payments are initiated through PayU’s secure APIs, and no UPI PIN, bank or
          card information passes through or is stored on our systems. Access to order records is limited to staff who
          need it to process orders and support customers. In the event of a personal data breach that is likely to
          affect you, we will notify you and the Data Protection Board of India as required by law.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and local storage",
    content: (
      <p>
        We use essential browser storage to remember your cart, wishlist, recently viewed products and delivery PIN.
        Details, including any analytics tools in use, are in our <Link href="/cookie-policy">Cookie Policy</Link>.
      </p>
    ),
  },
  {
    id: "grievance",
    title: "Grievance Officer",
    content: (
      <>
        <dl>
          {officer.name && (
            <>
              <dt>Name</dt>
              <dd>{officer.name}</dd>
            </>
          )}
          <dt>Designation</dt>
          <dd>
            {officer.designation}, {SITE.legalName}
            {officer.credentials ? <span className="block text-xs text-ink-3">{officer.credentials}</span> : null}
          </dd>
          <dt>Email</dt>
          <dd><a href={`mailto:${officer.email}`}>{officer.email}</a></dd>
          <dt>Phone</dt>
          <dd>{officer.phone.display} ({officer.phone.hours})</dd>
          <dt>Address</dt>
          <dd>{SITE.offices[0].address}</dd>
        </dl>
        <p>
          If you are not satisfied with our response, you may approach the Data Protection Board of India under the DPDP Act.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    content: (
      <p>
        We may update this policy when our practices or the law change. The “Last updated” date at the top shows the
        current version; material changes will be highlighted on the website.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <PolicyLayout
      eyebrow="Privacy"
      title="Privacy Policy"
      intro="How Surya Enterprises collects, uses and protects your personal data, in line with India's Digital Personal Data Protection Act, 2023."
      sections={sections}
    />
  );
}
