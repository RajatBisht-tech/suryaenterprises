import { Store } from "lucide-react";
import { SALE_RESTRICTION_LABEL } from "../../config/sale-restrictions";
import { LOW_STOCK } from "../../lib-shop/format";

// Amber tag for products that are listed but not sold online (see
// app/config/sale-restrictions.js). Exported for the wishlist / cart rows.
export function RestrictedBadge({ label = SALE_RESTRICTION_LABEL, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-sm border border-notice-line bg-notice-tint px-1.5 py-px text-[11px] font-bold text-notice ${className}`}>
      <Store className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
      {label}
    </span>
  );
}

// `restriction` (product.restriction from the catalogue / index) wins over
// the stock figure: restricted products are stock 0 but are not "out of
// stock" — they are sold at the store and by quotation.
export default function StockBadge({ stock, restriction = null, verbose = false }) {
  if (restriction) return <RestrictedBadge label={restriction.label} />;
  if (!(stock > 0)) {
    return <span className="text-xs font-semibold text-danger">Out of stock</span>;
  }
  if (stock <= LOW_STOCK) {
    return <span className="text-xs font-semibold text-danger">Only {stock} left</span>;
  }
  return verbose ? <span className="text-xs font-semibold text-brand">In stock</span> : null;
}
