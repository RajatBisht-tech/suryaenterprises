import { LOW_STOCK } from "../../lib-shop/format";

// Stock line under a price: "Out of stock", "Only N left" or (verbose) "In stock".
export default function StockBadge({ stock, verbose = false }) {
  if (!(stock > 0)) {
    return <span className="text-xs font-semibold text-danger">Out of stock</span>;
  }
  if (stock <= LOW_STOCK) {
    return <span className="text-xs font-semibold text-danger">Only {stock} left</span>;
  }
  return verbose ? <span className="text-xs font-semibold text-brand">In stock</span> : null;
}
