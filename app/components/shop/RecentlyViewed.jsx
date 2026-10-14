"use client";

import { useEffect, useState } from "react";
import { clearRecent, pruneRecent, useRecent } from "../../lib-shop/recent";
import ProductCard from "./ProductCard";
import ProductRail from "./ProductRail";

// Snapshots live in localStorage, so a product removed from the catalogue
// (app/config/catalog-exclusions.js) can linger in a shopper's history. When
// there is something to show, the slim client index is loaded lazily and
// stale SKUs are pruned before the rail renders — nothing that is no longer
// sold is ever shown.
export default function RecentlyViewed({ excludeSku }) {
  const recent = useRecent();
  const candidates = recent.filter((c) => c?.sku && c.sku !== excludeSku);
  const [verified, setVerified] = useState(null); // Set of SKUs known to exist

  useEffect(() => {
    if (!candidates.length) return undefined;
    let cancelled = false;
    import("../../products/data/products").then(({ getProduct }) => {
      if (cancelled) return;
      const live = new Set(candidates.map((c) => c.sku).filter((sku) => Boolean(getProduct(sku))));
      if (live.size !== candidates.length) pruneRecent((c) => live.has(c.sku));
      setVerified(live);
    });
    return () => {
      cancelled = true;
    };
    // Only re-check when the set of SKUs changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates.map((c) => c.sku).join("|")]);

  const items = verified ? candidates.filter((c) => verified.has(c.sku)) : [];
  if (!items.length) return null;
  return (
    <div className="relative">
      <ProductRail id="recent" title="Recently viewed" eyebrow="Pick up where you left off">
        {items.map((p) => (
          <ProductCard key={p.sku} product={p} layout="rail" />
        ))}
      </ProductRail>
      <button
        type="button"
        onClick={clearRecent}
        className="absolute right-3 top-4 text-xs font-semibold text-ink-2 hover:text-danger sm:right-4"
      >
        Clear
      </button>
    </div>
  );
}
