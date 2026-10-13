"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { PRICE_PRESETS, listingHref, toggleValue } from "../../lib-shop/listing-url";
import { formatPrice } from "../../lib-shop/format";

function Section({ title, children, defaultOpen = true, action }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <section className="border-b border-line px-4 py-3 last:border-b-0">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-ink"
        >
          {title}
          <ChevronDown className={`h-4 w-4 text-ink-3 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={1.75} aria-hidden="true" />
        </button>
        {action}
      </div>
      {open && (
        <div id={id} className="mt-2.5">
          {children}
        </div>
      )}
    </section>
  );
}

function CheckRow({ checked, onChange, label, count, disabled }) {
  return (
    <label className={`flex cursor-pointer items-center gap-2.5 rounded px-1 py-1 text-[13px] hover:bg-canvas ${disabled ? "opacity-50" : ""}`}>
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="peer sr-only" />
      <span
        aria-hidden="true"
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand ${
          checked ? "border-brand bg-brand text-white" : "border-[#A9B4AD] bg-white"
        }`}
      >
        {checked && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1 truncate text-ink">{label}</span>
      {count != null && <span className="text-xs tabular-nums text-ink-3">{count}</span>}
    </label>
  );
}

function PriceFilter({ state, facets, navigate }) {
  const floor = Math.floor(facets.priceMin / 50) * 50;
  const ceil = Math.max(floor + 50, Math.ceil(facets.priceMax / 50) * 50);
  const [lo, setLo] = useState(state.min ?? floor);
  const [hi, setHi] = useState(state.max ?? ceil);
  const span = ceil - floor || 1;
  const commit = () => {
    const min = lo <= floor ? null : lo;
    const max = hi >= ceil ? null : hi;
    if (min !== (state.min ?? null) || max !== (state.max ?? null)) navigate({ min, max });
  };
  const pct = (v) => ((Math.min(Math.max(v, floor), ceil) - floor) / span) * 100;

  return (
    <div>
      <div className="relative h-6">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-line" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-brand"
          style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
        />
        {[
          { value: lo, set: (v) => setLo(Math.min(v, hi - 50)), label: "Minimum price" },
          { value: hi, set: (v) => setHi(Math.max(v, lo + 50)), label: "Maximum price" },
        ].map((t) => (
          <input
            key={t.label}
            type="range"
            min={floor}
            max={ceil}
            step={50}
            value={Math.min(Math.max(t.value, floor), ceil)}
            aria-label={t.label}
            aria-valuetext={formatPrice(t.value)}
            onChange={(e) => t.set(Number(e.target.value))}
            onPointerUp={commit}
            onKeyUp={commit}
            className="range-thumb pointer-events-none absolute inset-0 w-full appearance-none bg-transparent"
          />
        ))}
      </div>
      <div className="mt-1 flex items-center justify-between text-xs font-semibold tabular-nums text-ink">
        <span>{formatPrice(lo)}</span>
        <span>{formatPrice(hi)}{hi >= ceil ? "+" : ""}</span>
      </div>
      <ul className="mt-2 space-y-0.5">
        {PRICE_PRESETS.map((p) => {
          const active = (state.min ?? null) === p.min && (state.max ?? null) === p.max;
          return (
            <li key={p.label}>
              <button
                type="button"
                onClick={() => navigate(active ? { min: null, max: null } : { min: p.min, max: p.max })}
                aria-pressed={active}
                className={`w-full rounded px-1 py-1 text-left text-[13px] hover:bg-canvas ${active ? "font-semibold text-brand" : "text-ink"}`}
              >
                {p.label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Multi-select facet: selected values first, then the top `initial` options,
 * a "N more" toggle and (when `searchable`) a search box over the full list.
 * Options are { value, count } (value doubles as label) or
 * { value, label, count }.
 */
function FacetList({ options, selected, onToggle, initial = 8, searchable = false, searchLabel, emptyText }) {
  const [term, setTerm] = useState("");
  const [expanded, setExpanded] = useState(false);
  const t = term.trim().toLowerCase();
  const labelOf = (o) => o.label ?? o.value;
  const picked = options.filter((o) => selected.includes(o.value));
  const missing = selected.filter((v) => !options.some((o) => o.value === v)).map((value) => ({ value, count: 0 }));
  const rest = options.filter((o) => !selected.includes(o.value) && (!t || labelOf(o).toLowerCase().includes(t)));
  const visible = t || expanded ? rest : rest.slice(0, initial);
  return (
    <div>
      {searchable && options.length > initial && (
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-3" strokeWidth={1.75} aria-hidden="true" />
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={`Search ${options.length} ${searchLabel}`}
            aria-label={`Search ${searchLabel}`}
            className="h-8 w-full rounded-md border border-line pl-8 pr-2 text-[13px] outline-none focus:border-brand"
          />
        </div>
      )}
      <div className="max-h-72 space-y-0.5 overflow-y-auto pr-1">
        {[...picked, ...missing].map((o) => (
          <CheckRow key={o.value} checked label={labelOf(o)} count={o.count} onChange={() => onToggle(o.value)} />
        ))}
        {visible.map((o) => (
          <CheckRow key={o.value} checked={false} label={labelOf(o)} count={o.count} onChange={() => onToggle(o.value)} />
        ))}
        {t && rest.length === 0 && <p className="px-1 py-1 text-xs text-ink-2">No {searchLabel} match “{term}”.</p>}
        {!t && options.length === 0 && emptyText && <p className="px-1 text-xs text-ink-2">{emptyText}</p>}
      </div>
      {!t && rest.length > initial && (
        <button type="button" onClick={() => setExpanded((e) => !e)} className="mt-1.5 px-1 text-[13px] font-semibold text-brand hover:underline">
          {expanded ? "Show less" : `${rest.length - initial} more`}
        </button>
      )}
    </div>
  );
}

/**
 * Listing filters. Every change navigates to a new URL; the server renders the
 * filtered results. Used in the desktop sidebar and the mobile filter sheet.
 *
 * scope: "category" (/c/x), "subcategory" (/c/x/y) or "search" (/search).
 */
export default function FilterSidebar({ basePath, state, facets, scope, categorySlug, subcategorySlug, total = 1, inSheet = false, onPendingChange }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const navigate = (overrides) => {
    const href = listingHref(basePath, state, overrides);
    onPendingChange?.(true);
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  };

  const hasFilters =
    state.min != null ||
    state.max != null ||
    state.subs.length ||
    state.brands.length ||
    state.crops.length ||
    state.units.length ||
    state.inStock ||
    (scope === "search" && state.category);
  const clearHref = listingHref(basePath, { q: state.q, sort: state.sort });
  const onCategoryPages = scope === "category" || scope === "subcategory";

  return (
    <div className={`transition-opacity ${pending ? "opacity-60" : ""}`} aria-busy={pending}>
      {/* In the mobile sheet the sheet title already says "Filters". */}
      {(!inSheet || hasFilters) && (
        <div className={`flex items-center border-b border-line px-4 ${inSheet ? "justify-end py-2" : "justify-between py-3"}`}>
          {!inSheet && <h2 className="font-display text-base font-extrabold text-ink">Filters</h2>}
          {hasFilters ? (
            <Link href={clearHref} scroll={false} className="text-xs font-semibold uppercase tracking-wide text-brand hover:underline">
              Clear all
            </Link>
          ) : null}
        </div>
      )}

      <Section title="Categories">
        <ul className="space-y-0.5">
          {scope === "search" && state.category && (
            <li>
              <button type="button" onClick={() => navigate({ category: "", subs: [] })} className="px-1 py-1 text-[13px] font-semibold text-brand hover:underline">
                ‹ All categories
              </button>
            </li>
          )}
          {facets.categories.map((c) => {
            const active = onCategoryPages ? categorySlug === c.slug : state.category === c.slug;
            if (onCategoryPages) {
              return (
                <li key={c.slug}>
                  <Link
                    href={`/c/${c.slug}`}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center justify-between rounded px-1 py-1 text-[13px] hover:bg-canvas ${active ? "font-semibold text-brand" : "text-ink"}`}
                  >
                    {c.name}
                  </Link>
                </li>
              );
            }
            return (
              <li key={c.slug}>
                <button
                  type="button"
                  disabled={!c.count && !active}
                  aria-pressed={active}
                  onClick={() => navigate({ category: active ? "" : c.slug, subs: [] })}
                  className={`flex w-full items-center justify-between rounded px-1 py-1 text-left text-[13px] hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50 ${
                    active ? "font-semibold text-brand" : "text-ink"
                  }`}
                >
                  {c.name}
                  <span className="text-xs font-normal tabular-nums text-ink-3">{c.count}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* Subcategory: on /c/x/y the siblings are links (switch listing); elsewhere a multi-select. */}
      {(scope !== "search" || state.category) && facets.subcategories.length > 0 && (
        <Section title="Subcategory">
          {scope === "subcategory" ? (
            <ul className="max-h-72 space-y-0.5 overflow-y-auto pr-1">
              <li>
                <Link href={`/c/${categorySlug}`} className="block px-1 py-1 text-[13px] font-semibold text-brand hover:underline">
                  ‹ All {facets.categories.find((c) => c.slug === categorySlug)?.name?.toLowerCase() ?? "products"}
                </Link>
              </li>
              {facets.subcategories.map((s) => {
                const active = s.slug === subcategorySlug;
                return (
                  <li key={s.slug}>
                    <Link
                      href={`/c/${categorySlug}/${s.slug}`}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center justify-between gap-2 rounded px-1 py-1 text-[13px] hover:bg-canvas ${active ? "font-semibold text-brand" : "text-ink"}`}
                    >
                      <span className="min-w-0 truncate">{s.name}</span>
                      <span className="text-xs font-normal tabular-nums text-ink-3">{s.count}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <FacetList
              options={facets.subcategories.map((s) => ({ value: s.slug, label: s.name, count: s.count }))}
              selected={state.subs}
              onToggle={(v) => navigate({ subs: toggleValue(state.subs, v) })}
              initial={10}
              searchable
              searchLabel="subcategories"
            />
          )}
        </Section>
      )}

      {/* A price range is meaningless with zero matching products. */}
      {total > 0 && (
        <Section title="Price">
          <PriceFilter key={`${state.min}-${state.max}-${facets.priceMin}-${facets.priceMax}`} state={state} facets={facets} navigate={navigate} />
        </Section>
      )}

      <Section title="Brand">
        <FacetList
          options={facets.brands}
          selected={state.brands}
          onToggle={(v) => navigate({ brands: toggleValue(state.brands, v) })}
          initial={30}
          searchable
          searchLabel="brands"
          emptyText="No brands for these filters."
        />
      </Section>

      {facets.crops.length > 0 && (
        <Section title="Crop">
          <FacetList
            options={facets.crops}
            selected={state.crops}
            onToggle={(v) => navigate({ crops: toggleValue(state.crops, v) })}
            initial={10}
            searchable
            searchLabel="crops"
          />
        </Section>
      )}

      <Section title="Pack size">
        <FacetList
          options={facets.units}
          selected={state.units}
          onToggle={(v) => navigate({ units: toggleValue(state.units, v) })}
          initial={12}
          searchable
          searchLabel="pack sizes"
          emptyText="No pack sizes for these filters."
        />
      </Section>

      {/* Excludes "Not for online sale" listings (store & quotation only) as well as out-of-stock ones. */}
      <Section title="Availability">
        <CheckRow checked={state.inStock} label="Available online" onChange={() => navigate({ inStock: !state.inStock })} />
      </Section>
    </div>
  );
}
