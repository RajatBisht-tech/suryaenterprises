// ---------------------------------------------------------------------------
// Surya Enterprises — online-sale restrictions (single source of truth).
//
// Indian payment gateways (PayU's banned / cautious category list) treat
// pesticides, agricultural chemicals, knives and animal-husbandry goods as
// regulated or cautious goods, and urea / ammonium nitrate are controlled
// under their own statutes. Products matched by a rule below stay VISIBLE in
// listings, search and product pages (as store-and-quotation items) but are:
//   - marked "Not for online sale" (amber badge / notice panel),
//   - treated as out of stock everywhere (stock 0, no add-to-cart, purged
//     from any saved cart by the cart guard),
//   - removed from the landing page rails and from online-sellable counts.
//
// The catalogue data (products.json) is never edited: the rules are applied
// at runtime by app/products/data/sale-restrictions.mjs (restrictionFor /
// applySaleRestriction) in catalog.server.js and in the client index build.
//
// Rule shape:
//   {
//     code:    "kebab-case id" (stable; goes into the product's `restriction`),
//     enabled: true | false        -> false switches the rule off without deleting it,
//     label:   customer-facing badge text,
//     short:   compact tag used in menus and search suggestions,
//     reason:  one or two sentences shown on the product page,
//     match:   [criterion, ...]    -> the rule applies when ANY criterion matches.
//   }
// A criterion matches when ALL of its keys hold:
//   category:      exact level-1 data category ("Crop Protection", …),
//   subcategories: list of exact level-2 subcategory names,
//   name:          RegExp tested against the product name.
// Rules are evaluated top to bottom and the first match wins, so put the more
// specific rule (e.g. growth-regulators) above the broader one (pesticides).
//
// HOW TO ADD A RULE: append an object with a new `code`, e.g.
//   { code: "seed-treatment", enabled: true, label: LABEL, short: SHORT,
//     reason: "…", match: [{ category: "Crop Nutrition", subcategories: ["Seed Treatment"] }] }
// HOW TO DISABLE A RULE: set `enabled: false` on it (keep the object so the
// history is visible). Then run `node scripts/report-sale-restrictions.mjs`
// to see the resulting counts, and `npm test`.
//
// Plain data, ESM, no Next imports: this file is read by server components,
// client components (through the generated index), Node scripts and tests.
// ---------------------------------------------------------------------------

export const SALE_RESTRICTION_LABEL = "Not for online sale";
export const SALE_RESTRICTION_SHORT = "Store only";

// Where restricted goods can actually be bought (used in copy next to the label).
export const SALE_RESTRICTION_CHANNELS = "Available at our Jaipur store and through the institutional desk.";

// Pesticide formulation codes as printed on CIB&RC labels: "25% SC", "70 % WP",
// "0.3% SL" … (EC emulsifiable concentrate, SC suspension concentrate, SL
// soluble liquid, WP wettable powder, WG/WDG water-dispersible granules, SP
// soluble powder, CG/GR granules, DF dry flowable, ZC/CS capsule suspensions,
// OD oil dispersion, ME micro-emulsion, EW emulsion in water, DP dust, FS seed
// treatment, SG soluble granules, UL ultra-low volume, SE suspo-emulsion).
export const PESTICIDE_FORMULATION_CODE =
  /\b\d+(?:\.\d+)?\s?%\s?(?:EC|SC|SL|WP|WG|WDG|SP|CG|GR|DF|ZC|CS|OD|ME|EW|DP|FS|SG|UL|SE)\b/i;

const LABEL = SALE_RESTRICTION_LABEL;
const SHORT = SALE_RESTRICTION_SHORT;

export const SALE_RESTRICTIONS = [
  {
    // Listed before `pesticides` so a PGR carrying a formulation code
    // ("Ethephon 39% SL") gets the growth-regulator wording.
    code: "growth-regulators",
    enabled: true,
    label: LABEL,
    short: SHORT,
    reason:
      "Plant growth regulators are regulated goods under the Insecticides Act, 1968 (registered through the CIB&RC). We do not sell them through the website. They are available at our Jaipur store and through the institutional desk against a valid requirement.",
    match: [{ subcategories: ["Growth Regulators"] }],
  },
  {
    code: "pesticides",
    enabled: true,
    label: LABEL,
    short: SHORT,
    reason:
      "Pesticides and agrochemicals are regulated goods under the Insecticides Act, 1968. We do not sell them through the website. They are available at our Jaipur store and through the institutional desk against a valid requirement.",
    match: [
      {
        category: "Crop Protection",
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
          "Product Kits",
        ],
      },
      // Any category: a pesticide formulation code in the name.
      { name: PESTICIDE_FORMULATION_CODE },
      // Miscellaneous crop-protection items that are still "-icides".
      { category: "Crop Protection", subcategories: ["Other Crop Protection"], name: /icide/i },
      // Rodenticides / fumigants (zinc or aluminium phosphide).
      { name: /phosphide|fumigant/i },
    ],
  },
  {
    code: "urea",
    enabled: true,
    label: LABEL,
    short: SHORT,
    reason:
      "Urea and subsidised fertilisers are sold only through licensed outlets under the Fertiliser (Control) Order, 1985. Available at our Jaipur store.",
    match: [{ name: /\burea\b/i }],
  },
  {
    code: "ammonium-nitrate",
    enabled: true,
    label: LABEL,
    short: SHORT,
    reason: "Ammonium nitrate products are regulated under the Ammonium Nitrate Rules, 2012 and are not sold online.",
    match: [{ name: /ammonium nitrate|\bUAN\b/i }],
  },
  {
    // PayU cautious list, item 35: livestock, poultry and related goods.
    code: "animal-husbandry",
    enabled: true,
    label: LABEL,
    short: SHORT,
    reason:
      "Livestock, poultry and related animal-husbandry products are a cautious category for online payment acceptance (PayU cautious list, item 35). Available at our Jaipur store and through the institutional desk.",
    match: [{ category: "Animal Husbandry" }],
  },
  {
    // PayU banned list, item 23. Sickles, khurpa, axes, saws, chainsaws,
    // secateurs, shears and pruners stay sellable.
    code: "knives",
    enabled: true,
    label: LABEL,
    short: SHORT,
    reason: "Knives are listed under PayU's banned categories (item 23). Available at our Jaipur store.",
    match: [{ category: "Farm Machinery", subcategories: ["Cutter/Blade/Knife"] }],
  },
  {
    // PayU cautious list, item 13: agricultural chemicals. Fertilisers,
    // bio-fertilisers, biostimulants and organic fertilisers remain sellable.
    code: "agri-chemicals",
    enabled: true,
    label: LABEL,
    short: SHORT,
    reason:
      "Agricultural chemicals are a cautious category for online payment acceptance (PayU cautious list, item 13). Available at our Jaipur store and through the institutional desk.",
    match: [
      { category: "Crop Protection", subcategories: ["Adjuvants", "Surface Disinfectants"] },
      { category: "Crop Nutrition", subcategories: ["Drip Cleaner", "Ph Balancer", "Seed Treatment"] },
    ],
  },
];
