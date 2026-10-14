"use client";

import { Heart, PackageX, X } from "lucide-react";
import Breadcrumbs from "../components/shop/Breadcrumbs";
import EmptyState from "../components/shop/EmptyState";
import ProductCard from "../components/shop/ProductCard";
import { CardSkeleton } from "../components/shop/Skeletons";
import { removeFromWishlist, useWishlist, useWishlistHydrated } from "../lib-shop/wishlist";
import { getProduct } from "../products/data/products";

export default function WishlistPage() {
  const skus = useWishlist();
  const hydrated = useWishlistHydrated();
  // A saved SKU that is no longer in the catalogue (product removed) is shown
  // by its SKU with a remove button instead of a card.
  const entries = skus.map((sku) => ({ sku, product: getProduct(sku) ?? null }));

  return (
    <main className="shell py-3">
      <Breadcrumbs className="mb-2" items={[{ label: "Home", href: "/" }, { label: "Wishlist" }]} />
      <div className="mb-2 rounded-lg border border-line bg-white px-4 py-3">
        <h1 className="font-display text-lg font-extrabold text-ink">
          My Wishlist{" "}
          {hydrated && <span className="font-sans text-sm font-medium text-ink-2">({entries.length})</span>}
        </h1>
        <p className="text-xs text-ink-2">Saved on this device. Accounts and synced wishlists are coming soon.</p>
      </div>
      {!hydrated ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-busy="true">
          {Array.from({ length: 5 }, (_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState icon={Heart} title="Your wishlist is empty" actions={[{ label: "Explore products", href: "/products" }]}>
          <p>Tap the heart on any product to save it here for later.</p>
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {entries.map(({ sku, product }) => (
            <li key={sku}>
              {product ? (
                <ProductCard product={product} />
              ) : (
                <article className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-white p-4 text-center">
                  <PackageX className="h-8 w-8 text-ink-3" strokeWidth={1.5} aria-hidden="true" />
                  <p className="text-[13px] font-semibold text-ink">No longer available</p>
                  <p className="font-mono text-xs text-ink-2">{sku}</p>
                  <button
                    type="button"
                    onClick={() => removeFromWishlist(sku)}
                    className="btn btn-outline mt-1 h-8 px-3 text-[13px]"
                    aria-label={`Remove ${sku} from wishlist`}
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                    Remove
                  </button>
                </article>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
