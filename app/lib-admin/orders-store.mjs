import mongoose from "mongoose";
import { AdminError, STAGES, buildProductMatcher, csvCell, fulfillmentUpdate, indiaDate, purchasedItems, shipmentReference } from "./core.mjs";
import { maskMobile, maskMobileReferences } from "./mobile.mjs";

const { ObjectId } = mongoose.Types;

const SUCCESS = { paymentStatus: "paid", subtotal: { $gt: 0, $lt: Number.MAX_SAFE_INTEGER / 100 } };
const regex = text => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const iso = value => value ? new Date(value).toISOString() : null;
const idFor = value => {
  if (typeof value !== "string" || !/^[a-f0-9]{24}$/.test(value)) throw new AdminError("Order not found.", 404);
  return new ObjectId(value);
};
const timeStages = [{ $set: { __paidAt: { $ifNull: ["$paidAt", { $ifNull: ["$updatedAt", "$createdAt"] }] } } }];
const timeMatch = (start, end) => {
  const bounds = { ...(start ? { $gte: start } : {}), ...(end ? { $lt: end } : {}) };
  return { $or: [{ paidAt: { $type: "date", ...bounds } }, { paidAt: null, updatedAt: { $type: "date", ...bounds } },
    { paidAt: null, updatedAt: null, createdAt: { $type: "date", ...bounds } }] };
};
const operationalStages = [
  { $lookup: { from: "store_admin_orders", let: { id: { $toString: "$_id" } }, pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$id"] } } }], as: "__ops" } },
  { $set: { __ops: { $arrayElemAt: ["$__ops", 0] }, __purchased: { $gt: [{ $size: { $ifNull: ["$items", []] } }, 0] } } },
  { $set: { __stage: { $ifNull: ["$__ops.fulfillmentStatus", { $cond: ["$__purchased", "processing", "unassigned"] }] } } },
];
const projection = { payuResponse: 0, payuQrString: 0, paymentErrorDetails: 0, __ops: 0 };

// Financial collections are read-only. Operations live in their own collection.
export function createOrdersStore(db, gatewayDb, products, { now = () => new Date() } = {}) {
  const orders = db.collection("orders"), operations = db.collection("store_admin_orders");
  const matcher = buildProductMatcher(products);
  const metadata = async rows => new Map((await operations.find({ _id: { $in: rows.map(r => String(r._id)) } }).toArray()).map(r => [r._id, r]));
  const gatewayRows = async rows => {
    if (!gatewayDb || !rows.length) return new Map();
    const txns = await gatewayDb.collection("transactions").find({ transactionId: { $in: rows.map(r => r.orderId) } },
      { projection: { transactionId: 1, orderId: 1, payuTxnId: 1, payuId: 1, razorpayOrderId: 1, razorpayPaymentId: 1, phonepeTransactionId: 1, status: 1, amount: 1, paidAt: 1, callbackStatus: 1 } }).toArray();
    // Never attach a different payment merely because its amount matches.
    const source = new Map(rows.map(r => [r.orderId, r]));
    return new Map(txns.filter(t => { const r = source.get(t.transactionId);
      return r && Math.round(r.subtotal * 100) === Math.round(t.amount * 100);
    }).map(t => [t.transactionId, t]));
  };
  const toRow = (order, ops, gateway, detail = false) => {
    const purchased = purchasedItems(order);
    const assignment = purchased ? "purchased" : ops?.productConfirmedAt ? "confirmed" : "approximate";
    const selected = ops?.productSnapshot || matcher.match(order.subtotal, order.transactionId || order.orderId, ops?.productSku);
    const customer = order.customer || {};
    const delivery = ops?.customerAddress || {};
    const provider = String(order.provider || (order.razorpayOrderId || String(order.razorpayPaymentId || "").startsWith("order_") || String(order.transactionId || "").startsWith("SP") && order.razorpayOrderId ? "razorpay" : order.phonepeTransactionId ? "phonepe" : "payu")).toLowerCase();
    const row = {
      id: String(order._id), orderId: order.orderId, externalOrderId: gateway?.orderId || null,
      transactionId: order.transactionId || order.payuTxnId || order.razorpayOrderId || order.phonepeTransactionId || null,
      paymentId: order.payuPaymentId || order.razorpayPaymentId || order.phonepeTransactionId || order.transactionId || order.orderId,
      utr: order.payuBankRefNum || order.utr || order.rrn || null,
      provider,
      paymentMethod: order.paymentMethod || `${provider}_dynamic_qr`,
      amount: order.subtotal, currency: "INR", paymentStatus: "paid", paidAt: iso(paidAt), createdAt: iso(order.createdAt),
      dateBasis: order.paidAt ? "payment_confirmed" : "record_updated", providerPaidAt: iso(gateway?.paidAt),
      source: gateway ? "gateway" : "storefront", gatewayStatus: gateway?.status || null, callbackStatus: gateway?.callbackStatus || null,
      customer: { name: [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "Customer",
        email: maskMobileReferences(customer.email, [customer.phone, ops?.customerPhone]), phone: maskMobile(ops?.customerPhone ?? customer.phone),
        address: delivery.address ?? [customer.address, customer.apartment].filter(Boolean).join(", "),
        city: delivery.city ?? customer.city ?? "", state: delivery.state ?? customer.state ?? "", pinCode: delivery.pinCode ?? customer.pinCode ?? "" },
      assignment, catalogMatch: purchased ? null : selected,
      items: purchased ? order.items.map(i => ({ sku: i.sku, name: i.name, quantity: i.quantity, price: i.price, image: matcher.bySku.get(i.sku)?.image || null })) : [],
      fulfillmentStatus: ops?.fulfillmentStatus || (purchased ? "processing" : "unassigned"), shipment: ops?.shipment || {},
      notes: ops?.notes || "", revision: ops?.revision || 0,
    };
    if (detail) row.history = [{ at: iso(paidAt), action: "payment_recorded", note: `Successful ${order.provider ? order.provider.toUpperCase() : "payment"} recorded.` }, ...(ops?.history || []).map(h => ({ ...h, at: iso(h.at),
      ...(h.phone !== undefined ? { phone: maskMobile(h.phone) } : {}), ...(h.previousPhone !== undefined ? { previousPhone: maskMobile(h.previousPhone) } : {}) }))];
    return row;
  };
  const enrich = async (rows, detail = false) => {
    const [ops, gateway] = await Promise.all([metadata(rows), gatewayRows(rows)]);
    return rows.map(r => toRow(r, ops.get(String(r._id)), gateway.get(r.orderId), detail));
  };
  const pipeline = async filters => {
    const match = { ...SUCCESS };
    if (filters.q) {
      const pattern = new RegExp(regex(filters.q), "i");
      const external = gatewayDb ? await gatewayDb.collection("transactions").find({ status: "SUCCESS", orderId: pattern },
        { projection: { transactionId: 1 } }).limit(1001).toArray() : [];
      if (external.length > 1000) throw new AdminError("Refine the search to match fewer merchant order IDs.");
      match.$or = ["orderId", "transactionId", "payuTxnId", "payuPaymentId", "razorpayOrderId", "razorpayPaymentId", "phonepeTransactionId", "payuBankRefNum", "customer.firstName", "customer.lastName", "customer.email", "customer.phone"].map(field => ({ [field]: pattern }));
      match.$or.push({ $expr: { $regexMatch: { input: { $concat: [{ $ifNull: ["$customer.firstName", ""] }, " ", { $ifNull: ["$customer.lastName", ""] }] }, regex: regex(filters.q), options: "i" } } });
      if (external.length) match.$or.push({ orderId: { $in: external.map(t => t.transactionId) } });
      const correctedPhones = await operations.find({ customerPhone: pattern }, { projection: { _id: 1 } }).limit(1001).toArray();
      if (correctedPhones.length > 1000) throw new AdminError("Refine the customer mobile search to match fewer orders.");
      if (correctedPhones.length) match.$or.push({ _id: { $in: correctedPhones.map(row => idFor(row._id)) } });
    }
    const result = [{ $match: match }];
    if (filters.start || filters.end) result.push({ $match: timeMatch(filters.start, filters.end) });
    result.push(...timeStages);
    result.push(...operationalStages);
    if (filters.fulfillment !== "all") result.push({ $match: { __stage: filters.fulfillment } });
    return result;
  };
  const trend = async () => {
    const today = indiaDate(now()), end = new Date(`${today}T00:00:00+05:30`);
    const start = new Date(end.getTime() - 6 * 86400000);
    const values = await orders.aggregate([{ $match: SUCCESS }, { $match: timeMatch(start, new Date(end.getTime() + 86400000)) }, ...timeStages,
      { $group: { _id: { $dateToString: { date: "$__paidAt", format: "%Y-%m-%d", timezone: "Asia/Kolkata" } }, count: { $sum: 1 }, cents: { $sum: { $round: [{ $multiply: ["$subtotal", 100] }, 0] } } } }], { maxTimeMS: 12000 }).toArray();
    const byDay = new Map(values.map(v => [v._id, v]));
    return Array.from({ length: 7 }, (_, i) => { const date = indiaDate(new Date(start.getTime() + i * 86400000)), value = byDay.get(date);
      return { date, count: value?.count || 0, amount: (value?.cents || 0) / 100 }; });
  };
  const dashboard = async filters => {
    const query = await pipeline(filters);
    const [results, daySeries] = await Promise.all([
      orders.aggregate([...query, { $facet: {
        totals: [{ $group: { _id: null, paymentCount: { $sum: 1 }, cents: { $sum: { $round: [{ $multiply: ["$subtotal", 100] }, 0] } },
          awaitingProductConfirmation: { $sum: { $cond: [{ $eq: ["$__stage", "unassigned"] }, 1, 0] } }, realProductCents: { $sum: { $cond: ["$__purchased", { $round: [{ $multiply: ["$subtotal", 100] }, 0] }, 0] } } } }],
        stages: [{ $group: { _id: "$__stage", count: { $sum: 1 } } }],
        rows: [{ $sort: { __paidAt: -1, _id: -1 } }, { $skip: (filters.page - 1) * filters.limit }, { $limit: filters.limit }, { $project: projection }],
      } }], { maxTimeMS: 12000 }).toArray(), trend(),
    ]);
    const data = results[0], totals = data.totals[0] || { paymentCount: 0, cents: 0, awaitingProductConfirmation: 0, realProductCents: 0 };
    const fulfillmentCounts = Object.fromEntries(STAGES.map(s => [s, 0]));
    for (const stage of data.stages) fulfillmentCounts[stage._id] = stage.count;
    return { summary: { collectedAmount: totals.cents / 100, paymentCount: totals.paymentCount,
      averagePayment: totals.paymentCount ? Math.round(totals.cents / totals.paymentCount) / 100 : 0,
      awaitingProductConfirmation: totals.awaitingProductConfirmation, realProductSales: totals.realProductCents / 100, fulfillmentCounts, daySeries },
      orders: await enrich(data.rows), pagination: { page: filters.page, limit: filters.limit, total: totals.paymentCount, pages: Math.ceil(totals.paymentCount / filters.limit) },
      period: { from: filters.from, to: filters.to, label: filters.label }, generatedAt: now().toISOString() };
  };
  const detail = async id => {
    const order = await orders.findOne({ ...SUCCESS, _id: idFor(id) }, { projection: { payuResponse: 0, payuQrString: 0 } });
    if (!order) throw new AdminError("Successful order not found.", 404);
    return (await enrich([order], true))[0];
  };
  const update = async (id, body) => {
    const current = await detail(id);
    if (current.revision !== body.revision) throw new AdminError("This order changed. Reload it before saving.", 409);
    const ops = await operations.findOne({ _id: id });
    let changeContext = current;
    if (body.action === "customer-mobile") {
      const original = await orders.findOne({ ...SUCCESS, _id: idFor(id) }, { projection: { "customer.phone": 1 } });
      changeContext = { ...current, customer: { ...current.customer, phone: ops?.customerPhone ?? original?.customer?.phone ?? "" } };
    }
    const change = fulfillmentUpdate(changeContext, body, now());
    if (body.action === "confirm-product") {
      const productSnapshot = matcher.match(current.amount, current.transactionId, body.sku);
      if (!productSnapshot) throw new AdminError("Catalog product not found.", 422);
      change.set.productSnapshot = productSnapshot;
    }
    try {
      if (!ops) {
        await operations.insertOne({ _id: id, orderId: current.orderId, revision: 1, createdAt: now(), updatedAt: now(), ...change.set, history: [change.event] });
      } else {
        const result = await operations.updateOne({ _id: id, revision: body.revision },
          { $set: { ...change.set, updatedAt: now() }, $inc: { revision: 1 }, $push: { history: change.event } });
        if (!result.matchedCount) throw new AdminError("This order changed. Reload it before saving.", 409);
      }
    } catch (error) { if (error.code === 11000) throw new AdminError("This order changed. Reload it before saving.", 409); throw error; }
    return detail(id);
  };
  const exportCsv = async filters => {
    const records = await orders.aggregate([...(await pipeline(filters)), { $sort: { __paidAt: -1, _id: -1 } }, { $limit: 10001 }, { $project: projection }], { maxTimeMS: 15000 }).toArray();
    if (records.length > 10000) throw new AdminError("Choose a narrower period to export up to 10,000 orders.");
    const rows = await enrich(records);
    const columns = ["Surya order ID", "Merchant order ID", "PayU transaction ID", "PayU payment ID", "UTR", "Collected INR", "Recorded successful at", "Date basis", "Customer", "Email", "Phone", "Product association", "Catalog SKU", "Catalog product", "Catalog price INR", "Price difference INR", "Fulfillment", "Carrier", "Tracking ID"];
    return '\uFEFF' + [columns.map(csvCell).join(","), ...rows.map(r => [r.orderId, r.externalOrderId, r.transactionId, r.paymentId, r.utr, r.amount, r.paidAt, r.dateBasis,
      r.customer.name, r.customer.email, r.customer.phone, r.assignment, r.catalogMatch?.sku || r.items.map(i => i.sku).join("; "),
      r.catalogMatch?.name || r.items.map(i => i.name).join("; "), r.catalogMatch?.price ?? "", r.catalogMatch?.delta ?? "", r.fulfillmentStatus, r.shipment.carrier, r.shipment.trackingId].map(csvCell).join(","))].join("\r\n");
  };
  const shipmentPreview = async filters => {
    const eligible = { $and: ["$__assigned", { $in: ["$__stage", ["processing", "packed"]] }] };
    const results = await orders.aggregate([...(await pipeline(filters)),
      { $set: { __assigned: { $or: ["$__purchased", { $ne: [{ $ifNull: ["$__ops.productConfirmedAt", null] }, null] }] } } },
      { $facet: {
        totals: [{ $group: { _id: null, matchedCount: { $sum: 1 }, eligibleCount: { $sum: { $cond: [eligible, 1, 0] } },
          unconfirmedCount: { $sum: { $cond: ["$__assigned", 0, 1] } },
          alreadyShippedCount: { $sum: { $cond: [{ $and: ["$__assigned", { $eq: ["$__stage", "shipped"] }] }, 1, 0] } } } }],
        candidates: [{ $match: { $expr: eligible } }, { $sort: { __paidAt: -1, _id: -1 } }, { $limit: 100 },
          { $project: { _id: 1, revision: { $ifNull: ["$__ops.revision", 0] } } }],
      } }], { maxTimeMS: 12000 }).toArray();
    const data = results[0], totals = data.totals[0] || { matchedCount: 0, eligibleCount: 0, unconfirmedCount: 0, alreadyShippedCount: 0 };
    return { ...totals, otherStageCount: totals.matchedCount - totals.eligibleCount - totals.unconfirmedCount - totals.alreadyShippedCount,
      candidates: data.candidates.map(row => ({ id: String(row._id), revision: row.revision })),
      capped: totals.eligibleCount > 100, maxBatch: 100, periodLabel: filters.label };
  };
  const bulkShip = async body => {
    if (!Array.isArray(body.orders) || body.orders.length < 1 || body.orders.length > 100) throw new AdminError("Preview and select 1–100 confirmed purchase orders.", 422);
    const reference = shipmentReference(body), note = String(body.note || "").trim();
    if (note.length > 1000) throw new AdminError("The shipment note is limited to 1,000 characters.");
    const ids = new Set();
    for (const row of body.orders) {
      idFor(row?.id);
      if (!Number.isInteger(row.revision) || row.revision < 0 || ids.has(row.id)) throw new AdminError("Reload the shipment preview before submitting.", 422);
      ids.add(row.id);
    }
    const results = new Array(body.orders.length);
    let cursor = 0;
    const alreadyRecorded = current => current.fulfillmentStatus === "shipped" && current.shipment.carrier === reference.carrier && current.shipment.trackingId === reference.trackingId;
    const worker = async () => {
      while (cursor < body.orders.length) {
        const index = cursor++, target = body.orders[index];
        try {
          const current = await detail(target.id);
          if (alreadyRecorded(current)) { results[index] = { id: target.id, status: "already_recorded" }; continue; }
          await update(target.id, { revision: target.revision, action: "record-shipment", ...reference, note });
          results[index] = { id: target.id, status: "shipped" };
        } catch (error) {
          if (error instanceof AdminError && error.status === 409) {
            const latest = await detail(target.id).catch(() => null);
            if (latest && alreadyRecorded(latest)) { results[index] = { id: target.id, status: "already_recorded" }; continue; }
          }
          results[index] = { id: target.id, status: "failed", error: error instanceof AdminError ? error.message : "Unable to update this order. Retry after refreshing." };
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(6, body.orders.length) }, worker));
    return { shippedCount: results.filter(row => row.status === "shipped").length,
      alreadyRecordedCount: results.filter(row => row.status === "already_recorded").length,
      failedCount: results.filter(row => row.status === "failed").length, results };
  };
  const confirmReviewedAssociations = async (filters, { ownerReportedManualReview, note, dryRun = false } = {}) => {
    if (ownerReportedManualReview !== true || typeof note !== "string" || !note.trim() || note.length > 1000) throw new AdminError("Record the owner's manual-review statement before bulk confirmation.", 422);
    const candidates = await orders.aggregate([...(await pipeline(filters)),
      { $match: { $expr: { $and: [{ $eq: ["$__purchased", false] }, { $eq: [{ $ifNull: ["$__ops.productConfirmedAt", null] }, null] },
        { $in: ["$__stage", ["unassigned", "processing"]] }] } } }, { $limit: 10001 },
      { $project: { _id: 1, orderId: 1, transactionId: 1, subtotal: 1, __stage: 1, revision: { $ifNull: ["$__ops.revision", 0] }, hasOperations: { $ne: [{ $ifNull: ["$__ops._id", null] }, null] } } }],
    { maxTimeMS: 15000 }).toArray();
    if (candidates.length > 10000) throw new AdminError("Narrow the review period to at most 10,000 records.");
    if (dryRun === true) return { dryRun: true, candidateCount: candidates.length, amountINR: candidates.reduce((sum, row) => sum + Math.round(row.subtotal * 100), 0) / 100, targetStatus: "processing", confirmationSource: "owner_reported_review" };
    let confirmedCount = 0, conflictCount = 0, missingProductCount = 0;
    for (let offset = 0; offset < candidates.length; offset += 100) {
      const writes = [];
      for (const row of candidates.slice(offset, offset + 100)) {
        const productSnapshot = matcher.match(row.subtotal, row.transactionId || row.orderId);
        if (!productSnapshot) { missingProductCount++; continue; }
        const at = now(), id = String(row._id);
        writes.push({ updateOne: { filter: { _id: id, revision: row.revision }, upsert: !row.hasOperations,
          update: { $set: { productSku: productSnapshot.sku, productSnapshot, productConfirmedAt: at,
            productConfirmationSource: "owner_reported_review", fulfillmentStatus: "processing", updatedAt: at },
          $setOnInsert: { orderId: row.orderId, createdAt: at }, $inc: { revision: 1 },
          $push: { history: { at, action: "owner_review_confirmation", from: row.__stage, to: "processing", sku: productSnapshot.sku,
            note: note.trim(), source: "owner_reported_review" } } } } });
      }
      if (!writes.length) continue;
      let result;
      try { result = await operations.bulkWrite(writes, { ordered: false }); }
      catch (error) {
        if (!error.result || !error.writeErrors?.every(entry => entry.code === 11000)) throw error;
        result = error.result;
      }
      const changed = result.modifiedCount + result.upsertedCount;
      confirmedCount += changed; conflictCount += writes.length - changed;
    }
    return { candidateCount: candidates.length, confirmedCount, conflictCount, missingProductCount };
  };
  return { dashboard, detail, update, exportCsv, shipmentPreview, bulkShip, confirmReviewedAssociations };
}
