// ---------------------------------------------------------------------------
// Surya Enterprises — catalogue exclusions (single source of truth).
//
// Owner decision (2026-10-14): the business does NOT sell pesticides,
// fertilisers or anything on PayU's banned / cautious category list. Products
// matched by a rule below are REMOVED from the catalogue at import time
// (scripts/import-brand-catalog.mjs drops them before products.json is
// written), so they never appear in listings, search, rails, photos or counts.
// scripts/build-product-index.mjs fails the build if products.json still
// contains a matching record, and test/catalog-exclusions.test.mjs covers
// every rule.
//
// Rule shape:
//   {
//     code:   "kebab-case id" (stable; printed in the import report),
//     reason: one line for maintainers (never shown to customers),
//     match:  [criterion, ...]   -> the rule applies when ANY criterion matches.
//   }
// A criterion matches when ALL of its keys hold:
//   category:      level-1 category — a string or a list of strings. The source
//                  master labels the traps category "Crop Protection"; the site
//                  calls it "Traps & Repellents", so rules list both.
//   subcategories: list of exact level-2 subcategory names,
//   name:          RegExp tested against the product name,
//   nameNot:       RegExp that must NOT match the product name (an exception).
// Rules are evaluated top to bottom; the first match wins.
//
// HOW TO EXCLUDE MORE: append a rule (or a criterion to an existing rule), run
// `npm run import:catalog` (regenerates products.json + catalog-facts.js),
// `npm run build:catalog-media` only if photos changed, then `npm test`.
// HOW TO ALLOW SOMETHING BACK: delete the criterion that matches it and re-run
// the import. Never edit products.json by hand.
//
// Plain data, ESM, no Next imports: read by the import script, the index
// build, catalog-exclusions.mjs and the tests.
// ---------------------------------------------------------------------------

// The source master's level-1 label for the traps category and the site's
// label for the same products (see app/config/taxonomy.js).
const TRAPS_CATEGORY = ["Crop Protection", "Traps & Repellents"];

// Pesticide formulation codes as printed on labels: "25% SC", "70 % WP",
// "0.3% SL" … (EC emulsifiable concentrate, SC suspension concentrate, SL
// soluble liquid, WP wettable powder, WG/WDG water-dispersible granules, SP
// soluble powder, CG/GR granules, DF dry flowable, ZC/CS capsule suspensions,
// OD oil dispersion, ME micro-emulsion, EW emulsion in water, DP dust, FS seed
// treatment, SG soluble granules, UL ultra-low volume, SE suspo-emulsion).
export const PESTICIDE_FORMULATION_CODE =
  /\b\d+(?:\.\d+)?\s?%\s?(?:EC|SC|SL|WP|WG|WDG|SP|CG|GR|DF|ZC|CS|OD|ME|EW|DP|FS|SG|UL|SE)\b/i;

// Controlled chemicals by name: rodenticides / fumigants (zinc or aluminium
// phosphide), urea and ammonium-nitrate products.
export const CONTROLLED_CHEMICAL_NAME = /phosphide|fumigant|\burea\b|ammonium nitrate|\bUAN\b/i;

// Anything that calls itself an "-icide" (insecticide, fungicide, herbicide,
// bactericide, nematicide, rodenticide, viricide …), in any category.
export const ICIDE_NAME = /icide/i;

// Non-chemical crop-care items that stay on sale when they sit in the source's
// catch-all "Other Crop Protection" subcategory.
export const NON_CHEMICAL_CROP_CARE = /trap|lure|sticky|net|cover|guard|repellent/i;

export const CATALOG_EXCLUSIONS = [
  {
    // (a) The whole crop-nutrition category: fertilisers, bio-fertilisers,
    // organic fertilisers, biostimulants, growth regulators, kits, pH
    // balancers, drip cleaners and seed treatment.
    code: "crop-nutrition",
    reason: "Fertilisers and agricultural chemicals are a PayU cautious category; the business does not sell them.",
    match: [{ category: "Crop Nutrition" }],
  },
  {
    // (b) The whole animal-husbandry category (PayU cautious list, item 35).
    code: "animal-husbandry",
    reason: "Livestock, poultry and related animal-husbandry products are a PayU cautious category; the business does not sell them.",
    match: [{ category: "Animal Husbandry" }],
  },
  {
    // (c) Chemical and biological pest control, adjuvants, disinfectants and
    // kits inside the traps category (the source's "Crop Protection").
    code: "pesticides",
    reason: "Pesticides and agricultural chemicals are a PayU cautious category; the business does not sell them.",
    match: [
      {
        category: TRAPS_CATEGORY,
        subcategories: [
          "Insecticides",
          "Fungicides",
          "Herbicides",
          "Bactericides",
          "Nematicides",
          "Bio Insecticides",
          "Bio Fungicides",
          "Bio Bactericides",
          "Bio Nematicides",
          "Bio Viricides",
          "Adjuvants",
          "Surface Disinfectants",
          "Product Kits",
          "Bio Fertilizers",
        ],
      },
      // The catch-all subcategory: keep only traps, lures, sticky sheets,
      // nets, covers, guards and repellents.
      { category: TRAPS_CATEGORY, subcategories: ["Other Crop Protection"], nameNot: NON_CHEMICAL_CROP_CARE },
    ],
  },
  {
    // (d) Any category: a pesticide formulation code, a controlled chemical or
    // an "-icide" in the product name.
    code: "chemical-by-name",
    reason: "The product name identifies a pesticide formulation or a controlled chemical.",
    match: [{ name: PESTICIDE_FORMULATION_CODE }, { name: CONTROLLED_CHEMICAL_NAME }, { name: ICIDE_NAME }],
  },
  {
    // (e) Knives (PayU banned list, item 23). Sickles, khurpa, axes, saws,
    // chainsaws, secateurs, shears and pruners stay on sale.
    code: "knives",
    reason: "Knives are a PayU banned category.",
    match: [{ category: "Farm Machinery", subcategories: ["Cutter/Blade/Knife"] }],
  },
];
