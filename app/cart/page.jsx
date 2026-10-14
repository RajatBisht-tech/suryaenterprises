"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShieldCheck, ShoppingCart, Trash2 } from "lucide-react";
import Breadcrumbs from "../components/shop/Breadcrumbs";
import EmptyState from "../components/shop/EmptyState";
import ProductImage from "../components/shop/ProductImage";
import QuantityStepper from "../components/shop/QuantityStepper";
import StockBadge from "../components/shop/StockBadge";
import { SITE } from "../config/site";
import { categoryByData } from "../config/taxonomy";
import { removeFromCart, setQty, useCart, useCartHydrated } from "../lib-shop/cart";
import { formatPrice } from "../lib-shop/format";
import { toast } from "../lib-shop/toast";
import { addToWishlist } from "../lib-shop/wishlist";
import { getProduct } from "../products/data/products";

function CartSkeleton() {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px]" aria-busy="true" aria-label="Loading cart">
      <div className="rounded-lg border border-line bg-white p-4">
        {[0, 1].map((i) => (
          <div key={i} className="flex gap-4 border-b border-line py-4 last:border-0">
            <div className="skeleton h-24 w-24" />
            <div className="flex-1">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton mt-2 h-3 w-24" />
              <div className="skeleton mt-4 h-5 w-20" />
            </div>
          </div>
        ))}
      </div>
      <div className="skeleton h-56 rounded-lg" />
    </div>
  );
}

export default function CartPage() {
  const router = useRouter();
  const cart = useCart();
  const hydrated = useCartHydrated();

  // SKUs that are no longer in the catalogue have no index entry: they are
  // skipped here (never crash) and <CartGuard /> removes them from the saved
  // cart with a toast naming the SKU.
  const items = Object.entries(cart)
    .map(([sku, quantity]) => ({ product: getProduct(sku), quantity: Number(quantity) || 0 }))
    .filter((item) => item.product && item.quantity > 0);
  const itemCount = items.reduce((t, i) => t + i.quantity, 0);
  const subtotal = items.reduce((t, i) => t + i.product.price * i.quantity, 0);
  const freeAt = SITE.delivery.freeShippingThreshold;

  return (
    <main className="shell py-3">
      <Breadcrumbs className="mb-2" items={[{ label: "Home", href: "/" }, { label: "Cart" }]} />

      {!hydrated ? (
        <CartSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          actions={[
            { label: "Browse products", href: "/products" },
            { label: "View wishlist", href: "/wishlist" },
          ]}
        >
          <p>Add products to see them here.</p>
        </EmptyState>
      ) : (
        <div className="grid gap-3 pb-20 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:pb-0">
          <section aria-labelledby="cart-title" className="rounded-lg border border-line bg-white">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h1 id="cart-title" className="font-display text-lg font-extrabold text-ink">
                My Cart <span className="font-sans text-sm font-medium text-ink-2">({itemCount} {itemCount === 1 ? "item" : "items"})</span>
              </h1>
              <Link href="/products" className="text-[13px] font-semibold text-brand hover:underline">
                Continue shopping
              </Link>
            </div>
            <ul>
              {items.map(({ product: p, quantity }) => {
                const cat = categoryByData[p.category];
                return (
                  <li key={p.sku} className="flex gap-3 border-b border-line px-4 py-4 last:border-0 sm:gap-5">
                    <div className="flex shrink-0 flex-col items-center gap-3">
                      <Link href={`/p/${p.slug}`} tabIndex={-1} aria-hidden="true" className="block h-20 w-20 sm:h-28 sm:w-28">
                        <ProductImage src={p.image} category={p.category} sizes="112px" frameClassName="h-full w-full rounded-md" className="p-1" />
                      </Link>
                      <QuantityStepper
                        value={quantity}
                        min={1}
                        max={p.stock}
                        size="touch"
                        itemName={p.name}
                        onChange={(next) => setQty(p.sku, next, p.stock)}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/p/${p.slug}`} className="line-clamp-2 text-[14px] font-medium text-ink hover:text-brand">
                        {p.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-ink-2">
                        {p.unit}
                        {cat ? <> · {cat.name}</> : null}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-2">Seller: {SITE.name}</p>
                      <div className="mt-2 flex flex-wrap items-baseline gap-2 tabular-nums">
                        <span className="text-lg font-bold text-ink">{formatPrice(p.price * quantity)}</span>
                        {quantity > 1 && <span className="text-xs text-ink-2">{formatPrice(p.price)} each</span>}
                      </div>
                      <StockBadge stock={p.stock} />
                      <div className="mt-2 flex flex-wrap gap-x-3 text-[13px] font-semibold uppercase tracking-wide">
                        <button
                          type="button"
                          onClick={() => {
                            addToWishlist(p.sku);
                            removeFromCart(p.sku);
                            toast(`Saved for later: ${p.name}`, { action: { label: "Wishlist", href: "/wishlist" } });
                          }}
                          aria-label={`Save ${p.name} for later`}
                          className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded px-2 text-ink hover:text-brand lg:min-h-9"
                        >
                          <Heart className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                          Save for later
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            removeFromCart(p.sku);
                            toast(`Removed ${p.name} from cart`);
                          }}
                          className="inline-flex min-h-11 items-center gap-1.5 rounded px-2 text-ink hover:text-danger lg:min-h-9"
                          aria-label={`Remove ${p.name} from cart`}
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="hidden justify-end border-t border-line px-4 py-3 lg:flex">
              <Link href="/checkout" className="btn btn-buy h-12 px-10 text-[15px]">
                Place order
              </Link>
            </div>
          </section>

          <aside aria-labelledby="price-title" className="space-y-3 lg:sticky lg:top-[calc(var(--header-h)+12px)]">
            <section className="rounded-lg border border-line bg-white">
              <h2 id="price-title" className="border-b border-line px-4 py-3 text-xs font-bold uppercase tracking-wider text-ink-2">
                Price details
              </h2>
              <dl className="space-y-3 px-4 py-4 text-[14px] tabular-nums">
                <div className="flex justify-between">
                  <dt>
                    Price ({itemCount} {itemCount === 1 ? "item" : "items"})
                  </dt>
                  <dd>{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Delivery charges</dt>
                  <dd className="text-ink-2">{SITE.delivery.cartDeliveryLabel}</dd>
                </div>
                <div className="flex justify-between border-t border-dashed border-line pt-3 text-base font-bold text-ink">
                  <dt>Total amount</dt>
                  <dd>{formatPrice(subtotal)}</dd>
                </div>
              </dl>
              {freeAt ? (
                <p className="border-t border-line px-4 py-3 text-xs font-medium text-brand">
                  {subtotal >= freeAt
                    ? "Your order qualifies for free delivery."
                    : `Add ${formatPrice(freeAt - subtotal)} more for free delivery.`}
                </p>
              ) : null}
            </section>
            <p className="flex items-start gap-2 px-1 text-xs text-ink-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-brand" strokeWidth={1.75} aria-hidden="true" />
              Safe and secure payments — UPI via PayU.
            </p>
          </aside>

          {/* Mobile sticky place-order bar (above the bottom nav) */}
          <div className="fixed inset-x-0 bottom-[var(--bottom-nav-h)] z-40 flex items-center justify-between gap-3 border-t border-line bg-white px-3 py-2 lg:hidden">
            <div className="tabular-nums">
              <p className="text-lg font-bold leading-tight text-ink">{formatPrice(subtotal)}</p>
              <a href="#price-title" className="text-xs font-semibold text-brand">
                View price details
              </a>
            </div>
            <button type="button" onClick={() => router.push("/checkout")} className="btn btn-buy h-11 px-8">
              Place order
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
