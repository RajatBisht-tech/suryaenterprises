import { notFound, permanentRedirect } from "next/navigation";
import ListingView from "../../../components/shop/ListingView";
import SubcategoryStrip from "../../../components/shop/SubcategoryStrip";
import { LEGACY_CATEGORY_REDIRECTS, categoryBySlug } from "../../../config/taxonomy";
import { getNavCategories, getSubcategories, parseListingParams, queryListing } from "../../../products/data/catalog.server";

export async function generateMetadata({ params }) {
  const { category } = await params;
  const c = categoryBySlug[category];
  if (!c) return { title: LEGACY_CATEGORY_REDIRECTS[category] ? "Redirecting…" : "Category not found" };
  // A category with no online-sellable listing (animal husbandry) must not be
  // advertised as "buy online".
  const storeOnly = getNavCategories().find((n) => n.slug === c.slug)?.storeOnly ?? false;
  return {
    title: storeOnly ? `${c.name} — store & quotation` : `${c.name} — buy online`,
    description: storeOnly
      ? `${c.description} Listed for our Jaipur store and institutional desk — not sold online.`
      : `${c.description} Shop ${c.name.toLowerCase()} online from Surya Enterprises.`,
    alternates: { canonical: `/c/${c.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const { category } = await params;
  // The previous four-category URLs (/c/insecticides, …) live on as subcategory listings.
  if (LEGACY_CATEGORY_REDIRECTS[category]) permanentRedirect(LEGACY_CATEGORY_REDIRECTS[category]);
  const c = categoryBySlug[category];
  if (!c) notFound();

  const state = parseListingParams(await searchParams);
  state.q = "";
  state.category = "";
  const result = queryListing({ scope: "category", categorySlug: c.slug, params: state });
  const viewState = { ...state, page: result.page };
  const subcategories = getSubcategories(c.slug);

  return (
    <ListingView
      scope="category"
      basePath={`/c/${c.slug}`}
      categorySlug={c.slug}
      title={c.name}
      intro={c.description}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "All categories", href: "/products" },
        { label: c.name },
      ]}
      result={result}
      state={viewState}
      emptyActions={[
        { label: `Clear filters`, href: `/c/${c.slug}` },
        { label: "All categories", href: "/products" },
      ]}
    >
      <SubcategoryStrip categorySlug={c.slug} subcategories={subcategories.slice(0, 12)} total={subcategories.length} />
    </ListingView>
  );
}
