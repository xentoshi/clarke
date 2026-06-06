"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { stocks, type Stock } from "@/data/stocks";
import type { StockQuote } from "@/lib/fetchStocks";
import { formatMarketCap } from "@/lib/fetchStocks";
import { sparklinePath } from "@/lib/fetchSparkline";
import StockDrawer from "../stocks/StockDrawer";

export type PrivateCompany = {
  slug: string;
  name: string;
  sector: string;
  valuationUsd: number | null;
  valuationAsOf: string | null;
  fleet: number | null;
};

type PublicRow = {
  kind: "public";
  key: string;
  name: string;
  sector: string;
  value: number | null;
  fleet: number | null;
  stock: Stock;
  quote: StockQuote | undefined;
  spark: number[];
  change24: number | null;
  change7: number | null;
  change30: number | null;
};
type PrivateRow = {
  kind: "private";
  key: string;
  name: string;
  sector: string;
  value: number | null;
  fleet: number | null;
  slug: string;
  valuationAsOf: string | null;
};
type Row = PublicRow | PrivateRow;

type SortKey = "value" | "price" | "change24" | "change7" | "change30" | "fleet" | "name";
type ViewMode = "all" | "public" | "private";

function pct(n: number | null | undefined, dp = 2): string {
  if (n === null || n === undefined) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(dp)}%`;
}
function changeFrom(spark: number[], back: number): number | null {
  if (spark.length < 2) return null;
  const ref = spark[Math.max(0, spark.length - 1 - back)];
  if (!ref) return null;
  return ((spark[spark.length - 1] - ref) / ref) * 100;
}
function areaPath(values: number[], w: number, h: number): string {
  const line = sparklinePath(values, w, h);
  if (!line) return "";
  return `${line} L ${w},${h} L 0,${h} Z`;
}

function MiniSpark({ values, up, w = 96, h = 28 }: { values: number[]; up: boolean; w?: number; h?: number }) {
  const color = up ? "#34d399" : "#f87171";
  const line = sparklinePath(values, w, h);
  const id = useMemo(() => `g${Math.random().toString(36).slice(2)}`, []);
  if (!line) return <span className="text-zinc-700 text-xs">—</span>;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath(values, w, h)} fill={`url(#${id})`} stroke="none" />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function MarketsClient({
  quotes,
  sparklines,
  slugByTicker,
  fleetByKey,
  privates,
  satellitesTracked,
  geoCount,
  companiesTracked,
}: {
  quotes: StockQuote[];
  sparklines: Record<string, number[]>;
  slugByTicker: Record<string, string>;
  fleetByKey: Record<string, number>;
  privates: PrivateCompany[];
  satellitesTracked: number;
  geoCount: number;
  companiesTracked: number;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Stock | null>(null);
  const [query, setQuery] = useState("");
  const [activeSector, setActiveSector] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [view, setView] = useState<ViewMode>("all");
  const [onlyWatch, setOnlyWatch] = useState(false);
  const [watch, setWatch] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem("clarke:watchlist");
      if (raw) setWatch(new Set(JSON.parse(raw)));
    } catch {
      /* ignore */
    }
  }, []);
  function toggleWatch(key: string) {
    setWatch((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      try {
        localStorage.setItem("clarke:watchlist", JSON.stringify([...n]));
      } catch {
        /* ignore */
      }
      return n;
    });
  }

  const quoteMap = useMemo(() => new Map(quotes.map((q) => [q.ticker, q])), [quotes]);

  const rows: Row[] = useMemo(() => {
    const pub: Row[] = stocks.map((stock) => {
      const spark = sparklines[stock.ticker] ?? [];
      const quote = quoteMap.get(stock.ticker);
      return {
        kind: "public",
        key: stock.ticker,
        name: stock.name,
        sector: stock.vertical,
        value: quote?.marketCap ?? null,
        fleet: fleetByKey[stock.ticker] ?? null,
        stock,
        quote,
        spark,
        change24: quote?.changePercent ?? null,
        change7: changeFrom(spark, 5),
        change30: changeFrom(spark, spark.length - 1),
      };
    });
    const priv: Row[] = privates.map((p) => ({
      kind: "private",
      key: p.slug,
      name: p.name,
      sector: p.sector,
      value: p.valuationUsd,
      fleet: p.fleet,
      slug: p.slug,
      valuationAsOf: p.valuationAsOf,
    }));
    return [...pub, ...priv];
  }, [quoteMap, sparklines, privates, fleetByKey]);

  const publicRows = useMemo(() => rows.filter((r): r is PublicRow => r.kind === "public"), [rows]);

  const { totalCap, avgChange, advancers, decliners, withQuote } = useMemo(() => {
    const wq = publicRows.filter((r) => r.quote);
    const totalCap = wq.reduce((s, r) => s + (r.quote!.marketCap ?? 0), 0);
    const avgChange = wq.length ? wq.reduce((s, r) => s + (r.quote!.changePercent ?? 0), 0) / wq.length : 0;
    const advancers = wq.filter((r) => (r.quote!.changePercent ?? 0) > 0).length;
    const decliners = wq.filter((r) => (r.quote!.changePercent ?? 0) < 0).length;
    return { totalCap, avgChange, advancers, decliners, withQuote: wq.length };
  }, [publicRows]);

  // Clarke Space Index — market-cap-weighted reconstruction from 30d sparklines
  const index = useMemo(() => {
    const elig = publicRows.filter((r) => r.quote?.marketCap && r.quote.price && r.spark.length >= 8);
    if (elig.length < 3) return null;
    const L = Math.min(...elig.map((r) => r.spark.length));
    const series: number[] = [];
    for (let d = 0; d < L; d++) {
      let v = 0;
      for (const r of elig) {
        const s = r.spark.slice(r.spark.length - L);
        const shares = r.quote!.marketCap! / r.quote!.price;
        v += shares * s[d];
      }
      series.push(v);
    }
    const base = series[0] || 1;
    const norm = series.map((v) => (v / base) * 100);
    return { norm, changePct: norm[norm.length - 1] - 100, members: elig.length };
  }, [publicRows]);

  const sectors = useMemo(() => {
    const m = new Map<string, { cap: number; sum: number; n: number; count: number }>();
    for (const r of publicRows) {
      const e = m.get(r.sector) ?? { cap: 0, sum: 0, n: 0, count: 0 };
      e.count += 1;
      if (r.quote) {
        e.cap += r.quote.marketCap ?? 0;
        e.sum += r.quote.changePercent ?? 0;
        e.n += 1;
      }
      m.set(r.sector, e);
    }
    return [...m.entries()]
      .map(([name, e]) => ({ name, cap: e.cap, avg: e.n ? e.sum / e.n : 0, count: e.count }))
      .sort((a, b) => b.cap - a.cap);
  }, [publicRows]);
  const maxSectorCap = Math.max(...sectors.map((s) => s.cap), 1);

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = rows.filter((r) => {
      if (view !== "all" && r.kind !== view) return false;
      if (onlyWatch && !watch.has(r.key)) return false;
      if (activeSector && r.sector !== activeSector) return false;
      if (!q) return true;
      return r.key.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || r.sector.toLowerCase().includes(q);
    });
    const dir = sortDir === "asc" ? 1 : -1;
    const num = (r: Row): number => {
      switch (sortKey) {
        case "price": return r.kind === "public" ? r.quote?.price ?? -Infinity : -Infinity;
        case "change24": return r.kind === "public" ? r.change24 ?? -Infinity : -Infinity;
        case "change7": return r.kind === "public" ? r.change7 ?? -Infinity : -Infinity;
        case "change30": return r.kind === "public" ? r.change30 ?? -Infinity : -Infinity;
        case "fleet": return r.fleet ?? -Infinity;
        case "value": default: return r.value ?? -Infinity;
      }
    };
    list = [...list].sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name) * dir;
      return (num(a) - num(b)) * dir;
    });
    return list;
  }, [rows, query, view, onlyWatch, watch, activeSector, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  }
  const sortArrow = (key: SortKey) => (sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "");
  const capUp = avgChange >= 0;

  function mcapPerSat(r: Row): string | null {
    if (!r.value || !r.fleet || r.fleet < 10) return null;
    return `${formatMarketCap(r.value / r.fleet)}/sat`;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">Space Markets</h1>
        <p className="text-zinc-400 text-base max-w-2xl leading-relaxed">
          Public stocks and private valuations across the space sector, each with its market value and the
          satellites it flies. A calm reference, not a ticker. Prices via Yahoo Finance.
        </p>
      </div>

      {/* Clarke Space Index */}
      {index && (
        <div className="border border-white/[0.06] rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent p-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest mb-1">Clarke Space Index · 30d · market-cap weighted</div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-white tabular-nums">{(100 + index.changePct).toFixed(1)}</span>
                <span className={`text-sm font-mono font-bold ${index.changePct >= 0 ? "text-emerald-400" : "text-red-400"}`}>{pct(index.changePct)}</span>
                <span className="text-zinc-600 text-xs">{index.members} listed names</span>
              </div>
            </div>
            <svg width="280" height="64" viewBox="0 0 280 64" className="overflow-visible w-full sm:w-[280px]">
              <defs>
                <linearGradient id="idxgrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={index.changePct >= 0 ? "#34d399" : "#f87171"} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={index.changePct >= 0 ? "#34d399" : "#f87171"} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={areaPath(index.norm, 280, 64)} fill="url(#idxgrad)" />
              <path d={sparklinePath(index.norm, 280, 64)} fill="none" stroke={index.changePct >= 0 ? "#34d399" : "#f87171"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      )}

      {/* Stat band */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.06] border border-white/[0.06] rounded-2xl overflow-hidden mb-10">
        {[
          { label: "Public market cap", value: formatMarketCap(totalCap), sub: `${withQuote} listed companies` },
          { label: "Sector 24h", value: pct(avgChange), sub: `${advancers} up · ${decliners} down`, color: capUp ? "text-emerald-400" : "text-red-400" },
          { label: "Satellites in orbit", value: satellitesTracked.toLocaleString(), sub: `${geoCount} in GEO` },
          { label: "Companies tracked", value: `${companiesTracked}+`, sub: "public + private" },
        ].map((s) => (
          <div key={s.label} className="bg-[#0a0a0e] px-5 py-5">
            <div className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest mb-2">{s.label}</div>
            <div className={`text-2xl font-bold tracking-tight tabular-nums ${s.color ?? "text-white"}`}>{s.value}</div>
            <div className="text-zinc-600 text-xs mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Sector heatmap */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-zinc-600 text-xs font-mono uppercase tracking-widest">Sectors · sized by market cap, colored by 24h</span>
          {activeSector && <button onClick={() => setActiveSector(null)} className="text-zinc-500 hover:text-zinc-300 text-xs">Clear ×</button>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {sectors.map((s) => {
            const up = s.avg >= 0;
            const intensity = 0.06 + Math.min(Math.abs(s.avg) / 5, 1) * 0.22;
            const grow = 1 + (s.cap / maxSectorCap) * 4;
            const isActive = activeSector === s.name;
            return (
              <button key={s.name} onClick={() => setActiveSector(isActive ? null : s.name)}
                style={{ flexGrow: grow, flexBasis: 130, background: up ? `rgba(52,211,153,${intensity})` : `rgba(248,113,113,${intensity})` }}
                className={`rounded-lg px-3 py-3 text-left border transition-all ${isActive ? "border-white/50" : up ? "border-emerald-900/40 hover:border-emerald-700/60" : "border-red-900/40 hover:border-red-700/60"}`}>
                <div className="text-white text-xs font-semibold truncate">{s.name}</div>
                <div className={`text-xs font-mono font-bold mt-0.5 ${up ? "text-emerald-300" : "text-red-300"}`}>{pct(s.avg)}</div>
                <div className="text-white/40 text-[10px] mt-0.5">{formatMarketCap(s.cap)} · {s.count}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-white/[0.08] overflow-hidden">
            {(["all", "public", "private"] as ViewMode[]).map((m) => (
              <button key={m} onClick={() => setView(m)}
                className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${view === m ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
                {m}
              </button>
            ))}
          </div>
          <button onClick={() => setOnlyWatch((v) => !v)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${onlyWatch ? "bg-amber-400/10 border-amber-400/30 text-amber-300" : "border-white/[0.08] text-zinc-500 hover:text-zinc-300"}`}>
            ★ Watchlist{watch.size ? ` (${watch.size})` : ""}
          </button>
        </div>
        <div className="relative">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ticker, name, sector…"
            className="bg-white/[0.03] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/25 w-full sm:w-72" />
        </div>
      </div>

      {/* Master table */}
      <div className="border border-white/[0.06] rounded-2xl overflow-hidden bg-[#0a0a0e]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="w-8 pl-3"></th>
                <th className="text-left pr-2 py-3 text-zinc-600 text-[10px] uppercase tracking-wider font-medium w-8">#</th>
                <th onClick={() => toggleSort("name")} className="text-left px-3 py-3 text-zinc-500 text-[10px] uppercase tracking-wider font-medium cursor-pointer hover:text-zinc-300 select-none">Company{sortArrow("name")}</th>
                <th onClick={() => toggleSort("price")} className="text-right px-3 py-3 text-zinc-500 text-[10px] uppercase tracking-wider font-medium cursor-pointer hover:text-zinc-300 select-none">Price{sortArrow("price")}</th>
                <th onClick={() => toggleSort("change24")} className="text-right px-3 py-3 text-zinc-500 text-[10px] uppercase tracking-wider font-medium cursor-pointer hover:text-zinc-300 select-none">24h{sortArrow("change24")}</th>
                <th onClick={() => toggleSort("change7")} className="text-right px-3 py-3 text-zinc-500 text-[10px] uppercase tracking-wider font-medium cursor-pointer hover:text-zinc-300 select-none hidden sm:table-cell">7d{sortArrow("change7")}</th>
                <th onClick={() => toggleSort("change30")} className="text-right px-3 py-3 text-zinc-500 text-[10px] uppercase tracking-wider font-medium cursor-pointer hover:text-zinc-300 select-none hidden md:table-cell">30d{sortArrow("change30")}</th>
                <th onClick={() => toggleSort("value")} className="text-right px-3 py-3 text-zinc-500 text-[10px] uppercase tracking-wider font-medium cursor-pointer hover:text-zinc-300 select-none">Mkt Cap / Val{sortArrow("value")}</th>
                <th onClick={() => toggleSort("fleet")} className="text-right px-3 py-3 text-zinc-500 text-[10px] uppercase tracking-wider font-medium cursor-pointer hover:text-zinc-300 select-none hidden md:table-cell" title="Satellites in orbit (Clarke registry / UCS)">Sats{sortArrow("fleet")}</th>
                <th className="text-center px-3 py-3 text-zinc-600 text-[10px] uppercase tracking-wider font-medium hidden lg:table-cell w-28">30d</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((r, i) => {
                const starred = watch.has(r.key);
                const onRow = () => (r.kind === "public" ? setSelected(r.stock) : router.push(`/companies/${r.slug}`));
                const perSat = mcapPerSat(r);
                return (
                  <tr key={r.key} onClick={onRow} className="border-b border-white/[0.04] last:border-0 cursor-pointer hover:bg-white/[0.025] transition-colors">
                    <td className="pl-3" onClick={(e) => { e.stopPropagation(); toggleWatch(r.key); }}>
                      <span className={`block text-sm leading-none transition-colors ${starred ? "text-amber-300" : "text-zinc-700 hover:text-zinc-400"}`}>★</span>
                    </td>
                    <td className="pr-2 py-3 text-zinc-600 font-mono text-xs tabular-nums">{i + 1}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-white text-sm leading-tight">{r.key}</span>
                            {r.kind === "private" && <span className="text-[9px] font-mono text-zinc-500 border border-white/[0.08] rounded px-1 py-0.5">PVT</span>}
                          </div>
                          <div className="text-zinc-500 text-xs leading-tight">{r.name}</div>
                        </div>
                        <span className="hidden xl:inline-block text-[10px] font-mono text-zinc-600 border border-white/[0.07] rounded px-1.5 py-0.5">{r.sector}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-sm tabular-nums">
                      {r.kind === "public" && r.quote ? <span className="text-white">${r.quote.price.toFixed(2)}</span> : <span className="text-zinc-600 text-xs">Private</span>}
                    </td>
                    <td className={`px-3 py-3 text-right font-mono text-sm tabular-nums ${r.kind === "public" && r.change24 !== null ? (r.change24 >= 0 ? "text-emerald-400" : "text-red-400") : "text-zinc-700"}`}>
                      {r.kind === "public" ? pct(r.change24) : "—"}
                    </td>
                    <td className={`px-3 py-3 text-right font-mono text-sm tabular-nums hidden sm:table-cell ${r.kind === "public" && r.change7 !== null ? (r.change7 >= 0 ? "text-emerald-400/90" : "text-red-400/90") : "text-zinc-700"}`}>
                      {r.kind === "public" ? pct(r.change7) : "—"}
                    </td>
                    <td className={`px-3 py-3 text-right font-mono text-sm tabular-nums hidden md:table-cell ${r.kind === "public" && r.change30 !== null ? (r.change30 >= 0 ? "text-emerald-400/90" : "text-red-400/90") : "text-zinc-700"}`}>
                      {r.kind === "public" ? pct(r.change30) : "—"}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-sm tabular-nums">
                      {r.value ? (
                        <span className="text-zinc-200">
                          {formatMarketCap(r.value)}
                          {r.kind === "private" && r.valuationAsOf && <span className="text-zinc-600 text-[10px] ml-1">&apos;{r.valuationAsOf.slice(-2)}</span>}
                        </span>
                      ) : (
                        <span className="text-zinc-700">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-sm tabular-nums hidden md:table-cell">
                      {r.fleet ? (
                        <div className="leading-tight">
                          <span className="text-sky-300/90">{r.fleet.toLocaleString()}</span>
                          {perSat && <div className="text-zinc-600 text-[10px]">{perSat}</div>}
                        </div>
                      ) : (
                        <span className="text-zinc-700">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell">
                      <div className="flex justify-center">
                        {r.kind === "public" ? <MiniSpark values={r.spark} up={(r.change30 ?? 0) >= 0} /> : <span className="text-zinc-700 text-xs">—</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {visibleRows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-zinc-600 text-sm">No companies match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-zinc-700 text-xs mt-6 font-mono leading-relaxed">
        Public prices and market cap via Yahoo Finance, updated every few minutes. 7d / 30d derived from daily closes.
        Private valuations are last publicly reported figures (year shown); most are undisclosed. Satellites in orbit are
        counts from Clarke&apos;s registry (UCS dataset) and may lag the latest launches. Not financial advice.
      </p>

      {selected && (
        <StockDrawer stock={selected} quote={quoteMap.get(selected.ticker)} companySlug={slugByTicker[selected.ticker] ?? null} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
