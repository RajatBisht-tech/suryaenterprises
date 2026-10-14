"use client";

import { useEffect } from "react";
import { CART_EVENT, readCart, writeCart } from "../../lib-shop/cart";
import { toast } from "../../lib-shop/toast";

// Mounted once in app/layout.js so it runs on every page, including the
// frozen /checkout page: on mount and after every "surya-cart-updated" event
// it drops SKUs that no longer exist in the product index (products removed
// from the catalogue — see app/config/catalog-exclusions.js — leave stale
// entries in shoppers' saved carts), writes the cart back (which re-dispatches
// the event) and toasts each removal with its SKU.
//
// The client index is imported lazily and only when the cart has items, so
// visitors with an empty cart never download it on listing pages.
export default function CartGuard() {
  useEffect(() => {
    let cancelled = false;
    let indexPromise = null;
    const loadIndex = () => {
      indexPromise ??= import("../../products/data/products");
      return indexPromise;
    };

    const purge = async () => {
      const cart = readCart();
      const skus = Object.keys(cart);
      if (!skus.length) return;
      const { getProduct } = await loadIndex();
      if (cancelled) return;
      const current = { ...readCart() };
      const removed = [];
      for (const sku of Object.keys(current)) {
        if (!getProduct(sku)) {
          delete current[sku];
          removed.push(sku);
        }
      }
      if (!removed.length) return;
      writeCart(current);
      for (const sku of removed) toast(`Removed ${sku}: no longer available`);
      // The frozen /checkout page reads the cart once on mount, before this
      // guard has run, so make it re-read the cleaned cart.
      if (window.location.pathname.startsWith("/checkout")) {
        window.setTimeout(() => window.location.reload(), 400);
      }
    };

    purge();
    const onUpdate = () => {
      purge();
    };
    window.addEventListener(CART_EVENT, onUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener(CART_EVENT, onUpdate);
    };
  }, []);

  return null;
}
