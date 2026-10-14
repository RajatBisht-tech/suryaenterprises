"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { formatPrice } from "../../lib-shop/format";
import ProductImage from "./ProductImage";

export const FOCUS_SEARCH_EVENT = "surya-focus-search";

function SearchBarInner({ categories, initialQuery = "", initialScope = "", variant = "desktop" }) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef(null);
  const boxRef = useRef(null);
  const abortRef = useRef(null);
  const timerRef = useRef(null);

  const [query, setQuery] = useState(initialQuery);
  const [scope, setScope] = useState(initialScope);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);

  const mobile = variant === "mobile";

  // Bottom-nav "Search" focuses the (mobile) search input.
  useEffect(() => {
    if (!mobile) return undefined;
    const focus = () => {
      window.scrollTo({ top: 0 });
      inputRef.current?.focus();
    };
    window.addEventListener(FOCUS_SEARCH_EVENT, focus);
    return () => window.removeEventListener(FOCUS_SEARCH_EVENT, focus);
  }, [mobile]);

  // Close on outside click.
  useEffect(() => {
    const onDown = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  useEffect(
    () => () => {
      clearTimeout(timerRef.current);
      abortRef.current?.abort();
    },
    []
  );

  const fetchSuggestions = (q, sc) => {
    clearTimeout(timerRef.current);
    abortRef.current?.abort();
    if (q.trim().length < 2) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const params = new URLSearchParams({ q: q.trim() });
        if (sc) params.set("category", sc);
        const res = await fetch(`/search/suggest?${params}`, { signal: controller.signal });
        const data = res.ok ? await res.json() : { items: [] };
        setItems(Array.isArray(data.items) ? data.items : []);
        setActive(-1);
        setOpen(true);
      } catch (err) {
        if (err?.name !== "AbortError") setItems([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 140);
  };

  const submit = (q = query) => {
    const text = q.trim();
    setOpen(false);
    if (!text) {
      router.push(scope ? `/c/${scope}` : "/search");
      return;
    }
    const params = new URLSearchParams({ q: text });
    if (scope) params.set("category", scope);
    router.push(`/search?${params}`);
    inputRef.current?.blur();
  };

  const go = (item) => {
    setOpen(false);
    setQuery(item.name);
    router.push(`/p/${item.slug}`);
  };

  // Options = suggestions + a final "search for" row.
  const showList = open && query.trim().length >= 2;
  const optionCount = items.length + 1;

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % optionCount);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i <= 0 ? optionCount - 1 : i - 1));
    } else if (e.key === "Escape") {
      if (showList) e.preventDefault(); // first Escape closes the list, not clears the text
      setOpen(false);
      setActive(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (showList && active >= 0 && active < items.length) go(items[active]);
      else submit();
    }
  };

  const scopeName = categories.find((c) => c.slug === scope)?.name ?? "All";

  return (
    <div ref={boxRef} className="relative w-full">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className={`flex w-full items-stretch overflow-hidden rounded-md bg-white ring-1 ring-line focus-within:ring-2 focus-within:ring-harvest ${
          mobile ? "h-10" : "h-11"
        }`}
      >
        {!mobile && (
          <label className="relative flex shrink-0 items-center border-r border-line bg-canvas text-xs font-medium text-ink-2 hover:bg-[#e7ebe9]">
            <span className="sr-only">Search in category</span>
            <span aria-hidden="true" className="pointer-events-none flex items-center gap-1 pl-3 pr-2">
              <span className="max-w-[120px] truncate">{scopeName}</span>
              <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.75} />
            </span>
            <select
              value={scope}
              onChange={(e) => {
                setScope(e.target.value);
                fetchSuggestions(query, e.target.value);
              }}
              className="absolute inset-0 cursor-pointer opacity-0"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {mobile && <Search className="ml-3 h-4 w-4 shrink-0 self-center text-ink-3" strokeWidth={1.75} aria-hidden="true" />}
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            fetchSuggestions(e.target.value, scope);
          }}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={mobile ? "Search seeds, traps, sprayers, tools…" : "Search by product, brand, crop or pack size"}
          aria-label="Search products"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          enterKeyHint="search"
          className="min-w-0 flex-1 bg-transparent px-3 text-[14px] text-ink outline-none placeholder:text-ink-3 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              setItems([]);
              inputRef.current?.focus();
            }}
            className="flex w-8 shrink-0 items-center justify-center text-ink-3 hover:text-ink"
          >
            <X className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
        )}
        {!mobile && (
          <button
            type="submit"
            aria-label="Search"
            className="flex w-14 shrink-0 items-center justify-center bg-harvest text-ink transition hover:bg-harvest-hover"
          >
            <Search className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          </button>
        )}
      </form>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Search suggestions"
          className="fade-in absolute left-0 right-0 top-full z-50 mt-1 max-h-[70vh] overflow-auto rounded-md border border-line bg-white py-1 shadow-xl"
        >
          {items.map((item, i) => (
            <li
              key={item.slug}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={active === i}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => go(item)}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${active === i ? "bg-brand-tint" : ""}`}
            >
              <span className="block h-10 w-10 shrink-0">
                <ProductImage src={item.image} category={item.category} sizes="40px" frameClassName="h-full w-full rounded" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] text-ink">{item.name}</span>
                <span className="block text-xs text-ink-2">in {item.category}</span>
              </span>
              <span className="shrink-0 text-[13px] font-semibold tabular-nums text-ink">{formatPrice(item.price)}</span>
            </li>
          ))}
          {!loading && items.length === 0 && (
            <li className="px-3 py-2 text-xs text-ink-2">No quick matches — press Enter to search all products.</li>
          )}
          <li
            id={`${listId}-${items.length}`}
            role="option"
            aria-selected={active === items.length}
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => submit()}
            onMouseEnter={() => setActive(items.length)}
            className={`flex cursor-pointer items-center gap-2 border-t border-line px-3 py-2.5 text-[13px] font-medium text-brand ${
              active === items.length ? "bg-brand-tint" : ""
            }`}
          >
            <Search className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            Search for “{query.trim()}”{scope ? ` in ${scopeName}` : ""}
          </li>
        </ul>
      )}
    </div>
  );
}

function SearchBarFromUrl(props) {
  const pathname = usePathname();
  const params = useSearchParams();
  const onSearch = pathname === "/search";
  const q = onSearch ? params.get("q") ?? "" : "";
  const scope = onSearch ? params.get("category") ?? "" : pathname.startsWith("/c/") ? pathname.slice(3) : "";
  return <SearchBarInner key={`${q}|${scope}`} {...props} initialQuery={q} initialScope={scope} />;
}

export default function SearchBar(props) {
  return (
    <Suspense fallback={<SearchBarInner {...props} />}>
      <SearchBarFromUrl {...props} />
    </Suspense>
  );
}
