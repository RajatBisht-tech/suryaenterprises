// Marketplace taxonomy. Live level-1 categories map 1:1 to `category` values
// in the catalogue data (app/products/data/products.json). Level-2
// subcategories are NOT listed here: they come from the data (`subcategory`
// on every record) and are counted in catalog.server.js, so adding products
// in a new subcategory needs no code change.
//
// This module is imported by client components, server components AND the
// import script (scripts/import-brand-catalog.mjs, plain Node) — keep it
// dependency-free.

export const CATEGORIES = [
  {
    slug: "seeds",
    name: "Seeds",
    shortName: "Seeds",
    dataCategory: "Seeds",
    skuCode: "SED",
    need: "Sowing & planting",
    icon: "wheat",
    tint: "#FFF4D6",
    illustration: "/assets/marketplace/soon-seeds.svg",
    description: "Vegetable, fruit, flower, field and forage seeds from established seed companies, by crop and pack size.",
  },
  {
    slug: "crop-protection",
    name: "Crop Protection",
    shortName: "Crop protection",
    dataCategory: "Crop Protection",
    skuCode: "CRP",
    need: "Pest, weed & disease",
    // Home "Shop by need" tile subtitle (pesticides are store-only; see config/sale-restrictions.js).
    tileNote: "Traps & lures and animal repellents online · pesticides and sprays at our store",
    icon: "bug",
    tint: "#E8F5EC",
    illustration: "/assets/marketplace/need-pest.svg",
    description:
      "Traps & lures and animal repellents to buy online; insecticides, fungicides, herbicides, bio-controls and adjuvants are listed for our Jaipur store and institutional desk (not sold online).",
  },
  {
    slug: "crop-nutrition",
    name: "Crop Nutrition",
    shortName: "Crop nutrition",
    dataCategory: "Crop Nutrition",
    skuCode: "NUT",
    need: "Fertilisers & growth",
    icon: "sprout",
    tint: "#E7F0FB",
    illustration: "/assets/marketplace/soon-fertiliser.svg",
    description: "Fertilisers, bio-fertilisers, biostimulants and organic inputs for every growth stage; growth regulators and urea are sold at our Jaipur store only.",
  },
  {
    slug: "farm-machinery",
    name: "Farm Machinery",
    shortName: "Farm machinery",
    dataCategory: "Farm Machinery",
    skuCode: "MCH",
    need: "Sprayers, tools & covers",
    icon: "shovel",
    tint: "#F3EEE8",
    illustration: "/assets/marketplace/soon-tools.svg",
    description: "Sprayers, brush cutters, tillers, hand tools, tarpaulins, mulches, irrigation and other farm equipment.",
  },
  {
    slug: "animal-husbandry",
    name: "Animal Husbandry",
    shortName: "Animal husbandry",
    dataCategory: "Animal Husbandry",
    skuCode: "ANH",
    need: "Livestock & poultry",
    icon: "package",
    tint: "#FFF6D9",
    illustration: "/assets/marketplace/need-animal.svg",
    description: "Cattle feed, milking equipment, poultry and fish care products and other livestock supplies — available at our Jaipur store and by quotation, not sold online.",
  },
];

export const categoryBySlug = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c]));
export const categoryByData = Object.fromEntries(CATEGORIES.map((c) => [c.dataCategory, c]));

// URL slug for any human label ("Bhendi/Okra Seeds" -> "bhendi-okra-seeds",
// "Traps & Lures" -> "traps-and-lures"). Shared by the import script (product
// slugs) and the listing routes (subcategory slugs).
export function slugify(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/%/g, " pct ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Old category URLs (the previous four-category catalogue) keep working as
// permanent redirects to the matching subcategory listing.
export const LEGACY_CATEGORY_REDIRECTS = {
  insecticides: "/c/crop-protection/insecticides",
  herbicides: "/c/crop-protection/herbicides",
  fungicides: "/c/crop-protection/fungicides",
  "pgr-and-others": "/c/crop-nutrition/growth-regulators",
};

export const categoryHref = (slug) => `/c/${slug}`;
export const subcategoryHref = (categorySlug, subcategorySlug) => `/c/${categorySlug}/${subcategorySlug}`;
export const productHref = (slug) => `/p/${slug}`;
export const brandHref = (brand) => `/search?brand=${encodeURIComponent(brand)}`;
