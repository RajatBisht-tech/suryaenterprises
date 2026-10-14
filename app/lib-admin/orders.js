import "server-only";
import products from "../products/data/products.json";
import media from "../products/data/catalog-media.json";
import { withCatalogMedia } from "../products/data/catalog-media.mjs";
import { createOrdersStore } from "./orders-store.mjs";

// Same catalogue view as the storefront (published photos attached). Orders
// that reference a SKU no longer in the catalogue keep their own recorded
// name, price and quantity; only the thumbnail falls back to none.
const catalog = products.map(p => withCatalogMedia(p, media));
export async function ordersFor(context) {
  const configuration = await context.access.settings();
  const gateway = configuration?.payinDbName ? context.client.db(configuration.payinDbName) : null;
  return createOrdersStore(context.db, gateway, catalog);
}
