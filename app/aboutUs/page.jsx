import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Download, Mail, Phone } from "lucide-react";
import BrandLogo from "../components/shop/BrandLogo";
import PageHeader from "../components/shop/PageHeader";
import { Medallion } from "../components/shop/TrustBar";
import { COMPANY_PROFILE as P, priceRange } from "../config/company-profile";
import { SITE, mailHref, telHref } from "../config/site";
import { getCatalogStats } from "../products/data/catalog.server";

export const metadata = {
  title: "About us",
  description:
    "Surya Enterprises is India's agriculture marketplace — a licensed agri-inputs marketplace selling seeds, crop protection, crop nutrition, farm machinery and animal husbandry products from leading brands alongside Surya's own crop-protection range, built from inside the supply chain in 2023. Pesticides, urea and other regulated goods are sold at the Jaipur store and by quotation, not online.",
};

const fmt = (n) => n.toLocaleString("en-IN");
const searchHref = (name) => `/search?q=${encodeURIComponent(name)}`;
// "insecticides" but "PGR & others" — keep acronyms as written.
const lineLabel = (name) => (/^[A-Z]{2,}/.test(name) ? name : name.toLowerCase());
const certs = SITE.certifications.filter((c) => c.enabled);
const officer = SITE.legal.grievanceOfficer;

function SectionTitle({ id, eyebrow, title, intro = null, className = "" }) {
  return (
    <div className={className}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id} className="mt-1 font-display text-[22px] font-extrabold leading-tight text-ink md:text-2xl">
        {title}
      </h2>
      {intro && <p className="mt-2 max-w-3xl text-[15px] leading-6 text-ink-2">{intro}</p>}
    </div>
  );
}

// A pack's route from factory to field, drawn as chips joined by arrows.
// `labels[i]` is written above the arrow after step i ("+ margin").
function Chain({ steps, labels = [], dark = false, ariaLabel }) {
  const chipBase = "inline-flex h-9 items-center whitespace-nowrap rounded-full px-3.5 text-[13px] font-semibold";
  const chipFor = (i) => {
    const first = i === 0;
    const last = i === steps.length - 1;
    if (dark) {
      if (first) return `${chipBase} bg-white text-ink`;
      return `${chipBase} bg-harvest text-ink`;
    }
    if (first) return `${chipBase} bg-brand-tint text-brand ring-1 ring-brand/20`;
    if (last) return `${chipBase} bg-ink text-white`;
    return `${chipBase} bg-canvas text-ink-2 ring-1 ring-line`;
  };
  return (
    // Wraps onto several rows on phones and tablets (each row ends with the
    // arrow that leads to the next row); one straight line from lg up.
    <ol aria-label={ariaLabel} className="flex flex-wrap items-end gap-y-4 pb-1 pt-4 lg:flex-nowrap">
      {steps.map((step, i) => (
        <li key={step} className="rise flex shrink-0 items-end" style={{ animationDelay: `${i * 70}ms` }}>
          <span className={chipFor(i)}>{step}</span>
          {i < steps.length - 1 && (
            <span className={`relative mx-1 mb-3 flex w-10 flex-col items-center sm:w-14 ${dark ? "text-harvest" : "text-ink-3"}`}>
              {labels[i] && (
                <span
                  className={`absolute -top-4 whitespace-nowrap text-[9.5px] font-bold uppercase tracking-wider ${
                    dark ? "text-harvest" : "text-danger"
                  }`}
                >
                  {labels[i]}
                </span>
              )}
              <svg viewBox="0 0 56 12" className="h-3 w-full" aria-hidden="true">
                <path d="M0 6h48M43 1.5 49 6l-6 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

export default function AboutPage() {
  const onlineLines = P.productLines.filter((l) => l.online);
  const storeLines = P.productLines.filter((l) => !l.online);
  const [b2c, b2b] = P.segments;
  const store = SITE.offices[0];
  // Online-sellable figures (same computation as the business-profile PDF).
  const stats = getCatalogStats();

  return (
    <main className="pb-3">
      {/* 1. Hero */}
      <PageHeader
        eyebrow={`Est. ${P.founded} · Jaipur & New Delhi`}
        title="About Surya Enterprises"
        subtitle={P.positioning}
        image="/assets/marketplace/hero-paddy-sunrise.svg"
        crumbs={[{ label: "About us" }]}
        aside={<BrandLogo variant="wide" width={230} tile href={null} />}
      >
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="At a glance">
          {[...P.coverChips, `${fmt(stats.onlineProducts)} products online`].map((chip, i) => (
            <li
              key={chip}
              className="rise rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[12px] font-semibold text-white"
              style={{ animationDelay: `${120 + i * 60}ms` }}
            >
              {chip}
            </li>
          ))}
        </ul>
      </PageHeader>

      <div className="shell mt-3 space-y-3">
        {/* 2. Where we started */}
        <section aria-labelledby="origin-heading" className="panel grid gap-5 p-5 md:grid-cols-[1.35fr_1fr] md:gap-8 md:p-6">
          <div>
            <SectionTitle id="origin-heading" eyebrow={P.origin.eyebrow} title={P.origin.title} />
            <div className="mt-3 space-y-3 text-[15px] leading-6 text-ink-2">
              {P.origin.paragraphs.map((text, i) => (
                <p key={i} className={i === P.origin.paragraphs.length - 1 ? "border-l-4 border-harvest pl-3 text-ink" : ""}>
                  {text}
                </p>
              ))}
            </div>
          </div>
          <div className="relative overflow-hidden rounded-lg border border-line bg-[linear-gradient(160deg,#FFF8E6_0%,#FFFFFF_55%,#E8F5EC_100%)] p-5">
            <div className="field-rows absolute inset-0" aria-hidden="true" />
            <div className="relative">
              <p className="font-display text-[56px] font-extrabold leading-none tracking-tight text-brand">{P.founded}</p>
              <p className="mt-1 text-[13px] font-semibold text-ink">Three years inside the agri-inputs supply chain</p>
              <ol className="mt-5 space-y-0">
                {P.origin.milestones.map((m, i) => (
                  <li key={m.title} className="relative flex gap-3 pb-5 last:pb-0">
                    {i < P.origin.milestones.length - 1 && (
                      <span className="absolute left-[5px] top-4 h-full w-px bg-brand/30" aria-hidden="true" />
                    )}
                    <span
                      className={`relative mt-1.5 block h-[11px] w-[11px] shrink-0 rounded-full ring-2 ring-white ${
                        i === P.origin.milestones.length - 1 ? "bg-harvest" : "bg-brand"
                      }`}
                      aria-hidden="true"
                    />
                    <span>
                      <span className="block text-[10.5px] font-bold uppercase tracking-[0.12em] text-earth">{m.when}</span>
                      <span className="block font-display text-[14px] font-extrabold text-ink">{m.title}</span>
                      <span className="block text-[12.5px] leading-5 text-ink-2">{m.text}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* 3. The problem we saw */}
        <section aria-labelledby="problem-heading" className="panel overflow-hidden">
          <div className="p-5 md:p-6">
            <SectionTitle id="problem-heading" eyebrow={P.problem.eyebrow} title={P.problem.title} intro={P.problem.intro} />
            <div className="mt-4 rounded-lg bg-canvas px-3 py-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">How a pack reaches the field today</p>
              <Chain
                steps={P.problem.chain}
                labels={[null, "+ margin", "+ margin", "+ margin", "+ commission"]}
                ariaLabel="Conventional supply chain: manufacturer to distributor to wholesaler to retailer to commission agent to farmer, each adding a margin"
              />
            </div>
          </div>
          <ol className="grid gap-px border-t border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {P.problem.cards.map((card, i) => (
              <li key={card.title} className="group relative bg-white p-5 transition-colors hover:bg-[#FFFCF2]">
                <span className="absolute right-4 top-4 font-display text-[28px] font-extrabold leading-none text-line transition-colors group-hover:text-harvest" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Medallion icon={card.icon} />
                <h3 className="mt-3 font-display text-[16px] font-extrabold leading-tight text-ink">{card.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-6 text-ink-2">{card.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* 4. Our answer */}
        <section aria-labelledby="answer-heading" className="on-dark relative overflow-hidden rounded-lg bg-brand-deep text-white">
          <Image
            src="/assets/marketplace/hero-cotton-sprayer.svg"
            alt=""
            fill
            sizes="(min-width: 1440px) 1408px, 100vw"
            unoptimized
            className="object-cover object-right opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-deep via-brand-deep/95 to-brand-deep/70" aria-hidden="true" />
          <div className="relative grid gap-6 p-5 md:grid-cols-[1.1fr_1fr] md:gap-10 md:p-7">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-harvest">{P.answer.eyebrow}</p>
              <h2 id="answer-heading" className="mt-1 font-display text-[24px] font-extrabold leading-tight md:text-[30px]">
                {P.answer.title}
              </h2>
              <p className="mt-3 max-w-xl text-[15px] leading-6 text-white/85">{P.answer.intro}</p>
              <div className="mt-4 rounded-lg bg-white/[0.08] px-3 py-2 ring-1 ring-white/15">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/70">How a pack reaches the field now</p>
                <Chain steps={P.answer.chain} labels={["direct"]} dark ariaLabel="Surya Marketplace: Surya Enterprises direct to the farmer" />
              </div>
              <blockquote className="mt-5 border-l-4 border-harvest pl-4">
                <p className="font-display text-[18px] font-extrabold leading-snug md:text-[20px]">“{P.answer.quote}”</p>
              </blockquote>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/products" className="btn btn-cart">
                  Shop the marketplace
                  <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                </Link>
                <Link href="/products/institutional" className="btn border border-white/40 text-white hover:bg-white/10">
                  Institutional desk
                </Link>
              </div>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
              {P.answer.points.map((pt) => (
                <li key={pt.title} className="flex gap-3 rounded-md bg-white/[0.08] p-3.5 ring-1 ring-white/15">
                  <Medallion icon={pt.icon} />
                  <span className="min-w-0">
                    <span className="block font-display text-[14px] font-extrabold leading-tight">{pt.title}</span>
                    <span className="mt-1 block text-[12.5px] leading-5 text-white/80">{pt.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 5. What we sell */}
        <section aria-labelledby="sell-heading" className="panel p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <SectionTitle
              id="sell-heading"
              eyebrow="What we sell"
              title="Seeds, traps & lures, crop nutrition and farm machinery online — pesticides, urea and animal husbandry at the store"
            />
            <dl className="grid shrink-0 grid-cols-3 divide-x divide-line rounded-lg border border-line bg-canvas">
              {[
                { value: fmt(stats.onlineProducts), label: "products online" },
                { value: fmt(stats.onlineBrands), label: "brands online" },
                { value: priceRange("₹"), label: "per pack" },
              ].map((s) => (
                <div key={s.label} className="px-3 py-2.5 sm:px-4">
                  <dd className="font-display text-[17px] font-extrabold tabular-nums text-brand sm:text-[19px]">{s.value}</dd>
                  <dt className="text-[11px] text-ink-2">{s.label}</dt>
                </div>
              ))}
            </dl>
          </div>

          <ul className="mt-4 divide-y divide-line border-t border-line">
            {onlineLines.map((line) => (
              <li key={line.name} className="grid gap-3 py-4 md:grid-cols-[15rem_1fr_auto] md:items-start md:gap-6">
                <div className="flex items-center gap-3">
                  <Medallion icon={line.icon} />
                  <div className="min-w-0">
                    <h3 className="font-display text-[15px] font-extrabold leading-tight text-ink">{line.name}</h3>
                    {line.detail && <p className="text-xs text-ink-2">{line.detail}</p>}
                  </div>
                </div>
                <ul className="flex flex-wrap gap-1.5" aria-label={`Example ${line.name.toLowerCase()}`}>
                  {line.examples.map((name) => (
                    <li key={name}>
                      <Link href={searchHref(name)} className="chip hover:border-brand hover:text-brand">
                        {name}
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-3 md:flex-col md:items-end md:gap-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-tint px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-brand">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
                    {P.availability.online.badge}
                  </span>
                  <Link href={`/c/${line.categorySlug}`} className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand hover:underline">
                    Shop {lineLabel(line.name)}
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 rounded-lg border border-notice-line bg-[linear-gradient(100deg,#FFF7E6_0%,#FFFFFF_60%)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-[15px] font-extrabold text-ink">Through our store and institutional desk only</h3>
              <span className="inline-flex items-center rounded-full bg-notice-tint px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-notice ring-1 ring-notice-line">
                {P.availability.offline.badge}
              </span>
            </div>
            <ul className="mt-3 divide-y divide-notice-line/60">
              {storeLines.map((line) => (
                <li key={line.name} className="grid gap-3 py-3 md:grid-cols-[15rem_1fr_auto] md:items-start md:gap-6">
                  <div className="flex items-center gap-3">
                    <Medallion icon={line.icon} />
                    <div className="min-w-0">
                      <h4 className="font-display text-[15px] font-extrabold leading-tight text-ink">{line.name}</h4>
                      {line.detail && <p className="text-xs text-ink-2">{line.detail}</p>}
                    </div>
                  </div>
                  <ul className="flex flex-wrap gap-1.5" aria-label={`Example ${line.name.toLowerCase()}`}>
                    {line.examples.map((name) => (
                      <li key={name}>
                        <Link href={searchHref(name)} className="chip hover:border-brand hover:text-brand">
                          {name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-3 md:flex-col md:items-end md:gap-1.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-notice-tint px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-notice">
                      <span className="h-1.5 w-1.5 rounded-full bg-notice" aria-hidden="true" />
                      Not for online sale
                    </span>
                    <Link
                      href={line.categorySlug ? `/c/${line.categorySlug}` : "/products/institutional"}
                      className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand hover:underline"
                    >
                      {line.categorySlug ? `Browse ${lineLabel(line.name)}` : "Ask the institutional desk"}
                      <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[12.5px] text-ink-2">
              {P.availability.offline.note}{" "}
              <Link href="/products/institutional" className="font-semibold text-brand hover:underline">
                Ask the institutional desk
              </Link>{" "}
              or{" "}
              <Link href="/contact" className="font-semibold text-brand hover:underline">
                visit the store
              </Link>
              .
            </p>
          </div>
        </section>

        {/* 6. How we sell */}
        <section aria-labelledby="channels-heading">
          <h2 id="channels-heading" className="sr-only">
            How we sell
          </h2>
          <ul className="grid gap-3 md:grid-cols-3">
            {P.channels.map((ch, i) => {
              const accent = ["bg-brand", "bg-harvest", "bg-earth"][i] ?? "bg-brand";
              return (
                <li key={ch.key} className="panel group relative flex flex-col overflow-hidden p-5 transition-shadow hover:shadow-[0_4px_16px_rgba(20,33,26,0.10)]">
                  <span className={`absolute inset-x-0 top-0 h-1 ${accent}`} aria-hidden="true" />
                  <div className="flex items-center gap-3">
                    <Medallion icon={ch.icon} />
                    <div>
                      <p className="eyebrow">How we sell</p>
                      <h3 className="font-display text-[17px] font-extrabold leading-tight text-ink">{ch.title}</h3>
                    </div>
                  </div>
                  {ch.key === "store" ? (
                    <address className="mt-3 rounded-md bg-canvas px-3 py-2 text-[13px] not-italic leading-5 text-ink">
                      <span className="block font-semibold">{ch.detail}</span>
                      <span className="block text-ink-2">{store.address}</span>
                      <span className="mt-1 block text-xs text-ink-3">{SITE.helpline.hours}</span>
                    </address>
                  ) : (
                    <p className="mt-3 rounded-md bg-canvas px-3 py-2 font-mono text-[13px] font-semibold text-brand">{ch.detail}</p>
                  )}
                  <p className="mt-3 text-[13.5px] leading-6 text-ink-2">{ch.text}</p>
                  <Link href={ch.href} className="mt-auto inline-flex items-center gap-1 pt-4 text-[13px] font-semibold text-brand hover:underline">
                    {ch.cta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* 7. Who we serve */}
        <section aria-labelledby="serve-heading" className="panel p-5 md:p-6">
          <SectionTitle
            id="serve-heading"
            eyebrow="Who we serve"
            title={`${b2c.share}% farmers, ${b2b.share}% institutions and bulk buyers`}
            intro="Sales by customer type. Farmers buy one pack at a time; institutions buy by quotation."
          />
          <div
            role="img"
            aria-label={`Sales mix: ${b2c.share} percent ${b2c.label} ${b2c.title}, ${b2b.share} percent ${b2b.label} ${b2b.title}`}
            className="reveal-x mt-5 flex h-14 w-full overflow-hidden rounded-md"
          >
            <div className="flex items-center justify-between bg-brand px-4 text-white" style={{ width: `${b2c.share}%` }}>
              <span className="font-display text-[22px] font-extrabold tabular-nums">{b2c.share}%</span>
              <span className="hidden text-[13px] font-semibold sm:inline">
                {b2c.label} · {b2c.title}
              </span>
            </div>
            <div className="flex items-center justify-between bg-harvest px-4 text-ink" style={{ width: `${b2b.share}%` }}>
              <span className="font-display text-[22px] font-extrabold tabular-nums">{b2b.share}%</span>
              <span className="hidden text-[13px] font-semibold md:inline">{b2b.label}</span>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-[7fr_3fr] md:gap-6">
            {P.segments.map((s, i) => (
              <div key={s.key} className="flex gap-3">
                <span className={`mt-1 block h-3 w-3 shrink-0 rounded-sm ${i === 0 ? "bg-brand" : "bg-harvest"}`} aria-hidden="true" />
                <div>
                  <h3 className="font-display text-[16px] font-extrabold text-ink">
                    {s.label} — {s.title}
                  </h3>
                  <p className="mt-1 text-[13.5px] leading-6 text-ink-2">{s.text}</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {s.who.map((w) => (
                      <li key={w} className="chip">
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 8. Company details */}
        <section aria-labelledby="details-heading" className="panel p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <SectionTitle id="details-heading" eyebrow="Company details" title={P.legalName} />
            <div className="shrink-0">
              <a
                href={P.pdf.href}
                download
                className="inline-flex h-12 items-center gap-2.5 rounded-full bg-ink px-6 text-[14px] font-semibold text-white shadow-[0_6px_18px_rgba(20,33,26,0.22)] transition hover:bg-black hover:shadow-[0_8px_24px_rgba(20,33,26,0.3)] active:translate-y-px"
              >
                <Download className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                {P.pdf.buttonLabel}
              </a>
              <p className="mt-1.5 text-xs text-ink-3 md:text-right">
                {P.pdf.format} · {P.pdf.pages} pages · {P.pdf.caption}
              </p>
            </div>
          </div>

          <dl className="mt-5 grid gap-x-8 gap-y-5 border-t border-line pt-5 sm:grid-cols-2 lg:grid-cols-3">
            {SITE.offices.map((o) => (
              <div key={o.gstin}>
                <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-earth">
                  {o.kind} · {o.label.replace(" Registration", "")}
                </dt>
                <dd className="mt-1 text-[13.5px] leading-5 text-ink">{o.address}</dd>
                <dd className="mt-1 text-[13px] font-semibold tabular-nums text-ink-2">GSTIN {o.gstin}</dd>
              </div>
            ))}

            <div>
              <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-earth">Certifications</dt>
              <dd className="mt-2 space-y-2">
                {certs.map((c) => (
                  <Link key={c.id} href={c.href ?? "/quality-assurance"} className="group flex items-center gap-3">
                    <span className="relative block h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-line">
                      <Image src={c.image} alt="" fill sizes="44px" className="object-contain p-1" />
                    </span>
                    <span className="leading-tight">
                      <span className="block text-[13.5px] font-semibold text-ink group-hover:text-brand">{c.name}</span>
                      {c.detail && <span className="block text-xs text-ink-2">{c.detail}</span>}
                    </span>
                  </Link>
                ))}
              </dd>
            </div>

            {P.licences.length > 0 && (
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-earth">Agro-input sales licences</dt>
                <dd className="mt-1 space-y-1 text-[13.5px] leading-5 text-ink">
                  {P.licences.map((l) => (
                    <p key={`${l.authority}-${l.number}`}>
                      <span className="font-semibold">{l.authority}</span>
                      {l.number && <span className="tabular-nums"> · No. {l.number}</span>}
                      {l.scope && <span className="text-ink-2"> · {l.scope}</span>}
                    </p>
                  ))}
                </dd>
              </div>
            )}

            <div>
              <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-earth">Grievance officer</dt>
              <dd className="mt-1 text-[13.5px] font-semibold text-ink">{officer.name}</dd>
              <dd className="text-[13px] text-ink-2">
                {[officer.designation, officer.credentials].filter(Boolean).join(" · ")}
              </dd>
              <dd className="mt-1 flex flex-col gap-0.5 text-[13px]">
                <a href={`mailto:${officer.email}`} className="break-all text-brand hover:underline">
                  {officer.email}
                </a>
                <a href={officer.phone.tel} className="tabular-nums text-brand hover:underline">
                  {officer.phone.display}
                </a>
                <Link href="/grievance-redressal" className="text-ink-2 hover:text-brand hover:underline">
                  Redressal process
                </Link>
              </dd>
            </div>

            <div>
              <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-earth">Contact</dt>
              <dd className="mt-1 flex flex-col gap-1 text-[13.5px]">
                <a href={telHref} className="inline-flex items-center gap-1.5 font-semibold tabular-nums text-ink hover:text-brand">
                  <Phone className="h-3.5 w-3.5 text-brand" strokeWidth={1.75} aria-hidden="true" />
                  {SITE.helpline.display}
                </a>
                <span className="text-xs text-ink-3">{SITE.helpline.hours}</span>
                <a href={mailHref} className="inline-flex items-center gap-1.5 break-all text-ink hover:text-brand">
                  <Mail className="h-3.5 w-3.5 text-brand" strokeWidth={1.75} aria-hidden="true" />
                  {SITE.email}
                </a>
                <a href={P.website.url} className="text-ink hover:text-brand">
                  {P.website.display}
                </a>
              </dd>
            </div>

            <div>
              <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-earth">Payment partners</dt>
              <dd className="mt-1 text-[13.5px] text-ink">{P.paymentPartners.join(", ")}</dd>
              <dd className="mt-0.5 text-xs text-ink-2">{SITE.payments.join(" · ")} at checkout</dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}
