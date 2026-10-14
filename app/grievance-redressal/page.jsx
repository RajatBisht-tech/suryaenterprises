import Link from "next/link";
import PolicyLayout from "../components/shop/PolicyLayout";
import { SITE } from "../config/site";

const officer = SITE.legal.grievanceOfficer;
const { grievance } = SITE.policies;

const sections = [
  {
    id: "commitment",
    title: "Our commitment",
    content: (
      <>
        <p>
          {SITE.legalName} operates this marketplace as an e-commerce entity under the Consumer Protection (E-Commerce)
          Rules, 2020. We have appointed a Grievance Officer, publish their contact details here, and follow the
          timelines below for every complaint.
        </p>
        <div className="callout">
          Every grievance is <strong>acknowledged within {grievance.acknowledgementHours} hours</strong> and{" "}
          <strong>resolved within {grievance.resolutionDays} days</strong> of receipt.
        </div>
      </>
    ),
  },
  {
    id: "officer",
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
          <dt>Postal address</dt>
          <dd>{SITE.offices[0].address}</dd>
        </dl>
      </>
    ),
  },
  {
    id: "what-to-raise",
    title: "What you can raise",
    content: (
      <ul>
        <li>Orders: non-delivery, delay, damaged, wrong, short or expired items, refunds not received.</li>
        <li>Payments: amount debited but order not confirmed, reversal not received.</li>
        <li>Product listing concerns: incorrect price, description or label information.</li>
        <li>Privacy: requests to access, correct or erase personal data, or complaints about its use (see <Link href="/privacy">Privacy Policy</Link>).</li>
        <li>Content or intellectual-property complaints (see <Link href="/intellectual-property">Intellectual Property Policy</Link>).</li>
        <li>Conduct of our staff or delivery partners.</li>
      </ul>
    ),
  },
  {
    id: "how-to-raise",
    title: "How to raise a grievance",
    content: (
      <>
        <ol>
          <li>
            <strong>First, the helpline:</strong> most issues are resolved quickly by calling {SITE.helpline.display} (
            {SITE.helpline.hours}) or emailing <a href={`mailto:${SITE.email}`}>{SITE.email}</a> with your order ID.
          </li>
          <li>
            <strong>If unresolved, write to the Grievance Officer</strong> at{" "}
            <a href={`mailto:${officer.email}?subject=${encodeURIComponent("Grievance — order ID")}`}>{officer.email}</a>{" "}
            with the subject “Grievance”, your order ID, the mobile number used at checkout, a description of the issue,
            what has happened so far and the outcome you expect. Attach photos or screenshots where relevant.
          </li>
        </ol>
        <p>We will give every grievance a reference number in our acknowledgement; please quote it in follow-ups.</p>
      </>
    ),
  },
  {
    id: "timelines",
    title: "Timelines",
    content: (
      <table>
        <thead>
          <tr>
            <th>Stage</th>
            <th>Timeline</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Acknowledgement with a reference number</td>
            <td>Within {grievance.acknowledgementHours} hours of receipt</td>
          </tr>
          <tr>
            <td>Investigation and resolution</td>
            <td>Within {grievance.resolutionDays} days of receipt (usually much sooner)</td>
          </tr>
          <tr>
            <td>Refund, where approved</td>
            <td>Initiated within 2 working days of the decision; see <Link href="/return-refund-policy">Return &amp; Refund Policy</Link></td>
          </tr>
        </tbody>
      </table>
    ),
  },
  {
    id: "escalation",
    title: "Escalation",
    content: (
      <>
        <p>If you are not satisfied with the Grievance Officer’s decision, or the timeline above is not met, you may:</p>
        <ul>
          <li>
            Contact the <strong>National Consumer Helpline</strong> (1915, or consumerhelpline.gov.in) run by the
            Department of Consumer Affairs, Government of India.
          </li>
          <li>File a complaint with the appropriate <strong>District, State or National Consumer Disputes Redressal Commission</strong> under the Consumer Protection Act, 2019, including through the e-Daakhil portal.</li>
          <li>For personal-data matters, approach the <strong>Data Protection Board of India</strong> under the DPDP Act, 2023.</li>
          <li>For seed quality concerns, you may also inform the <strong>Seed Inspector</strong> of your district under the Seeds Act, 1966.</li>
        </ul>
      </>
    ),
  },
  {
    id: "records",
    title: "Records",
    content: (
      <p>
        We keep a record of every grievance, the action taken and the time to resolution, and review them to improve our
        products and service.
      </p>
    ),
  },
];

export default function GrievanceRedressalPage() {
  return (
    <PolicyLayout
      eyebrow="Customer service"
      title="Grievance Redressal"
      intro="Who to contact when something goes wrong, how fast we respond, and where to escalate — under the Consumer Protection (E-Commerce) Rules, 2020."
      sections={sections}
    />
  );
}
