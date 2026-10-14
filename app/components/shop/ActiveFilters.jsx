import Link from "next/link";
import { X } from "lucide-react";
import { categoryBySlug } from "../../config/taxonomy";
import { formatPrice } from "../../lib-shop/format";
import { listingHref } from "../../lib-shop/listing-url";

export default function ActiveFilters({ basePath, state, scope, facets }) {
  const chips = [];
  if (scope === "search" && state.category && categoryBySlug[state.category]) {
    chips.push({ key: "category", label: categoryBySlug[state.category].name, o: { category: "", subs: [] } });
  }
  state.subs.forEach((s) =>
    chips.push({
      key: `sub-${s}`,
      label: facets?.subcategories?.find((x) => x.slug === s)?.name ?? s,
      o: { subs: state.subs.filter((x) => x !== s) },
    })
  );
  state.brands.forEach((b) => chips.push({ key: `brand-${b}`, label: b, o: { brands: state.brands.filter((x) => x !== b) } }));
  state.crops.forEach((c) => chips.push({ key: `crop-${c}`, label: c, o: { crops: state.crops.filter((x) => x !== c) } }));
  if (state.min != null || state.max != null) {
    const label =
      state.min != null && state.max != null
        ? `${formatPrice(state.min)} – ${formatPrice(state.max)}`
        : state.min != null
          ? `Over ${formatPrice(state.min)}`
          : `Under ${formatPrice(state.max)}`;
    chips.push({ key: "price", label, o: { min: null, max: null } });
  }
  state.units.forEach((u) => chips.push({ key: `unit-${u}`, label: u, o: { units: state.units.filter((x) => x !== u) } }));
  if (state.inStock) chips.push({ key: "stock", label: "In stock", o: { inStock: false } });
  if (!chips.length) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Active filters">
      {chips.map((c) => (
        <li key={c.key}>
          <Link
            href={listingHref(basePath, state, c.o)}
            scroll={false}
            className="chip border-brand/30 bg-brand-tint text-brand hover:border-brand"
            aria-label={`Remove filter ${c.label}`}
          >
            <span className="max-w-[200px] truncate">{c.label}</span>
            <X className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
