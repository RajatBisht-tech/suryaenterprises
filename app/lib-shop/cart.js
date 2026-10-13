// Cart helpers honouring the checkout contract (do not change):
//   localStorage["surya-cart"] = JSON object { [sku]: quantity }
//   after every write, window dispatches the "surya-cart-updated" event.
import { createLocalStore } from "./local-store";

export const CART_KEY = "surya-cart";
export const CART_EVENT = "surya-cart-updated";

const isCart = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

const store = createLocalStore({ key: CART_KEY, event: CART_EVENT, empty: {}, validate: isCart });

export const readCart = store.read;

export function writeCart(cart) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event(CART_EVENT));
}

// SKUs that are "Not for online sale" (app/config/sale-restrictions.js). The
// client index (products/data/products.js) registers them when it loads —
// on the cart, wishlist and checkout pages, and lazily through <CartGuard />
// as soon as a cart has items — so this module stays free of the 3 MB index
// and the header bundle stays small. setQty / addToCart refuse these SKUs.
const restrictedSkus = new Set();

export function registerRestrictedSkus(skus) {
  for (const sku of skus) restrictedSkus.add(sku);
}

export const isRestrictedSku = (sku) => restrictedSkus.has(sku);

export function setQty(sku, quantity, max) {
  const cart = { ...readCart() };
  const capped = isRestrictedSku(sku) ? 0 : Math.floor(Math.min(quantity, max ?? Number.POSITIVE_INFINITY));
  if (capped > 0) cart[sku] = capped;
  else delete cart[sku];
  writeCart(cart);
  return cart;
}

export function addToCart(sku, quantity = 1, max) {
  const current = readCart()[sku] || 0;
  return setQty(sku, current + quantity, max);
}

export function removeFromCart(sku) {
  return setQty(sku, 0);
}

export const cartCount = (cart) =>
  Object.values(cart).reduce((total, q) => total + (Number(q) || 0), 0);

export const useCart = store.useValue;
export const useCartHydrated = store.useHydrated;
