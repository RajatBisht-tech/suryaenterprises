"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowDownToLine, ArrowRight, ArrowUpRight, BarChart3, CalendarDays,
  Check, CheckCircle2, ChevronLeft, ChevronRight, CircleHelp, Clock3,
  Copy, Eye, EyeOff, LayoutDashboard, LoaderCircle, LockKeyhole, LogOut,
  Menu, Package, PackageCheck, RefreshCw, Search, ShieldCheck, ShoppingBag,
  Sprout, Truck, TriangleAlert, X,
} from "lucide-react";
import BrandLogo from "../components/shop/BrandLogo";
import { maskMobile as maskedMobile, parseIndianMobile as normalizedMobile } from "../lib-admin/mobile.mjs";
import styles from "./admin.module.css";

const STAGES = ["unassigned", "processing", "packed", "shipped", "delivered", "on_hold", "cancelled", "returned"];
const STAGE_LABELS = { unassigned: "Needs confirmation", processing: "Processing", packed: "Packed", shipped: "Shipped", delivered: "Delivered", on_hold: "On hold", cancelled: "Cancelled", returned: "Returned" };
const moneyFormatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const compactFormatter = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });
const integerFormatter = new Intl.NumberFormat("en-IN");
const money = (value) => moneyFormatter.format(Number(value) || 0);
const count = (value) => integerFormatter.format(Number(value) || 0);
const timestamp = (value, options = {}) => {
  if (!value || Number.isNaN(new Date(value).getTime())) return "Not recorded";
  return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", ...options }).format(new Date(value));
};
const indiaToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const dateLabel = (value) => {
  const date = new Date(`${value}T00:00:00+05:30`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" }).format(date);
};
const paymentReference = (order) => order.paymentId || order.transactionId || order.orderId || order.id;

class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

async function requestJson(path, options = {}) {
  const controller = new AbortController();
  const { signal, timeoutMs = 18000, ...rest } = options;
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timer = setTimeout(abort, timeoutMs);
  try {
    const response = await fetch(path, { cache: "no-store", credentials: "same-origin", ...rest, signal: controller.signal });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.ok === false) {
      const fallback = response.status === 429 ? "Too many attempts. Please wait a moment before trying again." : response.status === 401 ? "Your access has expired. Enter your key to continue." : response.status === 409 ? "This order changed in another session. Reload it before saving again." : "Your request couldn’t be completed. Please try again.";
      throw new ApiError(typeof payload.error === "string" ? payload.error : payload.message || fallback, response.status);
    }
    return payload;
  } catch (error) {
    if (signal?.aborted) throw error;
    if (error.name === "AbortError") throw new ApiError("The request took too long. Please try again.", 408);
    if (error instanceof ApiError) throw error;
    throw new ApiError("We couldn’t connect to your records. Check your connection and try again.", 0);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}

function IconButton({ label, children, ...props }) {
  return <button type="button" className={styles.iconButton} aria-label={label} title={label} {...props}>{children}</button>;
}

function StatusBadge({ status }) {
  return <span className={`${styles.statusBadge} ${styles[`status_${status}`] || ""}`}><span />{STAGE_LABELS[status] || "Unassigned"}</span>;
}

function ProductThumb({ src, name, large = false }) {
  return <span className={`${styles.productThumb} ${large ? styles.productThumbLarge : ""}`}>
    {/* Catalog photos retain their native compressed format. */}
    {src ? <Image src={src} alt={name || "Product"} width={72} height={72} unoptimized loading="lazy" /> : <Package size={large ? 27 : 20} aria-label="No product image recorded" />}
  </span>;
}

function Dialog({ children, className, labelledBy, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);
  return <dialog ref={ref} className={className} aria-labelledby={labelledBy} onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose(); } }}>{children}</dialog>;
}

function AccessScreen({ configured, initialError, onAuthenticated, onRetry }) {
  const [key, setKey] = useState("");
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(initialError || "");
  async function submit(event) {
    event.preventDefault();
    if (!key.trim() || pending) return;
    setPending(true);
    setError("");
    try {
      await requestJson("/admin-api/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key }) });
      setKey("");
      onAuthenticated();
    } catch (failure) {
      setError(failure.status === 401 ? "That access key wasn’t recognised. Please try again." : failure.message);
    } finally { setPending(false); }
  }
  return <main className={styles.accessPage}>
    <div className={styles.accessTop}><BrandLogo width={206} href="/" priority /><Link href="/" className={styles.textLink}>Back to storefront <ArrowUpRight size={15} /></Link></div>
    <section className={styles.accessCard} aria-labelledby="access-heading">
      <span className={styles.accessIcon}><LockKeyhole size={25} strokeWidth={1.6} /></span>
      <p className={styles.eyebrow}>SURYA OPERATIONS</p>
      <h1 id="access-heading">Your business,<br />in clear view.</h1>
      <p className={styles.accessIntro}>Collections, orders and fulfillment.<br />Enter your owner access key to continue.</p>
      {configured === false ? <div className={styles.configurationNotice}><TriangleAlert size={19} /><div><strong>Owner access isn’t enabled yet</strong><p>Ask your workspace administrator to complete setup, then try again.</p><button className={styles.textButton} onClick={onRetry}>Check again <RefreshCw size={13} /></button></div></div> : <form onSubmit={submit} className={styles.accessForm}>
        <label htmlFor="owner-key">Owner access key</label>
        <div className={styles.keyField}><input id="owner-key" type={visible ? "text" : "password"} value={key} onChange={(event) => setKey(event.target.value)} placeholder="Enter your access key" autoComplete="off" autoCapitalize="none" spellCheck={false} required disabled={pending} aria-describedby={error ? "access-error" : "access-hint"} /><IconButton label={visible ? "Hide access key" : "Show access key"} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</IconButton></div>
        <p id="access-hint" className={styles.fieldHint}>This workspace is for the business owner.</p>
        {error && <p role="alert" id="access-error" className={styles.inlineError}><TriangleAlert size={15} />{error}</p>}
        <button className={`${styles.primaryButton} ${styles.accessSubmit}`} disabled={pending || !key.trim()}>{pending ? <LoaderCircle size={17} className={styles.spin} /> : null}{pending ? "Opening workspace…" : "Open workspace"}{!pending && <ArrowRight size={17} />}</button>
      </form>}
      <div className={styles.accessSecure}><ShieldCheck size={15} /><span>Private access. Your records stay protected.</span></div>
    </section>
    <p className={styles.accessFooter}>SURYA ENTERPRISES <span>·</span> OWNER WORKSPACE</p>
  </main>;
}

function CollectionsChart({ series }) {
  const points = Array.isArray(series) ? series : [];
  const total = points.reduce((sum, day) => sum + Number(day.amount || 0), 0);
  const maxAmount = Math.max(...points.map((day) => Number(day.amount || 0)), 1);
  const scaleMax = maxAmount <= 1000 ? Math.ceil(maxAmount / 250) * 250 : Math.ceil(maxAmount / 1000) * 1000;
  const width = 650, height = 190, left = 60, right = 18, top = 14, bottom = 32;
  const plotWidth = width - left - right, plotHeight = height - top - bottom;
  const step = plotWidth / Math.max(points.length, 1), barWidth = Math.min(step * 0.46, 36);
  return <section className={`${styles.panel} ${styles.chartPanel}`} aria-labelledby="collections-heading">
    <div className={styles.panelHeading}><div><h2 id="collections-heading">Collections over time</h2><p>Last 7 days · Indian Standard Time</p></div><span className={styles.chartTotal}>{money(total)}<small>7-day collections</small></span></div>
    {points.length ? <div className={styles.chartWrap}><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Collections over the last 7 days: ${points.map((day) => `${dateLabel(day.date)}, ${money(day.amount)}, ${count(day.count)} payments`).join("; ")}`}>
      {[0, 0.5, 1].map((fraction) => { const y = top + plotHeight * (1 - fraction); return <g key={fraction}><line x1={left} x2={width - right} y1={y} y2={y} className={styles.chartGrid} /><text x={left - 12} y={y + 4} textAnchor="end" className={styles.chartTick}>{fraction === 0 ? "₹0" : `₹${compactFormatter.format(scaleMax * fraction)}`}</text></g>; })}
      {points.map((day, index) => { const x = left + step * (index + 0.5), barHeight = (Number(day.amount || 0) / scaleMax) * plotHeight; return <g key={day.date}><rect x={x - barWidth / 2} y={top + plotHeight - Math.max(barHeight, 1)} width={barWidth} height={Math.max(barHeight, 1)} rx="3" className={styles.chartBar}><title>{dateLabel(day.date)}: {money(day.amount)} · {count(day.count)} payments</title></rect><text x={x} y={height - 10} textAnchor="middle" className={styles.chartTick}>{dateLabel(day.date)}</text></g>; })}
    </svg></div> : <div className={styles.chartEmpty}><BarChart3 size={26} /><p>No collection history available yet.</p></div>}
    <div className={styles.chartLegend}><span /><span>Confirmed collections</span></div>
  </section>;
}

function FulfillmentBreakdown({ counts, onFilter }) {
  const values = counts || {};
  const total = STAGES.reduce((sum, stage) => sum + Number(values[stage] || 0), 0);
  const active = STAGES.filter((stage) => Number(values[stage] || 0) > 0);
  const visible = active.length ? active : ["unassigned", "processing", "packed", "shipped", "delivered"];
  return <section className={`${styles.panel} ${styles.breakdownPanel}`} aria-labelledby="fulfillment-heading">
    <div className={styles.panelHeading}><div><h2 id="fulfillment-heading">Fulfillment status</h2><p>Orders in the selected period</p></div><PackageCheck size={20} className={styles.mutedIcon} /></div>
    <div className={styles.breakdownTotal}>{count(total)} <span>orders</span></div>
    <div className={styles.breakdownBar} aria-hidden="true">{total ? active.map((stage) => <span key={stage} className={styles[`segment_${stage}`]} style={{ width: `${Number(values[stage]) / total * 100}%` }} />) : <span className={styles.emptySegment} />}</div>
    <div className={styles.breakdownList}>{visible.map((stage) => <button key={stage} onClick={() => onFilter(stage)}><span className={`${styles.stageDot} ${styles[`segment_${stage}`]}`} /><span>{STAGE_LABELS[stage]}</span><strong>{count(values[stage])}</strong><ChevronRight size={13} /></button>)}</div>
  </section>;
}

function DashboardSkeleton() {
  return <div className={styles.skeletonGroup} role="status" aria-label="Loading collection records"><div className={styles.skeletonKpis}>{[0, 1, 2, 3].map((item) => <div key={item} className={styles.skeletonKpi}><span /><strong /><span /></div>)}</div><div className={styles.skeletonCharts}><div /><div /></div><div className={styles.skeletonTable}>{[0, 1, 2, 3, 4].map((item) => <div key={item} />)}</div><span className="sr-only">Loading your records…</span></div>;
}

function OrdersTable({ data, loading, query, onSearch, status, onStatus, onView, onPage, view }) {
  const { orders = [], pagination = {} } = data;
  const totalPages = Math.max(Number(pagination.pages) || 1, 1);
  const currentPage = Number(pagination.page) || 1;
  const start = orders.length ? (currentPage - 1) * (Number(pagination.limit) || 20) + 1 : 0;
  const end = start ? start + orders.length - 1 : 0;
  return <section className={`${styles.panel} ${styles.ordersPanel}`} aria-labelledby="orders-heading">
    <div className={styles.tableHeading}><div><h2 id="orders-heading">{view === "fulfillment" ? "Fulfillment queue" : "Payment & order records"} <span className={styles.countPill}>{count(pagination.total)}</span></h2><p>Match payments. Confirm products. Move orders forward.</p></div><span className={styles.paidOnly}><CheckCircle2 size={14} />Confirmed payments</span></div>
    <div className={styles.tableTools}><div className={styles.searchField}><Search size={17} /><label htmlFor="order-search" className="sr-only">Search payment, order ID, UTR or customer</label><input id="order-search" placeholder="Search payment, order ID, UTR or customer…" value={query} onChange={(event) => onSearch(event.target.value)} /><span className={styles.searchHint}>Search records</span></div><label className={styles.statusSelect}><span className="sr-only">Fulfillment status</span><select value={status} onChange={(event) => onStatus(event.target.value)}><option value="all">All fulfillment statuses</option>{STAGES.map((stage) => <option key={stage} value={stage}>{STAGE_LABELS[stage]}</option>)}</select></label></div>
    <div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Payment records, scroll horizontally for more columns" aria-busy={loading}><table className={styles.table}><thead><tr><th>PAYMENT / ORDER ID</th><th>CUSTOMER</th><th className={styles.amountCell}>COLLECTED</th><th>UTR REFERENCE</th><th>PRODUCT ASSOCIATION</th><th>FULFILLMENT</th><th>RECORDED</th><th><span className="sr-only">View order</span></th></tr></thead><tbody>
      {orders.map((order) => { const product = order.assignment === "approximate" ? order.catalogMatch : order.items?.[0] || order.catalogMatch; return <tr key={order.id}>
        <td><button className={styles.paymentLink} onClick={() => onView(order)}>{paymentReference(order)}</button><span className={styles.orderSubline}>Order <code>{order.externalOrderId || order.orderId || "Not recorded"}</code></span></td>
        <td><span className={styles.customerName}>{order.customer?.name || "Name not recorded"}</span><span className={styles.cellSubline}>{maskedMobile(order.customer?.phone) || order.customer?.email || "Contact not recorded"}</span></td>
        <td className={styles.amountCell}><strong className={styles.tableAmount}>{money(order.amount)}</strong><span className={styles.cellSubline}>Paid</span></td>
        <td><code className={styles.utr}>{order.utr || "—"}</code>{!order.utr && <span className={styles.cellSubline}>Not recorded</span>}</td>
        <td><div className={styles.tableProduct}><ProductThumb src={product?.image} name={product?.name} /><div><span className={styles.productName}>{product?.name || (product?.sku ? `SKU ${product.sku} (no longer in catalogue)` : "Product not recorded")}</span>{order.assignment !== "approximate" && <span className={styles.cellSubline}>{order.assignment === "confirmed" ? "Owner confirmed" : order.items?.length ? `${order.items.length} purchased ${order.items.length === 1 ? "item" : "items"}` : "Awaiting product details"}</span>}</div></div></td>
        <td><StatusBadge status={order.fulfillmentStatus} /></td><td><span className={styles.recordedDate}>{timestamp(order.paidAt || order.createdAt, { hour: undefined, minute: undefined, year: undefined })}</span><span className={styles.cellSubline}>{timestamp(order.paidAt || order.createdAt, { day: undefined, month: undefined, year: undefined })} IST</span></td>
        <td><IconButton label={`View payment ${paymentReference(order)}`} onClick={() => onView(order)}><ArrowUpRight size={17} /></IconButton></td>
      </tr>; })}
    </tbody></table></div>
    {!orders.length && <div className={styles.emptyOrders}><span><ShoppingBag size={29} strokeWidth={1.5} /></span><h3>{query || status !== "all" ? "No records match these filters" : "No confirmed payments in this period"}</h3><p>{query || status !== "all" ? "Try another payment reference, customer or fulfillment status." : "Confirmed collections will appear here when a payment is recorded. Choose another period to see earlier records."}</p></div>}
    <div className={styles.tableFooter}><span>{count(start)}–{count(end)} of {count(pagination.total)} records</span><div className={styles.pagination}><IconButton label="Previous page" disabled={loading || currentPage <= 1} onClick={() => onPage(currentPage - 1)}><ChevronLeft size={16} /></IconButton><span>Page <strong>{currentPage}</strong> of {totalPages}</span><IconButton label="Next page" disabled={loading || currentPage >= totalPages} onClick={() => onPage(currentPage + 1)}><ChevronRight size={16} /></IconButton></div></div>
  </section>;
}

function BulkShipmentDialog({ filterString, onClose, onChange, onUnauthorized }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [needsReload, setNeedsReload] = useState(false);
  const [carrier, setCarrier] = useState("DTDC");
  const [tracking, setTracking] = useState("");
  const [note, setNote] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [result, setResult] = useState(null);

  const loadPreview = useCallback(async (signal) => {
    setLoading(true); setError(""); setAcknowledged(false);
    try {
      const response = await requestJson(`/admin-api/bulk-shipment?${filterString}`, { signal });
      setPreview(response); setNeedsReload(false); setResult(null); setTracking(""); setNote("");
    } catch (failure) {
      if (signal?.aborted) return;
      setNeedsReload(true);
      if (failure.status === 401) onUnauthorized();
      else setError(failure.message);
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [filterString, onUnauthorized]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => loadPreview(controller.signal), 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [loadPreview]);

  const batchLimit = Math.min(Number(preview?.maxBatch) || 100, 100);
  const candidates = Array.isArray(preview?.candidates) ? preview.candidates.slice(0, batchLimit) : [];
  const locked = loading || pending;
  const canSubmit = !locked && !needsReload && !result && candidates.length > 0 && carrier.trim() && tracking.trim() && acknowledged;
  async function submit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    setPending(true); setError("");
    try {
      const response = await requestJson("/admin-api/bulk-shipment", { method: "POST", timeoutMs: 55000, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orders: candidates, carrier: carrier.trim(), trackingId: tracking.trim(), note: note.trim() }) });
      setResult(response); setAcknowledged(false); onChange();
    } catch (failure) {
      if (failure.status === 401) onUnauthorized();
      else { setNeedsReload(true); setAcknowledged(false); setError(`${failure.message} Refresh the batch preview to check current records before trying again.`); }
    } finally { setPending(false); }
  }

  return <Dialog className={styles.bulkDialog} labelledBy="bulk-shipment-heading" onClose={() => { if (!pending) onClose(); }}>
    <div className={styles.drawerHeader}><div><p className={styles.eyebrow}>BATCH DISPATCH</p><h2 id="bulk-shipment-heading">Bulk shipment</h2></div><IconButton label="Close bulk shipment" onClick={onClose} disabled={pending}><X size={21} /></IconButton></div>
    <div className={styles.bulkBody}>
      <div className={styles.bulkScope}><CalendarDays size={16} /><div><strong>{preview?.periodLabel || "Current filtered records"}</strong><p>Your current date, search and fulfillment filters apply across all pages.</p></div></div>
      {loading && <div className={styles.drawerLoading} role="status"><LoaderCircle size={16} className={styles.spin} />Checking eligible orders…</div>}
      {error && <div className={styles.drawerError} role="alert"><TriangleAlert size={16} /><span>{error}</span><button className={styles.textButton} onClick={() => loadPreview()} disabled={locked}>Refresh batch preview</button></div>}
      {preview && <>
        <dl className={styles.batchCounts}>
          <div><dt>Matching records</dt><dd>{count(preview.matchedCount)}</dd></div><div className={styles.eligibleCount}><dt>Eligible to ship</dt><dd>{count(preview.eligibleCount)}</dd></div><div><dt>Need product confirmation</dt><dd>{count(preview.unconfirmedCount)}</dd></div><div><dt>Already shipped</dt><dd>{count(preview.alreadyShippedCount)}</dd></div><div><dt>Other fulfillment stages</dt><dd>{count(preview.otherStageCount)}</dd></div>
        </dl>
        <div className={styles.bulkEligibility}><ShieldCheck size={17} /><div><strong>Only confirmed products are eligible</strong><p>Purchased or owner-confirmed products in Processing or Packed can be shipped. Unconfirmed payments need product confirmation and are skipped.</p></div></div>
        {(preview.capped || Number(preview.eligibleCount) > candidates.length) && <p className={styles.batchLimit}><TriangleAlert size={14} />This batch includes the first {count(candidates.length)} eligible orders. A maximum of {count(batchLimit)} orders can be submitted per batch.</p>}
        {result ? <section className={styles.batchResult} aria-labelledby="batch-result-heading" role="status"><h3 id="batch-result-heading">Batch shipment results</h3><div className={styles.batchResultCounts}><span><strong>{count(result.shippedCount)}</strong> marked shipped</span><span><strong>{count(result.alreadyRecordedCount)}</strong> already recorded</span><span><strong>{count(result.failedCount)}</strong> not updated</span></div><p>These counts reflect the server’s recorded results. Refresh the preview to review any remaining eligible orders.</p>{result.results?.length > 0 && <details className={styles.batchResultDetails}><summary>View results for {count(result.results.length)} orders</summary><ul>{result.results.map((entry, index) => <li key={`${entry.id}-${index}`}><code>{entry.id}</code><span>{String(entry.status || "Not recorded").replaceAll("_", " ")}</span>{entry.error && <p>{entry.error}</p>}</li>)}</ul></details>}<button className={styles.secondaryButton} onClick={() => loadPreview()} disabled={locked}>Refresh batch preview <RefreshCw size={14} /></button></section> : <form className={styles.bulkForm} onSubmit={submit}>
          <div className={styles.shipmentFields}><label>Carrier *<input value={carrier} onChange={(event) => setCarrier(event.target.value)} placeholder="Carrier name" maxLength={100} required disabled={locked || needsReload} /></label><label>Consignment / tracking ID *<input value={tracking} onChange={(event) => setTracking(event.target.value)} placeholder="Enter the real consignment number" maxLength={120} required disabled={locked || needsReload} /></label></div>
          <label>Dispatch note <span>(optional)</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a note to each order’s shipment history" maxLength={1000} rows={2} disabled={locked || needsReload} /></label>
          <label className={styles.batchAcknowledgement}><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} disabled={locked || needsReload || candidates.length === 0} /><span>I confirm that these <strong>{count(candidates.length)} eligible orders</strong> are part of this real shipment and the carrier and consignment details are correct.</span></label>
          {!candidates.length && !loading && <p className={styles.batchNoEligible}>No orders in these filters are eligible for bulk shipment. Confirm product associations or choose another period or fulfillment status.</p>}
          <button className={styles.primaryButton} disabled={!canSubmit}>{pending ? <LoaderCircle size={16} className={styles.spin} /> : <Truck size={16} />}{pending ? "Recording shipments…" : `Mark ${count(candidates.length)} orders shipped`}</button>
        </form>}
      </>}
    </div>
    <div className={styles.drawerFooter}><span><ShieldCheck size={13} />Shipment updates are saved in each order’s history</span><button className={styles.secondaryButton} onClick={onClose} disabled={pending}>{result ? "Done" : "Close"}</button></div>
  </Dialog>;
}

export default function AdminConsole() {
  const [session, setSession] = useState(null);
  const [sessionError, setSessionError] = useState("");
  const [view, setView] = useState("overview");
  const [range, setRange] = useState("today");
  const [from, setFrom] = useState(indiaToday);
  const [to, setTo] = useState(indiaToday);
  const [draftFrom, setDraftFrom] = useState(indiaToday);
  const [draftTo, setDraftTo] = useState(indiaToday);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [exporting, setExporting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [selected, setSelected] = useState(null);
  const [bulkShipmentOpen, setBulkShipmentOpen] = useState(false);
  const requestSequence = useRef(0);

  const resetPrivateState = useCallback(() => {
    requestSequence.current += 1;
    setData(null); setSelected(null); setBulkShipmentOpen(false); setQuery(""); setSearch(""); setStatus("all"); setPage(1); setRange("today"); setView("overview"); setError(""); setNotice(""); setLoading(false); setMobileMenu(false);
    setSession({ authenticated: false, configured: true });
  }, []);

  const handleUnauthorized = useCallback(() => { resetPrivateState(); setSessionError("Your access has expired. Enter your key to continue."); }, [resetPrivateState]);

  const checkSession = useCallback(async () => {
    try { const result = await requestJson("/admin-api/session"); setSessionError(""); setSession(result); }
    catch (failure) { setSessionError(failure.message); setSession({ authenticated: false, configured: failure.status === 503 ? false : true }); }
  }, []);
  useEffect(() => { const timer = setTimeout(checkSession, 0); return () => clearTimeout(timer); }, [checkSession]);
  useEffect(() => { const timer = setTimeout(() => { setSearch(query.trim()); setPage(1); }, 350); return () => clearTimeout(timer); }, [query]);

  const filters = new URLSearchParams({ range, q: search, fulfillment: status, page: String(page), limit: "20" });
  if (range === "custom") { filters.set("from", from); filters.set("to", to); }
  const filterString = filters.toString();
  const loadDashboard = useCallback(async (signal) => {
    const sequence = ++requestSequence.current;
    setLoading(true); setError("");
    try {
      const result = await requestJson(`/admin-api/dashboard?${filterString}`, { signal });
      if (sequence === requestSequence.current) setData(result);
    } catch (failure) {
      if (signal?.aborted || sequence !== requestSequence.current) return;
      if (failure.status === 401) { resetPrivateState(); setSessionError("Your access has expired. Enter your key to continue."); }
      else setError(failure.message);
    } finally { if (sequence === requestSequence.current) setLoading(false); }
  }, [filterString, resetPrivateState]);
  useEffect(() => {
    if (!session?.authenticated) return;
    const controller = new AbortController();
    const timer = setTimeout(() => loadDashboard(controller.signal), 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [session?.authenticated, loadDashboard]);

  function changeView(next) { setView(next); setStatus(next === "fulfillment" ? "processing" : "all"); setPage(1); setMobileMenu(false); }
  function changeStatus(next) { setStatus(next); setPage(1); }
  async function logout() {
    setLoggingOut(true);
    try { await requestJson("/admin-api/session", { method: "DELETE" }); resetPrivateState(); }
    catch (failure) { setNotice(`Couldn’t sign out: ${failure.message}`); }
    finally { setLoggingOut(false); }
  }
  async function exportCsv() {
    setExporting(true); setNotice("");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 18000);
    try {
      const response = await fetch(`/admin-api/export?${filterString}`, { cache: "no-store", credentials: "same-origin", signal: controller.signal });
      if (response.status === 401) { resetPrivateState(); setSessionError("Your access has expired. Enter your key to continue."); return; }
      if (!response.ok) throw new Error("The export couldn’t be prepared. Please try again.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = `surya-collections-${range}-${indiaToday()}.csv`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("Your CSV export is ready.");
    } catch (failure) { setNotice(failure.name === "AbortError" ? "The export took too long. Please try again." : failure.message); }
    finally { clearTimeout(timer); setExporting(false); }
  }

  if (!session) return <main className={styles.sessionLoading}><BrandLogo width={206} href={null} /><span className={styles.loadingLabel}><LoaderCircle size={17} className={styles.spin} />Opening your workspace…</span></main>;
  if (!session.authenticated) return <AccessScreen key={sessionError} configured={session.configured} initialError={sessionError} onAuthenticated={() => { setSessionError(""); setSession({ authenticated: true, configured: true }); }} onRetry={checkSession} />;

  const summary = data?.summary;
  const awaiting = Number(summary?.awaitingProductConfirmation) || 0;
  const ready = Number(summary?.fulfillmentCounts?.processing || 0) + Number(summary?.fulfillmentCounts?.packed || 0);
  const sidebar = <>
    <div className={styles.sidebarBrand}><BrandLogo width={176} href="/admin/dashboard" priority /><span>OPERATIONS</span></div>
    <div className={styles.sidebarWorkspace}><span className={styles.workspaceMark}><Sprout size={19} /></span><div><strong>Surya Enterprises</strong><small>Owner workspace</small></div><LockKeyhole size={12} /></div>
    <div className={styles.navCaption}>WORKSPACE</div>
    <nav className={styles.sidebarNav} aria-label="Admin workspace">
      {[{ value: "overview", label: "Overview", icon: LayoutDashboard }, { value: "orders", label: "Orders", icon: ShoppingBag, amount: awaiting }, { value: "fulfillment", label: "Fulfillment", icon: Truck, amount: ready }].map(({ value, label, icon: Icon, amount }) => <button key={value} className={view === value ? styles.activeNav : ""} aria-current={view === value ? "page" : undefined} onClick={() => changeView(value)}><Icon size={18} strokeWidth={1.7} /><span>{label}</span>{amount > 0 && <small>{count(amount)}</small>}</button>)}
    </nav>
    <div className={styles.sidebarBottom}><div className={styles.workspaceNote}><ShieldCheck size={20} /><div><strong>Confirmed collections</strong><p>Every payment. A clear record.</p></div></div><Link href="/" className={styles.sidebarLink}><ArrowUpRight size={17} /><span>Visit storefront</span><ArrowUpRight size={13} /></Link><button className={styles.sidebarLink} onClick={logout} disabled={loggingOut}>{loggingOut ? <LoaderCircle size={17} className={styles.spin} /> : <LogOut size={17} />}<span>{loggingOut ? "Signing out…" : "Sign out"}</span></button><span className={styles.sidebarFootnote}>SURYA ENTERPRISES · PRIVATE ACCESS</span></div>
  </>;

  return <div className={styles.console}>
    <aside className={styles.sidebar}>{sidebar}</aside>
    {mobileMenu && <Dialog className={styles.mobileNavDialog} labelledBy="mobile-nav-heading" onClose={() => setMobileMenu(false)}><div className={styles.mobileNavClose}><span id="mobile-nav-heading">Workspace navigation</span><IconButton label="Close navigation" onClick={() => setMobileMenu(false)}><X size={20} /></IconButton></div>{sidebar}</Dialog>}
    <div className={styles.mainColumn}>
      <header className={styles.topbar}><div className={styles.topbarWorkspace}><button className={`${styles.iconButton} ${styles.mobileMenuButton}`} aria-label="Open workspace navigation" onClick={() => setMobileMenu(true)}><Menu size={21} /></button><span className={styles.topbarIcon}><Sprout size={18} /></span><strong>Business workspace</strong><span className={styles.topbarDivider}>/</span><span className={styles.topbarSection}>{view === "overview" ? "Overview" : view === "orders" ? "Orders" : "Fulfillment"}</span></div><div className={styles.topbarActions}><span className={styles.lastUpdated}><span className={styles.liveDot} />{data?.generatedAt ? `Updated ${timestamp(data.generatedAt, { day: undefined, month: undefined, year: undefined })} IST` : "Private owner access"}</span><IconButton label="Refresh records" onClick={() => loadDashboard()} disabled={loading}><RefreshCw size={17} className={loading ? styles.spin : ""} /></IconButton><span className={styles.ownerAvatar} aria-label="Surya Enterprises owner">SE</span></div></header>
      <main className={styles.content}>
        <div className={styles.pageHeading}><div><p className={styles.eyebrow}>YOUR BUSINESS, AT A GLANCE</p><h1>{view === "overview" ? "Business overview" : view === "orders" ? "Orders & collections" : "Fulfillment"}</h1><p>{view === "overview" ? "A clear view of collections, orders and dispatch." : view === "orders" ? "Reconcile each collection with the right order and product." : "From product confirmation to the customer’s doorstep."}</p></div><div className={styles.pageActions}><button className={styles.secondaryButton} onClick={exportCsv} disabled={exporting || loading || !data}>{exporting ? <LoaderCircle size={16} className={styles.spin} /> : <ArrowDownToLine size={16} />}{exporting ? "Preparing CSV…" : "Export records"}</button><button className={styles.primaryButton} onClick={() => setBulkShipmentOpen(true)} disabled={loading || !data}><Truck size={16} />Bulk shipment</button></div></div>
        <div className={styles.periodToolbar}><div className={styles.periodTabs} role="group" aria-label="Date period">{[{ value: "today", label: "Today" }, { value: "7d", label: "7 days" }, { value: "30d", label: "30 days" }, { value: "all", label: "All time" }, { value: "custom", label: "Custom", icon: true }].map(({ value, label, icon }) => <button key={value} className={range === value ? styles.activePeriod : ""} aria-pressed={range === value} onClick={() => { setRange(value); setPage(1); }}>{icon && <CalendarDays size={13} />}{label}</button>)}</div><span className={styles.periodLabel}><CalendarDays size={14} />{data?.period?.label || "All dates use Indian Standard Time"}</span></div>
        {range === "custom" && <form className={styles.customDates} onSubmit={(event) => { event.preventDefault(); if (draftFrom && draftTo && draftFrom <= draftTo) { setFrom(draftFrom); setTo(draftTo); setPage(1); } }}><label>From<input type="date" value={draftFrom} max={draftTo} onChange={(event) => setDraftFrom(event.target.value)} required /></label><label>To<input type="date" value={draftTo} min={draftFrom} onChange={(event) => setDraftTo(event.target.value)} required /></label><button className={styles.secondaryButton} disabled={!draftFrom || !draftTo || draftFrom > draftTo}>Apply dates</button></form>}
        {notice && <div className={styles.notice} role="status"><CircleHelp size={17} /><span>{notice}</span><IconButton label="Dismiss notification" onClick={() => setNotice("")}><X size={15} /></IconButton></div>}
        {error && <div className={styles.errorBanner} role="alert"><TriangleAlert size={19} /><div><strong>{data ? "Records couldn’t be refreshed" : "Your records couldn’t be loaded"}</strong><p>{error}{data && " Your last loaded records are still shown below."}</p></div><button className={styles.secondaryButton} onClick={() => loadDashboard()} disabled={loading}>Try again</button></div>}
        {!data ? loading ? <DashboardSkeleton /> : <div className={styles.initialEmpty}><BarChart3 size={32} /><p>Load your collection records to get started.</p><button className={styles.primaryButton} onClick={() => loadDashboard()}>Load records</button></div> : <div className={`${styles.dataContent} ${loading ? styles.refreshing : ""}`}>
          <section className={styles.kpiStrip} aria-label="Collection summary">
            <div className={`${styles.kpi} ${styles.primaryKpi}`}><div className={styles.kpiLabel}><span>Collected payments</span><span className={styles.kpiIcon}>₹</span></div><strong>{money(summary?.collectedAmount)}</strong><p><CheckCircle2 size={12} />Confirmed collections</p></div>
            <div className={styles.kpi}><div className={styles.kpiLabel}><span>Payments received</span><ShoppingBag size={16} /></div><strong>{count(summary?.paymentCount)}</strong><p>Successful collections in this period</p></div>
            <div className={styles.kpi}><div className={styles.kpiLabel}><span>Average payment</span><BarChart3 size={16} /></div><strong>{money(summary?.averagePayment)}</strong><p>Per confirmed payment</p></div>
            <div className={`${styles.kpi} ${styles.confirmationKpi}`}><div className={styles.kpiLabel}><span>Product confirmation</span><span className={styles.yellowDot} /></div><strong>{count(awaiting)}<small>awaiting</small></strong><p>{awaiting ? <button onClick={() => { setView("orders"); changeStatus("unassigned"); }}>Review products <ArrowRight size={12} /></button> : "No product confirmations pending"}</p></div>
          </section>
          <p className={styles.productSalesCaption}><ShoppingBag size={12} /><span>Recorded storefront product sales: <strong>{money(summary?.realProductSales)}</strong></span><span className={styles.productSalesExplanation}>Orders with actual cart line items only.</span></p>
          {view === "overview" && <div className={styles.insightsGrid}><CollectionsChart series={summary?.daySeries} /><FulfillmentBreakdown counts={summary?.fulfillmentCounts} onFilter={(stage) => { setView("fulfillment"); changeStatus(stage); }} /></div>}
          {awaiting > 0 && <div className={styles.confirmationBanner}><span className={styles.confirmationBannerIcon}><Package size={19} /></span><div><strong>{count(awaiting)} {awaiting === 1 ? "payment needs" : "payments need"} product confirmation</strong><p>Purchased items weren’t recorded for these payments. Confirm the product before packing or shipping.</p></div><button className={styles.textButton} onClick={() => { setView("orders"); changeStatus("unassigned"); }}>Review products <ArrowRight size={14} /></button></div>}
          <OrdersTable data={data} loading={loading} query={query} onSearch={setQuery} status={status} onStatus={changeStatus} onView={setSelected} onPage={setPage} view={view} />
          <footer className={styles.contentFooter}><span><LockKeyhole size={12} />Private owner workspace</span><span>All amounts in INR · All times in IST</span></footer>
        </div>}
      </main>
    </div>
    {selected && <OrderDrawer key={selected.id} initialOrder={selected} onClose={() => setSelected(null)} onChange={() => loadDashboard()} onUnauthorized={handleUnauthorized} />}
    {bulkShipmentOpen && <BulkShipmentDialog filterString={filterString} onClose={() => setBulkShipmentOpen(false)} onChange={() => loadDashboard()} onUnauthorized={handleUnauthorized} />}
  </div>;
}

function shippingAddress(customer = {}) {
  const address = typeof customer.address === "string" ? customer.address : customer.address && typeof customer.address === "object" ? Object.values(customer.address).filter((value) => typeof value === "string").join(", ") : "";
  return [...new Set([address, customer.city, customer.state, customer.pinCode].filter(Boolean))].join(", ");
}

function deliveryAddressFields(customer = {}) {
  const nested = customer.address && typeof customer.address === "object" ? customer.address : {};
  return {
    address: typeof customer.address === "string" ? customer.address : String(nested.address || nested.street || ""),
    city: String(customer.city || nested.city || ""),
    state: String(customer.state || nested.state || ""),
    pinCode: String(customer.pinCode || nested.pinCode || ""),
  };
}
const historicalAddress = (value) => typeof value === "string" ? value : shippingAddress(value || {});
const ADDRESS_SAVED_MESSAGE = "Delivery address saved. The change is in the recorded timeline.";
const MOBILE_SAVED_MESSAGE = "Mobile number updated. The change is in the order timeline.";

const NEXT_STAGES = { unassigned: ["processing"], processing: ["packed", "on_hold", "cancelled"], packed: ["shipped", "on_hold", "cancelled"], shipped: ["delivered", "returned"], delivered: ["returned"], on_hold: ["processing", "cancelled"], cancelled: [], returned: [] };
function historyLabel(entry) {
  const labels = {
    "confirm-product": "Product association confirmed",
    notes: "Owner notes updated",
    customer_address_updated: "Delivery address updated",
    customer_mobile_updated: "Customer mobile updated",
    "correct-status": "Fulfillment status corrected",
    status_correction: "Fulfillment status corrected",
    shipment_recorded: "Shipment recorded",
    owner_review_confirmation: "Owner confirmed product association",
    payment_recorded: "Payment recorded",
    "payment-recorded": "Payment recorded",
  };
  return labels[entry.action] || (entry.action === "fulfillment" ? `Moved to ${STAGE_LABELS[entry.to] || entry.to || "next stage"}` : String(entry.action || "Order updated").replaceAll("-", " ").replaceAll("_", " "));
}

function OrderTimeline({ order, loading }) {
  const history = [...(order.history || [])].reverse().sort((first, second) => (new Date(second.at).getTime() || 0) - (new Date(first.at).getTime() || 0));
  return <section className={styles.detailSection}><div className={styles.detailSectionHeading}><h3>Order timeline</h3><span className={styles.timelineCaption}><Clock3 size={12} />Saved history</span></div>{history.length ? <ol className={styles.timeline}>{history.map((entry, index) => <li key={`${entry.at}-${index}`}><span className={styles.timelineDot} /><div><strong>{historyLabel(entry)}</strong><time>{timestamp(entry.at)} IST</time>{entry.from && entry.to && <p>{STAGE_LABELS[entry.from] || entry.from} → {STAGE_LABELS[entry.to] || entry.to}</p>}{entry.note && <p className={styles.timelineNote}>{entry.note}</p>}{entry.action === "customer_address_updated" && <dl className={styles.timelineAddressChanges}><div><dt>Previous address</dt><dd>{historicalAddress(entry.previousAddress) || "No address recorded"}</dd></div><div><dt>Saved address</dt><dd>{historicalAddress(entry.address) || "No address recorded"}</dd></div></dl>}{entry.action === "customer_mobile_updated" && <dl className={styles.timelineAddressChanges}><div><dt>Previous mobile</dt><dd>{maskedMobile(entry.previousPhone) || "Mobile not recorded"}</dd></div><div><dt>Updated mobile</dt><dd>{maskedMobile(entry.phone) || "Mobile not recorded"}</dd></div></dl>}{(entry.previousShipment?.carrier || entry.previousShipment?.trackingId) && <p className={styles.timelineShipment}>Previous shipment: {[entry.previousShipment.carrier, entry.previousShipment.trackingId].filter(Boolean).join(" · ")}{entry.previousShipment.shippedAt && <time>Shipped {timestamp(entry.previousShipment.shippedAt)} IST</time>}</p>}</div></li>)}</ol> : <p className={styles.fieldHint}>{loading ? "Loading recorded history…" : "No order activity has been recorded yet."}</p>}</section>;
}

function OrderDrawer({ initialOrder, onClose, onChange, onUnauthorized }) {
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [checked, setChecked] = useState(false);
  const [nextStage, setNextStage] = useState(initialOrder.fulfillmentStatus || "unassigned");
  const [carrier, setCarrier] = useState(initialOrder.shipment?.carrier || "");
  const [tracking, setTracking] = useState(initialOrder.shipment?.trackingId || "");
  const [fulfillmentNote, setFulfillmentNote] = useState("");
  const [correctionStatus, setCorrectionStatus] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [addressEditing, setAddressEditing] = useState(false);
  const [addressDraft, setAddressDraft] = useState(() => deliveryAddressFields(initialOrder.customer));
  const [addressNote, setAddressNote] = useState("");
  const [addressValidation, setAddressValidation] = useState(null);
  const [mobileEditing, setMobileEditing] = useState(false);
  const [mobileDraft, setMobileDraft] = useState("");
  const [mobileValidation, setMobileValidation] = useState("");
  const [notes, setNotes] = useState(initialOrder.notes || "");
  const [copied, setCopied] = useState("");
  const copyTimer = useRef(null);
  const id = initialOrder.id;

  const applyOrder = useCallback((updated) => {
    setOrder(updated); setNextStage(updated.fulfillmentStatus || "unassigned"); setCarrier(updated.shipment?.carrier || ""); setTracking(updated.shipment?.trackingId || ""); setNotes(updated.notes || ""); setChecked(false); setFulfillmentNote(""); setCorrectionStatus(""); setCorrectionReason(""); setAddressDraft(deliveryAddressFields(updated.customer)); setAddressNote(""); setAddressValidation(null); setAddressEditing(false); setMobileDraft(""); setMobileValidation(""); setMobileEditing(false);
  }, []);
  const reload = useCallback(async (signal) => {
    setLoading(true); setError("");
    try { const result = await requestJson(`/admin-api/orders/${encodeURIComponent(id)}`, { signal }); applyOrder(result.order); }
    catch (failure) { if (signal?.aborted) return; if (failure.status === 401) onUnauthorized(); else setError(failure.message); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [id, applyOrder, onUnauthorized]);
  useEffect(() => {
    const controller = new AbortController();
    // One load per opened record; parent callbacks need not reload an open drawer.
    const timer = setTimeout(() => reload(controller.signal), 0);
    return () => { clearTimeout(timer); controller.abort(); clearTimeout(copyTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function mutate(action, body) {
    if (pending || loading) return;
    setPending(action); setError(""); setSuccess("");
    try {
      const result = await requestJson(`/admin-api/orders/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ revision: order.revision, action, ...body }) });
      applyOrder(result.order);
      setSuccess(action === "confirm-product" ? "Product confirmed. This order is ready for processing." : action === "notes" ? "Your notes have been saved." : action === "customer-address" ? ADDRESS_SAVED_MESSAGE : action === "customer-mobile" ? MOBILE_SAVED_MESSAGE : action === "correct-status" ? "Status correction saved to the recorded history." : "Fulfillment updated. The change is in the recorded timeline.");
      onChange();
    } catch (failure) { if (failure.status === 401) onUnauthorized(); else setError(failure.status === 409 ? "This order was updated in another session. Reload the latest record before saving." : failure.message); }
    finally { setPending(""); }
  }
  async function copy(value, label) {
    try { await navigator.clipboard.writeText(value); setCopied(label); clearTimeout(copyTimer.current); copyTimer.current = setTimeout(() => setCopied(""), 2000); }
    catch { setError("The reference couldn’t be copied. Select the reference text and copy it manually."); }
  }

  function editAddress() {
    setAddressDraft(deliveryAddressFields(order.customer)); setAddressNote(""); setAddressValidation(null); setSuccess(""); setError(""); setAddressEditing(true);
  }
  function editMobile() {
    setMobileDraft(""); setMobileValidation(""); setSuccess(""); setError(""); setMobileEditing(true);
  }
  function saveMobile(event) {
    event.preventDefault();
    const phone = normalizedMobile(mobileDraft);
    if (!phone) {
      setMobileValidation("Enter ten digits starting with 6–9, with an optional +91 or 91 prefix. Spaces and hyphens are allowed.");
      event.currentTarget.elements.namedItem("customer-mobile")?.focus();
      return;
    }
    setMobileValidation("");
    mutate("customer-mobile", { phone });
  }
  function changeAddressField(field, value) {
    setAddressDraft((current) => ({ ...current, [field]: value })); setAddressValidation(null);
  }
  function saveAddress(event) {
    event.preventDefault();
    const fields = Object.fromEntries(Object.entries(addressDraft).map(([field, value]) => [field, value.trim()]));
    const invalidField = ["address", "city", "state"].find((field) => !fields[field]);
    const validation = invalidField ? { field: invalidField, message: "Enter the street address, city and state confirmed by the customer." } : fields.address.length > 300 ? { field: "address", message: "Keep the street address within 300 characters." } : fields.city.length > 100 ? { field: "city", message: "Keep the city within 100 characters." } : fields.state.length > 100 ? { field: "state", message: "Keep the state within 100 characters." } : !/^[1-9][0-9]{5}$/.test(fields.pinCode) ? { field: "pinCode", message: "Enter a six-digit Indian PIN code starting with 1–9." } : null;
    if (validation) { setAddressValidation(validation); event.currentTarget.elements.namedItem(`delivery-${validation.field}`)?.focus(); return; }
    setAddressValidation(null);
    mutate("customer-address", { address: fields, note: addressNote.trim() });
  }

  const productVerified = order.assignment === "purchased" || order.assignment === "confirmed";
  const currentStage = order.fulfillmentStatus || "unassigned";
  const nextOptions = NEXT_STAGES[currentStage] || [];
  const address = shippingAddress(order.customer);
  const match = order.catalogMatch;
  const shipmentFieldsRequired = nextStage === "shipped";
  const reasonRequired = ["on_hold", "cancelled", "returned"].includes(nextStage);
  const correctionOptions = ["processing", "packed", "on_hold", "cancelled", ...(order.shipment?.shippedAt ? ["returned"] : [])].filter((stage) => stage !== currentStage);
  const locked = loading || Boolean(pending);
  const savedAddress = deliveryAddressFields(order.customer);
  const addressChanged = Object.keys(addressDraft).some((field) => addressDraft[field].trim() !== savedAddress[field].trim());

  return <Dialog className={styles.orderDialog} labelledBy="order-detail-heading" onClose={onClose}>
    <div className={styles.drawerHeader}><div><p className={styles.eyebrow}>PAYMENT & ORDER DETAIL</p><h2 id="order-detail-heading">Order record</h2></div><IconButton label="Close order details" onClick={onClose}><X size={21} /></IconButton></div>
    <div className={styles.drawerBody}>
      <div className={styles.drawerPayment}><div><span className={styles.detailLabel}>CONFIRMED COLLECTION</span><strong>{money(order.amount)}</strong><span className={styles.paidOnly}><CheckCircle2 size={13} />Payment received</span></div><StatusBadge status={currentStage} /></div>
      {loading && <div className={styles.drawerLoading} role="status"><LoaderCircle size={16} className={styles.spin} />Loading the full record…</div>}
      {error && <div className={styles.drawerError} role="alert"><TriangleAlert size={16} /><span>{error}</span><button className={styles.textButton} onClick={() => reload()} disabled={locked}>Reload record</button></div>}
      {success && <div className={styles.drawerSuccess} role="status"><CheckCircle2 size={16} />{success}</div>}
      <OrderTimeline order={order} loading={loading} />
      <section className={styles.detailSection}><h3>Payment references</h3><dl className={styles.referenceList}>
        {(() => {
          const rawProvider = String(order.provider || (
            String(order.paymentId || "").startsWith("order_") || String(order.paymentId || "").startsWith("pay_") ? "razorpay" :
            String(order.transactionId || "").startsWith("T") || String(order.phonepeTransactionId || "").length > 0 ? "phonepe" : "payu"
          )).toLowerCase();
          const providerName = rawProvider === "razorpay" ? "Razorpay" : rawProvider === "phonepe" ? "PhonePe" : rawProvider === "payu" ? "PayU" : "Gateway";
          const txnLabel = `${providerName} transaction ID`;

          return [
            { label: "Payment ID", value: order.paymentId },
            { label: txnLabel, value: order.transactionId },
            { label: "Merchant order ID", value: order.externalOrderId || order.orderId },
            { label: "UTR", value: order.utr },
            { label: "Payment Gateway", value: providerName },
          ].map(({ label, value }) => <div key={label}><dt>{label}</dt><dd><code>{value || "Not recorded"}</code>{value && <IconButton label={`Copy ${label}`} onClick={() => copy(value, label)}>{copied === label ? <Check size={13} /> : <Copy size={13} />}</IconButton>}</dd></div>);
        })()}
        <div><dt>{order.dateBasis === "record_updated" ? "Record last updated" : order.paidAt ? "Paid at" : "Record created"}</dt><dd>{timestamp(order.paidAt || order.createdAt)} IST</dd></div><div><dt>Payment source</dt><dd>{order.source === "storefront" ? "Storefront checkout" : "Payment gateway"}</dd></div>
      </dl>{order.dateBasis === "record_updated" && <p className={styles.fieldHint}>The first payment confirmation time wasn’t saved. This date and period use the historical record’s update timestamp.</p>}</section>
      <section className={styles.detailSection}><h3>Customer & delivery</h3><div className={styles.buyerCard}><strong>{order.customer?.name || "Customer name not recorded"}</strong><div className={styles.buyerContact}><span className={styles.maskedMobile}>{maskedMobile(order.customer?.phone) || "Mobile not recorded"}</span>{order.customer?.email ? order.customer.email.includes("*") ? <span>{order.customer.email}</span> : <a href={`mailto:${order.customer.email}`}>{order.customer.email}</a> : <span>Email not recorded</span>}</div>{address ? <address>{address}</address> : <div className={styles.missingAddress}><TriangleAlert size={15} /><div><strong>Delivery address not recorded</strong><p>Collect and verify the customer’s address before shipping.</p></div></div>}</div>
        <div className={styles.customerActions}>{!mobileEditing && <button className={styles.textButton} onClick={editMobile} disabled={locked || addressEditing}>{maskedMobile(order.customer?.phone) ? "Edit mobile" : "Add mobile"}<ArrowRight size={12} /></button>}{!addressEditing && <button className={styles.textButton} onClick={editAddress} disabled={locked || mobileEditing}>{address ? "Edit delivery address" : "Add delivery address"}<ArrowRight size={12} /></button>}</div>
        {success === MOBILE_SAVED_MESSAGE && <p className={styles.addressSaved} role="status"><CheckCircle2 size={13} />Mobile updated: {maskedMobile(order.customer?.phone)}</p>}
        {mobileEditing && <form className={`${styles.fulfillmentForm} ${styles.mobileEditor}`} onSubmit={saveMobile} noValidate><label htmlFor="customer-mobile">New mobile number *<input id="customer-mobile" name="customer-mobile" type="tel" inputMode="tel" autoComplete="off" value={mobileDraft} onChange={(event) => { setMobileDraft(event.target.value); setMobileValidation(""); }} placeholder="Enter the new mobile number" maxLength={32} required disabled={locked} aria-invalid={Boolean(mobileValidation)} aria-describedby={mobileValidation ? "customer-mobile-error" : "customer-mobile-hint"} /><span id="customer-mobile-hint" className={styles.fieldHint}>Ten digits starting with 6–9. Optional +91 or 91 prefix; spaces and hyphens accepted.</span></label>{mobileValidation && <p id="customer-mobile-error" className={styles.inlineError} role="alert"><TriangleAlert size={14} />{mobileValidation}</p>}{error && <p className={styles.inlineError} role="alert"><TriangleAlert size={14} />{error}</p>}<div className={styles.addressEditorActions}><button className={styles.primaryButton} disabled={locked || !mobileDraft.trim()}>{pending === "customer-mobile" ? <LoaderCircle size={14} className={styles.spin} /> : <CheckCircle2 size={14} />}{pending === "customer-mobile" ? "Saving mobile…" : "Save mobile"}</button><button type="button" className={styles.secondaryButton} disabled={locked} onClick={() => { setMobileEditing(false); setMobileDraft(""); setMobileValidation(""); }}>Cancel</button></div></form>}
        {success === ADDRESS_SAVED_MESSAGE && <p className={styles.addressSaved} role="status"><CheckCircle2 size={13} />Delivery address saved.</p>}
        {addressEditing && <form className={`${styles.fulfillmentForm} ${styles.addressEditor}`} onSubmit={saveAddress} noValidate><p>Use the delivery address confirmed by the customer.</p><label htmlFor="delivery-street">Street address *<textarea id="delivery-street" name="delivery-address" value={addressDraft.address} onChange={(event) => changeAddressField("address", event.target.value)} placeholder="House, street, village or locality" autoComplete="street-address" rows={3} maxLength={300} required disabled={locked} aria-invalid={addressValidation?.field === "address"} aria-describedby={addressValidation?.field === "address" ? "delivery-address-error" : undefined} /></label><div className={styles.addressGrid}><label htmlFor="delivery-city">City / district *<input id="delivery-city" name="delivery-city" value={addressDraft.city} onChange={(event) => changeAddressField("city", event.target.value)} autoComplete="address-level2" maxLength={100} required disabled={locked} aria-invalid={addressValidation?.field === "city"} aria-describedby={addressValidation?.field === "city" ? "delivery-address-error" : undefined} /></label><label htmlFor="delivery-state">State *<input id="delivery-state" name="delivery-state" value={addressDraft.state} onChange={(event) => changeAddressField("state", event.target.value)} autoComplete="address-level1" maxLength={100} required disabled={locked} aria-invalid={addressValidation?.field === "state"} aria-describedby={addressValidation?.field === "state" ? "delivery-address-error" : undefined} /></label></div><label htmlFor="delivery-pin">PIN code *<input id="delivery-pin" name="delivery-pinCode" value={addressDraft.pinCode} onChange={(event) => changeAddressField("pinCode", event.target.value)} placeholder="Six-digit PIN code" autoComplete="postal-code" inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} required disabled={locked} aria-invalid={addressValidation?.field === "pinCode"} aria-describedby={addressValidation?.field === "pinCode" ? "delivery-address-error" : "delivery-pin-hint"} /><span id="delivery-pin-hint" className={styles.fieldHint}>Six digits, starting with 1–9.</span></label><label htmlFor="delivery-note">Address update note <span>(optional)</span><textarea id="delivery-note" value={addressNote} onChange={(event) => setAddressNote(event.target.value)} placeholder="Add context to the saved address history" rows={2} maxLength={1000} disabled={locked} /></label>{addressValidation && <p id="delivery-address-error" className={styles.inlineError} role="alert"><TriangleAlert size={14} />{addressValidation.message}</p>}<div className={styles.addressEditorActions}><button className={styles.primaryButton} disabled={locked || !addressChanged}>{pending === "customer-address" ? <LoaderCircle size={14} className={styles.spin} /> : <CheckCircle2 size={14} />}{pending === "customer-address" ? "Saving address…" : "Save delivery address"}</button><button type="button" className={styles.secondaryButton} disabled={locked} onClick={() => { setAddressEditing(false); setAddressDraft(deliveryAddressFields(order.customer)); setAddressNote(""); setAddressValidation(null); }}>Cancel</button></div></form>}
      </section>
      <section className={styles.detailSection}><div className={styles.detailSectionHeading}><h3>{order.assignment === "approximate" ? "Product association" : "Product details"}</h3>{order.assignment === "confirmed" && <span className={styles.confirmedBadge}><Check size={11} />Owner confirmed</span>}</div>
        {order.assignment === "approximate" && match ? <div className={styles.matchCard}><div className={styles.detailProduct}><ProductThumb src={match.image} name={match.name} large /><div><span className={styles.detailLabel}>{match.category || "PRODUCT ASSOCIATION"}</span><strong>{match.name}</strong><code>{match.sku}</code>{match.unit && <small>{match.unit}</small>}</div></div><div className={styles.priceComparison}><div><span>Payment collected</span><strong>{money(order.amount)}</strong></div><div><span>Catalog price</span><strong>{money(match.price)}</strong></div><div><span>Difference</span><strong>{Number(match.delta) > 0 ? "+" : ""}{money(match.delta)}{Number.isFinite(Number(match.differencePercent)) && <small>{Number(match.differencePercent).toFixed(1)}%</small>}</strong></div></div><p className={styles.matchExplanation}>Product selection is based on payment amount. Purchased items and quantities were not recorded.</p><label className={styles.confirmCheckbox}><input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} disabled={locked} /><span>I have verified that this payment is for <strong>{match.name}</strong>.</span></label><button className={styles.primaryButton} disabled={locked || !checked} onClick={() => mutate("confirm-product", { sku: match.sku })}>{pending === "confirm-product" ? <LoaderCircle size={15} className={styles.spin} /> : <CheckCircle2 size={15} />}{pending === "confirm-product" ? "Confirming…" : "Confirm product association"}</button></div> : order.items?.length ? <div className={styles.purchasedItems}>{order.items.map((item, index) => <div className={styles.purchasedItem} key={`${item.sku}-${index}`}><ProductThumb src={item.image} name={item.name} large /><div><strong>{item.name}</strong><code>{item.sku}</code><span>Quantity {item.quantity} · {money(item.price)} each</span></div><strong>{money(Number(item.quantity) * Number(item.price))}</strong></div>)}</div> : match && order.assignment === "confirmed" ? <div className={styles.confirmedProduct}><div className={styles.detailProduct}><ProductThumb src={match.image} name={match.name} large /><div><strong>{match.name}</strong><code>{match.sku}</code><small>Owner confirmed product association</small></div></div><p className={styles.fieldHint}>This payment doesn’t include an itemized purchase or recorded quantity. Catalog price: {money(match.price)}.</p></div> : <div className={styles.detailEmpty}><Package size={20} /><p>No purchased items or product association were recorded.</p></div>}
      </section>
      <section className={styles.detailSection}><h3>Fulfillment</h3><ol className={styles.fulfillmentSteps}>{["processing", "packed", "shipped", "delivered"].map((stage, index, all) => { const currentIndex = all.indexOf(currentStage); const completed = currentIndex >= index; return <li key={stage} className={completed ? styles.stepComplete : ""}><span>{completed ? <Check size={12} /> : index + 1}</span><small>{STAGE_LABELS[stage]}</small></li>; })}</ol>
        {!productVerified ? <div className={styles.fulfillmentLocked}><LockKeyhole size={16} /><p>Confirm the product association before updating fulfillment.</p></div> : nextOptions.length ? <form className={styles.fulfillmentForm} onSubmit={(event) => { event.preventDefault(); mutate("fulfillment", { status: nextStage, carrier: carrier.trim(), trackingId: tracking.trim(), note: fulfillmentNote.trim() }); }}>
          <label>Next fulfillment stage<select value={nextStage} onChange={(event) => setNextStage(event.target.value)} disabled={locked}><option value={currentStage}>{STAGE_LABELS[currentStage]} (current)</option>{nextOptions.map((stage) => <option key={stage} value={stage}>{STAGE_LABELS[stage]}</option>)}</select></label>
          {(shipmentFieldsRequired || order.shipment?.carrier || order.shipment?.trackingId) && <div className={styles.shipmentFields}><label>Carrier{shipmentFieldsRequired && " *"}<input value={carrier} onChange={(event) => setCarrier(event.target.value)} placeholder="Carrier name" required={shipmentFieldsRequired} disabled={locked} /></label><label>Tracking ID{shipmentFieldsRequired && " *"}<input value={tracking} onChange={(event) => setTracking(event.target.value)} placeholder="Shipment tracking reference" required={shipmentFieldsRequired} disabled={locked} /></label></div>}
          <label>{reasonRequired ? "Update reason *" : "Update note"} {!reasonRequired && <span>(optional)</span>}<textarea value={fulfillmentNote} onChange={(event) => setFulfillmentNote(event.target.value)} placeholder={reasonRequired ? "Explain the reason for this fulfillment change" : "Add context to the recorded timeline"} rows={2} disabled={locked} maxLength={1000} required={reasonRequired} /></label>{["cancelled", "returned"].includes(nextStage) && <p className={styles.fieldHint}>Cancellation and return statuses update fulfillment only. Any refund must be handled separately.</p>}<button className={styles.primaryButton} disabled={locked || nextStage === currentStage || (shipmentFieldsRequired && (!carrier.trim() || !tracking.trim())) || (reasonRequired && !fulfillmentNote.trim())}>{pending === "fulfillment" ? <LoaderCircle size={15} className={styles.spin} /> : <PackageCheck size={15} />}{pending === "fulfillment" ? "Saving update…" : "Update fulfillment"}</button>
        </form> : <p className={styles.fieldHint}>This order is {STAGE_LABELS[currentStage]?.toLowerCase()}. No further fulfillment changes are available.</p>}
        {(order.shipment?.shippedAt || order.shipment?.deliveredAt) && <dl className={styles.shipmentDates}>{order.shipment.shippedAt && <div><dt>Shipped</dt><dd>{timestamp(order.shipment.shippedAt)} IST</dd></div>}{order.shipment.deliveredAt && <div><dt>Delivered</dt><dd>{timestamp(order.shipment.deliveredAt)} IST</dd></div>}</dl>}
        {productVerified && <details className={styles.manualCorrection}><summary>Manual status correction</summary><p>Correct an incorrectly recorded stage. A reason is required and saved in the order history.</p><form className={styles.fulfillmentForm} onSubmit={(event) => { event.preventDefault(); if (correctionStatus && correctionStatus !== currentStage && correctionReason.trim()) mutate("correct-status", { status: correctionStatus, note: correctionReason.trim() }); }}><label>Corrected fulfillment stage *<select value={correctionStatus} onChange={(event) => setCorrectionStatus(event.target.value)} required disabled={locked}><option value="">Choose the correct stage</option>{correctionOptions.map((stage) => <option value={stage} key={stage}>{STAGE_LABELS[stage]}</option>)}</select></label><label>Correction reason *<textarea value={correctionReason} onChange={(event) => setCorrectionReason(event.target.value)} placeholder="Explain why this recorded stage needs correction" maxLength={1000} rows={2} required disabled={locked} /></label>{["processing", "packed"].includes(correctionStatus) && <p className={styles.fieldHint}>Returning to Processing or Packed clears active shipment details. Previous shipment references remain in the recorded history.</p>}{["cancelled", "returned"].includes(correctionStatus) && <p className={styles.fieldHint}>Cancellation and return statuses update fulfillment only. Any refund must be handled separately.</p>}<button className={styles.secondaryButton} disabled={locked || !correctionStatus || correctionStatus === currentStage || !correctionReason.trim()}>{pending === "correct-status" ? <LoaderCircle size={15} className={styles.spin} /> : <RefreshCw size={15} />}{pending === "correct-status" ? "Saving correction…" : "Save status correction"}</button></form></details>}
      </section>
      <section className={styles.detailSection}><h3>Owner notes</h3><form className={styles.notesForm} onSubmit={(event) => { event.preventDefault(); mutate("notes", { notes }); }}><label htmlFor="owner-notes" className="sr-only">Owner notes</label><textarea id="owner-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Add a note for reconciliation or dispatch…" rows={3} maxLength={2000} disabled={locked} /><button className={styles.secondaryButton} disabled={locked || notes === (order.notes || "")}>{pending === "notes" ? <LoaderCircle size={14} className={styles.spin} /> : null}{pending === "notes" ? "Saving…" : "Save notes"}</button></form></section>
      <details className={styles.technicalDetails}><summary>Payment record details</summary><dl className={styles.referenceList}><div><dt>Internal record ID</dt><dd><code>{order.id}</code></dd></div><div><dt>Merchant callback delivery</dt><dd>{typeof order.callbackStatus === "object" && order.callbackStatus !== null ? JSON.stringify(order.callbackStatus) : order.callbackStatus || "Not recorded"}</dd></div><div><dt>Revision</dt><dd>{order.revision ?? "Not recorded"}</dd></div><div><dt>Currency</dt><dd>{order.currency || "INR"}</dd></div></dl></details>
    </div>
    <div className={styles.drawerFooter}><span><ShieldCheck size={13} />Payment records stay unchanged</span><button className={styles.secondaryButton} onClick={onClose}>Close record</button></div>
  </Dialog>;
}
