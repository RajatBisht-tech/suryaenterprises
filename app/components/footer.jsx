import Link from "next/link";
import {
  Facebook, Instagram, Linkedin, Mail, MapPin, MessageCircle, Twitter, UserCheck, Youtube,
} from "lucide-react";
import { COMPANY_PROFILE } from "../config/company-profile";
import { POLICY_LINKS } from "../config/policy-links";
import { SALE_RESTRICTION_SHORT } from "../config/sale-restrictions";
import { SITE, mailHref, telHref, whatsappHref } from "../config/site";
import { getNavCategories } from "../products/data/catalog.server";
import BrandLogo from "./shop/BrandLogo";
import FooterPartnersStrip from "./shop/FooterPartnersStrip";
import FooterColumn from "./shop/FooterColumn";
import NewsletterForm from "./shop/NewsletterForm";

// Categories whose every listing is "Not for online sale" (e.g. animal
// husbandry) are tagged "Store only" — counted from the live catalogue.
const shopLinks = () => [
  ...getNavCategories().map((c) => ({ name: c.name, href: `/c/${c.slug}`, tag: c.storeOnly ? SALE_RESTRICTION_SHORT : null })),
  { name: "All categories", href: "/products" },
  { name: "Bulk & institutional", href: "/products/institutional" },
  { name: "Under ₹500", href: "/search?max=500&sort=popularity" },
];

const SERVICE_LINKS = [
  { name: "Track order", href: "/track-order" },
  { name: "Shipping & delivery", href: "/shipping-policy" },
  { name: "Returns & refunds", href: "/return-refund-policy" },
  { name: "Cancellations", href: "/cancellation-policy" },
  { name: "Payments", href: "/payment-policy" },
  { name: "FAQs", href: "/faqs" },
  { name: "Contact us", href: "/contact" },
];

const COMPANY_LINKS = [
  { name: "About Surya Enterprises", href: "/aboutUs" },
  { name: COMPANY_PROFILE.pdf.linkLabel, href: COMPANY_PROFILE.pdf.href, download: true },
  { name: "Management", href: "/management" },
  { name: "Quality assurance", href: "/quality-assurance" },
  { name: "Careers", href: "/career" },
  { name: "Bulk & institutional", href: "/products/institutional" },
  { name: "Sitemap", href: "/sitemap" },
];

const SOCIAL = [
  { key: "facebook", label: "Facebook", Icon: Facebook },
  { key: "instagram", label: "Instagram", Icon: Instagram },
  { key: "youtube", label: "YouTube", Icon: Youtube },
  { key: "linkedin", label: "LinkedIn", Icon: Linkedin },
  { key: "x", label: "X (Twitter)", Icon: Twitter },
];

// National flag of India, 3:2: saffron / white / India-green bands with the
// 24-spoke Ashoka Chakra (navy) centred on the white band, its diameter 3/4
// of the band height. Decorative — the adjacent "Made in India" text carries
// the meaning.
function IndianFlag() {
  const spokes = [];
  for (let i = 0; i < 24; i += 1) {
    const a = (i * Math.PI) / 12;
    spokes.push(<line key={i} x1="15" y1="10" x2={15 + Math.cos(a) * 2.5} y2={10 + Math.sin(a) * 2.5} />);
  }
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 30 20"
      width="20"
      height="13"
      className="inline-block shrink-0 rounded-[1px] ring-1 ring-black/15"
    >
      <rect width="30" height="20" fill="#FFFFFF" />
      <rect width="30" height="6.667" fill="#FF9933" />
      <rect y="13.333" width="30" height="6.667" fill="#138808" />
      <g stroke="#000080" strokeWidth="0.3" fill="none">
        <circle cx="15" cy="10" r="2.5" />
        {spokes}
      </g>
      <circle cx="15" cy="10" r="0.45" fill="#000080" />
    </svg>
  );
}

function PanelHeading({ Icon, children }) {
  return (
    <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-harvest">
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
      {children}
    </h3>
  );
}

// Slightly lighter panel so addresses / grievance details stand out from the link columns.
function Panel({ children }) {
  return <div className="rounded-lg bg-white/[0.06] px-3.5 py-3 text-[12.5px] leading-snug">{children}</div>;
}

export default function Footer() {
  const year = new Date().getFullYear();
  const socials = SOCIAL.filter((s) => SITE.social?.[s.key]);
  const officer = SITE.legal.grievanceOfficer;
  const primaryGstin = SITE.offices[0]?.gstin;

  return (
    <footer aria-labelledby="footer-heading" className="print-hidden mt-8 pb-14 lg:pb-0">
      <h2 id="footer-heading" className="sr-only">
        Site footer
      </h2>

      <FooterPartnersStrip />

      <div className="on-dark bg-[#0B4A2A] text-[#D5E4DA]">
        <div className="shell pb-4 pt-6 lg:pt-7">
          {/* Row 1 — brand + link columns */}
          <div className="grid gap-x-8 gap-y-1 lg:grid-cols-[1.25fr_0.8fr_1fr_0.95fr_1.55fr] lg:gap-y-0">
            <div className="pb-5 lg:pb-0">
              {/* Icon-only mark (transparent PNG) directly on the green — no tile */}
              <span className="-ml-1 block lg:hidden">
                <BrandLogo variant="mark" width={80} />
              </span>
              <span className="-ml-1.5 hidden lg:block">
                <BrandLogo variant="mark" width={112} />
              </span>
              <p className="mt-2 max-w-xs text-[13px] leading-snug text-white/85">{SITE.mission}</p>
              <p className="mt-3 text-[13px]">
                <a href={telHref} className="font-semibold tabular-nums text-white hover:text-harvest">
                  {SITE.helpline.display}
                </a>
                <span className="block text-[11.5px] text-white/65">{SITE.helpline.hours}</span>
              </p>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-3 text-[13px]">
                <a href={mailHref} className="inline-flex items-center gap-1.5 break-all text-white/85 hover:text-harvest">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-harvest" strokeWidth={1.75} aria-hidden="true" />
                  {SITE.email}
                </a>
                {whatsappHref && (
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-white/85 hover:text-harvest">
                    <MessageCircle className="h-3.5 w-3.5 text-harvest" strokeWidth={1.75} aria-hidden="true" />
                    WhatsApp
                  </a>
                )}
              </p>
              {socials.length > 0 && (
                <ul className="mt-2 flex gap-1.5" aria-label="Social media">
                  {socials.map(({ key, label, Icon }) => (
                    <li key={key}>
                      <a href={SITE.social[key]} target="_blank" rel="noopener noreferrer" aria-label={label} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-harvest hover:text-ink">
                        <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 max-w-xs">
                <NewsletterForm compact />
              </div>
              {/* App-store badges: rendered only once SITE.appStores is configured (no apps yet). */}
              {SITE.appStores?.googlePlay || SITE.appStores?.appStore ? (
                <p className="mt-3 flex flex-wrap gap-2 text-xs">
                  {SITE.appStores.googlePlay && (
                    <a href={SITE.appStores.googlePlay} className="rounded-md border border-white/20 px-2 py-1 hover:text-harvest">Google Play</a>
                  )}
                  {SITE.appStores.appStore && (
                    <a href={SITE.appStores.appStore} className="rounded-md border border-white/20 px-2 py-1 hover:text-harvest">App Store</a>
                  )}
                </p>
              ) : null}
            </div>

            <FooterColumn title="Shop" links={shopLinks()} />
            <FooterColumn title="Customer service" links={SERVICE_LINKS} />
            <FooterColumn title="Company" links={COMPANY_LINKS} />
            <FooterColumn title="Policies" links={POLICY_LINKS} columns={2} />
          </div>

          {/* Row 2 — highlighted offices, grievance officer, help */}
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:mt-5 lg:grid-cols-3">
            {SITE.offices.map((o) => (
              <Panel key={o.gstin}>
                <PanelHeading Icon={MapPin}>{o.kind ?? o.label}</PanelHeading>
                <p className="mt-1.5 text-white/85">{o.address}</p>
                <p className="mt-1 tabular-nums text-white/65">GSTIN {o.gstin}</p>
              </Panel>
            ))}

            <Panel>
              <PanelHeading Icon={UserCheck}>Grievance officer</PanelHeading>
              <p className="mt-1.5 font-semibold text-white">{officer.name}</p>
              {officer.credentials && <p className="text-white/65">{officer.credentials}</p>}
              <p className="mt-1 flex flex-col gap-0.5">
                <a href={officer.phone.tel} className="tabular-nums text-white/85 hover:text-harvest">
                  {officer.phone.display}
                </a>
                <a href={`mailto:${officer.email}`} className="break-all text-white/85 hover:text-harvest">
                  {officer.email}
                </a>
                <Link href="/grievance-redressal" className="text-harvest hover:underline">
                  Redressal process
                </Link>
              </p>
            </Panel>

          </div>
        </div>

        {/* Legal bar */}
        <div className="border-t border-white/10">
          <div className="shell flex flex-wrap items-center gap-x-5 gap-y-1.5 py-3 text-[11px] text-white/75 sm:text-xs">
            <span>
              © {year} {SITE.legalName}
            </span>
            {SITE.legal.cin && <span className="tabular-nums">CIN {SITE.legal.cin}</span>}
            {primaryGstin && <span className="tabular-nums">GSTIN {primaryGstin}</span>}
            <span className="inline-flex items-center gap-1.5">
              <IndianFlag />
              Made in India
            </span>
            <nav aria-label="Legal" className="ml-auto flex gap-4">
              <Link href="/privacy" className="hover:text-harvest hover:underline">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-harvest hover:underline">
                Terms
              </Link>
              <Link href="/sitemap" className="hover:text-harvest hover:underline">
                Sitemap
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
