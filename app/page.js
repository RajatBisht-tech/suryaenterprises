import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, Phone } from "lucide-react";
import HeroCarousel from "./components/shop/HeroCarousel";
import OffersMarquee from "./components/shop/OffersMarquee";
import ProductCard from "./components/shop/ProductCard";
import ProductRail from "./components/shop/ProductRail";
import PromoCarousel from "./components/shop/PromoCarousel";
import RecentlyViewed from "./components/shop/RecentlyViewed";
import ShopByNeed from "./components/shop/ShopByNeed";
import TrustBar, { Medallion } from "./components/shop/TrustBar";
import { SITE, telHref } from "./config/site";
import { brandHref } from "./config/taxonomy";
import {
  getCatalogStats,
  getHomeRails,
  getNavCategories,
  getShopByNeed,
  getTopBrands,
} from "./products/data/catalog.server";

export const metadata = {
  title: { absolute: `${SITE.name} — ${SITE.tagline}` },
};

function Rail({ id, title, eyebrow, href, items }) {
  if (!items.length) return null;
  return (
    <ProductRail id={id} title={title} eyebrow={eyebrow} href={href}>
      {items.map((p) => (
        <ProductCard key={p.sku} product={p} layout="rail" />
      ))}
    </ProductRail>
  );
}

export default function HomePage() {
  const categories = getNavCategories();
  const needs = getShopByNeed();
  const stats = getCatalogStats();
  const rails = getHomeRails();
  const brands = getTopBrands(14);
  const fmt = (n) => n.toLocaleString("en-IN");
  const count = (slug) => categories.find((c) => c.slug === slug)?.count ?? 0;

  // Hero scenes are hand-made flat illustrations (public/assets/marketplace).
  const slides = [
    {
      id: "marketplace",
      image: "/assets/marketplace/hero-paddy-sunrise.svg",
      eyebrow: SITE.tagline,
      eyebrowShort: "Agri marketplace",
      title: "Seeds, traps and farm machinery, one marketplace",
      text: `${fmt(stats.total)} listings from ${fmt(stats.brands)} brands — seeds by crop, traps & repellents by pest, sprayers, tarpaulins and tools by type, every pack size, one checkout.`,
      textShort: `${fmt(stats.total)} listings · ${fmt(stats.brands)} brands`,
      cta: "Shop all categories",
      href: "/products",
      secondary: { label: "Seeds", href: "/c/seeds" },
    },
    {
      id: "protect",
      image: "/assets/marketplace/hero-cotton-sprayer.svg",
      eyebrow: `${fmt(count("traps-and-repellents"))} traps & repellents · ${fmt(count("farm-machinery"))} machinery listings`,
      eyebrowShort: "Protect & equip",
      title: "Protect the crop, equip the farm",
      text: "Pheromone traps, lures, sticky traps and animal repellents, plus knapsack and battery sprayers, tarpaulins, mulches and hand tools — filter by brand, crop and pack size.",
      textShort: "Traps, lures, repellents, sprayers and tools.",
      cta: "Shop traps & repellents",
      href: "/c/traps-and-repellents",
      secondary: { label: "Sprayers", href: "/c/farm-machinery/sprayers" },
    },
    {
      id: "bulk",
      image: "/assets/marketplace/hero-agri-warehouse.svg",
      eyebrow: "For agri-retailers & institutions",
      eyebrowShort: "Retailers & institutions",
      title: "Bulk & institutional buying",
      text: "Bulk seeds, sprayers, tarpaulins and equipment for institutions, universities and dealers — quotations on request.",
      textShort: "Volume supply, quotes on request.",
      cta: "Explore institutional",
      href: "/products/institutional",
      secondary: { label: "Talk to us", href: "/contact" },
    },
  ];

  const promotions = (SITE.promotions ?? []).filter((p) => p.enabled && p.title && p.href);

  return (
    <>
      {/* Offers ticker sits directly under the header (site-wide via layout when SITE.offersSiteWide). */}
      {!SITE.offersSiteWide && <OffersMarquee />}
      <main className="shell space-y-3 py-3">
        <h1 className="sr-only">
          {SITE.name} — {SITE.tagline}
        </h1>
        <HeroCarousel slides={slides} />
        <ShopByNeed needs={needs} />
        {promotions.length > 0 && <PromoCarousel slides={promotions} />}
        <TrustBar />

        <Rail id="featured" title="Featured products" eyebrow="One pick per brand across the most popular subcategories" items={rails.featured} />

        {/* Shop by brand */}
        <section aria-labelledby="brands-heading" className="rounded-lg border border-line bg-white px-3 py-3 sm:px-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Shop by brand</p>
              <h2 id="brands-heading" className="font-display text-lg font-extrabold text-ink sm:text-xl">
                {fmt(stats.brands)} brands, genuine packs
              </h2>
            </div>
            <Link href="/search" className="hidden shrink-0 text-[13px] font-semibold text-brand hover:underline sm:inline">
              All products
            </Link>
          </div>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {brands.map((b) => (
              <li key={b.name}>
                <Link href={brandHref(b.name)} className="chip hover:border-brand hover:text-brand">
                  {b.name}
                  <span className="text-ink-3">{fmt(b.count)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <Rail id="under-500" title="Under ₹500" eyebrow="Small packs, every category" href="/search?max=500&sort=popularity" items={rails.under500} />

        {/* Bulk & institutional banner */}
        <section
          aria-labelledby="bulk-heading"
          className="on-dark relative grid overflow-hidden rounded-lg bg-brand-deep text-white md:grid-cols-[1.2fr_1fr]"
        >
          <div className="relative z-10 p-5 sm:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-harvest">Bulk &amp; institutional buying</p>
            <h2 id="bulk-heading" className="mt-1.5 font-display text-2xl font-extrabold leading-tight sm:text-3xl">
              Buying for a co-operative, dealer network or institution?
            </h2>
            <p className="mt-2 max-w-lg text-[14px] text-white/85">
              Bulk seeds, sprayers, tarpaulins and farm equipment for institutions, universities and dealers — request a quote
              for volume supply.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/products/institutional" className="btn btn-cart">
                <Building2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                Bulk &amp; institutional orders
              </Link>
              <a href={telHref} className="btn border border-white/40 text-white hover:bg-white/10">
                <Phone className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                {SITE.helpline.display}
              </a>
            </div>
          </div>
          <div className="relative hidden min-h-[220px] md:block">
            <Image src="/assets/marketplace/hero-agri-warehouse.svg" alt="" fill sizes="40vw" unoptimized className="object-cover object-right" />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-deep via-brand-deep/10 to-transparent" />
          </div>
        </section>

        {rails.perCategory.map((c) => (
          <Rail key={c.slug} id={`best-${c.slug}`} title={`Explore ${c.name.toLowerCase()}`} eyebrow="Featured first, one pick per product" href={`/c/${c.slug}`} items={c.items} />
        ))}

        {/* Why buy from Surya */}
      <section
        aria-labelledby="why-heading"
        className="relative overflow-hidden rounded-lg border border-line bg-[linear-gradient(100deg,#E8F5EC_0%,#FFFFFF_48%,#FFF8E6_100%)] px-3 py-4 sm:px-4 sm:py-5"
      >
        <div className="field-rows absolute inset-0" aria-hidden="true" />
        <div className="relative">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Why buy from Surya</p>
              <h2 id="why-heading" className="font-display text-lg font-extrabold text-ink sm:text-xl">
                A licensed marketplace for seeds, traps and farm machinery
              </h2>
            </div>
            <Link href="/aboutUs" className="hidden shrink-0 items-center gap-1 text-[13px] font-semibold text-brand hover:underline sm:inline-flex">
              About Surya Enterprises <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: "shield", title: "Genuine products", text: "Genuine products from leading brands — every listing names the brand, pack size and SKU, so you know exactly what you are buying." },
              { icon: "label", title: "Licensed agri-inputs marketplace", text: "Surya Enterprises is licensed to trade in agri-inputs. Everything we ship comes in sealed manufacturer packs." },
              { icon: "wheat", title: "Every pack size, its own listing", text: "Seeds by crop and variety, traps & repellents by pest, sprayers, tarpaulins and tools by type — each pack size has its own price." },
              { icon: "truck", title: "Pan-India dispatch", text: SITE.delivery.dispatchClaim },
              { icon: "upi", title: "Secure UPI payments", text: "Pay with any UPI app through PayU. Your UPI PIN is never entered on this site and no card details are stored." },
              { icon: "building", title: "Bulk & institutional support", text: "Bulk seeds, sprayers, tarpaulins and equipment for co-operatives, dealers and institutions — quotations on request." },
            ].map((w) => (
              <li key={w.title} className="flex gap-3 rounded-md bg-white/85 p-3.5 ring-1 ring-line">
                <Medallion icon={w.icon} />
                <span className="min-w-0">
                  <span className="block font-display text-[14px] font-extrabold leading-tight text-ink">{w.title}</span>
                  <span className="mt-1 block text-[12.5px] leading-5 text-ink-2">{w.text}</span>
                </span>
              </li>
            ))}
          </ul>
          <Link href="/aboutUs" className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-brand hover:underline sm:hidden">
            About Surya Enterprises <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <RecentlyViewed />
      </main>
    </>
  );
}
