import { notFound, permanentRedirect } from "next/navigation";
import { LEGACY_CATEGORY_REDIRECTS, categoryBySlug } from "../../config/taxonomy";

// Resolves the category BEFORE the page's loading boundary so legacy URLs
// answer with a real 308 and unknown categories with a real 404 (inside the
// Suspense boundary they would stream as 200). This layout also wraps the
// subcategory route, so /c/crop-protection/<anything> lands on the new
// /c/traps-and-repellents category as well.
export default async function CategoryLayout({ params, children }) {
  const { category } = await params;
  if (LEGACY_CATEGORY_REDIRECTS[category]) permanentRedirect(LEGACY_CATEGORY_REDIRECTS[category]);
  if (!categoryBySlug[category]) notFound();
  return children;
}
