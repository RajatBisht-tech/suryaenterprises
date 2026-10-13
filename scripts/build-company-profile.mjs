// Builds the 3-page A4 "Business Profile" PDF used for bank / payment-partner
// onboarding ("describe the nature of your business, example products, sales
// channels and end customers").
//
//   public/downloads/surya-enterprises-company-profile.pdf
//
// Every word comes from app/config/company-profile.js and app/config/site.js
// (legal name, GSTINs, offices, helpline, grievance officer, certifications,
// social profiles), so the owner edits once and the About page and PDF stay in
// step. Catalogue figures and example product names are cross-checked against
// app/products/data/products.json.
//
// Typography matches the website: Inter (body) and Manrope (headings) are
// embedded from scripts/fonts (OFL-licensed, see LICENSE-*.txt there). If the
// font files are missing the script falls back to Helvetica and writes "INR"
// instead of the rupee sign (WinAnsi Helvetica has no ₹ glyph).
//
// Runs automatically before `npm run dev` and `npm run build` (see package.json).
import PDFDocument from "pdfkit";
import { createWriteStream, existsSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { COMPANY_PROFILE as P, formatProfileDate, priceRange, socialStatement } from "../app/config/company-profile.js";
import { SITE } from "../app/config/site.js";
import { saleFacts } from "../app/products/data/sale-restrictions.mjs";

const root = new URL("../", import.meta.url);
const LOGO = fileURLToPath(new URL("public/assets/brand/surya-logo-wide.png", root));
const OUT_DIR = new URL("public/downloads/", root);
const OUT = fileURLToPath(new URL(`public${P.pdf.href}`, root));
const PRODUCTS = new URL("app/products/data/products.json", root);

// ---------------------------------------------------------------------------
// Fonts (site typography) with Helvetica fallback.
// ---------------------------------------------------------------------------
const FONT_DIR = new URL("fonts/", import.meta.url);
const FONT_FILES = {
  Inter: "Inter-Regular.ttf",
  "Inter-Medium": "Inter-Medium.ttf",
  "Inter-SemiBold": "Inter-SemiBold.ttf",
  "Manrope-Bold": "Manrope-Bold.ttf",
  "Manrope-ExtraBold": "Manrope-ExtraBold.ttf",
};
const fontPaths = Object.fromEntries(Object.entries(FONT_FILES).map(([name, file]) => [name, fileURLToPath(new URL(file, FONT_DIR))]));
const fontsEmbedded = Object.values(fontPaths).every((p) => existsSync(p));
const F = fontsEmbedded
  ? { reg: "Inter", med: "Inter-Medium", semi: "Inter-SemiBold", display: "Manrope-ExtraBold", displayBold: "Manrope-Bold" }
  : { reg: "Helvetica", med: "Helvetica", semi: "Helvetica-Bold", display: "Helvetica-Bold", displayBold: "Helvetica-Bold" };
const CURRENCY = fontsEmbedded ? "₹" : "INR ";
if (!fontsEmbedded) {
  console.warn("[company-profile] WARNING: brand fonts not found in scripts/fonts — falling back to Helvetica and 'INR'");
}

// ---------------------------------------------------------------------------
// Brand tokens (mirror app/globals.css) and page geometry (points).
// ---------------------------------------------------------------------------
const C = {
  green: "#0F7A3D",
  yellow: "#FFC72C",
  earth: "#7A4E2D",
  ink: "#14211A",
  ink2: "#4A5A50",
  ink3: "#6B7A70",
  line: "#E3E7E4",
  tint: "#E8F5EC",
  harvestTint: "#FFF6D9",
  cream: "#FBF8EF",
  white: "#FFFFFF",
};
const PAGE = { w: 595.28, h: 841.89, mx: 56, top: 96, bottom: 64 };
const W = PAGE.w - PAGE.mx * 2; // content width (483.28)
const RIGHT = PAGE.w - PAGE.mx;
const CONTENT_TOP = PAGE.top;
const GAP = 18; // vertical rhythm between blocks

// ---------------------------------------------------------------------------
// Cross-check the stated catalogue facts against the live catalogue.
// ---------------------------------------------------------------------------
const products = JSON.parse(await readFile(PRODUCTS, "utf8"));
const prices = products.map((p) => p.price);
const live = {
  products: new Set(products.map((p) => p.family)).size,
  skus: products.length,
  brands: new Set(products.map((p) => p.brand)).size,
  priceMin: Math.min(...prices),
  priceMax: Math.max(...prices),
};
const drift = Object.keys(live).filter((key) => live[key] !== P.catalogue[key]);
for (const key of drift) {
  console.warn(`[company-profile] WARNING: catalogue.${key} is ${P.catalogue[key]} in catalog-facts.js but ${live[key]} in products.json — re-run scripts/import-brand-catalog.mjs`);
}
// Online-sellable figures: the same computation the storefront uses
// (getCatalogStats / saleFacts), so the hero, About page and PDF agree.
const facts = saleFacts(products);
const fmtN = (n) => n.toLocaleString("en-IN");
const fill = (str) =>
  str
    .replace("{priceRange}", priceRange(CURRENCY))
    .replace("{onlineProducts}", fmtN(facts.online.products))
    .replace("{onlineSkus}", fmtN(facts.online.skus))
    .replace("{onlineBrands}", fmtN(facts.online.brands))
    .replace("{restrictedProducts}", fmtN(facts.restricted.products));
// Example product names: a record's name is "<product> - <pack size>".
const prefixes = new Set(products.map((p) => p.name.slice(0, p.name.length - p.unit.length - 3).trim().toLowerCase()));
const missingExamples = P.productLines.flatMap((line) => line.examples.filter((e) => !prefixes.has(e.toLowerCase())).map((e) => `${e} (${line.name})`));
const brandSet = new Set(products.map((p) => p.brand.toLowerCase()));
const missingBrands = P.catalogue.exampleBrands.filter((b) => !brandSet.has(b.toLowerCase()));
if (missingExamples.length || missingBrands.length) {
  throw new Error(`[company-profile] not in products.json — examples: ${missingExamples.join("; ") || "none"}; brands: ${missingBrands.join(", ") || "none"}`);
}

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------
const generatedAt = new Date();
const generated = formatProfileDate(generatedAt);
const certs = (SITE.certifications ?? []).filter((c) => c.enabled);
const officer = SITE.legal.grievanceOfficer;
const [regdOffice, corpOffice] = SITE.offices;

const doc = new PDFDocument({
  size: "A4",
  margins: { top: PAGE.top, bottom: PAGE.bottom, left: PAGE.mx, right: PAGE.mx },
  bufferPages: true,
  info: {
    Title: `${P.displayName} — ${P.pdf.title}`,
    Author: P.legalName,
    Subject: `${P.pdf.subtitle}: ${P.natureOfBusiness}`,
    Keywords: "Surya Enterprises, business profile, nature of business, agro-inputs, crop protection, marketplace",
    Creator: "scripts/build-company-profile.mjs (pdfkit)",
    CreationDate: generatedAt,
  },
});
if (fontsEmbedded) for (const [name, file] of Object.entries(fontPaths)) doc.registerFont(name, file);

await mkdir(OUT_DIR, { recursive: true });
const stream = createWriteStream(OUT);
doc.pipe(stream);

// ---- primitives ------------------------------------------------------------
// PROFILE_DEBUG=1 prints where each block ends (must stay < 777pt).
const mark = (label) =>
  process.env.PROFILE_DEBUG && console.log(`[company-profile] ${label}: y=${Math.round(doc.y)} pages=${doc.bufferedPageRange().count}`);
const font = (name, size, color = C.ink) => doc.font(name).fontSize(size).fillColor(color);
// Extra leading so that line height = size × ratio (1.45 for body copy).
const lineGap = (size, ratio) => Math.max(0, size * ratio - doc.currentLineHeight());
const rule = (x1, y, x2, color = C.line, width = 0.8) => doc.moveTo(x1, y).lineTo(x2, y).lineWidth(width).stroke(color);

function text(str, x, y, w, { name = F.reg, size = 11, color = C.ink, ratio = 1.45, align = "left" } = {}) {
  font(name, size, color);
  doc.text(str, x, y, { width: w, lineGap: lineGap(size, ratio), align });
  return doc.y;
}
function heightOf(str, w, { name = F.reg, size = 11, ratio = 1.45 } = {}) {
  font(name, size);
  return doc.heightOfString(str, { width: w, lineGap: lineGap(size, ratio) });
}
function textRight(str, right, y, { name = F.reg, size = 8.5, color = C.ink3 } = {}) {
  font(name, size, color);
  doc.text(str, right - doc.widthOfString(str), y, { lineBreak: false });
}
// Small uppercase label (form-style).
function label(str, x, y, w, { color = C.ink2, size = 7.5 } = {}) {
  font(F.semi, size, color).text(str.toUpperCase(), x, y, { width: w, characterSpacing: 0.7, lineBreak: false });
}

// Wide logo left; title / subtitle / date right; thin green rule.
function pageHeader() {
  doc.image(LOGO, PAGE.mx, 28, { width: 150 });
  textRight(P.pdf.title, RIGHT, 26, { name: F.display, size: 16, color: C.ink });
  textRight(P.pdf.subtitle, RIGHT, 48, { size: 9, color: C.ink2 });
  textRight(generated, RIGHT, 62, { size: 8.5, color: C.ink3 });
  rule(PAGE.mx, 80, RIGHT, C.green, 1.2);
}

// Section heading: 14pt Manrope in brand green with a short yellow underline mark.
function h2(title, y) {
  font(F.display, 14, C.green).text(title, PAGE.mx, y, { lineBreak: false });
  doc.rect(PAGE.mx, y + 20, 28, 3).fill(C.yellow);
  return y + 34;
}

// Cream card with a 1pt hairline and a 3pt accent bar (top, or left for panels).
function card(x, y, w, h, { accent = C.green, leftRule = false } = {}) {
  doc.lineWidth(1).roundedRect(x, y, w, h, 6).fillAndStroke(C.cream, C.line);
  doc.save();
  doc.roundedRect(x, y, w, h, 6).clip();
  if (leftRule) doc.rect(x, y, 4, h).fill(accent);
  else doc.rect(x, y, w, 3).fill(accent);
  doc.restore();
}

// Small status chip ("Website + store" / "Store & institutional desk").
const CHIP_H = 17;
function chip(str, x, y, tone = "green") {
  const fill = tone === "green" ? C.tint : C.harvestTint;
  const color = tone === "green" ? C.green : C.earth;
  font(F.semi, 7, color);
  const w = doc.widthOfString(str.toUpperCase(), { characterSpacing: 0.3 }) + 16;
  if (process.env.PROFILE_DEBUG) console.log(`[company-profile]   chip "${str}" w=${w.toFixed(1)}`);
  doc.roundedRect(x, y, w, CHIP_H, CHIP_H / 2).fill(fill);
  font(F.semi, 7, color).text(str.toUpperCase(), x + 8, y + 5.5, { lineBreak: false, characterSpacing: 0.3 });
  return w;
}

function bullets(items, x, y, w, { size = 10, gap = 4, color = C.ink } = {}) {
  let cy = y;
  for (const item of items) {
    doc.circle(x + 3, cy + size * 0.55, 2).fill(C.green);
    text(item, x + 14, cy, w - 14, { size, color, ratio: 1.4 });
    cy = doc.y + gap;
  }
  return cy - gap;
}

// Table with a light green header row and hairlines. Cells are strings or
// { chip: "label", tone: "green" | "yellow" }.
function table({ x, y, columns, rows, fontSize = 9.5, pad = 7 }) {
  const totalW = columns.reduce((s, c) => s + c.width, 0);
  const headH = 22;
  doc.rect(x, y, totalW, headH).fill(C.tint);
  let cx = x;
  for (const col of columns) {
    label(col.label, cx + pad, y + 7, col.width - pad * 2, { color: C.green });
    cx += col.width;
  }
  let cy = y + headH;
  for (const row of rows) {
    let rh = 0;
    columns.forEach((col, j) => {
      const cell = row[j];
      const h =
        cell && typeof cell === "object"
          ? CHIP_H
          : heightOf(String(cell ?? ""), col.width - pad * 2, { name: col.bold ? F.semi : F.reg, size: fontSize, ratio: 1.35 });
      rh = Math.max(rh, h);
    });
    rh += pad * 2;
    if (process.env.PROFILE_DEBUG) console.log(`[company-profile]   row "${String(row[0]).slice(0, 22)}" h=${rh.toFixed(1)}`);
    cx = x;
    columns.forEach((col, j) => {
      const cell = row[j];
      if (cell && typeof cell === "object") chip(cell.chip, cx + pad, cy + pad, cell.tone);
      else text(String(cell ?? ""), cx + pad, cy + pad, col.width - pad * 2, { name: col.bold ? F.semi : F.reg, size: fontSize, ratio: 1.35, color: col.color ?? C.ink });
      cx += col.width;
    });
    rule(x, cy + rh, x + totalW, C.line, 0.6);
    cy += rh;
  }
  doc.lineWidth(0.8).rect(x, y, totalW, cy - y).stroke(C.line);
  return cy;
}

// Key / value rows (label left, value right). A value may be a string or
// { text, sub } (sub = small muted second line). Measured first so a card can
// be drawn behind them.
const KV = { gap: 7, value: 10, sub: 8 };
const valueParts = (value) => (value && typeof value === "object" ? value : { text: String(value ?? ""), sub: null });
function kvHeight(rows, w, labelW) {
  let h = 0;
  for (const [, value] of rows) {
    const { text: str, sub } = valueParts(value);
    h += heightOf(str, w - labelW - 8, { size: KV.value, ratio: 1.35 });
    if (sub) h += heightOf(sub, w - labelW - 8, { size: KV.sub, ratio: 1.3 }) + 1;
    h += KV.gap;
  }
  return h - KV.gap;
}
function kvRows(rows, x, y, w, labelW) {
  let cy = y;
  for (const [key, value] of rows) {
    const { text: str, sub } = valueParts(value);
    label(key, x, cy + 3, labelW);
    text(str, x + labelW + 8, cy, w - labelW - 8, { size: KV.value, ratio: 1.35 });
    if (sub) text(sub, x + labelW + 8, doc.y + 1, w - labelW - 8, { size: KV.sub, color: C.ink3, ratio: 1.3 });
    cy = doc.y + KV.gap;
  }
  return cy - KV.gap;
}

// Company identity card: a 3-column form grid (label above value) plus a
// full-width "Nature of business" row, on cream with a green left rule.
function fieldCell(key, value, x, y, w) {
  const { text: str, sub } = valueParts(value);
  label(key, x, y, w);
  text(str, x, y + 12, w, { size: KV.value, ratio: 1.35 });
  if (sub) text(sub, x, doc.y + 1, w, { size: KV.sub, color: C.ink3, ratio: 1.3 });
  return doc.y;
}
function fieldHeight(value, w) {
  const { text: str, sub } = valueParts(value);
  let h = 12 + heightOf(str, w, { size: KV.value, ratio: 1.35 });
  if (sub) h += heightOf(sub, w, { size: KV.sub, ratio: 1.3 }) + 1;
  return h;
}
function identityCard(y) {
  const pad = 16;
  const gap = 16;
  const rowGap = 14;
  const inner = W - pad * 2 - 6;
  const colW = (inner - gap * 2) / 3;
  const grid = [
    [["Legal name", P.legalName], ["Trade name", P.tradeName], ["Website", P.website.display]],
    [
      ["Founded", String(P.founded)],
      ["GSTIN (Rajasthan)", { text: regdOffice.gstin, sub: `${regdOffice.kind}, Jaipur` }],
      ["GSTIN (Delhi)", { text: corpOffice.gstin, sub: `${corpOffice.kind}, New Delhi` }],
    ],
    [["Helpline", SITE.helpline.display], ["Email", SITE.email], null],
  ];
  const rowHeights = grid.map((row) => Math.max(...row.filter(Boolean).map(([, value]) => fieldHeight(value, colW))));
  const natureH = fieldHeight(P.natureOfBusiness, inner);
  const gridH = rowHeights.reduce((a, b) => a + b, 0) + rowGap * (grid.length - 1);
  const h = pad + gridH + 14 + 14 + natureH + pad;
  card(PAGE.mx, y, W, h, { leftRule: true });
  const x0 = PAGE.mx + 6 + pad;
  let cy = y + pad;
  grid.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell) fieldCell(cell[0], cell[1], x0 + (colW + gap) * c, cy, colW);
    });
    cy += rowHeights[r] + rowGap;
  });
  cy += 14 - rowGap;
  rule(x0, cy, RIGHT - pad, C.line, 0.8);
  fieldCell("Nature of business", P.natureOfBusiness, x0, cy + 14, inner);
  return y + h;
}

// ===========================================================================
// Page 1 — identity + nature of business
// ===========================================================================
pageHeader();
let y = identityCard(CONTENT_TOP);
mark("page 1 identity");

y = h2("1. Nature of business", y + GAP);
y = text(P.nature.paragraph, PAGE.mx, y, W, { size: 10.5, color: C.ink, ratio: 1.4 });
mark("page 1 paragraph");

// The key points as a grid of cream cards, two per row (same copy as the
// bullets); an odd last item spans the full width.
{
  const items = P.nature.bullets.map(fill);
  const gap = 10;
  const cw = (W - gap) / 2;
  const pad = 10;
  const textX = 30; // room for the number badge
  const size = 9.5;
  let cy = y + 10;
  for (let i = 0; i < items.length; i += 2) {
    const row = items.slice(i, i + 2);
    const widths = row.length === 2 ? [cw, cw] : [W];
    const rowH = Math.max(...row.map((item, c) => heightOf(item, widths[c] - pad - textX - pad, { size, ratio: 1.35 }))) + pad * 2;
    row.forEach((item, c) => {
      const cx = PAGE.mx + (cw + gap) * c;
      card(cx, cy, widths[c], rowH, { accent: (i + c) % 2 === 0 ? C.green : C.yellow });
      doc.circle(cx + pad + 8, cy + pad + 8, 8).fill(C.green);
      const n = String(i + c + 1);
      font(F.semi, 8, C.white).text(n, cx + pad + 8 - doc.widthOfString(n) / 2, cy + pad + 3, { lineBreak: false });
      text(item, cx + pad + textX, cy + pad, widths[c] - pad - textX - pad, { size, ratio: 1.35, color: C.ink });
    });
    cy += rowH + gap;
  }
  y = cy - gap;
}
mark("page 1 end");

// ===========================================================================
// Page 2 — products + sales channels
// ===========================================================================
doc.addPage();
pageHeader();
y = h2("2. Products we sell", CONTENT_TOP);
y = table({
  x: PAGE.mx,
  y,
  columns: [
    { label: "Category", width: 128, bold: true },
    { label: "Example products", width: 205 },
    { label: "Availability", width: W - 128 - 205 },
  ],
  rows: P.productLines.map((l) => [
    l.name,
    l.examples.length ? l.examples.slice(0, 3).join(" · ") : "Range available in-store and by quotation; coming online in phases.",
    // Online lines get the green chip; store-only lines spell out the channel.
    l.online ? { chip: P.availability.online.channels, tone: "green" } : l.availability ?? P.availability.offline.channels,
  ]),
  fontSize: 9,
  pad: 6,
});
mark("page 2 products");

y = h2("3. Sales channels", y + GAP);
y = table({
  x: PAGE.mx,
  y,
  columns: [
    { label: "Channel", width: 96, bold: true },
    { label: "How customers buy", width: 262 },
    { label: "Payment", width: W - 96 - 262 },
  ],
  rows: P.channels.map((ch) => [ch.title, ch.how, ch.payment]),
});
y = text(socialStatement(), PAGE.mx, y + 10, W, { size: 9.5, color: C.ink2, ratio: 1.4 });
mark("page 2 end");

// ===========================================================================
// Page 3 — end customers, compliance, declaration
// ===========================================================================
doc.addPage();
pageHeader();
y = h2("4. End customers", CONTENT_TOP);

{
  const gap = 14;
  const cw = (W - gap) / 2;
  const pad = 14;
  const innerW = cw - pad * 2;
  const measure = (s) => {
    const textH = heightOf(s.text, innerW, { size: 10.5, ratio: 1.45 });
    const whoH = s.who.reduce((h, w) => h + heightOf(w, innerW - 14, { size: 10, ratio: 1.4 }) + 4, 0) - 4;
    return pad + 16 + 8 + CHIP_H + 10 + textH + 10 + whoH + pad;
  };
  const cardH = Math.max(...P.segments.map(measure));
  P.segments.forEach((s, i) => {
    const cx = PAGE.mx + (cw + gap) * i;
    card(cx, y, cw, cardH, { accent: i === 0 ? C.green : C.yellow });
    font(F.displayBold, 12, C.ink).text(`${s.label} — ${s.title}`, cx + pad, y + pad + 2, { lineBreak: false });
    chip(`${s.share}% of sales`, cx + pad, y + pad + 24, i === 0 ? "green" : "yellow");
    const after = text(s.text, cx + pad, y + pad + 24 + CHIP_H + 10, innerW, { size: 10.5, color: C.ink2 });
    bullets(s.who, cx + pad, after + 10, innerW, { size: 10 });
  });
  y += cardH + GAP;
}

// 70 / 30 bar with rounded ends and labels inside
{
  const h = 24;
  const [b2c, b2b] = P.segments;
  const b2cW = (W * b2c.share) / 100;
  doc.roundedRect(PAGE.mx, y, W, h, h / 2).fill(C.yellow);
  doc.roundedRect(PAGE.mx, y, b2cW, h, h / 2).fill(C.green);
  doc.rect(PAGE.mx + b2cW - h / 2, y, h / 2, h).fill(C.green);
  font(F.semi, 9.5, C.white).text(`${b2c.share}%  ${b2c.label} — ${b2c.title}`, PAGE.mx + 14, y + 7, { lineBreak: false });
  font(F.semi, 9.5, C.ink).text(`${b2b.share}%  ${b2b.label}`, PAGE.mx + b2cW + 12, y + 7, { lineBreak: false });
  y += h;
}
mark("page 3 customers");

y = h2("5. Compliance & certifications", y + GAP + 6);
const licenceText =
  P.licences.length > 0
    ? P.licences
        .map((l) => [l.authority, l.number && `No. ${l.number}`, l.scope, l.validTill && `valid till ${formatProfileDate(l.validTill)}`].filter(Boolean).join(" · "))
        .join("\n")
    : P.licencesFallback;
y = kvRows(
  [
    ["Certifications", certs.map((c) => `${c.name}${c.detail ? ` — ${c.detail}` : ""}`).join("\n")],
    ["Licences", licenceText],
    ["Payment partners", P.paymentPartners.join(", ")],
    ["Grievance officer", `${officer.name}, ${officer.designation} · ${officer.phone.display} · ${officer.email}`],
  ],
  PAGE.mx,
  y,
  W,
  120
);
mark("page 3 compliance");

y = h2("6. Declaration", y + GAP + 6);
y = text(P.declaration.statement, PAGE.mx, y, W, { size: 11 });
font(F.semi, 10.5, C.ink).text(`For ${P.legalName}`, PAGE.mx, y + 12, { lineBreak: false });
y += 12 + 14 + 16;
{
  const gap = 24;
  const sw = (W - gap) / 2;
  const lineBelow = 28; // comfortable space between label and signature line
  const rowGap = 26;
  P.declaration.signatureFields.forEach((field, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const extra = row === 1 ? 18 : 0; // signature / stamp row gets more room
    const sx = PAGE.mx + (sw + gap) * col;
    const sy = y + row * (lineBelow + rowGap + 10);
    label(field, sx, sy, sw);
    rule(sx, sy + lineBelow + extra, sx + sw, C.ink3, 0.8);
  });
  y += 2 * (lineBelow + rowGap + 10) + 18;
}
mark("page 3 end");

// ===========================================================================
// Footer on every page, then finish
// ===========================================================================
const range = doc.bufferedPageRange();
if (range.count !== P.pdf.pages) {
  const msg = `[company-profile] expected ${P.pdf.pages} pages, drew ${range.count} — content overflowed a page`;
  if (!process.env.PROFILE_DEBUG) throw new Error(msg);
  console.warn(`${msg} (PROFILE_DEBUG: writing anyway for inspection)`);
}
for (let i = range.start; i < range.start + range.count; i += 1) {
  doc.switchToPage(i);
  const saved = doc.page.margins.bottom;
  doc.page.margins.bottom = 0; // footer sits inside the bottom margin
  const fy = PAGE.h - 48;
  rule(PAGE.mx, fy, RIGHT, C.line, 0.8);
  font(F.reg, 8, C.ink3).text(`${P.website.display}   ·   Helpline ${SITE.helpline.display}   ·   ${SITE.email}`, PAGE.mx, fy + 9, { lineBreak: false });
  font(F.reg, 8, C.ink3).text(`Generated ${generated}`, PAGE.mx, fy + 21, { lineBreak: false });
  textRight(`Page ${i + 1} of ${range.count}`, RIGHT, fy + 9, { name: F.semi, size: 8, color: C.green });
  textRight(P.legalName, RIGHT, fy + 21, { size: 8 });
  doc.page.margins.bottom = saved;
}
doc.end();
await new Promise((resolve, reject) => {
  stream.on("finish", resolve);
  stream.on("error", reject);
});

// ---------------------------------------------------------------------------
// Verify the output without pdfkit: header, size and page count.
// ---------------------------------------------------------------------------
const bytes = await readFile(OUT);
const header = bytes.subarray(0, 5).toString("latin1");
const pageCount = (bytes.toString("latin1").match(/\/Type\s*\/Page(?![s])/g) ?? []).length;
const kb = bytes.length / 1024;
if (header !== "%PDF-") throw new Error(`[company-profile] ${OUT} does not start with %PDF-`);
if (kb < 50) throw new Error(`[company-profile] ${OUT} is only ${kb.toFixed(0)} KB`);
if (pageCount !== P.pdf.pages && !process.env.PROFILE_DEBUG) throw new Error(`[company-profile] ${OUT} has ${pageCount} pages, expected ${P.pdf.pages}`);
console.log(`[company-profile] ${pageCount} pages -> ${OUT} (${kb.toFixed(0)} KB, fonts ${fontsEmbedded ? "Inter + Manrope embedded" : "Helvetica fallback"})`);
