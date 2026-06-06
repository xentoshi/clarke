"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { LAYERS } from "@/lib/value-chain";
import { formatMarketCap } from "@/lib/fetchStocks";

export type MapCompany = {
  slug: string;
  name: string;
  sector: string;
  layer: string;
  description: string;
  hq: string | null;
  founded: number | null;
  website: string | null;
  fleet: number | null;
  valuationUsd: number | null;
  valuationAsOf: string | null;
  ticker: string | null;
};

const LAYER_ACCENT: Record<string, string> = {
  capital: "text-amber-300 border-amber-400/30 hover:border-amber-400/60",
  launch: "text-orange-300 border-orange-400/30 hover:border-orange-400/60",
  spacecraft: "text-sky-300 border-sky-400/30 hover:border-sky-400/60",
  operators: "text-emerald-300 border-emerald-400/30 hover:border-emerald-400/60",
  ground: "text-teal-300 border-teal-400/30 hover:border-teal-400/60",
  applications: "text-cyan-300 border-cyan-400/30 hover:border-cyan-400/60",
  inorbit: "text-violet-300 border-violet-400/30 hover:border-violet-400/60",
  frontier: "text-fuchsia-300 border-fuchsia-400/30 hover:border-fuchsia-400/60",
  defense: "text-red-300 border-red-400/30 hover:border-red-400/60",
  risk: "text-zinc-300 border-zinc-400/30 hover:border-zinc-400/60",
};
const LAYER_DOT: Record<string, string> = {
  capital: "bg-amber-400",
  launch: "bg-orange-400",
  spacecraft: "bg-sky-400",
  operators: "bg-emerald-400",
  ground: "bg-teal-400",
  applications: "bg-cyan-400",
  inorbit: "bg-violet-400",
  frontier: "bg-fuchsia-400",
  defense: "bg-red-400",
  risk: "bg-zinc-400",
};

function valueLabel(c: MapCompany): string | null {
  if (c.ticker) return c.ticker;
  if (c.valuationUsd) return formatMarketCap(c.valuationUsd);
  return null;
}

export default function SpaceEconomyMap({ companies }: { companies: MapCompany[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MapCompany | null>(null);

  const byLayer = useMemo(() => {
    const m = new Map<string, MapCompany[]>();
    for (const c of companies) {
      const arr = m.get(c.layer) ?? [];
      arr.push(c);
      m.set(c.layer, arr);
    }
    for (const arr of m.values()) arr.sort((a, b) => a.name.localeCompare(b.name));
    return m;
  }, [companies]);

  const totalSats = useMemo(
    () => companies.reduce((s, c) => s + (c.fleet ?? 0), 0),
    [companies]
  );

  const q = query.trim().toLowerCase();
  const matches = (c: MapCompany) =>
    !q ||
    c.name.toLowerCase().includes(q) ||
    c.sector.toLowerCase().includes(q) ||
    (c.ticker ?? "").toLowerCase().includes(q);

  const peers = selected
    ? (byLayer.get(selected.layer) ?? []).filter((c) => c.slug !== selected.slug)
    : [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="text-emerald-400/80 text-[11px] font-mono uppercase tracking-widest mb-3">
          Interactive · the whole industry in one view
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">The Space Economy</h1>
        <p className="text-zinc-400 text-base max-w-2xl leading-relaxed mb-6">
          Every company that turns capital into infrastructure in orbit, organized as one value chain —
          from the money, to the rockets, to the satellites, to the services in your pocket. Click anyone
          to see what they do and where they sit in the stack.
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="text-zinc-300 font-mono">{companies.length} <span className="text-zinc-600">companies</span></span>
          <span className="text-zinc-300 font-mono">{LAYERS.length} <span className="text-zinc-600">layers</span></span>
          <span className="text-zinc-300 font-mono">{totalSats.toLocaleString()} <span className="text-zinc-600">satellites in orbit</span></span>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-10 max-w-md">
        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a company, sector, or ticker…"
          className="bg-white/[0.03] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/25 w-full"
        />
      </div>

      {/* The stack */}
      <div className="space-y-3">
        {LAYERS.map((layer, i) => {
          const all = byLayer.get(layer.id) ?? [];
          const visible = all.filter(matches);
          if (q && visible.length === 0) return null;
          return (
            <div key={layer.id} className="relative">
              {/* connector */}
              {i > 0 && <div className="absolute left-[15px] -top-3 h-3 w-px bg-white/10" />}
              <div className="flex gap-4">
                {/* node + rail */}
                <div className="flex flex-col items-center pt-1.5">
                  <span className={`w-[31px] h-[31px] rounded-full flex items-center justify-center text-[11px] font-mono font-bold text-black ${LAYER_DOT[layer.id]}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {i < LAYERS.length - 1 && <div className="flex-1 w-px bg-white/10 mt-1" />}
                </div>
                {/* content */}
                <div className="flex-1 pb-6 min-w-0">
                  <h2 className="text-white font-semibold text-lg leading-tight">{layer.title}</h2>
                  <p className="text-zinc-500 text-sm leading-relaxed mb-3 max-w-2xl">{layer.blurb}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {visible.map((c) => {
                      const vl = valueLabel(c);
                      return (
                        <button
                          key={c.slug}
                          onClick={() => setSelected(c)}
                          className={`group inline-flex items-center gap-1.5 rounded-lg border bg-white/[0.02] px-2.5 py-1.5 text-left transition-all hover:bg-white/[0.05] ${LAYER_ACCENT[layer.id]}`}
                        >
                          <span className="text-white text-xs font-medium">{c.name}</span>
                          {c.fleet && <span className="text-sky-300/80 text-[10px] font-mono" title="satellites in orbit">{c.fleet.toLocaleString()} sats</span>}
                          {vl && <span className="text-zinc-600 text-[10px] font-mono">{vl}</span>}
                        </button>
                      );
                    })}
                    {visible.length === 0 && <span className="text-zinc-700 text-xs">No companies tracked yet.</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-zinc-700 text-xs mt-10 font-mono leading-relaxed">
        Counts labelled “sats” are satellites in orbit (Clarke registry / UCS) and may lag the latest
        launches. Tickers shown for public companies; figures for private companies are last reported
        valuations. Built from public data.
      </p>

      {/* Detail panel */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setSelected(null)} />
          <aside className="fixed right-0 top-0 h-full w-full sm:w-[440px] bg-[#0a0a0e] border-l border-white/10 z-50 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${LAYER_DOT[selected.layer]}`} />
                    <span className="text-zinc-500 text-[11px] font-mono uppercase tracking-widest">
                      {LAYERS.find((l) => l.id === selected.layer)?.title}
                    </span>
                  </div>
                  <h3 className="text-white text-2xl font-bold tracking-tight">{selected.name}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    {selected.ticker ? (
                      <span className="text-emerald-300 text-xs font-mono border border-emerald-400/20 rounded px-1.5 py-0.5">Public · {selected.ticker}</span>
                    ) : (
                      <span className="text-zinc-400 text-xs font-mono border border-white/10 rounded px-1.5 py-0.5">
                        Private{selected.valuationUsd ? ` · ${formatMarketCap(selected.valuationUsd)}${selected.valuationAsOf ? ` (${selected.valuationAsOf})` : ""}` : ""}
                      </span>
                    )}
                    <span className="text-zinc-500 text-xs">{selected.sector}</span>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="text-zinc-500 hover:text-white p-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Key facts */}
              <div className="grid grid-cols-3 gap-px bg-white/[0.06] border border-white/[0.06] rounded-xl overflow-hidden mb-5">
                <div className="bg-[#0c0c11] px-3 py-3">
                  <div className="text-zinc-600 text-[9px] font-mono uppercase tracking-wider mb-1">Satellites</div>
                  <div className="text-sky-300 font-bold tabular-nums">{selected.fleet ? selected.fleet.toLocaleString() : "—"}</div>
                </div>
                <div className="bg-[#0c0c11] px-3 py-3">
                  <div className="text-zinc-600 text-[9px] font-mono uppercase tracking-wider mb-1">Founded</div>
                  <div className="text-white font-bold tabular-nums">{selected.founded ?? "—"}</div>
                </div>
                <div className="bg-[#0c0c11] px-3 py-3">
                  <div className="text-zinc-600 text-[9px] font-mono uppercase tracking-wider mb-1">HQ</div>
                  <div className="text-white text-xs font-medium leading-tight pt-0.5">{selected.hq ?? "—"}</div>
                </div>
              </div>

              <p className="text-zinc-400 text-sm leading-relaxed mb-6">{selected.description}</p>

              <div className="flex flex-wrap gap-2 mb-6">
                <button onClick={() => router.push(`/companies/${selected.slug}`)} className="px-3 py-2 bg-white text-black rounded-lg text-xs font-bold hover:bg-zinc-200 transition-colors">
                  Full profile →
                </button>
                {selected.ticker && (
                  <button onClick={() => router.push("/markets")} className="px-3 py-2 border border-white/15 text-zinc-300 rounded-lg text-xs font-medium hover:text-white hover:border-white/30 transition-colors">
                    Market data
                  </button>
                )}
                {selected.website && (
                  <a href={selected.website} target="_blank" rel="noopener noreferrer" className="px-3 py-2 border border-white/15 text-zinc-300 rounded-lg text-xs font-medium hover:text-white hover:border-white/30 transition-colors">
                    Website ↗
                  </a>
                )}
              </div>

              {/* Peers */}
              {peers.length > 0 && (
                <div>
                  <div className="text-zinc-600 text-[10px] font-mono uppercase tracking-widest mb-2">Others in {LAYERS.find((l) => l.id === selected.layer)?.title}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {peers.slice(0, 16).map((p) => (
                      <button key={p.slug} onClick={() => setSelected(p)} className="text-xs text-zinc-400 border border-white/[0.08] rounded-md px-2 py-1 hover:text-white hover:border-white/20 transition-colors">
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
