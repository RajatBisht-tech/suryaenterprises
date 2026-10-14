// Pure helpers that apply app/config/catalog-exclusions.js to catalogue
// records. No Next, no fs: shared by scripts/import-brand-catalog.mjs (drops
// matching source products before products.json is written),
// scripts/build-product-index.mjs (fails the build if products.json still
// contains a matching record) and test/catalog-exclusions.test.mjs.
import { CATALOG_EXCLUSIONS } from "../../config/catalog-exclusions.js";

const asList = (value) => (Array.isArray(value) ? value : [value]);

function criterionMatches(criterion, product) {
  if (criterion.category && !asList(criterion.category).includes(product.category)) return false;
  if (criterion.subcategories && !criterion.subcategories.includes(product.subcategory)) return false;
  const name = String(product.name ?? "");
  if (criterion.name && !criterion.name.test(name)) return false;
  if (criterion.nameNot && criterion.nameNot.test(name)) return false;
  return true;
}

/**
 * The first exclusion rule that matches a product, or null when the product
 * belongs in the catalogue. `product` needs `category`, `subcategory` and
 * `name` (the full record name or the product's base name both work).
 * @returns {null | { code: string, reason: string }}
 */
export function exclusionFor(product) {
  if (!product) return null;
  for (const rule of CATALOG_EXCLUSIONS) {
    if (rule.match.some((criterion) => criterionMatches(criterion, product))) {
      return { code: rule.code, reason: rule.reason };
    }
  }
  return null;
}

export const isExcluded = (product) => exclusionFor(product) != null;
