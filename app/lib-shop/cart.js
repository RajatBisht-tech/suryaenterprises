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

export function setQty(sku, quantity, max) {
  const cart = { ...readCart() };
  const capped = Math.floor(Math.min(quantity, max ?? Number.POSITIVE_INFINITY));
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
