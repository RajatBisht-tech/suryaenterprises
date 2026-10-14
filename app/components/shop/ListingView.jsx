import { PackageSearch } from "lucide-react";
import Link from "next/link";
import { SORTS } from "../../products/data/catalog.server";
import ActiveFilters from "./ActiveFilters";
import Breadcrumbs from "./Breadcrumbs";
import EmptyState from "./EmptyState";
import FilterSidebar from "./FilterSidebar";
import MobileListingControls from "./MobileListingControls";
import Pagination from "./Pagination";
import ProductCard from "./ProductCard";
import SortBar from "./SortBar";

const activeFilterCount = (s, scope) =>
  (s.min != null || s.max != null ? 1 : 0) +
  s.subs.length +
  s.brands.length +
  s.crops.length +
  s.units.length +
  (s.inStock ? 1 : 0) +
  (scope === "search" && s.category ? 1 : 0);

/**
 * Shared listing UI for /c/[category], /c/[category]/[subcategory] and
 * /search (server component).
 */
export default function ListingView({
  scope,
  basePath,
  categorySlug,
  subcategorySlug,
  title,
  subtitle,
  intro,
  breadcrumbs,
  result,
  state,
  emptyActions,
  suggestions,
  children,
}) {
  const { items, total, page, pageCount, pageSize, facets } = result;
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(page * pageSize, total);
  const sorts = scope === "search" ? SORTS : SORTS.map((s) => (s.value === "relevance" ? { ...s, label: "Featured" } : s));
  const filtersActive = activeFilterCount(state, scope);
  // Nothing to refine when an unfiltered query has no results: hide filters/sort.
  const showFilters = total > 0 || filtersActive > 0;
  const sidebarProps = { basePath, state, facets, scope, categorySlug, subcategorySlug, total };

  return (
    <main className="shell py-3">
      <Breadcrumbs items={breadcrumbs} className="mb-2" />
      <div className={`grid gap-3 ${showFilters ? "lg:grid-cols-[264px_minmax(0,1fr)]" : ""}`}>
        {showFilters && (
          <aside className="hidden self-start lg:sticky lg:top-[calc(var(--header-h)+12px)] lg:block lg:max-h-[calc(100vh-var(--header-h)-24px)] lg:overflow-y-auto lg:rounded-lg lg:border lg:border-line lg:bg-white">
            <FilterSidebar {...sidebarProps} />
          </aside>
        )}

        <section aria-labelledby="listing-title" className="min-w-0">
          <div className="rounded-lg border border-line bg-white px-3 pb-3 pt-3 sm:px-4 lg:pb-0">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 id="listing-title" className="font-display text-lg font-extrabold text-ink sm:text-xl">
                {title}
              </h1>
              <p className="text-xs text-ink-2" aria-live="polite">
                {total ? (
                  <>
                    Showing <span className="tabular-nums">{from.toLocaleString("en-IN")}</span>–<span className="tabular-nums">{to.toLocaleString("en-IN")}</span> of{" "}
                    <span className="font-semibold tabular-nums text-ink">{total.toLocaleString("en-IN")}</span> results
                    {subtitle ? <> {subtitle}</> : null}
                  </>
                ) : (
                  "No results"
                )}
              </p>
            </div>
            {intro && <p className="mt-1 max-w-3xl text-[13px] text-ink-2">{intro}</p>}
            {children}
            {filtersActive > 0 && (
              <div className="mt-2">
                <ActiveFilters basePath={basePath} state={state} scope={scope} facets={facets} />
              </div>
            )}
            <div className={`mt-2 border-t border-line pt-1 ${showFilters ? "hidden lg:block" : "hidden"}`}>
              <SortBar basePath={basePath} state={state} sorts={sorts} />
            </div>
          </div>
          {/* Sibling of the results grid (not inside the header card) so it stays
              sticky under the measured header for the whole results column. */}
          {showFilters && <MobileListingControls {...sidebarProps} sorts={sorts} activeCount={filtersActive} />}

          {items.length > 0 ? (
            <>
              <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {items.map((p, i) => (
                  <li key={p.sku}>
                    <ProductCard product={p} priority={i < 4} />
                  </li>
                ))}
              </ul>
              <div className="mt-3">
                <Pagination basePath={basePath} state={state} page={page} pageCount={pageCount} />
              </div>
            </>
          ) : (
            <EmptyState
              icon={PackageSearch}
              title={filtersActive ? "No products match these filters" : "We couldn't find a match"}
              actions={emptyActions}
              className="mt-2"
            >
              {filtersActive ? (
                <p>Try removing a filter or widening the price range.</p>
              ) : (
                <p>Check the spelling, or search by brand (e.g. “Syngenta”), crop (e.g. “Tomato”) or product type (e.g. “Sprayer”).</p>
              )}
              {suggestions?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-2">Popular searches</p>
                  <ul className="mt-2 flex flex-wrap justify-center gap-1.5">
                    {suggestions.map((s) => (
                      <li key={s}>
                        <Link href={`/search?q=${encodeURIComponent(s)}`} className="chip hover:border-brand hover:text-brand">
                          {s}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </EmptyState>
          )}
        </section>
      </div>
    </main>
  );
}
