import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { CATALOG_EXCLUSIONS, PESTICIDE_FORMULATION_CODE } from "../app/config/catalog-exclusions.js";
import { exclusionFor, isExcluded } from "../app/products/data/catalog-exclusions.mjs";
import { CATEGORIES } from "../app/config/taxonomy.js";

const record = (overrides) => ({
  sku: "SE-TEST-1",
  family: "test-family",
  name: "Test product - 1 L",
  category: "Traps & Repellents",
  subcategory: "Traps & Lures",
  brand: "Test Brand",
  price: 100,
  stock: 100,
  ...overrides,
});

test("every rule has a stable code, a maintainer reason and match criteria", () => {
  assert.equal(CATALOG_EXCLUSIONS.length, 5);
  const codes = new Set();
  for (const rule of CATALOG_EXCLUSIONS) {
    assert.match(rule.code, /^[a-z][a-z-]+$/, `${rule.code} must be kebab-case`);
    assert.ok(rule.reason.length > 20, `${rule.code} needs a reason`);
    assert.ok(Array.isArray(rule.match) && rule.match.length > 0, `${rule.code} needs match criteria`);
    assert.ok(!codes.has(rule.code), `duplicate rule code ${rule.code}`);
    codes.add(rule.code);
  }
});

test("(a) the whole crop-nutrition category is excluded", () => {
  for (const subcategory of ["Fertilizers", "Bio Fertilizers", "Organic Fertilizers", "Biostimulants", "Growth Regulators", "Product Kits", "Ph Balancer", "Drip Cleaner", "Seed Treatment"]) {
    assert.equal(exclusionFor(record({ category: "Crop Nutrition", subcategory, name: "Farm input - 1 kg" }))?.code, "crop-nutrition", subcategory);
  }
});

test("(b) the whole animal-husbandry category is excluded", () => {
  for (const subcategory of ["Cattle Feed Products", "Milking Machine & Accessories", "Pregnancy Detection Kit", "Fish Care Products", "Poultry Accessories"]) {
    assert.equal(exclusionFor(record({ category: "Animal Husbandry", subcategory, name: "Farm item - 1 unit" }))?.code, "animal-husbandry", subcategory);
  }
});

test("(c) chemical and biological pest control inside the traps category is excluded", () => {
  const subs = ["Insecticides", "Fungicides", "Herbicides", "Bactericides", "Nematicides", "Bio Insecticides", "Bio Fungicides", "Bio Bactericides", "Bio Nematicides", "Bio Viricides", "Adjuvants", "Surface Disinfectants", "Product Kits", "Bio Fertilizers"];
  for (const subcategory of subs) {
    // Both the source master's label and the site's label for the category.
    assert.equal(exclusionFor(record({ category: "Crop Protection", subcategory, name: "Plain name - 100 ml" }))?.code, "pesticides", subcategory);
    assert.equal(exclusionFor(record({ category: "Traps & Repellents", subcategory, name: "Plain name - 100 ml" }))?.code, "pesticides", subcategory);
  }
  // "Product Kits" is only excluded inside the traps category: seed kits stay.
  assert.equal(exclusionFor(record({ category: "Seeds", subcategory: "Product Kits", name: "Kitchen garden seed kit - 1 pack" })), null);
  // "Other Crop Protection": only non-chemical items (traps, lures, sticky sheets, nets, covers, guards, repellents) stay.
  assert.equal(exclusionFor(record({ subcategory: "Other Crop Protection", name: "Garden spray concentrate - 100 ml" }))?.code, "pesticides");
  for (const name of ["Eco Yellow Sticky Trap A4 - 1 pack", "Fruit fly lure - 10 unit", "Bird net 10 m - 1 unit", "Tree guard - 1 unit", "Monkey repellent nuts - 1 kg", "Fruit cover bag - 100 pack"]) {
    assert.equal(exclusionFor(record({ subcategory: "Other Crop Protection", name })), null, name);
  }
});

test("(d) a formulation code, a controlled chemical or an -icide in the name is excluded in any category", () => {
  for (const name of ["Barrier (Metribuzin 70 % WP) - 100 g", "Ethephon 39% SL - 500 ml", "Something 1.9%EC - 250 ml", "Granules 0.3% GR - 1 kg"]) {
    assert.match(name, PESTICIDE_FORMULATION_CODE);
    assert.equal(exclusionFor(record({ category: "Seeds", subcategory: "Tomato Seeds", name }))?.code, "chemical-by-name", name);
  }
  assert.equal(exclusionFor(record({ name: "Commando Rat Poison (Zinc Phosphide 80% Powder) - 10 g" }))?.code, "chemical-by-name");
  assert.equal(exclusionFor(record({ name: "Grain store fumigant tablets - 1 pack" }))?.code, "chemical-by-name");
  assert.equal(exclusionFor(record({ category: "Farm Machinery", subcategory: "Sprayers", name: "IFFCO Nano Urea Plus - 500 ml" }))?.code, "chemical-by-name");
  assert.equal(exclusionFor(record({ name: "Calcium Ammonium Nitrate granules - 1 kg" }))?.code, "chemical-by-name");
  assert.equal(exclusionFor(record({ name: "Liquid UAN 32 - 1 L" }))?.code, "chemical-by-name");
  assert.equal(exclusionFor(record({ category: "Farm Machinery", subcategory: "Sprayers", name: "Mist blower for herbicides and weed control - 1 unit" }))?.code, "chemical-by-name");
  // Whole-word "urea": brand names containing the letters are not caught.
  assert.equal(exclusionFor(record({ category: "Seeds", subcategory: "Tomato Seeds", name: "Aureate Tomato Seeds - 10 g" })), null);
  // "25 seeds" or "100 ml" are not formulation codes.
  assert.equal(exclusionFor(record({ category: "Seeds", subcategory: "Tomato Seeds", name: "Abhilash Tomato Seeds - 25 seeds" })), null);
});

test("(e) knives: only the Cutter/Blade/Knife subcategory of farm machinery", () => {
  assert.equal(exclusionFor(record({ category: "Farm Machinery", subcategory: "Cutter/Blade/Knife", name: "Sugarcane harvesting knife - 1 unit" }))?.code, "knives");
  for (const subcategory of ["Akadi/Khurpa/Sickle", "Axe", "Saw", "Chainsaw", "Secateur", "Shear", "Pruner/Lopper", "Brush Cutter"]) {
    assert.equal(exclusionFor(record({ category: "Farm Machinery", subcategory, name: "Garden tool - 1 unit" })), null, subcategory);
  }
});

test("kept products: a seed, a trap, a repellent and a sprayer are not excluded", () => {
  for (const p of [
    record({ category: "Seeds", subcategory: "Tomato Seeds", name: "Abhilash Tomato Seeds - 10 g" }),
    record({ category: "Traps & Repellents", subcategory: "Traps & Lures", name: "Barrix Catch Fruit Fly Lure - 1 pack" }),
    record({ category: "Traps & Repellents", subcategory: "Animal Repellents", name: "Organic Monkey Repellent Nuts - 1 kg" }),
    record({ category: "Farm Machinery", subcategory: "Sprayers", name: "Knapsack sprayer 16 L - 1 unit" }),
    record({ category: "Farm Machinery", subcategory: "Tarpaulin", name: "HDPE Tarpaulin 250 GSM - 1 unit" }),
  ]) {
    assert.equal(exclusionFor(p), null, p.name);
    assert.equal(isExcluded(p), false, p.name);
  }
  assert.equal(exclusionFor(null), null);
  assert.equal(isExcluded(undefined), false);
});

test("products.json contains no excluded record and only the three live categories", async () => {
  const products = JSON.parse(await readFile(new URL("../app/products/data/products.json", import.meta.url), "utf8"));
  assert.ok(products.length > 5000, `expected the pruned catalogue, got ${products.length} records`);
  const excluded = products.filter(isExcluded);
  assert.deepEqual(excluded.map((p) => `${p.sku} ${p.name}`).slice(0, 5), [], `${excluded.length} excluded record(s) in products.json`);
  const live = new Set(CATEGORIES.map((c) => c.dataCategory));
  const foreign = products.filter((p) => !live.has(p.category));
  assert.equal(foreign.length, 0, `records outside the live categories: ${[...new Set(foreign.map((p) => p.category))].join(", ")}`);
  for (const dropped of ["Crop Nutrition", "Animal Husbandry", "Crop Protection"]) {
    assert.equal(products.some((p) => p.category === dropped), false, `${dropped} still in products.json`);
  }
});
