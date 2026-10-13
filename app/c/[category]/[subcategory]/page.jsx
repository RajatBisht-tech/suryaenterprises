import { notFound } from "next/navigation";
import ListingView from "../../../components/shop/ListingView";
import { categoryBySlug } from "../../../config/taxonomy";
import { getSubcategory, parseListingParams, queryListing } from "../../../products/data/catalog.server";

export async function generateMetadata({ params }) {
  const { category, subcategory } = await params;
  const c = categoryBySlug[category];
  const s = c ? getSubcategory(c.slug, subcategory) : null;
  if (!c || !s) return { title: "Category not found" };
  const n = s.count.toLocaleString("en-IN");
  return {
    title: `${s.name} — ${c.name}`,
    // Store-only subcategories (pesticides, PGRs…) are browsable, not purchasable online.
    description: s.storeOnly
      ? `Browse ${n} ${s.name.toLowerCase()} listings in ${c.name.toLowerCase()} from Surya Enterprises — not for online sale; available at our Jaipur store and by quotation.`
      : `Shop ${n} ${s.name.toLowerCase()} listings in ${c.name.toLowerCase()} online from Surya Enterprises, by brand and pack size.`,
    alternates: { canonical: `/c/${c.slug}/${s.slug}` },
  };
}

export default async function SubcategoryPage({ params, searchParams }) {
  const { category, subcategory } = await params;
  const c = categoryBySlug[category];
  if (!c) notFound();
  const s = getSubcategory(c.slug, subcategory);
  if (!s) notFound();

  const state = parseListingParams(await searchParams);
  state.q = "";
  state.category = "";
  state.subs = [];
  const result = queryListing({ scope: "subcategory", categorySlug: c.slug, subcategorySlug: s.slug, params: state });
  const viewState = { ...state, page: result.page };

  return (
    <ListingView
      scope="subcategory"
      basePath={`/c/${c.slug}/${s.slug}`}
      categorySlug={c.slug}
      subcategorySlug={s.slug}
      title={s.name}
      subtitle={<>in {c.name}</>}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "All categories", href: "/products" },
        { label: c.name, href: `/c/${c.slug}` },
        { label: s.name },
      ]}
      result={result}
      state={viewState}
      emptyActions={[
        { label: `Clear filters`, href: `/c/${c.slug}/${s.slug}` },
        { label: `All ${c.name.toLowerCase()}`, href: `/c/${c.slug}` },
      ]}
    />
  );
}
