"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

// Promotional banner carousel driven by site.js `promotions`.
// 2.2 slides visible on desktop (peek), 1.1 on phones; native scroll-snap for
// swipe, mouse drag, arrow buttons, dots, autoplay with pause (hover, focus,
// button, reduced motion) and arrow-key navigation.
const INTERVAL = 5000;

const ART = {
  pest: "/assets/marketplace/need-pest.svg",
  growth: "/assets/marketplace/need-growth.svg",
  seeds: "/assets/marketplace/soon-seeds.svg",
  sprayer: "/assets/marketplace/need-sprayer.svg",
  tarpaulin: "/assets/marketplace/need-tarpaulin.svg",
  tools: "/assets/marketplace/soon-tools.svg",
  warehouse: "/assets/marketplace/hero-agri-warehouse.svg",
};

const THEMES = {
  green: {
    card: "bg-[linear-gradient(120deg,#0A4F28_0%,#0F7A3D_100%)] text-white",
    sub: "text-white/85",
    btn: "btn-cart",
    badge: "bg-harvest text-ink",
    glow: "bg-white/10",
  },
  harvest: {
    card: "bg-[linear-gradient(120deg,#FFC72C_0%,#FFE28F_100%)] text-ink",
    sub: "text-ink-2",
    btn: "btn-buy",
    badge: "bg-ink text-harvest",
    glow: "bg-white/40",
  },
  earth: {
    card: "bg-[linear-gradient(120deg,#5A361C_0%,#7A4E2D_100%)] text-white",
    sub: "text-white/85",
    btn: "btn-cart",
    badge: "bg-harvest text-ink",
    glow: "bg-white/10",
  },
};

const subscribeMotion = (cb) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const getMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function PromoCarousel({ slides, title = "Picks for your farm", eyebrow = "Shop smart" }) {
  const scroller = useRef(null);
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const dragging = useRef(false);
  const dragState = useRef(null);
  const reduced = useSyncExternalStore(subscribeMotion, getMotion, () => true);
  const count = slides.length;

  const slideStep = () => {
    const el = scroller.current;
    if (!el || !el.firstElementChild) return 1;
    const first = el.firstElementChild;
    const gap = parseFloat(getComputedStyle(el).columnGap || "0") || 0;
    return first.getBoundingClientRect().width + gap;
  };

  const go = useCallback(
    (i) => {
      const el = scroller.current;
      if (!el) return;
      const next = ((i % count) + count) % count;
      el.scrollTo({ left: next * slideStep(), behavior: reduced ? "auto" : "smooth" });
    },
    [count, reduced]
  );

  // Track the active slide from the scroll position.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return undefined;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const step = slideStep();
        setIndex(Math.max(0, Math.min(count - 1, Math.round(el.scrollLeft / step))));
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [count]);

  const playing = !reduced && !userPaused && !hovered && count > 1;
  useEffect(() => {
    if (!playing) return undefined;
    const t = setTimeout(() => go(index + 1), INTERVAL);
    return () => clearTimeout(t);
  }, [playing, index, go]);

  // Mouse drag (touch already swipes natively).
  const onPointerDown = (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const el = scroller.current;
    dragState.current = { x: e.clientX, left: el.scrollLeft, moved: false };
    el.classList.add("snap-none", "cursor-grabbing");
    el.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    const d = dragState.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 6) d.moved = true;
    scroller.current.scrollLeft = d.left - dx;
  };
  const endDrag = () => {
    const d = dragState.current;
    const el = scroller.current;
    if (!d || !el) return;
    dragState.current = null;
    dragging.current = d.moved;
    el.classList.remove("snap-none", "cursor-grabbing");
    if (d.moved) go(Math.round(el.scrollLeft / slideStep()));
    // Let the click that ends a drag through only if nothing moved.
    setTimeout(() => {
      dragging.current = false;
    }, 0);
  };

  if (!count) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={title}
      className="rounded-lg border border-line bg-white"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setHovered(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
    >
      <div className="flex items-end justify-between gap-3 border-b border-line px-3 py-3 sm:px-4">
        <div className="min-w-0">
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="truncate font-display text-lg font-extrabold text-ink sm:text-xl">{title}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {!reduced && count > 1 && (
            <button
              type="button"
              onClick={() => setUserPaused((p) => !p)}
              aria-label={userPaused ? "Play carousel" : "Pause carousel"}
              aria-pressed={userPaused}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-ink hover:bg-canvas"
            >
              {userPaused ? <Play className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true" /> : <Pause className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true" />}
            </button>
          )}
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous promotion"
            className="hidden h-9 w-9 items-center justify-center rounded-md border border-line text-ink hover:bg-canvas sm:flex"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next promotion"
            className="hidden h-9 w-9 items-center justify-center rounded-md border border-line text-ink hover:bg-canvas sm:flex"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </div>

      <ul
        ref={scroller}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={(e) => {
          if (dragging.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        className="no-scrollbar flex cursor-grab snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-3 px-3 py-3 sm:px-4"
      >
        {slides.map((s, i) => {
          const theme = THEMES[s.theme] ?? THEMES.green;
          const art = ART[s.art] ?? ART.growth;
          const wide = s.art === "warehouse";
          return (
            <li
              key={s.id ?? s.title}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}: ${s.title}`}
              className="w-[86%] shrink-0 snap-start sm:w-[calc((100%-0.75rem)/2.2)]"
            >
              <div className={`relative flex h-[168px] overflow-hidden rounded-lg sm:h-[188px] ${theme.card}`}>
                <span aria-hidden="true" className={`absolute -right-10 -top-16 h-56 w-56 rounded-full ${theme.glow}`} />
                <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-center p-4 sm:p-5">
                  {s.badge && (
                    <span className={`mb-2 inline-flex w-fit rounded-sm px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${theme.badge}`}>
                      {s.badge}
                    </span>
                  )}
                  <h3 className="font-display text-[19px] font-extrabold leading-tight sm:text-[22px]">{s.title}</h3>
                  {s.subtitle && <p className={`mt-1 line-clamp-2 text-[13px] ${theme.sub}`}>{s.subtitle}</p>}
                  <Link href={s.href} draggable={false} className={`btn ${theme.btn} mt-3 h-9 w-fit px-3 text-[13px]`}>
                    {s.cta}
                    <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  </Link>
                </div>
                <div className="relative z-10 flex w-[120px] shrink-0 items-center justify-center pr-3 sm:w-[150px] sm:pr-4">
                  <span className={`relative block overflow-hidden ${wide ? "h-24 w-full rounded-md ring-1 ring-black/10 sm:h-28" : "h-24 w-24 rounded-full ring-4 ring-white/40 sm:h-28 sm:w-28"}`}>
                    <Image src={art} alt="" fill sizes="150px" unoptimized draggable={false} className="object-cover" />
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {count > 1 && (
        <div className="flex items-center justify-center gap-1 pb-3">
          {slides.map((s, i) => (
            <button
              key={s.id ?? s.title}
              type="button"
              onClick={() => go(i)}
              aria-label={`Go to promotion ${i + 1}: ${s.title}`}
              aria-current={i === index ? "true" : undefined}
              className="group flex h-8 w-8 items-center justify-center"
            >
              <span aria-hidden="true" className={`block h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-brand" : "w-1.5 bg-line group-hover:bg-ink-3"}`} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
