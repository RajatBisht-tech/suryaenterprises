// Builds app/products/data/products.json from the brand/product master in
// bighaat_products/ (products.csv + variants.csv — git-ignored, never committed).
//
//   node scripts/import-brand-catalog.mjs            # writes products.json + report
//   LICENSED_MEDIA=true node scripts/import-brand-catalog.mjs
//
// ONE RECORD PER VARIANT (one listing per pack size), deterministic and
// idempotent: the same source files always produce a byte-identical file.
//
// LICENSING RULE (non-negotiable): only factual fields are read from the
// source — name, brand, vendor, product_type, category levels/path,
// product_overview key-values (crop name / crop type, and the "Category"
// value as a subcategory fallback where level-2 is empty), variant title
// (pack size), price, mrp, weight/unit, barcode, state_restrictions.
// Descriptions are OUR OWN templated text (app/products/data/describe.mjs),
// images are category placeholders (app/config/placeholders.js), ratings are
// null and SKUs are ours. description_*, technical_content, tags, seo_*,
// rating_*, review_count, image_*, name_hi, source SKUs/ids and source URLs
// are never read unless LICENSED_MEDIA=true (owner-supplied written licence),
// which adds `images`, `description` and `sourceAttribution` from the source.
// With the flag off the output is scanned and the script FAILS if any
// source-site string or URL slipped through.
//
// CATALOGUE EXCLUSIONS (owner decision, 2026-10-14): the business sells seeds,
// non-chemical crop care (traps, lures, sticky traps, animal repellents) and
// farm machinery only. Every source product is checked against
// app/config/catalog-exclusions.js BEFORE it is imported; matching products
// (pesticides, fertilisers, animal-husbandry goods, knives …) are dropped and
// counted in the report, and validation fails if an excluded record ever
// reaches the output.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { CATEGORIES, categoryBySlug, slugify } from "../app/config/taxonomy.js";
import { PLACEHOLDER_FILES, PLACEHOLDER_DIR, placeholderFor } from "../app/config/placeholders.js";
import { describeProduct } from "../app/products/data/describe.mjs";
import { exclusionFor, isExcluded } from "../app/products/data/catalog-exclusions.mjs";

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
export const STOCK_DEFAULT = 100; // Surya stock levels are not known yet
export const OWN_BRAND = "Surya Enterprises";
const FEATURED_TARGET = 60;
const MAX_BYTES = 12 * 1024 * 1024;
// Fixed so re-runs are byte-identical; override with IMPORT_DATE=YYYY-MM-DD.
const IMPORT_DATE = process.env.IMPORT_DATE || "2026-10-07";
const LICENSED_MEDIA = process.env.LICENSED_MEDIA === "true";
const SOURCE_SITE = { label: "Product data courtesy BigHaat", host: "bighaat" };

// The source master's level-1 labels -> our category slugs (app/config/taxonomy.js).
// Source categories not listed here (crop nutrition, animal husbandry) are
// excluded wholesale by app/config/catalog-exclusions.js.
const SOURCE_CATEGORIES = { Seeds: "seeds", "Crop Protection": "traps-and-repellents", "Farm Machinery": "farm-machinery" };
const categoryBySource = Object.fromEntries(Object.entries(SOURCE_CATEGORIES).map(([label, slug]) => [label, categoryBySlug[slug]]));
// Source level-2 labels renamed on the site (the source's catch-all for the
// traps category carries the old category name).
const SUBCATEGORY_RENAMES = { "Other Crop Protection": "Other Traps & Repellents" };

const ROOT = fileURLToPath(new URL("../", import.meta.url));
export const SOURCE_DIR = process.env.BRAND_SOURCE_DIR || path.join(ROOT, "bighaat_products");
const OUT_FILE = path.join(ROOT, "app/products/data/products.json");
const FACTS_FILE = path.join(ROOT, "app/products/data/catalog-facts.js");
const PUBLIC_DIR = path.join(ROOT, "public");

// ---------------------------------------------------------------------------
// CSV (RFC 4180: quoted fields may contain commas, quotes and newlines)
// ---------------------------------------------------------------------------
export function parseCSV(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // BOM
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") field += c;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  const header = rows.shift().map((h) => h.trim());
  return rows.filter((r) => r.length > 1).map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()])));
}

// ---------------------------------------------------------------------------
// Normalisers
// ---------------------------------------------------------------------------
const collapse = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

// "Product Name: X; Brand: Y; Crop Type: Vegetable; Crop Name: Tomato Seeds"
function overviewValue(overview, key) {
  const m = new RegExp(`(?:^|;)\\s*${key}\\s*:\\s*([^;]+)`, "i").exec(overview ?? "");
  return m ? collapse(m[1]) : "";
}

const CLAIM_WORDS = /\b(high[- ]yield|hybrid|early[- ]matur|resistan|toleran|uniform|growth|quality|best|premium|benefit|control|boost|protect|improve|healthy|strong|eco[- ]friendly)\b/i;

// Listing titles carry taglines after an en dash / pipe / (sometimes) hyphen
// and a Hindi rendering in brackets. Keep the product name only.
export function cleanName(raw) {
  let n = collapse(raw);
  n = n.replace(/\s*\(\s*[^()]*[ऀ-ॿ][^()]*\)/g, "");
  n = n.replace(/[ऀ-ॿ]+/g, "");
  n = n.split(" | ")[0];
  n = n.split(" – ")[0];
  const hyphen = n.indexOf(" - ");
  if (hyphen > 0) {
    const tail = n.slice(hyphen + 3);
    if (tail.includes(",") || CLAIM_WORDS.test(tail)) n = n.slice(0, hyphen);
  }
  n = collapse(n).replace(/[\s\-–|,]+$/g, "");
  // Some listings end with the source's level-1 label as a tag
  // ("… Sticky Trap A4 Crop Protection"); it is a category, not a name.
  n = n.replace(/\s+crop protection$/i, "");
  return n || collapse(raw);
}

// Pack-size strings: canonical unit tokens so "10 gm", "10 gms" and "10 g"
// are one pack size (same quantity, one facet entry).
export function normalizeUnit(title) {
  let t = collapse(title);
  if (!t || /^default title$/i.test(t) || /^(1\s*units?|one unit)$/i.test(t)) return "1 unit";
  return t
    .replace(/(\d)\s*(gms?|grams?)\b/gi, "$1 g")
    .replace(/(\d)\s*(ltrs?|lts?|litres?|liters?)\b/gi, "$1 L")
    .replace(/(\d)\s*(kgs?)\b/gi, "$1 kg")
    .replace(/(\d)\s*(ml)\b/gi, "$1 ml")
    .replace(/(\d)\s*(mtrs?|meters?|metres?)\b/gi, "$1 m")
    .replace(/(\d)\s*(seeds?)\b/gi, "$1 seeds")
    .replace(/(\d)\s*(units?)\b/gi, "$1 unit")
    .replace(/\s+/g, " ");
}

// "100 ml" -> 100, "5 L" -> 5000, "1000 seeds" -> 1000 (for ordering packs).
const UNIT_FACTORS = { ml: 1, l: 1000, g: 1, kg: 1000, seeds: 1, unit: 1, m: 1 };
export function packSizeValue(unit) {
  const m = /([\d.]+)\s*([a-z]+)/i.exec(String(unit ?? ""));
  if (!m) return Number.MAX_SAFE_INTEGER;
  return Number(m[1]) * (UNIT_FACTORS[m[2].toLowerCase()] ?? 1);
}

// "Andaman and Nicobar | AndamanandNicobar | Manipur" -> ["Andaman and Nicobar", "Manipur"]
function parseStates(value) {
  const seen = new Map();
  for (const raw of String(value ?? "").split("|")) {
    const s = collapse(raw);
    if (!s) continue;
    const key = s.toLowerCase().replace(/[^a-z]/g, "");
    const prev = seen.get(key);
    if (!prev || (!prev.includes(" ") && s.includes(" "))) seen.set(key, s);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

const money = (v) => {
  const n = Number(String(v ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
};

// FNV-1a 32-bit -> 6 decimal digits.
function hash6(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return String((h >>> 0) % 1000000).padStart(6, "0");
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------
export function loadSource(dir = SOURCE_DIR) {
  const read = (name) => parseCSV(readFileSync(path.join(dir, name), "utf8"));
  return { products: read("products.csv"), variants: read("variants.csv") };
}

/**
 * Derives catalogue records from the source rows.
 * @returns {{ records: object[], skipped: {reason: string, name: string}[], excluded: object[], sources: Map<string, object>, products: object[] }}
 *   `sources` maps our sku -> the source row pair (for the dev-only reference overlay);
 *   `excluded` lists every source product dropped by app/config/catalog-exclusions.js
 *   ({ code, category, subcategory, name }).
 */
export function buildCatalog({ products, variants }, { licensedMedia = LICENSED_MEDIA } = {}) {
  const skipped = [];
  const excluded = [];
  const skip = (reason, row) => skipped.push({ reason, name: row.name || row.handle || row.product_id });

  // Canonical spelling for level-2 names ("Growth regulators" -> "Growth Regulators").
  const l2Counts = new Map();
  for (const p of products) {
    const l2 = collapse(p.category_level2);
    if (!l2) continue;
    const key = l2.toLowerCase();
    const entry = l2Counts.get(key) ?? new Map();
    entry.set(l2, (entry.get(l2) ?? 0) + 1);
    l2Counts.set(key, entry);
  }
  const canonicalL2 = (value) => {
    const key = collapse(value).toLowerCase();
    const entry = l2Counts.get(key);
    if (!entry) return collapse(value);
    return [...entry.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
  };

  // ---- products ------------------------------------------------------------
  const byId = new Map();
  for (const p of [...products].sort((a, b) => a.handle.localeCompare(b.handle))) {
    const l1 = collapse(p.category_level1);
    const type = collapse(p.product_type);
    const pathValue = collapse(p.category_path);
    if (type === "Combo" || l1 === "Combo" || /\bcombo\b/i.test(pathValue)) {
      skip("combo", p);
      continue;
    }
    if (type === "Dummy") {
      skip("dummy product", p);
      continue;
    }
    if (!collapse(p.name)) {
      skip("no name", p);
      continue;
    }
    if (!collapse(p.brand)) {
      skip("no brand", p);
      continue;
    }
    if (!l1) {
      skip("no category", p);
      continue;
    }
    const crop = overviewValue(p.product_overview, "Crop Name");
    const cropType = overviewValue(p.product_overview, "Crop Type");
    const overviewCategory = overviewValue(p.product_overview, "Category");

    let subcategory = canonicalL2(p.category_level2);
    if (!subcategory || subcategory === l1) {
      if (overviewCategory && overviewCategory !== l1) subcategory = canonicalL2(overviewCategory);
      else if (l1 === "Seeds" && crop) subcategory = canonicalL2(crop);
      else subcategory = `Other ${l1}`;
    }
    const baseName = cleanName(p.name);

    // Catalogue exclusions (app/config/catalog-exclusions.js), checked on the
    // source's own labels BEFORE the taxonomy lookup so whole source categories
    // (crop nutrition, animal husbandry) are reported as exclusions, not as
    // unknown categories. An excluded product in a LIVE category still flows
    // through SKU assignment below (flagged `excluded`, never written) so that
    // the SKUs of the products we keep do not shift when a hash collision
    // partner disappears — SKUs are stable across exclusion changes.
    const exclusion = exclusionFor({ name: baseName, category: l1, subcategory });
    if (exclusion) excluded.push({ code: exclusion.code, category: l1, subcategory, name: baseName });
    const category = categoryBySource[l1];
    if (!category) {
      if (!exclusion) skip(`unknown category "${l1}"`, p);
      continue;
    }
    subcategory = SUBCATEGORY_RENAMES[subcategory] ?? subcategory;
    // Excluded products are not reported under the ordinary skip reasons.
    const drop = (reason) => {
      if (!exclusion) skip(reason, p);
    };
    if (!p.handle) {
      drop("no handle");
      continue;
    }
    if (new RegExp(SOURCE_SITE.host, "i").test(`${p.brand} ${p.vendor}`)) {
      drop("source-site own/test brand");
      continue;
    }
    // Owner rule: products the source lists without any image are not imported
    // (only the emptiness of the field is tested; nothing from it is used).
    if (!collapse(p.image_files)) {
      drop("no image in source");
      continue;
    }
    // Our slugs derive from the handle; never carry the source site's name.
    const handle = slugify(p.handle.replace(new RegExp(SOURCE_SITE.host, "gi"), " "));
    if (!handle) {
      drop("empty handle");
      continue;
    }
    // Product type: the overview's own value when it adds information, else the
    // source product type, else the site's category name (never the source label).
    const productType =
      overviewCategory && overviewCategory !== l1 && overviewCategory !== subcategory ? overviewCategory : type && type !== l1 ? type : category.dataCategory;

    byId.set(p.product_id, {
      row: p,
      handle,
      baseName,
      brand: collapse(p.brand),
      vendor: collapse(p.vendor) || collapse(p.brand),
      category: category.dataCategory,
      categorySlug: category.slug,
      skuCode: category.skuCode,
      subcategory,
      productType,
      crop: crop || null,
      cropType: cropType || null,
      excluded: exclusion?.code ?? null,
      variants: [],
    });
  }

  // ---- variants ------------------------------------------------------------
  let orphan = 0;
  for (const v of variants) {
    const product = byId.get(v.product_id);
    if (!product) {
      orphan += 1;
      continue;
    }
    const price = money(v.price) || money(v.mrp);
    if (!price) {
      skip("no price and no mrp", { ...v, name: `${product.baseName} (${v.title})` });
      continue;
    }
    const mrp = money(v.mrp);
    const unit = normalizeUnit(v.title);
    product.variants.push({
      row: v,
      rawTitle: collapse(v.title),
      unit,
      price,
      mrp: mrp > price ? mrp : null,
      weight: money(v.weight) || null,
      weightUnit: collapse(v.weight_unit) || null,
      barcode: collapse(v.barcode) || null,
      stateRestrictions: parseStates(v.state_restrictions),
    });
  }
  if (orphan) skipped.push({ reason: "variant without product (or product skipped)", name: `${orphan} variants` });

  // `productList` still carries the excluded products of live categories (for
  // SKU reservation); `kept` is what actually goes into the catalogue.
  const productList = [...byId.values()].filter((p) => {
    if (p.variants.length) return true;
    if (!p.excluded) skip("no sellable variant", p.row);
    return false;
  });
  for (const p of productList) {
    p.variants.sort((a, b) => packSizeValue(a.unit) - packSizeValue(b.unit) || a.rawTitle.localeCompare(b.rawTitle));
  }
  const kept = productList.filter((p) => !p.excluded);

  // ---- featured: ~60, one per brand, drawn from the most common subcategories
  const subCount = new Map();
  const brandCount = new Map();
  for (const p of kept) {
    subCount.set(p.subcategory, (subCount.get(p.subcategory) ?? 0) + 1);
    brandCount.set(p.brand, (brandCount.get(p.brand) ?? 0) + 1);
  }
  const topSubs = [...subCount.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 30)
    .map(([name]) => name);
  const bySub = new Map(topSubs.map((s) => [s, []]));
  for (const p of kept) if (bySub.has(p.subcategory)) bySub.get(p.subcategory).push(p);
  for (const list of bySub.values()) {
    list.sort((a, b) => brandCount.get(b.brand) - brandCount.get(a.brand) || a.baseName.localeCompare(b.baseName) || a.handle.localeCompare(b.handle));
  }
  const featured = new Set();
  const usedBrands = new Set();
  for (let round = 0; round < 10 && featured.size < FEATURED_TARGET; round += 1) {
    for (const sub of topSubs) {
      const pick = bySub.get(sub).find((p) => !featured.has(p) && !usedBrands.has(p.brand));
      if (!pick) continue;
      featured.add(pick);
      usedBrands.add(pick.brand);
      if (featured.size >= FEATURED_TARGET) break;
    }
  }

  // ---- records -------------------------------------------------------------
  const records = [];
  const sources = new Map();
  const skus = new Set();
  const slugs = new Set();
  for (const p of productList) {
    p.variants.forEach((v, i) => {
      const key = `${p.handle}|${v.rawTitle}`;
      let sku = `SE-${p.skuCode}-${hash6(key)}`;
      for (let n = 1; skus.has(sku); n += 1) sku = `SE-${p.skuCode}-${hash6(`${key}#${n}`)}`;
      skus.add(sku);

      let slug = `${p.handle}-${slugify(v.unit)}`;
      if (slugs.has(slug)) slug = `${p.handle}-${slugify(v.rawTitle)}`;
      if (slugs.has(slug)) throw new Error(`duplicate slug ${slug}`);
      slugs.add(slug);
      // Excluded product: its SKU and slug are now reserved; write nothing.
      if (p.excluded) return;

      const facts = {
        baseName: p.baseName,
        brand: p.brand,
        category: p.category,
        subcategory: p.subcategory,
        unit: v.unit,
        crop: p.crop,
        cropType: p.cropType,
        productType: p.productType,
        weight: v.weight,
        weightUnit: v.weightUnit,
        barcode: v.barcode,
      };
      const record = {
        name: `${p.baseName} - ${v.unit}`,
        slug,
        sku,
        family: p.handle,
        category: p.category,
        subcategory: p.subcategory,
        productType: p.productType,
        brand: p.brand,
        vendor: p.vendor,
        crop: p.crop,
        cropType: p.cropType,
        // `specs` for the PDP table is derived at render time by specsFor()
        // (same module) so the JSON does not repeat brand/category/pack size.
        description: describeProduct(facts),
        price: v.price,
        mrp: v.mrp,
        unit: v.unit,
        // weight / weightUnit / barcode are written only when the source has them.
        ...(v.weight != null ? { weight: v.weight, weightUnit: v.weightUnit } : {}),
        stock: STOCK_DEFAULT,
        image: placeholderFor(p.categorySlug, slugify(p.subcategory)),
        images: [],
        ...(v.barcode ? { barcode: v.barcode } : {}),
        stateRestrictions: v.stateRestrictions,
        rating: null,
        reviewsCount: null,
        isFeatured: featured.has(p) && i === 0,
        isOwnBrand: p.brand === OWN_BRAND,
        createdAt: IMPORT_DATE,
      };
      if (licensedMedia) {
        // Only with a written licence from the source site (owner decision).
        const files = String(p.row.image_files ?? "")
          .split("|")
          .map((f) => collapse(f).replace(/^images\//, ""))
          .filter(Boolean);
        record.images = files.map((f) => `/assets/catalog/${f}`);
        if (record.images.length) record.image = record.images[0];
        if (collapse(p.row.description_text)) record.description = collapse(p.row.description_text);
        record.sourceAttribution = { label: SOURCE_SITE.label, url: collapse(p.row.url) };
      }
      records.push(record);
      sources.set(sku, { product: p.row, variant: v.row, handle: p.handle });
    });
  }
  return { records, skipped, excluded, sources, products: kept };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
export function validateCatalog(records, { licensedMedia = LICENSED_MEDIA } = {}) {
  const errors = [];
  const skus = new Set();
  const slugs = new Set();
  const categories = new Set(CATEGORIES.map((c) => c.dataCategory));
  for (const r of records) {
    if (skus.has(r.sku)) errors.push(`duplicate sku ${r.sku}`);
    if (slugs.has(r.slug)) errors.push(`duplicate slug ${r.slug}`);
    skus.add(r.sku);
    slugs.add(r.slug);
    if (!/^SE-[A-Z]{3}-\d{6}$/.test(r.sku)) errors.push(`bad sku ${r.sku}`);
    if (!/^[a-z0-9-]+$/.test(r.slug)) errors.push(`bad slug ${r.slug}`);
    if (!categories.has(r.category)) errors.push(`unknown category ${r.category} (${r.sku})`);
    if (!r.name || !r.brand || !r.subcategory || !r.unit) errors.push(`missing core field on ${r.sku}`);
    if (!(r.price > 0)) errors.push(`bad price on ${r.sku}`);
    if (r.mrp != null && !(r.mrp > r.price)) errors.push(`mrp not above price on ${r.sku}`);
    if (!r.image.startsWith(PLACEHOLDER_DIR) && !licensedMedia) errors.push(`non-placeholder image on ${r.sku}`);
    if (!r.family || !/^[a-z0-9-]+$/.test(r.family)) errors.push(`bad family on ${r.sku}`);
    if (!licensedMedia && (r.images.length || r.sourceAttribution)) errors.push(`licensed media present on ${r.sku}`);
    if (r.rating != null || r.reviewsCount != null) errors.push(`rating present on ${r.sku}`);
    if (/<[a-z][^>]*>/i.test(r.description)) errors.push(`html in description on ${r.sku}`);
    // Nothing on the exclusion list may reach the catalogue (app/config/catalog-exclusions.js).
    if (isExcluded(r)) errors.push(`excluded product in output: ${r.sku} ${r.name}`);
  }
  if (!licensedMedia) {
    const text = JSON.stringify(records);
    if (new RegExp(SOURCE_SITE.host, "i").test(text)) errors.push(`source-site name found in output`);
    if (/https?:\/\//i.test(text)) errors.push("URL found in output");
    if (/\/dev-reference-image\//.test(text)) errors.push("dev reference image path found in output");
  }
  for (const file of PLACEHOLDER_FILES) {
    if (!existsSync(path.join(PUBLIC_DIR, PLACEHOLDER_DIR, file))) errors.push(`placeholder missing: public${PLACEHOLDER_DIR}${file}`);
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Catalogue facts (tiny JSON used by the About page / company profile PDF)
// ---------------------------------------------------------------------------
export function catalogFacts(records, products) {
  const brandCounts = new Map();
  for (const p of products) brandCounts.set(p.brand, (brandCounts.get(p.brand) ?? 0) + 1);
  const prices = records.map((r) => r.price);
  return {
    importDate: IMPORT_DATE,
    products: products.length,
    skus: records.length,
    brands: brandCounts.size,
    subcategories: new Set(records.map((r) => `${r.category}>${r.subcategory}`)).size,
    priceMin: Math.min(...prices),
    priceMax: Math.max(...prices),
    categories: CATEGORIES.map((c) => ({
      slug: c.slug,
      name: c.name,
      products: products.filter((p) => p.category === c.dataCategory).length,
      skus: records.filter((r) => r.category === c.dataCategory).length,
      brands: new Set(records.filter((r) => r.category === c.dataCategory).map((r) => r.brand)).size,
    })),
    topBrands: [...brandCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 12)
      .map(([name, count]) => ({ name, products: count })),
  };
}

// ---------------------------------------------------------------------------
// Report + write (CLI)
// ---------------------------------------------------------------------------
function countBy(list, key) {
  const m = new Map();
  for (const item of list) m.set(key(item), (m.get(key(item)) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
}

function main() {
  const t0 = Date.now();
  const source = loadSource();
  const { records, skipped, excluded, products } = buildCatalog(source);
  const errors = validateCatalog(records);

  const json = `[\n${records.map((r) => JSON.stringify(r)).join(",\n")}\n]\n`;
  const bytes = Buffer.byteLength(json);
  if (bytes > MAX_BYTES) errors.push(`products.json is ${(bytes / 1048576).toFixed(1)} MB (limit ${MAX_BYTES / 1048576} MB)`);

  const log = (s = "") => console.log(s);
  log(`[import] source: ${source.products.length} products, ${source.variants.length} variants (${SOURCE_DIR})`);
  log(`[import] output: ${records.length} records from ${products.length} products, ${new Set(records.map((r) => r.brand)).size} brands, ${new Set(records.map((r) => r.subcategory)).size} subcategories`);
  log(`[import] licensed media: ${LICENSED_MEDIA ? "ON" : "off"} · import date ${IMPORT_DATE} · stock ${STOCK_DEFAULT} · featured ${records.filter((r) => r.isFeatured).length} · own brand ${records.filter((r) => r.isOwnBrand).length}`);
  log();
  log("Per level-1 category (products / listings), every subcategory:");
  for (const c of CATEGORIES) {
    const ps = products.filter((p) => p.category === c.dataCategory);
    const rs = records.filter((r) => r.category === c.dataCategory);
    log(`  ${c.name.padEnd(20)} ${String(ps.length).padStart(5)} / ${String(rs.length).padStart(6)}`);
    for (const [sub, n] of countBy(rs, (r) => r.subcategory)) log(`      ${sub.padEnd(36)} ${String(n).padStart(5)}`);
  }
  log();
  log(`Excluded by app/config/catalog-exclusions.js: ${excluded.length} source products`);
  for (const [code, n] of countBy(excluded, (e) => e.code)) {
    log(`  ${String(n).padStart(5)}  ${code}`);
    for (const [key, m] of countBy(excluded.filter((e) => e.code === code), (e) => `${e.category} > ${e.subcategory}`)) log(`           ${String(m).padStart(5)}  ${key}`);
  }
  log();
  log("Top brands (variants):");
  for (const [brand, n] of countBy(records, (r) => r.brand).slice(0, 15)) log(`  ${brand.padEnd(48)} ${String(n).padStart(5)}`);
  log();
  log("Skipped:");
  for (const [reason, n] of countBy(skipped, (s) => s.reason)) log(`  ${String(n).padStart(5)}  ${reason}`);
  log();
  log(`Validation: ${errors.length ? `${errors.length} error(s)` : "ok"} · ${(bytes / 1048576).toFixed(2)} MB · ${Date.now() - t0} ms`);
  for (const e of errors.slice(0, 20)) log(`  ✗ ${e}`);
  if (errors.length) process.exit(1);

  let previous = "";
  try {
    previous = readFileSync(OUT_FILE, "utf8");
  } catch {
    // first run
  }
  if (previous === json) log(`[import] ${OUT_FILE} unchanged`);
  else {
    writeFileSync(OUT_FILE, json);
    log(`[import] wrote ${OUT_FILE}`);
  }
  const facts = `// Generated by scripts/import-brand-catalog.mjs from the catalogue — do not edit.\n// Read by app/config/company-profile.js (About page + business-profile PDF).\nexport const CATALOG_FACTS = ${JSON.stringify(catalogFacts(records, products), null, 2)};\n`;
  let previousFacts = "";
  try {
    previousFacts = readFileSync(FACTS_FILE, "utf8");
  } catch {
    // first run
  }
  if (previousFacts !== facts) {
    writeFileSync(FACTS_FILE, facts);
    log(`[import] wrote ${FACTS_FILE}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
