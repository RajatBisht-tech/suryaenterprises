import Image from "next/image";
import Link from "next/link";

// "Shop by need" round tiles: the five live categories with illustrated
// scenes (seed packet, insect pest, nutrient sack, farm tools, livestock).
// Counts show online-sellable listings only; a category with none (animal
// husbandry) gets a "Store & quotation only" tag instead of a count.
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

export default function ShopByNeed({ categories }) {
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
      <ul className="no-scrollbar -mx-3 mt-3 flex gap-1 overflow-x-auto px-3 sm:mx-0 sm:grid sm:grid-cols-5 sm:gap-3 sm:px-0">
        {categories.map((c) => (
          <li key={c.slug} className="w-[108px] shrink-0 sm:w-auto">
            <Link href={`/c/${c.slug}`} className="group flex h-full flex-col items-center gap-2 rounded-lg p-1.5 text-center">
              <Tile src={c.illustration} />
              <span className="leading-tight">
                <span className="block text-[13px] font-semibold text-ink group-hover:text-brand">{c.shortName}</span>
                <span className="block text-[11px] leading-[1.35] text-ink-2">{c.tileNote ?? c.need}</span>
                {c.storeOnly ? (
                  <span className="mt-1 inline-block rounded-sm bg-notice-tint px-1.5 py-px text-[9.5px] font-bold uppercase tracking-wider text-notice">
                    Store &amp; quotation only
                  </span>
                ) : (
                  <span className="mt-0.5 block text-[11px] tabular-nums text-ink-3">
                    {(c.onlineCount ?? c.count).toLocaleString("en-IN")} products online
                  </span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
