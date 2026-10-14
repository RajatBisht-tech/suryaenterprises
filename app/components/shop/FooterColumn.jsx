"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

// One footer link column. On phones it collapses into an accordion
// (button + aria-expanded); from lg up it is a plain heading + list.
// Links with `soon: true` render as greyed, non-interactive labels; links
// with `download: true` are plain anchors to a static file (e.g. a PDF).
// `columns={2}` splits a long list into two sub-columns on desktop; `note`
// adds a muted trailing line (e.g. "Coming soon: …").
export default function FooterColumn({ title, links, columns = 1, note = null }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const headingId = `${id}-heading`;
  const listId = `${id}-list`;

  return (
    <nav aria-labelledby={headingId} className="border-b border-white/10 lg:border-0">
      <h3 id={headingId} className="mb-2 hidden text-[11px] font-bold uppercase tracking-[0.16em] text-harvest lg:block">
        {title}
      </h3>
      <h3 className="lg:hidden">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((o) => !o)}
          className="flex min-h-12 w-full items-center justify-between py-2 text-left text-[12px] font-bold uppercase tracking-[0.16em] text-harvest"
        >
          {title}
          <ChevronDown
            className={`h-4 w-4 text-white/70 transition-transform ${open ? "rotate-180" : ""}`}
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </button>
      </h3>
      <ul
        id={listId}
        className={`${open ? "block" : "hidden"} pb-4 text-[13px] lg:block lg:pb-0 ${
          columns === 2 ? "lg:grid lg:grid-cols-2 lg:gap-x-5" : ""
        }`}
      >
        {links.map((l) => (
          <li key={`${l.href}-${l.name}`} className="py-[2px]">
            {l.soon ? (
              <span className="inline-flex items-center gap-1.5 text-white/55">
                {l.name}
                <span className="rounded-full border border-white/20 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-white/70">
                  Soon
                </span>
              </span>
            ) : l.download ? (
              <a href={l.href} download className="inline-block text-white/85 hover:text-harvest hover:underline">
                {l.name}
              </a>
            ) : (
              <Link href={l.href} className="inline-block text-white/85 hover:text-harvest hover:underline">
                {l.name}
              </Link>
            )}
          </li>
        ))}
        {note && <li className="pt-1 text-[11.5px] leading-snug text-white/55 lg:col-span-2">{note}</li>}
      </ul>
    </nav>
  );
}
