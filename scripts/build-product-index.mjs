// Builds the slim client-side product index used by the cart and checkout.
//
//   node scripts/build-product-index.mjs                  # clean index (prebuild / predev)
//   node scripts/build-product-index.mjs --with-reference # LOCAL dev only (npm run dev:reference)
//
// The full catalogue (app/products/data/products.json) stays on the server
// (see app/products/data/catalog.server.js). Client code that needs a
// synchronous getProduct(sku) — the cart, wishlist and the frozen checkout
// page — reads this slim index instead, so their bundles stay small.
//
// products.index.json is GENERATED and git-ignored. `prebuild` / `predev`
// always regenerate the clean variant; `--with-reference` merges the
// development reference overlay's image (and description) into the local
// index so cart / wishlist / checkout show the same pictures as the PDP on
// localhost. It refuses to run with NODE_ENV=production.
//
// Also a CI-style guard: the committed catalogue may contain ONLY our own
// factual text and local imagery, and NOTHING on the exclusion list
// (app/config/catalog-exclusions.js). The build fails if products.json (or the
// production index) carries any source-site string, any development
// reference-image path, an image outside /assets, or an excluded record.
import { existsSync, readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { withCatalogMedia, validateCatalogMedia } from "../app/products/data/catalog-media.mjs";
import { exclusionFor } from "../app/products/data/catalog-exclusions.mjs";
import path from "node:path";

const dataDir = new URL("../app/products/data/", import.meta.url);
const source = new URL("products.json", dataDir);
const target = new URL("products.index.json", dataDir);
const overlayFile = new URL("reference-overlay.json", dataDir);
const mediaFile = new URL("catalog-media.json", dataDir);
const publicDir = fileURLToPath(new URL("../public/", import.meta.url));

const withReference = process.argv.includes("--with-reference");
const FIELDS = ["sku", "name", "slug", "price", "image", "unit", "category", "stock", "brand"];
const FORBIDDEN = [
  { label: "source-site string", test: (text) => /bighaat/i.test(text) },
  { label: "development reference-image path", test: (text) => text.includes("/dev-reference-image/") },
  { label: "external URL", test: (text) => /https?:\/\//i.test(text) },
];

const fail = (problems) => {
  console.error(`[product-index] REFUSING TO BUILD — ${problems.length} problem(s):`);
  for (const p of problems.slice(0, 20)) console.error(`  ✗ ${p}`);
  process.exit(1);
};

if (withReference && process.env.NODE_ENV === "production") fail(["--with-reference is a development-only option"]);

const raw = await readFile(source, "utf8");
const products = JSON.parse(raw);
if (!Array.isArray(products)) throw new Error("products.json must contain an array");

// ---- guard the committed catalogue ------------------------------------------
const problems = [];
for (const rule of FORBIDDEN) if (rule.test(raw)) problems.push(`products.json contains a ${rule.label}`);
const skus = new Set();
for (const p of products) {
  if (skus.has(p.sku)) problems.push(`duplicate sku ${p.sku}`);
  skus.add(p.sku);
  if (typeof p.image !== "string" || !p.image.startsWith("/assets/")) problems.push(`${p.sku}: image outside /assets (${p.image})`);
  for (const img of p.images ?? []) if (typeof img !== "string" || !img.startsWith("/assets/")) problems.push(`${p.sku}: images[] entry outside /assets (${img})`);
  if (p.sourceAttribution) problems.push(`${p.sku}: sourceAttribution present without licence flag`);
  // Nothing the business does not sell may be in the catalogue.
  const exclusion = exclusionFor(p);
  if (exclusion) problems.push(`${p.sku}: excluded product in products.json (${exclusion.code}: ${p.name}) — re-run npm run import:catalog`);
  if (problems.length > 20) break;
}
if (problems.length) fail(problems);

// Published static photos also belong in the cart/wishlist/checkout index.
// Fail the production build if a photo is missing instead of shipping SVGs.
const media = JSON.parse(await readFile(mediaFile, "utf8"));
const mediaProblems = validateCatalogMedia(products, media, (image) => existsSync(path.join(publicDir, image)));
if (mediaProblems.length) fail(mediaProblems);

// ---- optional local reference merge -----------------------------------------
let reference = null;
if (withReference) {
  if (!existsSync(overlayFile)) console.warn("[product-index] --with-reference: no reference-overlay.json found, building the clean index instead");
  else {
    const overlay = JSON.parse(readFileSync(overlayFile, "utf8"));
    reference = (sku) => overlay.products?.[overlay.skus?.[sku]] ?? null;
  }
}

let merged = 0;
const index = products.map((entry) => {
  const product = withCatalogMedia(entry, media);
  const slim = {};
  for (const field of FIELDS) slim[field] = product[field];
  // productsForView("Featured") relies on this flag; only emitted when true.
  if (product.isFeatured) slim.isFeatured = true;
  const ref = reference?.(product.sku);
  if (ref) {
    if (ref.images?.[0]) slim.image = ref.images[0];
    if (ref.description) slim.description = ref.description;
    merged += 1;
  }
  return slim;
});

const json = JSON.stringify(index);
if (!reference) {
  const indexProblems = FORBIDDEN.filter((rule) => rule.test(json)).map((rule) => `products.index.json would contain a ${rule.label}`);
  if (indexProblems.length) fail(indexProblems);
}

let previous = "";
try {
  previous = await readFile(target, "utf8");
} catch {
  // first run
}
if (previous !== json) await writeFile(target, json);

console.log(
  `[product-index] ${index.length} products -> ${fileURLToPath(target)} (${(json.length / 1024).toFixed(0)} KB)${
    reference ? ` — LOCAL index with reference images for ${merged} products (git-ignored, never deploy)` : ""
  }`
);
