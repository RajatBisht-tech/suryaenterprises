import Image from "next/image";
import Link from "next/link";

// "Shop by need" round tiles: six needs (config/taxonomy.js SHOP_BY_NEED)
// with illustrated scenes and live listing counts from catalog.server.js
// getShopByNeed(). Tiles link to a category or to a pre-filtered
// farm-machinery listing (sprayers, tools, covers, irrigation).
function Tile({ src }) {
  return (
    <span className="relative block aspect-square w-full max-w-[112px] overflow-hidden rounded-full ring-1 ring-black/5 transition group-hover:ring-2 group-hover:ring-brand">
      {src && (
        <Image
          src={src}
          alt=""
          fill
          sizes="112px"
          unoptimized
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      )}
    </span>
  );
}

export default function ShopByNeed({ needs }) {
  return (
    <section aria-labelledby="need-heading" className="rounded-lg border border-line bg-white px-3 py-3 sm:px-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow">Shop by need</p>
          <h2 id="need-heading" className="font-display text-lg font-extrabold text-ink sm:text-xl">
            What does your farm need today?
          </h2>
        </div>
        <Link href="/products" className="hidden text-[13px] font-semibold text-brand hover:underline sm:inline">
          All categories
        </Link>
      </div>
      <ul className="no-scrollbar -mx-3 mt-3 flex gap-1 overflow-x-auto px-3 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-3 sm:px-0 lg:grid-cols-6">
        {needs.map((n) => (
          <li key={n.slug} className="w-[108px] shrink-0 sm:w-auto">
            <Link href={n.href} className="group flex h-full flex-col items-center gap-2 rounded-lg p-1.5 text-center">
              <Tile src={n.illustration} />
              <span className="leading-tight">
                <span className="block text-[13px] font-semibold text-ink group-hover:text-brand">{n.title}</span>
                <span className="block text-[11px] leading-[1.35] text-ink-2">{n.note}</span>
                <span className="mt-0.5 block text-[11px] tabular-nums text-ink-3">{n.count.toLocaleString("en-IN")} products</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
