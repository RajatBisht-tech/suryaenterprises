import Link from "next/link";
import { ChevronRight } from "lucide-react";

// Chip row of a category's subcategories (with counts) shown under the
// listing title on /c/[category].
export default function SubcategoryStrip({ categorySlug, subcategories, total, current = null }) {
  if (!subcategories?.length) return null;
  return (
    <nav aria-label="Subcategories" className="mt-2">
      <ul className="flex flex-wrap gap-1.5">
        {subcategories.map((s) => {
          const active = s.slug === current;
          return (
            <li key={s.slug}>
              <Link
                href={`/c/${categorySlug}/${s.slug}`}
                aria-current={active ? "page" : undefined}
                className={`chip ${active ? "border-brand bg-brand-tint text-brand" : "hover:border-brand hover:text-brand"}`}
              >
                {s.name}
                <span className="text-ink-3">{s.count.toLocaleString("en-IN")}</span>
              </Link>
            </li>
          );
        })}
        {total > subcategories.length && (
          <li className="inline-flex items-center text-xs text-ink-2">
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            {total - subcategories.length} more in the filters
          </li>
        )}
      </ul>
    </nav>
  );
}
