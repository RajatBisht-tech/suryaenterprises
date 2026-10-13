// Prints which catalogue records the online-sale restriction rules
// (app/config/sale-restrictions.js) currently match: records and products
// per rule and per subcategory, plus the online-sellable totals.
//
//   node scripts/report-sale-restrictions.mjs
//
// products.json is never modified; this is a read-only report.
import { readFile } from "node:fs/promises";
import { saleFacts } from "../app/products/data/sale-restrictions.mjs";

const source = new URL("../app/products/data/products.json", import.meta.url);
const products = JSON.parse(await readFile(source, "utf8"));
const facts = saleFacts(products);
const fmt = (n) => n.toLocaleString("en-IN");
const pad = (s, n) => String(s).padEnd(n);
const rpad = (s, n) => String(s).padStart(n);

console.log(`Sale restrictions — ${fmt(facts.skus)} records / ${fmt(facts.products)} products in products.json\n`);
console.log(`${pad("Rule", 20)}${pad("Category > subcategory", 48)}${rpad("Records", 9)}${rpad("Products", 10)}`);
console.log("-".repeat(87));
for (const rule of facts.rules) {
  console.log(`${pad(rule.code, 20)}${pad("(all)", 48)}${rpad(fmt(rule.skus), 9)}${rpad(fmt(rule.products), 10)}`);
  for (const sub of rule.subcategories) {
    console.log(`${pad("", 20)}${pad(sub.name, 48)}${rpad(fmt(sub.skus), 9)}${rpad(fmt(sub.products), 10)}`);
  }
}
console.log("-".repeat(87));
console.log(`${pad("Not for online sale", 68)}${rpad(fmt(facts.restricted.skus), 9)}${rpad(fmt(facts.restricted.products), 10)}`);
console.log(`${pad("Online-sellable", 68)}${rpad(fmt(facts.online.skus), 9)}${rpad(fmt(facts.online.products), 10)}`);
console.log(`\nOnline-sellable brands: ${fmt(facts.online.brands)}`);
