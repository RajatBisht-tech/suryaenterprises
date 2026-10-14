import { createHash } from "node:crypto";
import { parseIndianMobile } from "./mobile.mjs";

export class AdminError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

export const STAGES = ["unassigned", "processing", "packed", "shipped", "delivered", "on_hold", "cancelled", "returned"];
export const NEXT_STAGES = {
  unassigned: [], processing: ["packed", "on_hold", "cancelled"],
  packed: ["shipped", "on_hold", "cancelled"], shipped: ["delivered", "on_hold", "returned"],
  delivered: ["returned"], on_hold: ["processing", "packed", "shipped", "cancelled"], cancelled: [], returned: [],
};
export const digest = value => createHash("sha256").update(String(value)).digest("hex");
export const paise = value => Math.round(Number(value) * 100);
export const indiaDate = (date = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
const dayStart = date => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new AdminError("Use a valid calendar date.");
  const value = new Date(`${date}T00:00:00+05:30`);
  if (!Number.isFinite(value.getTime()) || indiaDate(value) !== date) throw new AdminError("Use a valid calendar date.");
  return value;
};

export function dashboardFilters(params, now = new Date()) {
  const range = params.get("range") || "today";
  const today = indiaDate(now);
  let from = today, to = today, label = "Today";
  if (range === "all") { from = null; to = null; label = "All time"; }
  else if (range === "7d" || range === "30d") {
    const days = range === "7d" ? 7 : 30;
    from = indiaDate(new Date(dayStart(today).getTime() - (days - 1) * 86400000));
    label = `Last ${days} days`;
  } else if (range === "custom") {
    from = params.get("from") || ""; to = params.get("to") || ""; label = `${from} – ${to}`;
  } else if (range !== "today") throw new AdminError("Invalid date range.");
  const start = from ? dayStart(from) : null;
  const end = to ? new Date(dayStart(to).getTime() + 86400000) : null;
  if (start && end && start >= end) throw new AdminError("The start date must be before the end date.");
  const fulfillment = params.get("fulfillment") || "all";
  if (fulfillment !== "all" && !STAGES.includes(fulfillment)) throw new AdminError("Invalid fulfillment stage.");
  const page = Number(params.get("page") || 1), limit = Number(params.get("limit") || 20);
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000 || ![20, 50, 100].includes(limit)) throw new AdminError("Invalid page size or page number.");
  const q = (params.get("q") || "").trim();
  if (q.length > 120) throw new AdminError("Search is limited to 120 characters.");
  return { range, from, to, start, end, label, fulfillment, page, limit, q };
}

export function buildProductMatcher(products) {
  const byPrice = new Map();
  const bySku = new Map();
  for (const p of products) {
    if (!Number.isFinite(p.price) || p.price <= 0) continue;
    bySku.set(p.sku, p);
    const key = paise(p.price);
    if (!byPrice.has(key)) byPrice.set(key, []);
    byPrice.get(key).push(p);
  }
  for (const group of byPrice.values()) group.sort((a, b) => a.sku.localeCompare(b.sku));
  const prices = [...byPrice.keys()].sort((a, b) => a - b);
  const match = (amount, reference, sku) => {
    const target = paise(amount);
    if (!Number.isFinite(target) || target <= 0 || !prices.length) return null;
    let product = sku ? bySku.get(sku) : null;
    if (!product && !sku) {
      let low = 0, high = prices.length;
      while (low < high) { const mid = (low + high) >>> 1; if (prices[mid] < target) low = mid + 1; else high = mid; }
      const candidates = [prices[low - 1], prices[low]].filter(p => p !== undefined);
      const price = candidates.sort((a, b) => Math.abs(a - target) - Math.abs(b - target) || a - b)[0];
      const group = byPrice.get(price);
      product = group[parseInt(digest(reference).slice(0, 8), 16) % group.length];
    }
    if (!product) return null;
    const delta = (target - paise(product.price)) / 100;
    return { sku: product.sku, name: product.name, price: product.price, image: product.image, unit: product.unit,
      category: product.category, brand: product.brand,
      delta, differencePercent: Math.round(Math.abs(delta) / Number(amount) * 10000) / 100,
      exact: delta === 0 };
  };
  return { match, bySku };
}

export function purchasedItems(order) {
  return Array.isArray(order.items) && order.items.length > 0 && order.items.every(i => typeof i.sku === "string" && Number.isInteger(i.quantity) && i.quantity > 0 && Number.isFinite(i.price) && i.price > 0);
}

export function shipmentReference(body) {
  if (typeof body.carrier !== "string" || typeof body.trackingId !== "string") throw new AdminError("A carrier and tracking number are required.", 422);
  const carrier = body.carrier.trim(), trackingId = body.trackingId.trim();
  if (!carrier || !trackingId || carrier.length > 100 || trackingId.length > 120) throw new AdminError("Enter a valid carrier and tracking number.", 422);
  return { carrier, trackingId };
}

export function fulfillmentUpdate(current, body, now = new Date()) {
  if (!Number.isInteger(body.revision) || body.revision < 0) throw new AdminError("Reload this order before making changes.");
  const note = String(body.note || "").trim();
  if (note.length > 1000) throw new AdminError("The note is limited to 1,000 characters.");
  const event = { at: now, action: body.action, from: current.fulfillmentStatus, note };
  if (body.action === "notes") {
    const notes = String(body.notes || "").trim();
    if (notes.length > 2000) throw new AdminError("Notes are limited to 2,000 characters.");
    return { set: { notes }, event: { ...event, note: notes } };
  }
  if (body.action === "customer-mobile") {
    const phone = parseIndianMobile(body.phone);
    if (!phone) throw new AdminError("Enter a valid ten-digit Indian mobile number, optionally prefixed with +91.", 422);
    const previousPhone = String(current.customer?.phone || "");
    if (phone === parseIndianMobile(previousPhone)) throw new AdminError("The customer mobile number has not changed.", 422);
    return { set: { customerPhone: phone }, event: { ...event, action: "customer_mobile_updated", previousPhone, phone,
      note: note || "Admin updated the customer mobile number." } };
  }
  if (body.action === "customer-address") {
    const input = body.address;
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new AdminError("Enter the customer's complete delivery address.", 422);
    const address = {};
    for (const [field, max] of [["address", 300], ["city", 100], ["state", 100], ["pinCode", 6]]) {
      if (typeof input[field] !== "string" || !input[field].trim() || input[field].trim().length > max) throw new AdminError("Enter the customer's complete delivery address.", 422);
      address[field] = input[field].trim();
    }
    if (!/^[1-9]\d{5}$/.test(address.pinCode)) throw new AdminError("Enter a valid six-digit Indian PIN code.", 422);
    const previousAddress = Object.fromEntries(Object.keys(address).map(field => [field, current.customer?.[field] || ""]));
    if (Object.keys(address).every(field => address[field] === previousAddress[field])) throw new AdminError("The delivery address has not changed.", 422);
    return { set: { customerAddress: address }, event: { ...event, action: "customer_address_updated", previousAddress, address,
      note: note || "Admin updated the customer delivery address." } };
  }
  if (body.action === "confirm-product") {
    if (current.assignment === "purchased") throw new AdminError("This order already has purchased line items.", 422);
    if (typeof body.sku !== "string" || !body.sku.trim()) throw new AdminError("Select a catalog product.", 422);
    if (!["unassigned", "processing"].includes(current.fulfillmentStatus)) throw new AdminError("Product assignment cannot change after packing starts.", 422);
    return { set: { productSku: body.sku, productConfirmedAt: now, fulfillmentStatus: "processing" },
      event: { ...event, to: "processing", sku: body.sku, note: note || "Admin confirmed catalog association; original payment data preserved." } };
  }
  if (body.action === "correct-status") {
    if (current.assignment === "approximate") throw new AdminError("Confirm the purchased product before correcting fulfillment.", 422);
    if (!["processing", "packed", "on_hold", "cancelled", "returned"].includes(body.status) || body.status === current.fulfillmentStatus) throw new AdminError("Choose a different valid correction status.", 422);
    if (!note) throw new AdminError("A reason is required for a manual status correction.", 422);
    if (body.status === "returned" && !current.shipment?.shippedAt) throw new AdminError("A recorded shipment is required before marking a return.", 422);
    const previousShipment = { ...(current.shipment || {}) };
    const shipment = ["processing", "packed"].includes(body.status) ? {} : previousShipment;
    return { set: { fulfillmentStatus: body.status, shipment }, event: { ...event, action: "status_correction", to: body.status, previousShipment } };
  }
  if (body.action === "record-shipment") {
    if (current.assignment === "approximate") throw new AdminError("Confirm the purchased product before recording shipment.", 422);
    if (!["processing", "packed"].includes(current.fulfillmentStatus)) throw new AdminError("Only processing or packed orders can be bulk shipped.", 422);
    const shipment = { ...shipmentReference(body), shippedAt: now };
    return { set: { fulfillmentStatus: "shipped", shipment }, event: { ...event, action: "shipment_recorded", to: "shipped", shipment, note: note || "Admin recorded a bulk shipment." } };
  }
  if (body.action !== "fulfillment" || !STAGES.includes(body.status) || !(NEXT_STAGES[current.fulfillmentStatus] || []).includes(body.status)) {
    throw new AdminError("This fulfillment transition is not allowed.", 422);
  }
  if (current.assignment === "approximate") throw new AdminError("Confirm the product association before fulfillment.", 422);
  const shipment = { ...(current.shipment || {}) };
  if (body.status === "shipped") {
    const carrier = String(body.carrier || shipment.carrier || "").trim();
    const trackingId = String(body.trackingId || shipment.trackingId || "").trim();
    if (!carrier || !trackingId || carrier.length > 100 || trackingId.length > 120) throw new AdminError("A carrier and tracking number are required to record shipment.", 422);
    shipment.carrier = carrier; shipment.trackingId = trackingId; shipment.shippedAt ||= now;
  }
  if (body.status === "delivered") {
    if (!shipment.shippedAt) throw new AdminError("Record shipment before delivery.", 422);
    shipment.deliveredAt = now;
  }
  if (["cancelled", "returned", "on_hold"].includes(body.status) && !note) throw new AdminError("Add a reason for this status.", 422);
  return { set: { fulfillmentStatus: body.status, shipment }, event: { ...event, to: body.status } };
}

export function csvCell(value) {
  let text = String(value ?? "");
  if (/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
