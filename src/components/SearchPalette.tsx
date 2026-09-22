"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { OrbitalSlot } from "@/data/orbital-slots";
import { lonToSlug } from "@/lib/slot-utils";

type Result = {
  type: "slot" | "page";
  label: string;
  sub: string;
  href: string;
};

const typeColors: Record<Result["type"], string> = {
  slot: "text-ink",
  page: "text-faint",
};

const typeLabels: Record<Result["type"], string> = {
  slot: "Orbital",
  page: "Page",
};

const pages = [
  { label: "GEO Slot Index #1", sub: "Occupancy enter/leave, dispute flips, FCC deltas. Not prices.", href: "/index" },
  { label: "Slot Terminal · 101°W", sub: "Sample hot slot. Occupancy, FCC, freshness, labeled model.", href: "/orbital/101w" },
  { label: "Docs", sub: "Occupancy, rights, freshness, and the labeled model", href: "/docs" },
  { label: "Data trust", sub: "Field trust matrix, TLE-primary occupancy, V/M/S legend", href: "/docs/data-trust" },
  { label: "Valuation v0", sub: "$30M baseline formula, drivers, confidence bands", href: "/docs/valuation" },
  { label: "FCC SSAL refresh", sub: "Workbook vintage and the replace-xlsx runbook", href: "/docs/fcc-refresh" },
  { label: "Pricing", sub: "Free registry vs Pro driver breakdown, compare, export+", href: "/pricing" },
  { label: "About Clarke", sub: "How it works, data sources, methodology, and the agents API", href: "/about" },
];

function search(q: string, slots: OrbitalSlot[]): Result[] {
  if (!q.trim()) return [];
  const lq = q.toLowerCase();

  return [
    ...slots
      .filter((s) => s.label.toLowerCase().includes(lq) || s.operator.toLowerCase().includes(lq) || (s.operatorRaw ?? "").toLowerCase().includes(lq) || s.country.toLowerCase().includes(lq))
      .slice(0, 6)
      .map((s) => ({ type: "slot" as const, label: s.label, sub: s.valueEstimate ? `${s.operator} · hand estimate ${s.valueEstimate}` : s.operator, href: `/orbital/${lonToSlug(s.longitude)}` })),

    ...pages
      .filter((p) => p.label.toLowerCase().includes(lq) || p.sub.toLowerCase().includes(lq))
      .slice(0, 4)
      .map((p) => ({ type: "page" as const, ...p })),
  ].slice(0, 12);
}

export default function SearchPalette({ slots, onClose }: { slots: OrbitalSlot[]; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const results = search(query, slots);

  const close = useCallback(() => { setQuery(""); setSelected(0); onClose(); }, [onClose]);
  const navigate = useCallback((href: string) => { router.push(href); close(); }, [router, close]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [close]);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);

  // Reset selection when the query changes. Adjusted during render rather
  // than in an effect to avoid an extra commit on every keystroke.
  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setSelected(0);
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    else if (e.key === "Enter" && results[selected]) navigate(results[selected].href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4" onClick={close}>
      <div className="absolute inset-0 bg-black/55" />
      <div className="relative w-full max-w-xl bg-surface border border-line shadow-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-line">
          <svg className="w-4 h-4 text-faint shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search orbital slots..."
            className="flex-1 bg-transparent text-ink text-sm placeholder-faint focus:outline-none"
          />
          <kbd className="text-[10px] text-faint bg-canvas border border-line px-1.5 py-0.5 rounded font-mono">ESC</kbd>
        </div>

        {results.length > 0 && (
          <div className="py-2 max-h-80 overflow-y-auto">
            {results.map((result, i) => (
              <button key={`${result.type}-${i}`} onClick={() => navigate(result.href)} onMouseEnter={() => setSelected(i)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === selected ? "bg-canvas" : "hover:bg-canvas/70"}`}>
                <span className={`text-xs shrink-0 w-16 ${typeColors[result.type]}`}>{typeLabels[result.type]}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-ink text-sm truncate">{result.label}</div>
                  <div className="text-muted text-xs truncate">{result.sub}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {query && results.length === 0 && <div className="py-10 text-center text-muted text-sm">No results for &quot;{query}&quot;</div>}
        {!query && <div className="py-6 text-center text-faint text-sm">Search orbital slots and pages</div>}
      </div>
    </div>
  );
}
