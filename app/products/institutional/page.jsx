'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Award, Bug, ChevronRight, Droplets, Layers, Mail, Package, Phone, Receipt, Shovel, SprayCan, Wheat, X,
} from 'lucide-react';
import PageHeader from '../../components/shop/PageHeader';
import { SITE, telHref } from '../../config/site';

// What the institutional desk supplies in volume. Every line links to the live
// listing it comes from, so the range shown here is always the range we sell.
const LINES = [
  {
    id: 'seeds',
    name: 'Seeds in bulk',
    detail: 'Vegetable, field, forage and flower seeds — by crop, variety and pack size, in full cartons.',
    href: '/c/seeds',
    Icon: Wheat,
  },
  {
    id: 'sprayers',
    name: 'Sprayers',
    detail: 'Knapsack, battery-operated and power sprayers, foggers and spare nozzles.',
    href: '/c/farm-machinery/sprayers',
    Icon: SprayCan,
  },
  {
    id: 'tarpaulins',
    name: 'Tarpaulins & covers',
    detail: 'HDPE tarpaulins, mulch film, shade nets, crop and fruit covers, weed mats.',
    href: '/c/farm-machinery/tarpaulin',
    Icon: Layers,
  },
  {
    id: 'tools',
    name: 'Tools & equipment',
    detail: 'Brush cutters, tillers, chaff cutters, earth augers, hand weeders, hoes, sickles and pruners.',
    href: '/c/farm-machinery',
    Icon: Shovel,
  },
  {
    id: 'irrigation',
    name: 'Irrigation',
    detail: 'Water pumps, hose pipes, drip and irrigation tools, pump controllers.',
    href: '/c/farm-machinery/irrigation-tools',
    Icon: Droplets,
  },
  {
    id: 'traps',
    name: 'Traps, lures & repellents',
    detail: 'Pheromone traps and lures, sticky traps and animal repellents for field-scale programmes.',
    href: '/c/traps-and-repellents',
    Icon: Bug,
  },
];

const quoteHref = (names) => {
  const subject = `Institutional quote request: ${names.length === 1 ? names[0] : `${names.length} product lines`}`;
  const body = `Hello Surya Enterprises,\n\nPlease share a quotation for the following:\n\n${names
    .map((n) => `- ${n}`)
    .join('\n')}\n\nProducts / varieties / models:\nRequired quantity:\nDelivery location / PIN:\nOrganisation name:\nGSTIN (for the invoice):\nContact number:\n\nThank you.`;
  return `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

export default function InstitutionalProducts() {
  const [selected, setSelected] = useState([]);
  const toggle = (name) => setSelected((s) => (s.includes(name) ? s.filter((n) => n !== name) : [...s, name]));
  const { bulk } = SITE.policies;

  return (
    <main className="pb-20 lg:pb-3">
      <PageHeader
        eyebrow="Bulk & institutional"
        title="Bulk & institutional orders"
        subtitle="Bulk seeds, sprayers, tarpaulins and equipment for institutions, universities and dealers — quotations on request."
        image="/assets/marketplace/hero-agri-warehouse.svg"
        crumbs={[{ label: 'All categories', href: '/products' }, { label: 'Bulk & institutional' }]}
      >
        <dl className="mt-5 flex flex-wrap gap-2">
          {[
            [`${LINES.length} product lines`, 'Supplied in volume'],
            [`${bulk.quoteValidityDays} days`, 'Quotation validity'],
            ['GST invoice', 'With every supply'],
          ].map(([v, l]) => (
            <div key={l} className="rounded-md bg-white/10 px-3 py-2 ring-1 ring-white/15">
              <dt className="text-[11px] text-white/75">{l}</dt>
              <dd className="font-display text-lg font-extrabold tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      </PageHeader>

      <div className="shell mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <section aria-labelledby="inst-list" className="min-w-0 rounded-lg border border-line bg-white">
          <div className="border-b border-line px-4 py-3">
            <h2 id="inst-list" className="font-display text-base font-extrabold text-ink">
              What we supply in volume
            </h2>
            <p className="mt-0.5 text-[13px] text-ink-2">
              Tick the lines you need and send one quote request, or browse the live listing to pick exact products, varieties and models.
            </p>
          </div>
          <ul className="divide-y divide-line">
            {LINES.map((line) => {
              const checked = selected.includes(line.name);
              return (
                <li key={line.id} className="flex flex-wrap items-start gap-3 px-4 py-4 sm:flex-nowrap">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand">
                    <line.Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-[15px] font-extrabold text-ink">{line.name}</h3>
                    <p className="mt-0.5 text-[13px] leading-5 text-ink-2">{line.detail}</p>
                    <Link href={line.href} className="mt-1.5 inline-flex items-center gap-1 text-[13px] font-semibold text-brand hover:underline">
                      Browse the range
                      <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                    </Link>
                  </div>
                  <label className={`btn h-9 cursor-pointer px-3 text-[13px] ${checked ? 'btn-buy' : 'btn-outline'}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggle(line.name)} className="sr-only" />
                    {checked ? 'Added to quote' : 'Add to quote'}
                  </label>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-line px-4 py-3 text-[13px] text-ink-2">
            Quotation-based orders are governed by our{' '}
            <Link href="/bulk-order-terms" className="font-semibold text-brand hover:underline">
              Bulk Order Terms
            </Link>
            . {bulk.creditTerms}
          </div>
        </section>

        <aside className="space-y-3 lg:sticky lg:top-[calc(var(--header-h)+12px)]">
          <section aria-labelledby="quote-title" className="rounded-lg border border-line bg-white">
            <h2 id="quote-title" className="border-b border-line px-4 py-3 font-display text-base font-extrabold text-ink">
              Request a quotation
            </h2>
            <div className="px-4 py-3">
              {selected.length === 0 ? (
                <p className="text-[13px] text-ink-2">Tick product lines in the list to build a single quote request, or contact us directly.</p>
              ) : (
                <ul className="flex flex-wrap gap-1.5">
                  {selected.map((n) => (
                    <li key={n}>
                      <button type="button" onClick={() => toggle(n)} className="chip border-brand/30 bg-brand-tint text-brand" aria-label={`Remove ${n} from quote`}>
                        {n} <X className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <a
                href={selected.length ? quoteHref(selected) : `mailto:${SITE.email}?subject=${encodeURIComponent('Institutional enquiry')}`}
                className="btn btn-buy mt-3 w-full"
              >
                <Mail className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                {selected.length ? `Email quote request (${selected.length})` : 'Email us'}
              </a>
              <a href={telHref} className="btn btn-outline mt-2 w-full">
                <Phone className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                {SITE.helpline.display}
              </a>
              <p className="mt-2 text-xs text-ink-2">{SITE.helpline.hours}</p>
            </div>
          </section>
          <ul className="space-y-2">
            {[
              [Package, 'Volume supply', 'Full cartons and bulk packs; custom packaging on request'],
              [Award, 'Genuine brands', 'Sealed manufacturer packs from leading seed and equipment brands'],
              [Receipt, 'GST invoice', 'Issued for every supply, in your organisation’s name'],
            ].map(([Icon, t, d]) => (
              <li key={t} className="flex gap-3 rounded-lg border border-line bg-white p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand">
                  <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-[13px] font-bold text-ink">{t}</span>
                  <span className="block text-xs text-ink-2">{d}</span>
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  );
}
