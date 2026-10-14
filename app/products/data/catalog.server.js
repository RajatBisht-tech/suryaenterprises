// Server-only catalogue access for marketplace pages (home, listing, search,
// product detail, search suggestions). The full catalogue never reaches the
// browser: pages read from here and pass only the rendered page of results
// (as plain "card" objects) to client components.
//
// Data model (app/products/data/products.json, one record per pack size):
//   category (level-1, see config/taxonomy.js) > subcategory (level-2, from
//   the data) ; brand ; crop (seeds) ; family = product-level key shared by
//   the pack sizes of one product.
//
// Everything in products.json is for sale online: goods the business does not
// sell (app/config/catalog-exclusions.js) are removed at import time and the
// build refuses to ship a catalogue that still contains one.
import "server-only";
import productsData from "./products.json";
import catalogMedia from "./catalog-media.json";
import { withCatalogMedia } from "./catalog-media.mjs";
import { CATEGORIES, SHOP_BY_NEED, categoryByData, categoryBySlug, slugify } from "../../config/taxonomy";
import { getReference } from "./reference-overlay.server";

export const PAGE_SIZE = 24;

// ---------------------------------------------------------------------------
// Indexes (built once per server process)
// ---------------------------------------------------------------------------

const normalize = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9.%]+/g, " ")
    .trim();

const tokenize = (value) => normalize(value).split(" ").filter(Boolean);

const UNIT_FACTORS = { ml: 1, l: 1000, ltr: 1000, g: 1, gm: 1, gms: 1, kg: 1000, kgs: 1000, seeds: 1, unit: 1, m: 1 };

// "100 ml" -> 100, "5 L" -> 5000 (for sorting pack sizes small -> large).
export function packSizeValue(unit) {
  const match = /([\d.]+)\s*([a-z]+)/i.exec(String(unit ?? ""));
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[1]) * (UNIT_FACTORS[match[2].toLowerCase()] ?? 1);
}

// Every record carries its published photos (catalog-media.json).
const records = productsData.map((entry, order) => {
  const product = withCatalogMedia(entry, catalogMedia);
  return {
    product,
    order,
    categorySlug: categoryByData[product.category]?.slug ?? null,
    subcategorySlug: slugify(product.subcategory),
    nameTokens: tokenize(product.name),
    nameText: normalize(product.name),
    brandText: normalize(product.brand),
    metaText: normalize([product.subcategory, product.crop, product.productType, product.category].filter(Boolean).join(" ")),
    descText: normalize(product.description),
  };
});

const bySlug = new Map(records.map((r) => [r.product.slug, r]));
const bySku = new Map(records.map((r) => [r.product.sku, r]));
const byCategory = new Map(CATEGORIES.map((c) => [c.slug, []]));
const byFamily = new Map();
for (const r of records) {
  if (r.categorySlug) byCategory.get(r.categorySlug).push(r);
  const fam = byFamily.get(r.product.family) ?? [];
  fam.push(r);
  byFamily.set(r.product.family, fam);
}

// categorySlug -> [{ slug, name, count }] sorted by count desc.
const subcategoriesByCategory = new Map();
for (const c of CATEGORIES) {
  const counts = new Map();
  for (const r of byCategory.get(c.slug)) {
    const entry = counts.get(r.subcategorySlug) ?? { slug: r.subcategorySlug, name: r.product.subcategory, count: 0 };
    entry.count += 1;
    counts.set(r.subcategorySlug, entry);
  }
  subcategoriesByCategory.set(
    c.slug,
    [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  );
}

const sortDesc = (map) => [...map.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));

// ---------------------------------------------------------------------------
// Shapes sent to the browser
// ---------------------------------------------------------------------------

// Product cards use the same published photos as the detail and cart views.
// The optional development reference overlay can still supply local previews.
export function toCard(product) {
  const card = {
    sku: product.sku,
    slug: product.slug,
    name: product.name,
    price: product.price,
    image: product.image,
    unit: product.unit,
    stock: product.stock,
    category: product.category,
    subcategory: product.subcategory,
    brand: product.brand,
    rating: product.rating ?? null,
  };
  if (product.mrp) card.mrp = product.mrp;
  if (product.reviewsCount) card.reviewsCount = product.reviewsCount;
  const ref = getReference(product.sku);
  if (ref?.images[0]) card.image = ref.images[0];
  return card;
}

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

export function getProductBySlug(slug) {
  return bySlug.get(slug)?.product ?? null;
}

export function getProductBySkuServer(sku) {
  return bySku.get(sku)?.product ?? null;
}

// Development-only reference copy for a product (null in production).
export function getProductReference(product) {
  return getReference(product.sku);
}

export function getCategoryProducts(slug) {
  return byCategory.get(slug) ?? [];
}

export function getSubcategories(categorySlug) {
  return subcategoriesByCategory.get(categorySlug) ?? [];
}

export function getSubcategory(categorySlug, subcategorySlug) {
  return getSubcategories(categorySlug).find((s) => s.slug === subcategorySlug) ?? null;
}

// Pick up to `limit` records, at most one per product family, so rails don't
// fill up with five pack sizes of the same product.
function distinctByFamily(list, limit) {
  const seen = new Set();
  const out = [];
  for (const r of list) {
    const key = r.product.family;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
    if (out.length >= limit) break;
  }
  return out;
}

// "Popularity": featured first, then by name (no ratings exist yet).
const featuredRank = (r) => (r.product.isFeatured ? 0 : 1);
const byPopularity = (a, b) => featuredRank(a) - featuredRank(b) || a.product.name.localeCompare(b.product.name) || a.order - b.order;

// Small deterministic hash so "Customers also viewed" is stable per product.
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ---------------------------------------------------------------------------
// Navigation / home data
// ---------------------------------------------------------------------------

let navCache = null;

// Category strip + mega menu: counts, top subcategories, brands, pack sizes.
export function getNavCategories() {
  if (navCache) return navCache;
  navCache = CATEGORIES.map((category) => {
    const list = getCategoryProducts(category.slug);
    const brandCounts = new Map();
    const unitCounts = new Map();
    for (const r of list) {
      brandCounts.set(r.product.brand, (brandCounts.get(r.product.brand) ?? 0) + 1);
      unitCounts.set(r.product.unit, (unitCounts.get(r.product.unit) ?? 0) + 1);
    }
    const subcategories = getSubcategories(category.slug);
    return {
      slug: category.slug,
      name: category.name,
      shortName: category.shortName ?? category.name,
      need: category.need,
      icon: category.icon,
      tint: category.tint,
      description: category.description,
      illustration: category.illustration ?? null,
      count: list.length,
      subcategoryCount: subcategories.length,
      subcategories: subcategories.slice(0, 10),
      brandCount: brandCounts.size,
      topBrands: sortDesc(brandCounts)
        .slice(0, 8)
        .map(([value, count]) => ({ value, count })),
      packSizes: sortDesc(unitCounts)
        .slice(0, 10)
        .sort((a, b) => packSizeValue(a[0]) - packSizeValue(b[0]))
        .map(([value, count]) => ({ value, count })),
    };
  });
  return navCache;
}

let needCache = null;

// Home "Shop by need" tiles (config/taxonomy.js SHOP_BY_NEED) with live
// listing counts. A tile with `subcategories` links to the category listing
// pre-filtered to those subcategories (only the ones that exist in the data).
export function getShopByNeed() {
  if (needCache) return needCache;
  needCache = SHOP_BY_NEED.map((need) => {
    const list = getCategoryProducts(need.category);
    if (!need.subcategories) {
      return { slug: need.slug, title: need.title, note: need.note, illustration: need.illustration, href: `/c/${need.category}`, count: list.length };
    }
    const wanted = new Set(need.subcategories.map(slugify));
    const present = getSubcategories(need.category).filter((s) => wanted.has(s.slug));
    const count = present.reduce((n, s) => n + s.count, 0);
    const query = present.map((s) => `sub=${encodeURIComponent(s.slug)}`).join("&");
    return {
      slug: need.slug,
      title: need.title,
      note: need.note,
      illustration: need.illustration,
      href: present.length === 1 ? `/c/${need.category}/${present[0].slug}` : `/c/${need.category}${query ? `?${query}` : ""}`,
      count,
    };
  });
  return needCache;
}

let statsCache = null;

// Catalogue totals (listings, products = families, brands, subcategories).
export function getCatalogStats() {
  if (statsCache) return statsCache;
  statsCache = {
    total: records.length,
    products: byFamily.size,
    brands: new Set(records.map((r) => r.product.brand)).size,
    subcategories: [...subcategoriesByCategory.values()].reduce((n, list) => n + list.length, 0),
  };
  return statsCache;
}

// Top brands across the catalogue (by number of listings).
export function getTopBrands(limit = 12) {
  const counts = new Map();
  for (const r of records) counts.set(r.product.brand, (counts.get(r.product.brand) ?? 0) + 1);
  return sortDesc(counts)
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

// Landing page rails. "Featured" = isFeatured, topped up deterministically
// (popularity order, one per family) from the rest of the catalogue so the
// rail stays full.
export function getHomeRails() {
  const RAIL = 16;
  const featuredPicks = distinctByFamily(records.filter((r) => r.product.isFeatured).sort(byPopularity), RAIL);
  if (featuredPicks.length < RAIL) {
    const taken = new Set(featuredPicks.map((r) => r.product.family));
    const topUp = distinctByFamily(
      [...records].sort(byPopularity).filter((r) => !taken.has(r.product.family)),
      RAIL - featuredPicks.length
    );
    featuredPicks.push(...topUp);
  }
  const under500 = distinctByFamily(
    records.filter((r) => r.product.price < 500).sort(byPopularity),
    RAIL
  );
  const perCategory = CATEGORIES.map((category) => ({
    slug: category.slug,
    name: category.name,
    items: distinctByFamily([...getCategoryProducts(category.slug)].sort(byPopularity), 14).map((r) => toCard(r.product)),
  }));
  return {
    featured: featuredPicks.map((r) => toCard(r.product)),
    under500: under500.map((r) => toCard(r.product)),
    perCategory,
  };
}

// Picks across categories (/products): an even share from every category.
export function getTopPicks(limit = 12) {
  const pools = CATEGORIES.map((c) => [...getCategoryProducts(c.slug)].sort(byPopularity)).filter((pool) => pool.length);
  const perCat = Math.ceil(limit / Math.max(1, pools.length));
  return pools
    .flatMap((pool) => distinctByFamily(pool, perCat))
    .slice(0, limit)
    .map((r) => toCard(r.product));
}

// ---------------------------------------------------------------------------
// Product detail helpers
// ---------------------------------------------------------------------------

// Other pack sizes of the same product (one per unit).
export function getPackVariants(product) {
  const seen = new Set();
  return (byFamily.get(product.family) ?? [])
    .filter((r) => {
      if (seen.has(r.product.unit)) return false;
      seen.add(r.product.unit);
      return true;
    })
    .sort((a, b) => packSizeValue(a.product.unit) - packSizeValue(b.product.unit) || a.order - b.order)
    .map((r) => ({ slug: r.product.slug, unit: r.product.unit, price: r.product.price, stock: r.product.stock }));
}

export function getSimilarProducts(product, limit = 14) {
  const same = records.filter(
    (r) => r.product.category === product.category && r.product.subcategory === product.subcategory && r.product.family !== product.family
  );
  return distinctByFamily(same.sort(byPopularity), limit).map((r) => toCard(r.product));
}

export function getAlsoViewed(product, limit = 14) {
  const seed = product.sku;
  const pool = records
    .filter((r) => r.product.category === product.category && r.product.family !== product.family)
    .map((r) => ({ r, k: hash(`${seed}:${r.product.sku}`) }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.r);
  return distinctByFamily(pool, limit).map((r) => toCard(r.product));
}

// ---------------------------------------------------------------------------
// Listing: search, filters, facets, sort, pagination
// ---------------------------------------------------------------------------

export const SORTS = [
  { value: "relevance", label: "Relevance" },
  { value: "popularity", label: "Popularity" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" },
];

const MAX_VALUES = 24;
const asArray = (value) =>
  (Array.isArray(value) ? value : value == null ? [] : [value])
    .map((v) => String(v).slice(0, 120))
    .filter(Boolean)
    .slice(0, MAX_VALUES);

const asNumber = (value) => {
  if (value == null || value === "") return null;
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

const first = (value) => (Array.isArray(value) ? value[0] : value) ?? "";

export function parseListingParams(sp = {}) {
  const sort = String(first(sp.sort));
  const page = Math.max(1, Math.floor(asNumber(sp.page) ?? 1));
  return {
    q: String(first(sp.q)).trim().slice(0, 120),
    category: String(first(sp.category)),
    subs: asArray(sp.sub),
    brands: asArray(sp.brand),
    crops: asArray(sp.crop),
    min: asNumber(sp.min),
    max: asNumber(sp.max),
    units: asArray(sp.unit),
    inStock: first(sp.stock) === "1",
    sort: SORTS.some((s) => s.value === sort) ? sort : "relevance",
    page,
  };
}

function scoreRecord(record, tokens, phrase) {
  let score = 0;
  for (const token of tokens) {
    if (record.nameTokens.includes(token)) score += 4;
    else if (record.nameTokens.some((t) => t.startsWith(token))) score += 3;
    else if (record.brandText.includes(token)) score += 3;
    else if (record.metaText.includes(token)) score += 2;
    else if (record.descText.includes(token)) score += 1;
    else return 0; // every token must match somewhere
  }
  if (phrase && record.nameText.includes(phrase)) score += 5;
  if (phrase && record.nameText.startsWith(phrase)) score += 3;
  if (phrase && record.brandText === phrase) score += 4;
  return score;
}

// Returns [{ record, score }] for a free-text query.
export function searchRecords(query, pool = records) {
  const tokens = tokenize(query);
  if (tokens.length === 0) return pool.map((record) => ({ record, score: 0 }));
  const phrase = tokens.join(" ");
  const out = [];
  for (const record of pool) {
    const score = scoreRecord(record, tokens, phrase);
    if (score > 0) out.push({ record, score });
  }
  return out;
}

function passes(record, f, skip) {
  const p = record.product;
  if (skip !== "category" && f.category && record.categorySlug !== f.category) return false;
  if (skip !== "sub" && f.subs.length && !f.subs.includes(record.subcategorySlug)) return false;
  if (skip !== "brand" && f.brands.length && !f.brands.includes(p.brand)) return false;
  if (skip !== "crop" && f.crops.length && !f.crops.includes(p.crop)) return false;
  if (skip !== "price") {
    if (f.min != null && p.price < f.min) return false;
    if (f.max != null && p.price > f.max) return false;
  }
  if (skip !== "unit" && f.units.length && !f.units.includes(p.unit)) return false;
  if (skip !== "stock" && f.inStock && !(p.stock > 0)) return false;
  return true;
}

function countBy(list, f, skip, key) {
  const counts = new Map();
  for (const { record } of list) {
    if (!passes(record, f, skip)) continue;
    const k = key(record);
    if (k == null || k === "") continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

/**
 * Run a listing query.
 * @param {{ scope: "category" | "subcategory" | "search", categorySlug?: string, subcategorySlug?: string,
 *           params: ReturnType<typeof parseListingParams> }} input
 */
export function queryListing({ scope, categorySlug, subcategorySlug, params }) {
  const filters = { ...params };
  if (scope === "category" || scope === "subcategory") filters.category = categorySlug;
  if (scope === "subcategory") filters.subs = [subcategorySlug];
  if (filters.category && !categoryBySlug[filters.category]) filters.category = "";

  const base = scope === "search" ? searchRecords(params.q) : searchRecords("", getCategoryProducts(categorySlug));

  // Facets: each facet is counted with every *other* filter applied.
  const categoryCounts = countBy(base, filters, "category", (r) => r.categorySlug);
  const subCounts = countBy(base, filters, "sub", (r) => r.subcategorySlug);
  const subNames = new Map();
  for (const { record } of base) subNames.set(record.subcategorySlug, record.product.subcategory);
  const brandCounts = countBy(base, filters, "brand", (r) => r.product.brand);
  const cropCounts = countBy(base, filters, "crop", (r) => r.product.crop);
  const unitCounts = countBy(base, filters, "unit", (r) => r.product.unit);
  const pricePool = base.filter(({ record }) => passes(record, filters, "price"));
  const prices = (pricePool.length ? pricePool : base).map(({ record }) => record.product.price);

  const facets = {
    categories: CATEGORIES.map((c) => ({ slug: c.slug, name: c.name, count: categoryCounts.get(c.slug) ?? 0 })),
    subcategories: sortDesc(subCounts).map(([slug, count]) => ({ slug, name: subNames.get(slug) ?? slug, count })),
    brands: sortDesc(brandCounts).map(([value, count]) => ({ value, count })),
    crops: sortDesc(cropCounts).map(([value, count]) => ({ value, count })),
    units: sortDesc(unitCounts)
      .sort((a, b) => b[1] - a[1] || packSizeValue(a[0]) - packSizeValue(b[0]))
      .map(([value, count]) => ({ value, count })),
    priceMin: prices.length ? Math.min(...prices) : 0,
    priceMax: prices.length ? Math.max(...prices) : 0,
  };

  const matched = base.filter(({ record }) => passes(record, filters));

  const sorters = {
    relevance: (a, b) => b.score - a.score || byPopularity(a.record, b.record),
    popularity: (a, b) => byPopularity(a.record, b.record),
    price_asc: (a, b) => a.record.product.price - b.record.product.price || a.record.order - b.record.order,
    price_desc: (a, b) => b.record.product.price - a.record.product.price || a.record.order - b.record.order,
    newest: (a, b) => String(b.record.product.createdAt).localeCompare(String(a.record.product.createdAt)) || b.record.order - a.record.order,
  };
  // Category pages without a query: "relevance" (labelled "Featured") = popularity.
  const sorter = params.sort === "relevance" && scope !== "search" ? sorters.popularity : sorters[params.sort];
  matched.sort(sorter);

  const total = matched.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(params.page, pageCount);
  const items = matched
    .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    .map(({ record }) => toCard(record.product));

  return { items, total, page, pageCount, pageSize: PAGE_SIZE, facets, filters };
}

// Up to 8 lightweight suggestions for the header search box.
export function suggest(query, categorySlug) {
  const q = String(query ?? "").trim();
  if (q.length < 2) return [];
  const pool = categorySlug && categoryBySlug[categorySlug] ? getCategoryProducts(categorySlug) : records;
  return distinctByFamily(
    searchRecords(q, pool)
      .sort((a, b) => b.score - a.score || byPopularity(a.record, b.record))
      .map(({ record }) => record),
    8
  ).map(({ product }) => {
    const card = toCard(product);
    return { name: card.name, slug: card.slug, price: card.price, image: card.image, category: card.category, brand: card.brand };
  });
}
