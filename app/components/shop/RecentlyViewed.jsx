"use client";

import { clearRecent, useRecent } from "../../lib-shop/recent";
import ProductCard from "./ProductCard";
import ProductRail from "./ProductRail";

export default function RecentlyViewed({ excludeSku }) {
  // Snapshots carry the index flag: "Not for online sale" products never
  // appear in this rail (they stay reachable from listings and search).
  const items = useRecent().filter((c) => c?.sku && c.sku !== excludeSku && c.onlineSale !== false && !c.restriction);
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
