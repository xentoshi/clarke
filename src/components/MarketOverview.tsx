import Link from "next/link";
import { stocks } from "@/data/stocks";
import { fetchAllQuotes, formatMarketCap } from "@/lib/fetchStocks";
import { fetchSparkline, sparklinePath } from "@/lib/fetchSparkline";

export const revalidate = 300;

const FEATURED = ["RKLB", "LUNR", "RDW", "PL", "SPIR", "OKLO", "BKSY", "ASTS"];

export default async function MarketOverview() {
  const featured = stocks.filter((s) => FEATURED.includes(s.ticker));
  const tickers = featured.map((s) => s.ticker);

  const [quotes, sparklines] = await Promise.all([
    fetchAllQuotes(tickers),
    Promise.all(featured.map(async (s) => ({ ticker: s.ticker, values: await fetchSparkline(s.ticker) }))),
  ]);

  if (quotes.length === 0) return null;

  const quoteMap = new Map(quotes.map((q) => [q.ticker, q]));
  const sparklineMap = new Map(sparklines.map((s) => [s.ticker, s.values]));

  const totalMarketCap = quotes.reduce((sum, q) => sum + (q.marketCap ?? 0), 0);
  const gainers = quotes.filter((q) => q.changePercent > 0).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-medium font-mono">{"// Live Markets"}</h2>
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 live-dot" />
          <span className="text-zinc-700 text-xs font-mono hidden sm:block">5min refresh</span>
        </div>
        <Link href="/stocks" className="text-xs text-zinc-600 hover:text-white transition-colors">All stocks →</Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="border border-zinc-800 rounded-lg p-3 bg-zinc-900/20">
          <div className="text-zinc-600 text-xs font-mono mb-1">COMBINED MCAP</div>
          <div className="text-white text-sm font-mono font-bold">{formatMarketCap(totalMarketCap)}</div>
        </div>
        <div className="border border-zinc-800 rounded-lg p-3 bg-zinc-900/20">
          <div className="text-zinc-600 text-xs font-mono mb-1">TRACKED</div>
          <div className="text-white text-sm font-mono font-bold">{quotes.length} public</div>
        </div>
        <div className="border border-zinc-800 rounded-lg p-3 bg-zinc-900/20">
          <div className="text-zinc-600 text-xs font-mono mb-1">ADVANCING</div>
          <div className="text-sm font-mono font-bold">
            <span className="text-emerald-400">{gainers}</span>
            <span className="text-zinc-600"> / {quotes.length}</span>
          </div>
        </div>
      </div>

      <div className="border border-zinc-800 rounded-xl overflow-hidden">
        <div className="divide-y divide-zinc-800/60">
          {FEATURED.map((ticker) => {
            const q = quoteMap.get(ticker);
            const stock = featured.find((s) => s.ticker === ticker);
            const vals = sparklineMap.get(ticker) ?? [];
            if (!q || !stock) return null;
            const up = q.changePercent >= 0;
            const path = sparklinePath(vals, 72, 24);
            return (
              <Link
                key={ticker}
                href="/stocks"
                className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-4 py-3 hover:bg-zinc-900/40 transition-colors group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white">{ticker}</span>
                    <span className="text-zinc-500 text-xs truncate hidden sm:block group-hover:text-zinc-400 transition-colors">{stock.name}</span>
                  </div>
                  <div className="text-zinc-700 text-xs truncate">{stock.vertical}</div>
                </div>
                {path && (
                  <svg width="72" height="24" viewBox="0 0 72 24" className="hidden sm:block shrink-0">
                    <path d={path} fill="none" stroke={up ? "#34d399" : "#f87171"} strokeWidth="1.2" strokeLinejoin="round"/>
                  </svg>
                )}
                <div className="text-right shrink-0">
                  <div className="text-white text-sm font-mono">${q.price.toFixed(2)}</div>
                  <div className={`text-xs font-mono ${up ? "text-emerald-400" : "text-red-400"}`}>
                    {up ? "+" : ""}{q.changePercent.toFixed(2)}%
                  </div>
                </div>
                <div className="text-zinc-700 text-xs font-mono shrink-0 hidden md:block">
                  {formatMarketCap(q.marketCap)}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
