import Link from "next/link";
import { Building2, MapPin, MessageSquareText, Phone, Store } from "lucide-react";
import { SITE, telHref } from "../../config/site";
import WishlistButton from "./WishlistButton";
import { enquiryHref } from "./ProductCard";

// Product-page panel that replaces the BuyBox for products matched by
// app/config/sale-restrictions.js: label, reason, where to buy (registered
// office / store), helpline, institutional desk and contact buttons. Server
// component (WishlistButton is the only client island).
export default function SaleRestrictionNotice({ sku, name, restriction }) {
  const store = SITE.offices.find((o) => /registered/i.test(o.kind ?? "")) ?? SITE.offices[0];
  return (
    <section
      aria-labelledby="restriction-title"
      className="rounded-lg border border-notice-line bg-notice-tint p-4 text-ink"
    >
      <h2 id="restriction-title" className="flex items-center gap-2 font-display text-[17px] font-extrabold text-notice">
        <Store className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        {restriction.label}
      </h2>
      <p className="mt-2 text-[13.5px] leading-6">{restriction.reason}</p>
      <dl className="mt-3 grid gap-2 text-[13px] sm:grid-cols-2">
        <div className="flex items-start gap-2 rounded-md bg-white/80 px-3 py-2 ring-1 ring-notice-line/60">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-notice" strokeWidth={1.75} aria-hidden="true" />
          <div>
            <dt className="text-xs text-ink-2">Buy at our Jaipur store</dt>
            <dd className="font-medium leading-5">{store.address}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-md bg-white/80 px-3 py-2 ring-1 ring-notice-line/60">
          <Phone className="mt-0.5 h-4 w-4 shrink-0 text-notice" strokeWidth={1.75} aria-hidden="true" />
          <div>
            <dt className="text-xs text-ink-2">Helpline · {SITE.helpline.hours}</dt>
            <dd>
              <a href={telHref} className="font-semibold tabular-nums text-brand hover:underline">
                {SITE.helpline.display}
              </a>
            </dd>
          </div>
        </div>
      </dl>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={enquiryHref(sku)} className="btn btn-buy h-10 px-4 text-[14px]">
          <Building2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          Institutional desk
        </Link>
        <Link href="/contact" className="btn btn-outline h-10 bg-white px-4 text-[14px]">
          <MessageSquareText className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          Contact us
        </Link>
        <WishlistButton sku={sku} name={name} variant="button" className="h-10 bg-white text-[14px]" />
      </div>
    </section>
  );
}
