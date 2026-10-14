// Recently viewed: localStorage["surya-recent"] = array of small product
// snapshots (newest first) so the home page can render them without
// downloading the catalogue.
import { createLocalStore } from "./local-store";

const MAX = 16;

const store = createLocalStore({
  key: "surya-recent",
  event: "surya-recent-updated",
  empty: [],
  validate: Array.isArray,
});

export const useRecent = store.useValue;

export function recordRecent(card) {
  if (!card?.sku) return;
  const next = [card, ...store.read().filter((c) => c?.sku !== card.sku)].slice(0, MAX);
  store.write(next);
}

// Drop snapshots that fail `keep` (e.g. SKUs no longer in the catalogue).
export function pruneRecent(keep) {
  const current = store.read();
  const next = current.filter((c) => c?.sku && keep(c));
  if (next.length !== current.length) store.write(next);
}

export function clearRecent() {
  store.write([]);
}
