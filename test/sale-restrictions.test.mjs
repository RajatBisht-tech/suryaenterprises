import test from "node:test";
import assert from "node:assert/strict";
import { SALE_RESTRICTIONS, SALE_RESTRICTION_LABEL } from "../app/config/sale-restrictions.js";
import { applySaleRestriction, isOnlineSellable, restrictionFor, saleFacts } from "../app/products/data/sale-restrictions.mjs";

const record = (overrides) => ({
  sku: "SE-TEST-1",
  family: "test-family",
  name: "Test product - 1 L",
  category: "Crop Nutrition",
  subcategory: "Fertilizers",
  brand: "Test Brand",
  price: 100,
  stock: 100,
  ...overrides,
});

test("every rule is enabled and carries the customer label and a reason", () => {
  assert.ok(SALE_RESTRICTIONS.length >= 7);
  const codes = new Set();
  for (const rule of SALE_RESTRICTIONS) {
    assert.equal(rule.enabled, true, `${rule.code} should be enabled`);
    assert.equal(rule.label, SALE_RESTRICTION_LABEL);
    assert.ok(rule.reason.length > 40, `${rule.code} needs a reason`);
    assert.ok(Array.isArray(rule.match) && rule.match.length > 0, `${rule.code} needs match criteria`);
    assert.ok(!codes.has(rule.code), `duplicate rule code ${rule.code}`);
    codes.add(rule.code);
  }
});

test("pesticides: crop-protection subcategories, formulation codes, -icides and fumigants", () => {
  for (const subcategory of ["Insecticides", "Fungicides", "Herbicides", "Bactericides", "Nematicides", "Bio Insecticides", "Bio Fungicides", "Bio Bactericides", "Bio Nematicides", "Bio Viricides", "Product Kits"]) {
    assert.equal(restrictionFor(record({ category: "Crop Protection", subcategory }))?.code, "pesticides", subcategory);
  }
  // Product Kits only count as pesticides inside crop protection.
  assert.equal(restrictionFor(record({ category: "Seeds", subcategory: "Product Kits", name: "Kitchen garden kit - 1 pack" })), null);
  // A formulation code anywhere in the catalogue.
  assert.equal(restrictionFor(record({ category: "Crop Nutrition", subcategory: "Fertilizers", name: "Zinoxil Zinc Oxide 39.5% SC - 250 ml" }))?.code, "pesticides");
  assert.equal(restrictionFor(record({ name: "Barrier (Metribuzin 70 % WP) - 100 g" }))?.code, "pesticides");
  // "Other Crop Protection" only when the name says -icide; traps stay sellable.
  assert.equal(restrictionFor(record({ category: "Crop Protection", subcategory: "Other Crop Protection", name: "Garden Bactericide spray - 100 ml" }))?.code, "pesticides");
  assert.equal(restrictionFor(record({ category: "Crop Protection", subcategory: "Other Crop Protection", name: "HEDO Eco Yellow Sticky Trap A4 - 1 pack" })), null);
  // Rodenticides / fumigants.
  assert.equal(restrictionFor(record({ category: "Crop Protection", subcategory: "Traps & Lures", name: "Commando Rat Poison (Zinc Phosphide 80% Powder) - 10 g" }))?.code, "pesticides");
  assert.equal(restrictionFor(record({ name: "Grain store fumigant tablets - 1 pack" }))?.code, "pesticides");
});

test("growth regulators are restricted with their own wording, even with a formulation code", () => {
  const plain = restrictionFor(record({ subcategory: "Growth Regulators", name: "Gibberellic acid tablets - 10 tabs" }));
  assert.equal(plain?.code, "growth-regulators");
  assert.match(plain.reason, /Plant growth regulators/);
  const coded = restrictionFor(record({ subcategory: "Growth Regulators", name: "Bayer Ethrel (Ethephon 39% SL) - 500 ml" }));
  assert.equal(coded?.code, "growth-regulators");
});

test("urea and ammonium nitrate are restricted in any category", () => {
  assert.equal(restrictionFor(record({ name: "IFFCO Nano Urea Plus Fertilizers - 500 ml" }))?.code, "urea");
  assert.equal(restrictionFor(record({ name: "Multiplex Liquid-N (Urea Ammonium Nitrate 32% N) - 1 L" }))?.code, "urea");
  assert.equal(restrictionFor(record({ name: "Calcium Ammonium Nitrate granules - 1 kg" }))?.code, "ammonium-nitrate");
  assert.equal(restrictionFor(record({ name: "Liquid UAN 32 - 1 L" }))?.code, "ammonium-nitrate");
  // "urea" must be a whole word: "ureaform"-style brand names are not caught.
  assert.equal(restrictionFor(record({ name: "Aureate Bio Potash - 1 kg" })), null);
});

test("animal husbandry is restricted as a whole category", () => {
  for (const subcategory of ["Cattle Feed Products", "Milking Machine & Accessories", "Pregnancy Detection Kit", "Fish Care Products", "Poultry Accessories"]) {
    assert.equal(restrictionFor(record({ category: "Animal Husbandry", subcategory, name: "Farm item - 1 unit" }))?.code, "animal-husbandry", subcategory);
  }
  // Repellents for animals are crop protection and stay sellable.
  assert.equal(restrictionFor(record({ category: "Crop Protection", subcategory: "Animal Repellents", name: "Organic Monkey Repellent Nuts - 1 kg" })), null);
});

test("knives: only the Cutter/Blade/Knife subcategory of farm machinery", () => {
  assert.equal(restrictionFor(record({ category: "Farm Machinery", subcategory: "Cutter/Blade/Knife", name: "Sugarcane harvesting knife - 1 unit" }))?.code, "knives");
  for (const subcategory of ["Akadi/Khurpa/Sickle", "Axe", "Saw", "Chainsaw", "Secateur", "Shear", "Pruner/Lopper", "Brush Cutter"]) {
    assert.equal(restrictionFor(record({ category: "Farm Machinery", subcategory, name: "Garden tool - 1 unit" })), null, subcategory);
  }
});

test("agri-chemicals: adjuvants, disinfectants, drip cleaner, pH balancer, seed treatment; fertilisers stay sellable", () => {
  assert.equal(restrictionFor(record({ category: "Crop Protection", subcategory: "Adjuvants", name: "Fast Stick adjuvant - 100 ml" }))?.code, "agri-chemicals");
  assert.equal(restrictionFor(record({ category: "Crop Protection", subcategory: "Surface Disinfectants", name: "Crop disinfectant - 1 L" }))?.code, "agri-chemicals");
  for (const subcategory of ["Drip Cleaner", "Ph Balancer", "Seed Treatment"]) {
    assert.equal(restrictionFor(record({ category: "Crop Nutrition", subcategory, name: "Farm input - 1 L" }))?.code, "agri-chemicals", subcategory);
  }
  for (const subcategory of ["Fertilizers", "Bio Fertilizers", "Biostimulants", "Organic Fertilizers"]) {
    assert.equal(restrictionFor(record({ category: "Crop Nutrition", subcategory, name: "Humic acid granules - 1 kg" })), null, subcategory);
  }
});

test("non-matching products are untouched and sellable", () => {
  for (const p of [
    record({ category: "Seeds", subcategory: "Tomato Seeds", name: "Abhilash Tomato Seeds - 10 g" }),
    record({ category: "Crop Protection", subcategory: "Traps & Lures", name: "Barrix Catch Fruit Fly Lure - 1 pack" }),
    record({ category: "Farm Machinery", subcategory: "Sprayers", name: "Knapsack sprayer 16 L - 1 unit" }),
    record({ category: "Crop Nutrition", subcategory: "Bio Fertilizers", name: "Rhizobium culture - 1 kg" }),
  ]) {
    assert.equal(restrictionFor(p), null, p.name);
    const applied = applySaleRestriction(p);
    assert.equal(applied.onlineSale, true);
    assert.equal(applied.stock, 100);
    assert.equal(applied.restriction, undefined);
    assert.notEqual(applied, p, "returns a copy");
    assert.equal(isOnlineSellable(applied), true);
  }
  assert.equal(restrictionFor(null), null);
});

test("applySaleRestriction marks a restricted product out of stock and keeps the source record intact", () => {
  const source = record({ category: "Crop Protection", subcategory: "Insecticides", name: "Confidor Insecticide - 100 ml" });
  const applied = applySaleRestriction(source);
  assert.equal(applied.onlineSale, false);
  assert.equal(applied.stock, 0);
  assert.deepEqual(applied.restriction, { code: "pesticides", label: SALE_RESTRICTION_LABEL, short: "Store only" });
  assert.equal(applied.price, 100, "price stays");
  assert.equal(source.stock, 100, "source not mutated");
  assert.equal(isOnlineSellable(applied), false);
});

test("saleFacts counts records and families per rule and online totals", () => {
  const facts = saleFacts([
    record({ sku: "a1", family: "a", category: "Crop Protection", subcategory: "Insecticides", name: "Insecticide - 100 ml" }),
    record({ sku: "a2", family: "a", category: "Crop Protection", subcategory: "Insecticides", name: "Insecticide - 250 ml" }),
    record({ sku: "b1", family: "b", category: "Animal Husbandry", subcategory: "Cattle Feed Products", name: "Feed - 25 kg", brand: "Feed Co" }),
    record({ sku: "c1", family: "c", category: "Seeds", subcategory: "Tomato Seeds", name: "Tomato - 10 g", brand: "Seed Co" }),
    record({ sku: "c2", family: "c", category: "Seeds", subcategory: "Tomato Seeds", name: "Tomato - 50 g", brand: "Seed Co" }),
  ]);
  assert.equal(facts.skus, 5);
  assert.equal(facts.products, 3);
  assert.deepEqual(facts.online, { skus: 2, products: 1, brands: 1 });
  assert.deepEqual(facts.restricted, { skus: 3, products: 2 });
  const pesticides = facts.rules.find((r) => r.code === "pesticides");
  assert.equal(pesticides.skus, 2);
  assert.equal(pesticides.products, 1);
  assert.deepEqual(pesticides.subcategories, [{ name: "Crop Protection > Insecticides", skus: 2, products: 1 }]);
  assert.equal(facts.rules.find((r) => r.code === "animal-husbandry").skus, 1);
  assert.equal(facts.rules.find((r) => r.code === "knives").skus, 0);
});
