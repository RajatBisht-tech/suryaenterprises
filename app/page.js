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
  const stats = getCatalogStats();
  const rails = getHomeRails();
  const brands = getTopBrands(14);
  const fmt = (n) => n.toLocaleString("en-IN");
  // Online-sellable listings only (pesticides, urea, animal-husbandry goods
  // etc. are store-and-quotation items — see app/config/sale-restrictions.js).
  const count = (slug) => categories.find((c) => c.slug === slug)?.onlineCount ?? 0;

  // Hero scenes are hand-made flat illustrations (public/assets/marketplace).
  const slides = [
    {
      id: "marketplace",
      image: "/assets/marketplace/hero-paddy-sunrise.svg",
      eyebrow: SITE.tagline,
      eyebrowShort: "Agri marketplace",
      title: "Every farm input, one marketplace",
      text: `${fmt(stats.onlineTotal)} listings to buy online from ${fmt(stats.onlineBrands)} brands — seeds, traps & lures, crop nutrition and farm machinery in every pack size, one checkout. Pesticides, urea and animal-husbandry products: at our Jaipur store and by quotation.`,
      textShort: `${fmt(stats.onlineTotal)} listings online · ${fmt(stats.onlineBrands)} brands`,
      cta: "Shop all categories",
      href: "/products",
      secondary: { label: "Seeds", href: "/c/seeds" },
    },
    {
      id: "protect",
      image: "/assets/marketplace/hero-cotton-sprayer.svg",
      eyebrow: `${fmt(count("crop-protection"))} crop protection · ${fmt(count("crop-nutrition"))} crop nutrition online`,
      eyebrowShort: "Protect & nourish",
      title: "Protect the crop, feed the soil",
      text: "Traps & lures, animal repellents, bio-fertilisers, biostimulants and fertilisers online — filter by brand, crop and pack size. Pesticides and growth regulators are sold at our Jaipur store and through the institutional desk.",
      textShort: "Traps, lures, repellents and crop nutrition online.",
      cta: "Shop crop protection",
      href: "/c/crop-protection",
      secondary: { label: "Crop nutrition", href: "/c/crop-nutrition" },
    },
    {
      id: "bulk",
      image: "/assets/marketplace/hero-agri-warehouse.svg",
      eyebrow: "For agri-retailers & institutions",
      eyebrowShort: "Retailers & institutions",
      title: "Bulk & institutional buying",
      text: "Volume supply and technical grades for institutional partners, with quotations on request.",
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
        <ShopByNeed categories={categories} />
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
              Browse our institutional range of technical-grade actives with listed purity, and request a quote for volume
              supply and custom packaging.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/products/institutional" className="btn btn-cart">
                <Building2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                View institutional range
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
                A licensed marketplace for every farm input
              </h2>
            </div>
            <Link href="/aboutUs" className="hidden shrink-0 items-center gap-1 text-[13px] font-semibold text-brand hover:underline sm:inline-flex">
              About Surya Enterprises <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: "shield", title: "Genuine products", text: "Genuine products from leading brands and Surya's own range — every listing names the brand, pack size and SKU, so you know exactly what you are buying." },
              { icon: "label", title: "Licensed agro-inputs marketplace", text: "Surya Enterprises is licensed to sell agro-inputs. Pesticides, urea and animal-husbandry products are sold only at our Jaipur store and through the institutional desk — never online; everything we ship comes in sealed manufacturer packs." },
              { icon: "factory", title: "Surya's own range", text: "Products made by Surya Enterprises are marked “Manufacturer direct” on their page; everything else is a genuine branded pack sold by Surya." },
              { icon: "truck", title: "Pan-India dispatch", text: SITE.delivery.dispatchClaim },
              { icon: "upi", title: "Secure UPI payments", text: "Pay with any UPI app through PayU. Your UPI PIN is never entered on this site and no card details are stored." },
              { icon: "building", title: "Bulk & institutional support", text: "Technical-grade products with listed purity for co-operatives, dealers and institutions — quotations on request." },
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
