import Link from "next/link";
import {
  Building2, ChevronRight, FileText, Headset, LayoutGrid, ShoppingBag,
} from "lucide-react";
import PageHeader from "../components/shop/PageHeader";
import { COMPANY_PROFILE } from "../config/company-profile";
import { POLICY_LINKS } from "../config/policy-links";
import { SITE } from "../config/site";
import { CATEGORIES } from "../config/taxonomy";
import { getSubcategories } from "../products/data/catalog.server";

// `download` links point at a static file (plain anchor), not a route.
type SitemapLink = { name: string; href: string; desc?: string; soon?: boolean; download?: boolean };
type SitemapSection = { id: string; title: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; links: SitemapLink[] };

const groups: SitemapSection[] = [
  {
    id: "shop",
    title: "Shop",
    icon: LayoutGrid,
    links: [
      { name: "Home", href: "/", desc: "Marketplace home — highlights, shop by need, rails" },
      { name: "All categories", href: "/products", desc: "Every live category with counts and top picks" },
      ...CATEGORIES.flatMap((c) => {
        const subs = getSubcategories(c.slug);
        return [
          { name: c.name, href: `/c/${c.slug}`, desc: c.description },
          ...subs.slice(0, 6).map((s) => ({ name: `${c.name} › ${s.name}`, href: `/c/${c.slug}/${s.slug}`, desc: `${s.count.toLocaleString("en-IN")} listings` })),
          ...(subs.length > 6 ? [{ name: `${c.name} › all ${subs.length} subcategories`, href: `/c/${c.slug}`, desc: "Use the Subcategory filter on the category page" }] : []),
        ];
      }),
      { name: "Bulk & institutional", href: "/products/institutional", desc: "Bulk seeds, sprayers, tarpaulins and equipment; quotes on request" },
      { name: "Search", href: "/search", desc: "Search by product name, brand, crop or pack size" },
    ],
  },
  {
    id: "account",
    title: "Your orders & tools",
    icon: ShoppingBag,
    links: [
      { name: "Cart", href: "/cart", desc: "Review items and place your order" },
      { name: "Checkout", href: "/checkout", desc: "Delivery details and UPI payment" },
      { name: "Wishlist", href: "/wishlist", desc: "Products you have saved for later" },
      { name: "Track order", href: "/track-order", desc: "Dispatch and tracking details via our support team" },
      { name: "Sign in", href: "/login", desc: "Access your account" },
      { name: "Create account", href: "/register", desc: "Save addresses and see your orders" },
      { name: "My account", href: "/account", desc: "Profile, saved addresses and order history" },
    ],
  },
  {
    id: "service",
    title: "Customer service",
    icon: Headset,
    links: [
      { name: "FAQs", href: "/faqs", desc: "Orders, payments, delivery, returns, product questions" },
      { name: "Contact us", href: "/contact", desc: `Helpline ${SITE.helpline.display}, email and office addresses` },
      { name: "Shipping & delivery", href: "/shipping-policy", desc: "Coverage, dispatch time, charges, receiving your order" },
      { name: "Returns & refunds", href: "/return-refund-policy", desc: "Claims for damaged, wrong or expired-on-arrival items" },
      { name: "Cancellations", href: "/cancellation-policy", desc: "Cancelling before dispatch and refund timelines" },
      { name: "Payments", href: "/payment-policy", desc: "UPI via PayU, pending and failed payments" },
      { name: "Grievance redressal", href: "/grievance-redressal", desc: "Grievance Officer and escalation" },
    ],
  },
  {
    id: "company",
    title: "Company",
    icon: Building2,
    links: [
      { name: "About Surya Enterprises", href: "/aboutUs", desc: "Where we started, the problem we saw, what and how we sell" },
      {
        name: COMPANY_PROFILE.pdf.linkLabel,
        href: COMPANY_PROFILE.pdf.href,
        desc: `${COMPANY_PROFILE.pdf.format}, ${COMPANY_PROFILE.pdf.pages} pages — ${COMPANY_PROFILE.pdf.caption}`,
        download: true,
      },
      { name: "Management", href: "/management", desc: "Leadership team" },
      { name: "Quality assurance", href: "/quality-assurance", desc: "Quality checks, ISO and ZED certification" },
      { name: "Careers", href: "/career", desc: "Open positions across India" },
    ],
  },
  {
    id: "policies",
    title: "Policies & legal",
    icon: FileText,
    links: POLICY_LINKS.map((l) => ({ ...l })),
  },
];

export default function SitemapPage() {
  return (
    <main className="pb-3">
      <PageHeader
        eyebrow="Site navigation"
        title="Sitemap"
        subtitle="Every page on the Surya Enterprises marketplace — shopping, your orders, customer service, company information and policies."
        crumbs={[{ label: "Sitemap" }]}
      />
      <div className="shell grid gap-3 pt-3 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((g) => {
          const Icon = g.icon;
          return (
            <section key={g.id} id={g.id} aria-labelledby={`${g.id}-title`} className="panel scroll-mt-[calc(var(--header-h)+12px)] p-5">
              <h2 id={`${g.id}-title`} className="flex items-center gap-2.5 font-display text-[17px] font-extrabold text-ink">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-tint text-brand">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                {g.title}
                <span className="ml-auto text-xs font-medium text-ink-3">{g.links.length} pages</span>
              </h2>
              <ul className="mt-3 divide-y divide-line">
                {g.links.map((l) => (
                  <li key={`${g.id}-${l.href}-${l.name}`}>
                    {l.soon ? (
                      <span className="flex items-center justify-between gap-3 py-2 text-[13px] text-ink-3">
                        <span>
                          {l.name} <span className="ml-1 rounded-full border border-line px-1.5 py-px text-[9px] font-bold uppercase tracking-wider">Soon</span>
                        </span>
                      </span>
                    ) : l.download ? (
                      <a href={l.href} download className="group flex items-center justify-between gap-3 py-2 text-[13px]">
                        <span className="min-w-0">
                          <span className="block font-semibold text-ink group-hover:text-brand">{l.name}</span>
                          {l.desc && <span className="block truncate text-xs text-ink-2">{l.desc}</span>}
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-brand" strokeWidth={1.75} />
                      </a>
                    ) : (
                      <Link href={l.href} className="group flex items-center justify-between gap-3 py-2 text-[13px]">
                        <span className="min-w-0">
                          <span className="block font-semibold text-ink group-hover:text-brand">{l.name}</span>
                          {l.desc && <span className="block truncate text-xs text-ink-2">{l.desc}</span>}
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-brand" strokeWidth={1.75} />
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}
