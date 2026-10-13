// Pure helpers that apply app/config/sale-restrictions.js to catalogue
// records. No Next, no fs: shared by catalog.server.js (listings, PDP,
// search, rails), scripts/build-product-index.mjs (client index for cart /
// wishlist / checkout), scripts/build-company-profile.mjs, the report script
// and the tests.
import { SALE_RESTRICTIONS } from "../../config/sale-restrictions.js";

const activeRules = () => SALE_RESTRICTIONS.filter((rule) => rule.enabled !== false);

function criterionMatches(criterion, product) {
  if (criterion.category && product.category !== criterion.category) return false;
  if (criterion.subcategories && !criterion.subcategories.includes(product.subcategory)) return false;
  if (criterion.name && !criterion.name.test(String(product.name ?? ""))) return false;
  return true;
}

/**
 * The first enabled rule that matches a product, or null when it may be sold
 * online. `product` needs `category`, `subcategory` and `name`.
 * @returns {null | { code: string, label: string, reason: string, short: string }}
 */
export function restrictionFor(product) {
  if (!product) return null;
  for (const rule of activeRules()) {
    if (rule.match.some((criterion) => criterionMatches(criterion, product))) {
      return { code: rule.code, label: rule.label, reason: rule.reason, short: rule.short };
    }
  }
  return null;
}

/**
 * Copy of the product with the restriction applied: a restricted product has
 * `onlineSale: false`, `stock: 0` and `restriction: { code, label, short }`;
 * everything else gets `onlineSale: true`.
 */
export function applySaleRestriction(product) {
  const rule = restrictionFor(product);
  if (!rule) return { ...product, onlineSale: true };
  return {
    ...product,
    onlineSale: false,
    stock: 0,
    restriction: { code: rule.code, label: rule.label, short: rule.short },
  };
}

export const isOnlineSellable = (product) => Boolean(product) && product.onlineSale !== false && restrictionFor(product) == null;

/**
 * Catalogue-wide figures used by the hero, the About page, the business
 * profile PDF and the report script, so every "products online" number comes
 * from the same computation. `products` = products.json records (one per pack
 * size); a "product" below means a family (all pack sizes of one product).
 */
export function saleFacts(products) {
  const families = new Map(); // family -> true when at least one pack is sellable
  const onlineBrands = new Set();
  const perRule = new Map();
  let onlineSkus = 0;
  let restrictedSkus = 0;

  for (const p of products) {
    const family = p.family ?? p.sku;
    const rule = restrictionFor(p);
    if (!rule) {
      onlineSkus += 1;
      onlineBrands.add(p.brand);
      families.set(family, true);
      continue;
    }
    restrictedSkus += 1;
    if (!families.has(family)) families.set(family, false);
    const entry = perRule.get(rule.code) ?? { code: rule.code, label: rule.label, skus: 0, families: new Set(), subcategories: new Map() };
    entry.skus += 1;
    entry.families.add(family);
    const key = `${p.category} > ${p.subcategory}`;
    const sub = entry.subcategories.get(key) ?? { name: key, skus: 0, families: new Set() };
    sub.skus += 1;
    sub.families.add(family);
    entry.subcategories.set(key, sub);
    perRule.set(rule.code, entry);
  }

  const onlineProducts = [...families.values()].filter(Boolean).length;
  const rules = activeRules().map((rule) => {
    const entry = perRule.get(rule.code);
    return {
      code: rule.code,
      label: rule.label,
      skus: entry?.skus ?? 0,
      products: entry?.families.size ?? 0,
      subcategories: entry
        ? [...entry.subcategories.values()]
            .map((s) => ({ name: s.name, skus: s.skus, products: s.families.size }))
            .sort((a, b) => b.skus - a.skus || a.name.localeCompare(b.name))
        : [],
    };
  });

  return {
    skus: products.length,
    products: families.size,
    online: { skus: onlineSkus, products: onlineProducts, brands: onlineBrands.size },
    restricted: { skus: restrictedSkus, products: families.size - onlineProducts },
    rules,
  };
}
