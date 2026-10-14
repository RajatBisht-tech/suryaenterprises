// Marketplace taxonomy. The three live level-1 categories map 1:1 to the
// `category` values in the catalogue data (app/products/data/products.json).
// Level-2 subcategories are NOT listed here: they come from the data
// (`subcategory` on every record) and are counted in catalog.server.js, so
// adding products in a new subcategory needs no code change.
//
// The business sells seeds, non-chemical crop care (traps, lures, sticky
// traps, animal repellents) and farm machinery only. Anything else in the
// source master is dropped by app/config/catalog-exclusions.js at import.
//
// This module is imported by client components, server components AND the
// import script (scripts/import-brand-catalog.mjs, plain Node) — keep it
// dependency-free.

export const CATEGORIES = [
  {
    slug: "seeds",
    name: "Seeds",
    shortName: "Seeds",
    // `dataCategory` is the value written to every record (the import script
    // maps the source master's own level-1 labels onto these slugs).
    dataCategory: "Seeds",
    skuCode: "SED",
    need: "Sowing & planting",
    icon: "wheat",
    tint: "#FFF4D6",
    illustration: "/assets/marketplace/soon-seeds.svg",
    description: "Vegetable, fruit, flower, field and forage seeds from established seed companies, by crop and pack size.",
  },
  {
    slug: "traps-and-repellents",
    name: "Traps & Repellents",
    shortName: "Traps & repellents",
    dataCategory: "Traps & Repellents",
    skuCode: "CRP",
    need: "Pest & animal control",
    icon: "bug",
    tint: "#E8F5EC",
    illustration: "/assets/marketplace/need-pest.svg",
    description: "Pheromone traps, lures, sticky traps and animal repellents",
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

// Home "Shop by need" tiles. A tile links to a whole category or to a set of
// farm-machinery subcategories (listed by their data names; the listing page
// accepts several `sub` filters). Counts are computed live in
// catalog.server.js (getShopByNeed). Art is reused from public/assets/marketplace.
export const SHOP_BY_NEED = [
  { slug: "seeds", title: "Seeds", note: "Sowing & planting", category: "seeds", illustration: "/assets/marketplace/soon-seeds.svg" },
  { slug: "traps", title: "Traps & repellents", note: "Pest & animal control", category: "traps-and-repellents", illustration: "/assets/marketplace/need-pest.svg" },
  {
    slug: "sprayers",
    title: "Sprayers",
    note: "Knapsack, battery & power",
    category: "farm-machinery",
    subcategories: ["Sprayers", "Fogger"],
    illustration: "/assets/marketplace/need-sprayer.svg",
  },
  {
    slug: "tools",
    title: "Tools & equipment",
    note: "Hand tools, cutters & tillers",
    category: "farm-machinery",
    subcategories: [
      "Brush Cutter",
      "Tillers/Cultivator",
      "Hand Weeder",
      "Hoe/Spade/Fawada",
      "Akadi/Khurpa/Sickle",
      "Axe",
      "Saw",
      "Chainsaw",
      "Secateur",
      "Shear",
      "Pruner/Lopper",
      "Earth Auger",
      "Chaff Cutter",
      "Harvesters",
      "Power Reaper",
      "Lawn Mower",
      "Trimmer",
      "Garden Tool kit",
      "Manual Seeder",
      "Seedling Transplanters",
      "Hammer",
      "Drill Machine",
      "Engine",
      "Farm Accessories",
    ],
    illustration: "/assets/marketplace/soon-tools.svg",
  },
  {
    slug: "covers",
    title: "Tarpaulins & covers",
    note: "Tarpaulins, mulches, nets",
    category: "farm-machinery",
    subcategories: ["Tarpaulin", "Mulches", "Shade Nets", "Crop Cover", "Fruit Covers", "Weed Mat"],
    illustration: "/assets/marketplace/need-tarpaulin.svg",
  },
  {
    slug: "irrigation",
    title: "Irrigation",
    note: "Pumps, pipes & drip",
    category: "farm-machinery",
    subcategories: ["Irrigation Tools", "Hose Pipe", "Water Pump", "Pump Controller", "Fertigation Device", "Solar Pump Set"],
    illustration: "/assets/marketplace/soon-irrigation.svg",
  },
];

// Old category URLs keep working as permanent redirects: the four product
// URLs of the original site and the former slug of the category that is now
// "Traps & Repellents". /c/crop-protection/<anything> also lands on the new
// category (handled in app/c/[category]/layout.js). The keys are URL slugs
// only — the goods they once named are no longer sold.
export const LEGACY_CATEGORY_REDIRECTS = {
  "crop-protection": "/c/traps-and-repellents",
  insecticides: "/c/traps-and-repellents",
  herbicides: "/c/traps-and-repellents",
  fungicides: "/c/traps-and-repellents",
  "pgr-and-others": "/c/traps-and-repellents",
};

export const categoryHref = (slug) => `/c/${slug}`;
export const subcategoryHref = (categorySlug, subcategorySlug) => `/c/${categorySlug}/${subcategorySlug}`;
export const productHref = (slug) => `/p/${slug}`;
export const brandHref = (brand) => `/search?brand=${encodeURIComponent(brand)}`;
