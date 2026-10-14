import Link from "next/link";
import { productHref } from "../../config/taxonomy";
import AddToCartControl from "./AddToCartControl";
import PriceTag from "./PriceTag";
import ProductImage from "./ProductImage";
import RatingBadge from "./RatingBadge";
import StockBadge from "./StockBadge";
import WishlistButton from "./WishlistButton";

// Works from server and client components (no hooks of its own).
export default function ProductCard({ product, priority = false, layout = "grid" }) {
  const p = product;
  const rail = layout === "rail";
  return (
    <article
      className={`group relative flex h-full flex-col rounded-lg border border-line bg-white p-2.5 transition-shadow hover:shadow-[0_4px_16px_rgba(20,33,26,0.10)] sm:p-3 ${
        rail ? "w-[164px] shrink-0 snap-start sm:w-[196px]" : ""
      }`}
    >
      <WishlistButton sku={p.sku} name={p.name} className="absolute right-2 top-2 z-10" />
      <Link href={productHref(p.slug)} className="flex flex-1 flex-col focus-visible:outline-offset-4">
        <ProductImage
          src={p.image}
          category={p.category}
          sizes={rail ? "196px" : "(min-width: 1536px) 16vw, (min-width: 1280px) 20vw, (min-width: 640px) 30vw, 46vw"}
          preload={priority}
          frameClassName="aspect-square w-full rounded-md"
          className="p-1 transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {p.brand && <p className="mt-2 truncate text-[11px] font-semibold uppercase tracking-wide text-ink-2">{p.brand}</p>}
        <h3 className={`line-clamp-2 min-h-10 text-[14px] font-medium leading-5 text-ink group-hover:text-brand ${p.brand ? "mt-0.5" : "mt-2"}`}>
          {p.name}
        </h3>
        {/* Pack size is usually already in the name; don't announce it twice. */}
        <p className="mt-0.5 truncate text-xs text-ink-2" aria-hidden={p.unit && p.name.includes(p.unit) ? "true" : undefined}>
          {p.unit}
        </p>
        {p.rating != null && (
          <div className="mt-1.5 flex min-h-5 items-center gap-2">
            <RatingBadge rating={p.rating} reviewsCount={p.reviewsCount} />
          </div>
        )}
        <div className="mt-1.5">
          <PriceTag price={p.price} mrp={p.mrp} size="sm" />
        </div>
        <div className="mt-0.5 min-h-4">
          <StockBadge stock={p.stock} />
        </div>
      </Link>
      <AddToCartControl sku={p.sku} name={p.name} stock={p.stock} className="mt-2" />
    </article>
  );
}
