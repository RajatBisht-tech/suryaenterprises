"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { SALE_RESTRICTION_SHORT } from "../../config/sale-restrictions";
import { ICONS } from "./icons";

const listingHref = (slug, params) => {
  const sp = new URLSearchParams(params);
  const qs = sp.toString();
  return `/c/${slug}${qs ? `?${qs}` : ""}`;
};

// "Store only": every listing in the category / subcategory is not for online sale.
export function StoreOnlyTag({ className = "" }) {
  return (
    <span className={`rounded-sm bg-notice-tint px-1 py-px text-[9.5px] font-bold uppercase tracking-wider text-notice ${className}`}>
      {SALE_RESTRICTION_SHORT}
    </span>
  );
}

// Green category strip with hover/click mega menus (subcategories, brands,
// pack sizes — all counted from the live catalogue).
export default function CategoryMegaMenu({ categories }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(null);
  const [lastPath, setLastPath] = useState(pathname);
  const closeTimer = useRef(null);
  const rootRef = useRef(null);

  // Close the menu after navigation (render-time sync, no effect needed).
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(null);
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(null);
    };
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
      clearTimeout(closeTimer.current);
    };
  }, []);

  const hoverOpen = (slug) => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(slug), 90);
  };
  const hoverClose = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(null), 160);
  };

  const current = categories.find((c) => c.slug === open);

  return (
    <nav ref={rootRef} aria-label="Shop by category" className="on-dark relative hidden bg-brand lg:block" onMouseLeave={hoverClose}>
      <div className="shell flex h-10 items-stretch gap-0.5 text-[13px] font-semibold text-white">
        <Link
          href="/products"
          className={`flex items-center px-3 hover:bg-brand-hover ${pathname === "/products" ? "bg-brand-hover" : ""}`}
        >
          All categories
        </Link>
        {categories.map((c) => {
          const active = pathname === `/c/${c.slug}` || pathname.startsWith(`/c/${c.slug}/`);
          return (
            <div key={c.slug} className="flex" onMouseEnter={() => hoverOpen(c.slug)}>
              <Link
                href={`/c/${c.slug}`}
                className={`flex items-center gap-1.5 pl-3 pr-1 hover:bg-brand-hover ${active || open === c.slug ? "bg-brand-hover" : ""}`}
              >
                {c.name}
                {c.storeOnly && <StoreOnlyTag />}
              </Link>
              <button
                type="button"
                aria-expanded={open === c.slug}
                aria-controls="mega-menu-panel"
                aria-label={`${c.name} menu`}
                onClick={() => setOpen((o) => (o === c.slug ? null : c.slug))}
                className={`flex items-center pl-0.5 pr-2 hover:bg-brand-hover ${active || open === c.slug ? "bg-brand-hover" : ""}`}
              >
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${open === c.slug ? "rotate-180" : ""}`}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </button>
            </div>
          );
        })}
        <Link href="/products/institutional" className="flex items-center px-3 hover:bg-brand-hover" onMouseEnter={hoverClose}>
          Bulk &amp; institutional
        </Link>
      </div>

      {current && (
        <div
          id="mega-menu-panel"
          onMouseEnter={() => clearTimeout(closeTimer.current)}
          className="fade-in absolute inset-x-0 top-full z-40 border-b border-line bg-white text-ink shadow-[0_12px_24px_rgba(20,33,26,0.12)]"
        >
          <div className="shell grid grid-cols-[220px_1fr_1fr_240px] gap-6 py-5">
            <div className="flex flex-col gap-3 border-r border-line pr-5">
              <p className="eyebrow">{current.need}</p>
              <p className="font-display text-xl font-extrabold leading-tight">{current.name}</p>
              <p className="text-[13px] leading-5 text-ink-2">{current.description}</p>
              <Link href={`/c/${current.slug}`} className="btn btn-buy mt-auto h-9 w-fit px-3 text-[13px]">
                View all {current.count.toLocaleString("en-IN")}
                <ChevronRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              </Link>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-2">Shop by subcategory</p>
              <ul className="grid gap-0.5">
                {current.subcategories.map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/c/${current.slug}/${s.slug}`}
                      className="flex items-center justify-between gap-2 rounded px-2 py-1.5 text-[13px] hover:bg-brand-tint hover:text-brand"
                    >
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate">{s.name}</span>
                        {s.storeOnly && <StoreOnlyTag />}
                      </span>
                      <span className="text-xs tabular-nums text-ink-3">{s.count}</span>
                    </Link>
                  </li>
                ))}
                {current.subcategoryCount > current.subcategories.length && (
                  <li>
                    <Link href={`/c/${current.slug}`} className="block rounded px-2 py-1.5 text-[13px] font-semibold text-brand hover:underline">
                      All {current.subcategoryCount} subcategories
                    </Link>
                  </li>
                )}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-2">Popular brands</p>
              <ul className="grid gap-0.5">
                {current.topBrands.map((b) => (
                  <li key={b.value}>
                    <Link
                      href={listingHref(current.slug, { brand: b.value })}
                      className="flex items-center justify-between rounded px-2 py-1.5 text-[13px] hover:bg-brand-tint hover:text-brand"
                    >
                      <span className="truncate">{b.value}</span>
                      <span className="text-xs tabular-nums text-ink-3">{b.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-ink-2">Shop by pack size</p>
              <div className="flex flex-wrap gap-1.5">
                {current.packSizes.map((u) => (
                  <Link key={u.value} href={listingHref(current.slug, { unit: u.value })} className="chip hover:border-brand hover:text-brand">
                    {u.value}
                    <span className="text-ink-3">{u.count}</span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg p-4" style={{ background: current.tint }}>
              {current.illustration && (
                <span className="relative h-36 w-36 overflow-hidden rounded-full bg-white ring-1 ring-black/5">
                  <Image src={current.illustration} alt="" fill sizes="144px" unoptimized className="object-cover" />
                </span>
              )}
              <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                {(() => {
                  const Icon = ICONS[current.icon];
                  return Icon ? <Icon className="h-4 w-4 text-brand" strokeWidth={1.75} aria-hidden="true" /> : null;
                })()}
                {current.count.toLocaleString("en-IN")} products · {current.brandCount} brands
              </span>
              <span className="mt-1 text-[12px] text-ink-2">
                {current.storeOnly
                  ? "Store & quotation only — not sold online"
                  : `${current.onlineCount.toLocaleString("en-IN")} available online`}
              </span>
              <ul className="mt-2 flex flex-wrap justify-center gap-1 text-[12px]">
                <li>
                  <Link href={listingHref(current.slug, { sort: "popularity" })} className="rounded px-2 py-1 text-brand hover:underline">
                    Featured first
                  </Link>
                </li>
                <li>
                  <Link href={listingHref(current.slug, { max: "500" })} className="rounded px-2 py-1 text-brand hover:underline">
                    Under ₹500
                  </Link>
                </li>
                <li>
                  <Link href={listingHref(current.slug, { sort: "price_asc" })} className="rounded px-2 py-1 text-brand hover:underline">
                    Lowest price first
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
