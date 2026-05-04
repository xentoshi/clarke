import Link from "next/link";
import { buildMeta } from "@/lib/metadata";
import { stocks } from "@/data/stocks";
import { companies } from "@/data/companies";

export const metadata = buildMeta({
  title: "Stocks",
  description: "Live prices and sparklines for every publicly traded company in the space industry directory.",
  tag: "Markets",
});
import { fetchAllQuotes, formatMarketCap, formatVolume } from "@/lib/fetchStocks";
import { fetchSparkline, sparklinePath } from "@/lib/fetchSparkline";

export const revalidate = 300;

// Group stocks by vertical for heatmap
function groupByVertical(stockList: typeof stocks, quoteMap: Map<string, { changePercent: number }>) {
  const groups: Record<string, number[]> = {};
  for (const s of stockList) {
    const q = quoteMap.get(s.ticker);
    if (!q) continue;
    groups[s.vertical] = groups[s.vertical] ?? [];
    groups[s.vertical].push(q.changePercent);
  }
  return Object.entries(groups).map(([vertical, changes]) => ({
    vertical,
    avg: changes.reduce((a, b) => a + b, 0) / changes.length,
    count: changes.length,
  })).sort((a, b) => b.avg - a.avg);
}

function HeatmapCell({ vertical, avg, count }: { vertical: string; avg: number; count: number }) {
  const up = avg >= 0;
  const intensity = Math.min(Math.abs(avg) / 5, 1);
  const bg = up
    ? `rgba(52,211,153,${0.08 + intensity * 0.18})`
    : `rgba(248,113,113,${0.08 + intensity * 0.18})`;
  const border = up ? "border-emerald-800/50" : "border-red-800/50";
  const text = up ? "text-emerald-400" : "text-red-400";

  return (
    <div
      className={`border ${border} rounded-lg p-3 text-center`}
      style={{ background: bg }}
    >
      <div className="text-white text-xs font-medium truncate mb-1">{vertical}</div>
      <div className={`text-sm font-bold font-mono ${text}`}>
        {up ? "+" : ""}{avg.toFixed(2)}%
      </div>
      <div className="text-zinc-600 text-xs">{count} stock{count !== 1 ? "s" : ""}</div>
    </div>
  );
}

export default async function StocksPage() {
  const tickers = stocks.map((s) => s.ticker);
  const [quotes, sparklines] = await Promise.all([
    fetchAllQuotes(tickers),
    Promise.all(stocks.map(async (s) => ({ ticker: s.ticker, values: await fetchSparkline(s.ticker) }))),
  ]);

  const quoteMap = new Map(quotes.map((q) => [q.ticker, q]));
  const sparklineMap = new Map(sparklines.map((s) => [s.ticker, s.values]));
  const tickerToSlug = new Map(companies.filter((c) => c.ticker).map((c) => [c.ticker!, c.slug]));
  const heatmapData = groupByVertical(stocks, quoteMap);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-white mb-2">Stocks</h1>
        <p className="text-zinc-500 text-sm">
          Publicly traded space industry · prices refresh every 5 min · not financial advice
        </p>
      </div>

      {/* Sector Heatmap */}
      {heatmapData.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4 font-medium">Sector Performance · Today</h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-2">
            {heatmapData.map((d) => (
              <HeatmapCell key={d.vertical} {...d} />
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="text-left px-4 py-3 text-zinc-500 text-xs uppercase tracking-wider font-medium">Ticker</th>
              <th className="text-left px-4 py-3 text-zinc-500 text-xs uppercase tracking-wider font-medium hidden sm:table-cell">Company</th>
              <th className="text-right px-4 py-3 text-zinc-500 text-xs uppercase tracking-wider font-medium">Price</th>
              <th className="text-right px-4 py-3 text-zinc-500 text-xs uppercase tracking-wider font-medium">24h</th>
              <th className="text-center px-4 py-3 text-zinc-500 text-xs uppercase tracking-wider font-medium hidden md:table-cell">30d</th>
              <th className="text-right px-4 py-3 text-zinc-500 text-xs uppercase tracking-wider font-medium hidden md:table-cell">Mkt Cap</th>
              <th className="text-right px-4 py-3 text-zinc-500 text-xs uppercase tracking-wider font-medium hidden lg:table-cell">52w High</th>
              <th className="text-right px-4 py-3 text-zinc-500 text-xs uppercase tracking-wider font-medium hidden lg:table-cell">52w Low</th>
              <th className="text-right px-4 py-3 text-zinc-500 text-xs uppercase tracking-wider font-medium hidden md:table-cell">Volume</th>
              <th className="text-left px-4 py-3 text-zinc-500 text-xs uppercase tracking-wider font-medium hidden lg:table-cell">Vertical</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock, i) => {
              const q = quoteMap.get(stock.ticker);
              const values = sparklineMap.get(stock.ticker) ?? [];
              const isUp = (q?.changePercent ?? 0) >= 0;
              const changeColor = isUp ? "text-emerald-400" : "text-red-400";
              const path = sparklinePath(values);
              const sparkColor = isUp ? "#34d399" : "#f87171";

              return (
                <tr
                  key={stock.ticker}
                  className={`border-b border-zinc-800/50 hover:bg-zinc-900/40 transition-colors ${i === stocks.length - 1 ? "border-b-0" : ""}`}
                >
                  <td className="px-4 py-3">
                    <a
                      href={`https://www.tradingview.com/symbols/${stock.ticker}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono font-bold text-white hover:text-zinc-300 transition-colors"
                    >
                      {stock.ticker}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs hidden sm:table-cell">
                    {tickerToSlug.has(stock.ticker) ? (
                      <Link href={`/companies/${tickerToSlug.get(stock.ticker)}`} className="hover:text-white transition-colors">
                        {stock.name}
                      </Link>
                    ) : (
                      stock.name
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-white text-sm">
                      {q ? `$${q.price.toFixed(2)}` : <span className="text-zinc-700">—</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {q ? (
                      <div className={`font-mono text-xs ${changeColor}`}>
                        <div>{isUp ? "+" : ""}{q.change.toFixed(2)}</div>
                        <div>{isUp ? "+" : ""}{q.changePercent.toFixed(2)}%</div>
                      </div>
                    ) : (
                      <span className="text-zinc-700 font-mono text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {path ? (
                      <svg width="80" height="28" viewBox="0 0 80 28" className="mx-auto">
                        <path d={path} fill="none" stroke={sparkColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <span className="text-zinc-700 text-xs block text-center">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-400 text-xs hidden md:table-cell">
                    {formatMarketCap(q?.marketCap)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-500 text-xs hidden lg:table-cell">
                    {q?.high52w ? `$${q.high52w.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-500 text-xs hidden lg:table-cell">
                    {q?.low52w ? `$${q.low52w.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-500 text-xs hidden md:table-cell">
                    {formatVolume(q?.volume)}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-zinc-600 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                      {stock.vertical}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
