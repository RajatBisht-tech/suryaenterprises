import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Breadcrumbs from "../components/shop/Breadcrumbs";
import { StoreOnlyTag } from "../components/shop/CategoryMegaMenu";
import ProductCard from "../components/shop/ProductCard";
import { ICONS } from "../components/shop/icons";
import { getCatalogStats, getNavCategories, getTopPicks } from "./data/catalog.server";

export const metadata = {
  title: "All categories",
  description: "Explore seeds, crop protection, crop nutrition, farm machinery and animal husbandry products from Surya Enterprises.",
};

export default function ProductsPage() {
  const categories = getNavCategories();
  const stats = getCatalogStats();
  const picks = getTopPicks(12);
  const fmt = (n) => n.toLocaleString("en-IN");

  return (
    <main className="shell space-y-3 py-3">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "All categories" }]} />
      <header className="rounded-lg border border-line bg-white px-4 py-4 sm:px-5">
        <p className="eyebrow">Surya Enterprises</p>
        <h1 className="font-display text-2xl font-extrabold text-ink sm:text-[28px]">All categories</h1>
        <p className="mt-1 max-w-2xl text-[14px] text-ink-2">
          Five categories, <span className="font-semibold text-ink tabular-nums">{fmt(stats.subcategories)}</span> subcategories and{" "}
          <span className="font-semibold text-ink tabular-nums">{fmt(stats.total)}</span> listings from{" "}
          <span className="font-semibold text-ink tabular-nums">{fmt(stats.brands)}</span> brands — genuine products from leading brands and
          Surya&apos;s own range. <span className="font-semibold text-ink tabular-nums">{fmt(stats.onlineTotal)}</span> listings can be bought online;
          pesticides, urea, animal-husbandry products and other regulated goods are marked “Not for online sale” and are available at our Jaipur
          store and by quotation.
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {categories.map((c) => {
          const Icon = ICONS[c.icon];
          return (
            <li key={c.slug}>
              <div className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white transition-shadow hover:shadow-[0_4px_16px_rgba(20,33,26,0.10)]">
                <Link href={`/c/${c.slug}`} className="group flex items-center gap-3 p-4" style={{ background: `linear-gradient(180deg, ${c.tint} 0%, #fff 100%)` }}>
                  {c.illustration && (
                    <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-black/5">
                      <Image src={c.illustration} alt="" fill sizes="64px" unoptimized className="object-cover" />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      {Icon && <Icon className="h-4 w-4 shrink-0 text-brand" strokeWidth={1.75} aria-hidden="true" />}
                      <span className="font-display text-lg font-extrabold leading-tight text-ink group-hover:text-brand">{c.name}</span>
                      {c.storeOnly && <StoreOnlyTag />}
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-2">
                      {c.storeOnly ? "Store & quotation only" : `${fmt(c.onlineCount)} online`} · {fmt(c.count)} listings · {c.subcategoryCount} subcategories · {c.brandCount} brands
                    </span>
                  </span>
                </Link>
                <div className="flex flex-1 flex-col px-4 pb-4">
                  <p className="text-[13px] leading-5 text-ink-2">{c.description}</p>
                  <ul className="mt-3 space-y-0.5 text-[13px]">
                    {c.subcategories.slice(0, 6).map((s) => (
                      <li key={s.slug}>
                        <Link href={`/c/${c.slug}/${s.slug}`} className="flex items-center justify-between gap-2 rounded px-1 py-0.5 text-ink hover:bg-brand-tint hover:text-brand">
                          <span className="flex min-w-0 items-center gap-1.5">
                            <span className="truncate">{s.name}</span>
                            {s.storeOnly && !c.storeOnly && <StoreOnlyTag />}
                          </span>
                          <span className="text-xs tabular-nums text-ink-3">{s.count}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link href={`/c/${c.slug}`} className="mt-auto inline-flex items-center gap-1 pt-3 text-[13px] font-semibold text-brand hover:underline">
                    Shop all {c.name.toLowerCase()}
                    <ChevronRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <section aria-labelledby="institutional-heading" className="rounded-lg border border-line bg-white px-4 py-3">
        <h2 id="institutional-heading" className="eyebrow">Buying in volume?</h2>
        <p className="mt-1 text-[13px] text-ink-2">
          Technical grades, custom packaging and quotations for co-operatives, dealers and institutions.
          <Link href="/products/institutional" className="ml-1 font-semibold text-brand hover:underline">
            Bulk &amp; institutional range
          </Link>
        </p>
      </section>

      <section aria-labelledby="picks-heading" className="rounded-lg border border-line bg-white">
        <div className="border-b border-line px-4 py-3">
          <p className="eyebrow">Top picks</p>
          <h2 id="picks-heading" className="font-display text-lg font-extrabold text-ink">Featured across categories</h2>
        </div>
        <ul className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {picks.map((p) => (
            <li key={p.sku}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
