"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { slots } from "@/data/orbital-slots";
import { stocks } from "@/data/stocks";

type Result = {
  type: "slot" | "stock" | "page";
  label: string;
  sub: string;
  href: string;
};

const typeColors: Record<Result["type"], string> = {
  slot: "text-sky-400",
  stock: "text-emerald-400",
  page: "text-zinc-500",
};

const typeLabels: Record<Result["type"], string> = {
  slot: "Orbital",
  stock: "Stock",
  page: "Page",
};

const pages = [
  { label: "Orbital Slots", sub: "Browse and invest in tokenized GEO slots", href: "/orbital" },
  { label: "Portfolio", sub: "View positions and claim yield", href: "/portfolio" },
  { label: "Space Markets", sub: "Live prices for satellite companies", href: "/stocks" },
  { label: "Docs", sub: "Technical reference", href: "/docs" },
  { label: "About Clarke", sub: "How it works and why", href: "/about" },
  { label: "List a Slot", sub: "Operators: raise capital against your slot", href: "/orbital/list" },
];

function search(q: string): Result[] {
  if (!q.trim()) return [];
  const lq = q.toLowerCase();

  return [
    ...slots
      .filter((s) => s.label.toLowerCase().includes(lq) || s.operator.toLowerCase().includes(lq) || s.country.toLowerCase().includes(lq))
      .slice(0, 4)
      .map((s) => ({ type: "slot" as const, label: s.label, sub: `${s.operator} · ${s.valueEstimate}`, href: "/orbital" })),

    ...stocks
      .filter((s) => s.ticker.toLowerCase().includes(lq) || s.name.toLowerCase().includes(lq))
      .slice(0, 4)
      .map((s) => ({ type: "stock" as const, label: s.ticker, sub: s.name, href: "/stocks" })),

    ...pages
      .filter((p) => p.label.toLowerCase().includes(lq) || p.sub.toLowerCase().includes(lq))
      .slice(0, 3)
      .map((p) => ({ type: "page" as const, ...p })),
  ].slice(0, 12);
}

export default function SearchPalette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const results = search(query);

  const close = useCallback(() => { setQuery(""); setSelected(0); onClose(); }, [onClose]);
  const navigate = useCallback((href: string) => { router.push(href); close(); }, [router, close]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [close]);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);
  useEffect(() => { setSelected(0); }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    else if (e.key === "Enter" && results[selected]) navigate(results[selected].href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4" onClick={close}>
      <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
          <svg className="w-4 h-4 text-zinc-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search slots, stocks, pages..."
            className="flex-1 bg-transparent text-white text-sm placeholder-zinc-600 focus:outline-none"
          />
          <kbd className="text-xs text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded font-mono">ESC</kbd>
        </div>

        {results.length > 0 && (
          <div className="py-2 max-h-80 overflow-y-auto">
            {results.map((result, i) => (
              <button key={`${result.type}-${i}`} onClick={() => navigate(result.href)} onMouseEnter={() => setSelected(i)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === selected ? "bg-zinc-800" : "hover:bg-zinc-800/50"}`}>
                <span className={`text-xs font-mono shrink-0 w-16 ${typeColors[result.type]}`}>{typeLabels[result.type]}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm truncate">{result.label}</div>
                  <div className="text-zinc-500 text-xs truncate">{result.sub}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {query && results.length === 0 && <div className="py-10 text-center text-zinc-600 text-sm">No results for "{query}"</div>}
        {!query && <div className="py-6 text-center text-zinc-700 text-xs">Search orbital slots, stocks, and pages</div>}
      </div>
    </div>
  );
}
