'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Award, Beaker, Download, FlaskConical, Grid3x3, List, Mail, Package, Phone, Search, Star, Store, X,
} from 'lucide-react';
import PageHeader from '../../components/shop/PageHeader';
import { SITE, telHref } from '../../config/site';

// Product pages and cards link here as /products/institutional?sku=<sku> for
// items that are "Not for online sale". The SKU (and its name, looked up in
// the lazily loaded client index) is shown in the enquiry box and included
// in the e-mail. Reads the URL inside Suspense so the page can still be
// prerendered.
function SkuParam({ onResolve }) {
  const params = useSearchParams();
  const sku = params.get('sku') || '';
  useEffect(() => {
    if (!sku) {
      onResolve(null);
      return undefined;
    }
    let cancelled = false;
    import('../data/products').then(({ getProduct }) => {
      if (!cancelled) onResolve(getProduct(sku) ?? { sku, name: null });
    });
    return () => {
      cancelled = true;
    };
  }, [sku, onResolve]);
  return null;
}

// ONLY the data provided by Surya Enterprises - no extra categories
const products = [
  { name: 'Paraquate Dichloride', purity: '42%' },
  { name: 'Prophenophos', purity: '94%' },
  { name: 'Thiomathoxam', purity: '97%' },
  { name: 'Validamycin', purity: '62%' },
  { name: '2,4-D Amine Salt', purity: '97%' },
  { name: 'Azoxystrobin', purity: '98%' },
  { name: 'Acephate', purity: '97%' },
  { name: 'Chlorantraniliprole (CTPR)', purity: '95%' },
  { name: 'Chlorpyrifos', purity: '95%' },
  { name: 'Atrazine', purity: '97%' },
  { name: 'Cypermethrin', purity: '95%' },
  { name: 'Emamectin Benzoate', purity: '72%' },
  { name: 'Gibberellic Acid', purity: '98%' },
  { name: 'Glyphosate', purity: '97%' },
  { name: 'Hexaconazole', purity: '93%' },
  { name: 'Imidacloprid', purity: '96%' },
  { name: 'Lambdacyhalothrin', purity: '98%' },
  { name: 'Lambdacyhalothrin (Powder)', purity: '95%' },
  { name: 'Monocrotophos', purity: '75%' },
  { name: 'Pandimethalin', purity: '93%' },
];

const purityRanges = [
  { value: 'all', label: 'All Purity Levels', test: () => true },
  { value: '40-50%', label: '40-50%', test: (v) => v >= 40 && v < 50 },
  { value: '50-60%', label: '50-60%', test: (v) => v >= 50 && v < 60 },
  { value: '60-70%', label: '60-70%', test: (v) => v >= 60 && v < 70 },
  { value: '70-80%', label: '70-80%', test: (v) => v >= 70 && v < 80 },
  { value: '80-90%', label: '80-90%', test: (v) => v >= 80 && v < 90 },
  { value: '90-95%', label: '90-95%', test: (v) => v >= 90 && v < 95 },
  { value: '95-100%', label: '95-100%', test: (v) => v >= 95 && v <= 100 },
];

const purityTone = (purity) => {
  const v = parseInt(purity, 10);
  if (v >= 95) return { badge: 'bg-[#E3F4E9] text-[#0B6331]', bar: '#0F7A3D' };
  if (v >= 90) return { badge: 'bg-[#E8F5EC] text-[#1F8A4C]', bar: '#34A065' };
  if (v >= 80) return { badge: 'bg-[#FFF6D9] text-[#7A5A00]', bar: '#E0A800' };
  if (v >= 70) return { badge: 'bg-[#FDEFE3] text-[#8A4A12]', bar: '#E07B24' };
  if (v >= 60) return { badge: 'bg-[#FDECEA] text-[#B42318]', bar: '#D64535' };
  return { badge: 'bg-[#EEF0EF] text-[#4A5A50]', bar: '#7C8A81' };
};

const quoteHref = (names, enquiry = null) => {
  const skuLine = enquiry ? `- ${enquiry.name ? `${enquiry.name} (SKU ${enquiry.sku})` : `SKU ${enquiry.sku}`}\n` : '';
  const count = names.length + (enquiry ? 1 : 0);
  const first = enquiry ? enquiry.name ?? `SKU ${enquiry.sku}` : names[0];
  const subject = `Institutional quote request: ${count === 1 ? first : `${count} products`}`;
  const body = `Hello Surya Enterprises,\n\nPlease share a quotation for the following products:\n\n${skuLine}${names
    .map((n) => `- ${n}`)
    .join('\n')}\n\nRequired quantity:\nDelivery location / PIN:\nCompany name:\nContact number:\n\nThank you.`;
  return `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

function exportCsv(rows) {
  const csv = ['Product Name,Purity', ...rows.map((p) => `"${p.name.replace(/"/g, '""')}",${p.purity}`)].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'surya-institutional-products.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function InstitutionalProducts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('list');
  const [filterPurity, setFilterPurity] = useState('all');
  const [selected, setSelected] = useState([]);
  // Store-only product the visitor arrived from (?sku=), or null.
  const [enquiry, setEnquiry] = useState(null);

  const sortedProducts = useMemo(() => {
    const range = purityRanges.find((r) => r.value === filterPurity) ?? purityRanges[0];
    return products
      .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) && range.test(parseInt(p.purity, 10)))
      .sort((a, b) => (sortBy === 'purity' ? parseInt(b.purity, 10) - parseInt(a.purity, 10) : a.name.localeCompare(b.name)));
  }, [searchTerm, filterPurity, sortBy]);

  const toggle = (name) => setSelected((s) => (s.includes(name) ? s.filter((n) => n !== name) : [...s, name]));
  const avgPurity = Math.round(products.reduce((acc, p) => acc + parseInt(p.purity, 10), 0) / products.length);

  return (
    <main className="pb-20 lg:pb-3">
      <Suspense fallback={null}>
        <SkuParam onResolve={setEnquiry} />
      </Suspense>
      <PageHeader
        eyebrow="Institutional Grade"
        title="Institutional Products"
        subtitle="High-purity agrochemical solutions with complete technical specifications"
        image="/assets/images/Frame-162665.png"
        crumbs={[{ label: 'All categories', href: '/products' }, { label: 'Institutional' }]}
      >
        <dl className="mt-5 flex flex-wrap gap-2">
          {[
            [products.length, 'Total Products'],
            [`${avgPurity}%`, 'Avg. Purity'],
            [products.filter((p) => parseInt(p.purity, 10) >= 95).length, '95%+ Purity'],
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
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-3 sm:px-4">
            <h2 id="inst-list" className="sr-only">Institutional product list</h2>
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" strokeWidth={1.75} aria-hidden="true" />
              <input
                type="search"
                placeholder="Search products by name..."
                aria-label="Search institutional products"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 w-full rounded-md border border-line pl-9 pr-3 text-[14px] outline-none focus:border-brand"
              />
            </div>
            <select
              value={filterPurity}
              onChange={(e) => setFilterPurity(e.target.value)}
              aria-label="Filter by purity"
              className="h-10 rounded-md border border-line bg-white px-3 text-[13px] outline-none focus:border-brand"
            >
              {purityRanges.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort"
              className="h-10 rounded-md border border-line bg-white px-3 text-[13px] outline-none focus:border-brand"
            >
              <option value="name">Sort by Name (A-Z)</option>
              <option value="purity">Sort by Purity (High to Low)</option>
            </select>
            <div className="flex overflow-hidden rounded-md border border-line" role="group" aria-label="View">
              {[
                ['list', List, 'List view'],
                ['grid', Grid3x3, 'Grid view'],
              ].map(([mode, Icon, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  aria-pressed={viewMode === mode}
                  aria-label={label}
                  className={`flex h-10 w-10 items-center justify-center ${viewMode === mode ? 'bg-brand text-white' : 'bg-white text-ink-2 hover:bg-canvas'}`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                </button>
              ))}
            </div>
            <button type="button" onClick={() => exportCsv(sortedProducts)} className="btn btn-outline h-10 px-3 text-[13px]">
              <Download className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              <span className="hidden md:inline">Export List</span>
            </button>
          </div>

          {(searchTerm || filterPurity !== 'all') && (
            <div className="flex flex-wrap items-center gap-1.5 border-b border-line px-4 py-2">
              <span className="text-xs text-ink-2">Active filters:</span>
              {searchTerm && (
                <button type="button" onClick={() => setSearchTerm('')} className="chip border-brand/30 bg-brand-tint text-brand">
                  Search: &quot;{searchTerm}&quot; <X className="h-3 w-3" aria-hidden="true" />
                </button>
              )}
              {filterPurity !== 'all' && (
                <button type="button" onClick={() => setFilterPurity('all')} className="chip border-brand/30 bg-brand-tint text-brand">
                  Purity: {filterPurity} <X className="h-3 w-3" aria-hidden="true" />
                </button>
              )}
            </div>
          )}

          <p className="px-4 pt-3 text-xs text-ink-2" aria-live="polite">
            Showing <span className="font-semibold text-ink">{sortedProducts.length}</span> of {products.length} products
          </p>

          {sortedProducts.length === 0 ? (
            <div className="px-4 py-14 text-center">
              <Beaker className="mx-auto h-12 w-12 text-ink-3" strokeWidth={1.5} aria-hidden="true" />
              <h3 className="mt-3 font-display text-lg font-bold text-ink">No products found</h3>
              <p className="text-sm text-ink-2">Try adjusting your search or filters</p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="overflow-x-auto p-3 sm:p-4">
              <table className="w-full min-w-[480px] text-[14px]">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-2">
                    <th scope="col" className="w-10 py-2 font-semibold"><span className="sr-only">Select</span></th>
                    <th scope="col" className="py-2 font-semibold">Product Name</th>
                    <th scope="col" className="py-2 font-semibold">Purity</th>
                    <th scope="col" className="py-2 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProducts.map((p) => {
                    const tone = purityTone(p.purity);
                    return (
                      <tr key={p.name} className="border-b border-line last:border-0 hover:bg-canvas">
                        <td className="py-2.5">
                          <input
                            type="checkbox"
                            checked={selected.includes(p.name)}
                            onChange={() => toggle(p.name)}
                            aria-label={`Add ${p.name} to quote`}
                            className="h-4 w-4 accent-[#0F7A3D]"
                          />
                        </td>
                        <td className="py-2.5 font-medium text-ink">{p.name}</td>
                        <td className="py-2.5">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${tone.badge}`}>{p.purity}</span>
                        </td>
                        <td className="py-2.5 text-right">
                          <a href={quoteHref([p.name])} className="text-[13px] font-semibold text-brand hover:underline">
                            Get Quote
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-3">
              {sortedProducts.map((p) => {
                const tone = purityTone(p.purity);
                const v = parseInt(p.purity, 10);
                return (
                  <li key={p.name} className="overflow-hidden rounded-lg border border-line bg-white">
                    <div className="h-1.5 w-full bg-line">
                      <div className="h-full" style={{ width: `${v}%`, background: tone.bar }} />
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-2 min-h-10 text-[14px] font-semibold text-ink">{p.name}</h3>
                        <span className={`shrink-0 rounded-md px-2.5 py-1 text-base font-bold tabular-nums ${tone.badge}`}>{p.purity}</span>
                      </div>
                      <dl className="mt-3 grid grid-cols-3 gap-2 rounded-md bg-canvas p-2.5 text-xs">
                        <div><dt className="text-ink-2">Form</dt><dd className="font-medium text-ink">Technical</dd></div>
                        <div><dt className="text-ink-2">Packaging</dt><dd className="font-medium text-ink">As required</dd></div>
                        <div><dt className="text-ink-2">CAS</dt><dd className="font-medium text-ink">On request</dd></div>
                      </dl>
                      <div className="mt-3 flex items-center gap-2">
                        <a href={quoteHref([p.name])} className="btn btn-buy h-9 flex-1 text-[13px]">Get Quote</a>
                        <label className="btn btn-outline h-9 cursor-pointer px-3 text-[13px]">
                          <input type="checkbox" checked={selected.includes(p.name)} onChange={() => toggle(p.name)} className="h-4 w-4 accent-[#0F7A3D]" />
                          Add to quote
                        </label>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="border-t border-line px-4 py-3">
            <h4 className="text-xs font-semibold text-ink">Purity Levels:</h4>
            <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-ink">
              {[['#0F7A3D', '95-100% (Highest)'], ['#34A065', '90-94%'], ['#E0A800', '80-89%'], ['#E07B24', '70-79%'], ['#D64535', '60-69%'], ['#7C8A81', 'Below 60%']].map(([c, l]) => (
                <span key={l} className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />{l}</span>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-3 lg:sticky lg:top-[calc(var(--header-h)+12px)]">
          <section aria-labelledby="quote-title" className="rounded-lg border border-line bg-white">
            <h2 id="quote-title" className="border-b border-line px-4 py-3 font-display text-base font-extrabold text-ink">
              Bulk enquiry
            </h2>
            <div className="px-4 py-3">
              {enquiry && (
                <div className="mb-3 rounded-md border border-notice-line bg-notice-tint px-3 py-2 text-[13px] text-ink" role="status">
                  <p className="flex items-center gap-1.5 font-semibold text-notice">
                    <Store className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                    Enquiry about a store-only product
                  </p>
                  <p className="mt-1 leading-5">
                    {enquiry.name ? <span className="font-medium">{enquiry.name}</span> : 'Product'} · SKU <code className="font-mono text-[12px]">{enquiry.sku}</code>
                  </p>
                  <p className="mt-1 text-xs text-ink-2">
                    Not for online sale — available at our Jaipur store and by quotation. The SKU is included in the e-mail below.
                  </p>
                </div>
              )}
              {selected.length === 0 ? (
                <p className="text-[13px] text-ink-2">Tick products in the list to build a single quote request, or contact us directly.</p>
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
                href={
                  selected.length || enquiry
                    ? quoteHref(selected, enquiry)
                    : `mailto:${SITE.email}?subject=${encodeURIComponent('Institutional enquiry')}`
                }
                className="btn btn-buy mt-3 w-full"
              >
                <Mail className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                {selected.length || enquiry ? `Email quote request (${selected.length + (enquiry ? 1 : 0)})` : 'Email us'}
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
              [Award, 'Institutional Grade', 'High-purity products for institutional partners'],
              [Package, 'Bulk Supply', 'Custom packaging and volume discounts'],
              [Star, 'Quality Assured', 'Rigorous testing for purity and consistency'],
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
            <li className="flex items-center gap-2 px-1 text-xs text-ink-2">
              <FlaskConical className="h-4 w-4 text-brand" strokeWidth={1.75} aria-hidden="true" /> Technical Grade · CAS available on request
            </li>
          </ul>
        </aside>
      </div>
    </main>
  );
}
