"use client";

import { useEffect } from "react";
import { CART_EVENT, readCart, writeCart } from "../../lib-shop/cart";
import { toast } from "../../lib-shop/toast";

// Mounted once in app/layout.js so it runs on every page, including the
// frozen /checkout page: on mount and after every "surya-cart-updated" event
// it drops SKUs whose index entry says onlineSale:false (pesticides, urea,
// animal-husbandry goods… see app/config/sale-restrictions.js), writes the
// cart back (which re-dispatches the event) and toasts the removal.
//
// The 3 MB client index is imported lazily and only when the cart has items,
// so visitors with an empty cart never download it on listing pages.
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
        const product = getProduct(sku);
        if (product && product.onlineSale === false) {
          delete current[sku];
          removed.push(product.name);
        }
      }
      if (!removed.length) return;
      writeCart(current);
      for (const name of removed) toast(`Removed ${name}: not for online sale`);
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
