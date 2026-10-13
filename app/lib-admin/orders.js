import "server-only";
import products from "../products/data/products.json";
import media from "../products/data/catalog-media.json";
import { withCatalogMedia } from "../products/data/catalog-media.mjs";
import { applySaleRestriction } from "../products/data/sale-restrictions.mjs";
import { createOrdersStore } from "./orders-store.mjs";

// Same catalogue view as the storefront: products that are "Not for online
// sale" carry onlineSale:false so the console can flag a payment that was
// matched to one of them.
const catalog = products.map(p => applySaleRestriction(withCatalogMedia(p, media)));
export async function ordersFor(context) {
  const configuration = await context.access.settings();
  const gateway = configuration?.payinDbName ? context.client.db(configuration.payinDbName) : null;
  return createOrdersStore(context.db, gateway, catalog);
}
