"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { companies, verticalLabels } from "@/data/companies";
import { narratives } from "@/data/narratives";

type Result = {
  type: "company" | "narrative" | "vertical";
  label: string;
  sub: string;
  href: string;
};

const typeColors: Record<Result["type"], string> = {
  company: "text-violet-400",
  narrative: "text-emerald-400",
  vertical: "text-amber-400",
};

const typeLabels: Record<Result["type"], string> = {
  company: "Company",
  narrative: "Narrative",
  vertical: "Vertical",
};

function search(q: string): Result[] {
  if (!q.trim()) return [];
  const lq = q.toLowerCase();

  return [
    ...companies
      .filter((c) => c.name.toLowerCase().includes(lq) || c.description.toLowerCase().includes(lq))
      .slice(0, 6)
      .map((c) => ({ type: "company" as const, label: c.name, sub: c.description, href: `/companies/${c.slug}` })),

    ...narratives
      .filter((n) => n.title.toLowerCase().includes(lq) || n.tagline.toLowerCase().includes(lq))
      .slice(0, 3)
      .map((n) => ({ type: "narrative" as const, label: n.title, sub: n.tagline, href: `/narratives/${n.slug}` })),

    ...Object.entries(verticalLabels)
      .filter(([, label]) => label.toLowerCase().includes(lq))
      .slice(0, 3)
      .map(([key, label]) => ({ type: "vertical" as const, label, sub: `${companies.filter(c => c.vertical === key).length} companies`, href: `/companies?vertical=${key}` })),
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
            placeholder="Search companies, narratives, verticals..."
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
        {!query && <div className="py-6 text-center text-zinc-700 text-xs">Search companies, narratives, and verticals</div>}
      </div>
    </div>
  );
}
