"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Stock } from "@/data/stocks";
import type { StockQuote } from "@/lib/fetchStocks";
import { formatMarketCap } from "@/lib/fetchStocks";

interface Profile {
  company: { name: string; sector: string; hq?: string; founded?: number; description: string; website?: string };
  slots: unknown[];
  satellites: unknown[];
}

export default function StockDrawer({
  stock, quote, companySlug, onClose,
}: {
  stock: Stock;
  quote: StockQuote | undefined;
  companySlug: string | null;
  onClose: () => void;
}) {
  const [shown, setShown] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Clear the stale profile the instant the slug changes, adjusted during
  // render rather than in an effect, so a fast switch never shows the
  // previous company's data while the new fetch is in flight.
  const [prevSlug, setPrevSlug] = useState(companySlug);
  if (companySlug !== prevSlug) {
    setPrevSlug(companySlug);
    setProfile(null);
  }

  useEffect(() => {
    if (!companySlug) return;
    let cancelled = false;
    fetch(`/api/v1/agents/companies/${companySlug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => { if (!cancelled && json?.data) setProfile(json.data as Profile); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [companySlug]);

  const isUp = (quote?.changePercent ?? 0) >= 0;

  return (
    <>
      <div className={`fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 ${shown ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div className={`fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-zinc-950 border-l border-zinc-800 overflow-y-auto z-40 transition-transform duration-300 ease-out ${shown ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="text-zinc-500 text-xs font-mono mb-1">{stock.vertical}</div>
              <h2 className="text-white font-bold text-lg leading-tight">{stock.name}</h2>
              <a href={`https://www.tradingview.com/symbols/${stock.ticker}/`} target="_blank" rel="noopener noreferrer"
                className="text-zinc-500 text-xs font-mono hover:text-zinc-300 transition-colors">{stock.ticker} ↗</a>
            </div>
            <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 transition-colors text-xl leading-none" aria-label="Close">×</button>
          </div>

          {/* Quote */}
          <div className="flex items-baseline gap-3 mb-5">
            <span className="text-white font-mono text-2xl font-bold">{quote ? `$${quote.price.toFixed(2)}` : "—"}</span>
            {quote && (
              <span className={`font-mono text-sm ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                {isUp ? "+" : ""}{quote.change.toFixed(2)} ({isUp ? "+" : ""}{quote.changePercent.toFixed(2)}%)
              </span>
            )}
          </div>
          {quote && (quote.marketCap || quote.high52w) && (
            <div className="grid grid-cols-3 gap-2 mb-5">
              <Metric label="Mkt cap" value={formatMarketCap(quote.marketCap)} />
              <Metric label="52w high" value={quote.high52w ? `$${quote.high52w.toFixed(2)}` : "—"} />
              <Metric label="52w low" value={quote.low52w ? `$${quote.low52w.toFixed(2)}` : "—"} />
            </div>
          )}

          {/* Stock thesis */}
          <p className="text-zinc-400 text-sm leading-relaxed mb-3">{stock.detail}</p>
          <div className="border-l border-white/[0.08] pl-4 mb-5">
            <div className="text-zinc-500 text-[10px] uppercase tracking-wider font-medium mb-1">Why it matters to Clarke</div>
            <p className="text-zinc-400 text-xs leading-relaxed">{stock.clarkeRelevance}</p>
          </div>

          {/* Company profile (if matched) */}
          {companySlug && profile && (
            <div className="pt-5 border-t border-zinc-800">
              <div className="text-zinc-500 text-[10px] uppercase tracking-wider font-medium mb-2">Company profile</div>
              <p className="text-zinc-400 text-xs leading-relaxed mb-3">{profile.company.description}</p>
              <div className="flex flex-wrap gap-x-5 gap-y-1 mb-3 text-xs">
                <span className="text-zinc-500">{profile.company.sector}</span>
                {profile.company.hq && <span className="text-zinc-600">{profile.company.hq}</span>}
                <span className="text-zinc-400 font-mono">{profile.slots.length} GEO position{profile.slots.length !== 1 ? "s" : ""}</span>
                <span className="text-zinc-400 font-mono">{profile.satellites.length.toLocaleString()} satellite{profile.satellites.length !== 1 ? "s" : ""}</span>
              </div>
              <Link href={`/companies/${companySlug}`} className="text-zinc-300 hover:text-white text-xs transition-colors border border-zinc-800 hover:border-zinc-600 rounded-lg px-3 py-1.5 inline-block">
                View full orbital profile →
              </Link>
            </div>
          )}
          {companySlug && !profile && (
            <div className="pt-5 border-t border-zinc-800 text-zinc-700 text-xs">Loading company profile…</div>
          )}
        </div>
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-zinc-800 rounded-lg p-2 text-center">
      <div className="text-white text-xs font-bold font-mono">{value}</div>
      <div className="text-zinc-700 text-[10px] mt-0.5">{label}</div>
    </div>
  );
}
