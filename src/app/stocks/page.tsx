import { buildMeta } from "@/lib/metadata";
import { stocks } from "@/data/stocks";
import { fetchAllQuotes, formatMarketCap } from "@/lib/fetchStocks";
import { fetchSparkline, sparklinePath } from "@/lib/fetchSparkline";

export const metadata = buildMeta({
  title: "Space Markets",
  description: "Live prices for publicly traded satellite and space infrastructure companies, grouped by sector.",
  tag: "Markets",
});

export const revalidate = 300;

const VERTICAL_ORDER = [
  "GEO Operators",
  "LEO Broadband",
  "LEO Comms",
  "Earth Observation",
  "Satellite Data",
  "Launch",
  "Manufacturing",
  "Ground Systems",
];

export default async function StocksPage() {
  const tickers = stocks.map((s) => s.ticker);
  const [quotes, sparklines] = await Promise.all([
    fetchAllQuotes(tickers),
    Promise.all(stocks.map(async (s) => ({ ticker: s.ticker, values: await fetchSparkline(s.ticker) }))),
  ]);

  const quoteMap = new Map(quotes.map((q) => [q.ticker, q]));
  const sparklineMap = new Map(sparklines.map((s) => [s.ticker, s.values]));

  // Group stocks by vertical
  const grouped = new Map<string, typeof stocks>();
  for (const vertical of VERTICAL_ORDER) {
    const group = stocks.filter((s) => s.vertical === vertical);
    if (group.length > 0) grouped.set(vertical, group);
  }

  // Avg change per vertical
  function verticalAvg(vertical: string): number | null {
    const group = grouped.get(vertical) ?? [];
    const changes = group.map((s) => quoteMap.get(s.ticker)?.changePercent).filter((c): c is number => c !== undefined);
    if (changes.length === 0) return null;
    return changes.reduce((a, b) => a + b, 0) / changes.length;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-white mb-2">Space Markets</h1>
        <p className="text-zinc-500 text-sm max-w-2xl leading-relaxed">
          Publicly traded satellite and space infrastructure companies. GEO operators are direct candidates to list orbital slots on Clarke. The broader sector represents the infrastructure those assets support.
        </p>
      </div>

      {/* Sector heatmap */}
      <div className="mb-12">
        <p className="text-zinc-600 text-xs font-mono mb-4 uppercase tracking-widest">// SECTOR PERFORMANCE · TODAY</p>
        <div className="flex flex-wrap gap-2">
          {VERTICAL_ORDER.map((vertical) => {
            const avg = verticalAvg(vertical);
            const group = grouped.get(vertical);
            if (!group) return null;
            const up = (avg ?? 0) >= 0;
            return (
              <div key={vertical}
                className={`border rounded-lg px-3 py-2 text-center min-w-[120px] ${up ? "border-emerald-800/40" : "border-red-800/40"}`}
                style={{ background: avg !== null ? (up ? `rgba(52,211,153,${0.05 + Math.min(Math.abs(avg)/5,1)*0.12})` : `rgba(248,113,113,${0.05 + Math.min(Math.abs(avg)/5,1)*0.12})`) : undefined }}
              >
                <div className="text-white text-xs font-medium mb-0.5 truncate">{vertical}</div>
                {avg !== null ? (
                  <div className={`text-xs font-mono font-bold ${up ? "text-emerald-400" : "text-red-400"}`}>
                    {up ? "+" : ""}{avg.toFixed(2)}%
                  </div>
                ) : (
                  <div className="text-zinc-700 text-xs font-mono">—</div>
                )}
                <div className="text-zinc-700 text-[10px] mt-0.5">{group.length} co.</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grouped tables */}
      <div className="space-y-10">
        {Array.from(grouped.entries()).map(([vertical, group]) => {
          const avg = verticalAvg(vertical);
          const up = (avg ?? 0) >= 0;
          return (
            <div key={vertical}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-white text-sm font-semibold">{vertical}</h2>
                {avg !== null && (
                  <span className={`text-xs font-mono ${up ? "text-emerald-400" : "text-red-400"}`}>
                    {up ? "+" : ""}{avg.toFixed(2)}%
                  </span>
                )}
              </div>
              <div className="border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/40">
                      <th className="text-left px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium w-20">Ticker</th>
                      <th className="text-left px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium hidden sm:table-cell">Company</th>
                      <th className="text-right px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium">Price</th>
                      <th className="text-right px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium">24h</th>
                      <th className="text-center px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium hidden md:table-cell w-24">30d</th>
                      <th className="text-right px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium hidden md:table-cell">Mkt Cap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.map((stock, i) => {
                      const q = quoteMap.get(stock.ticker);
                      const values = sparklineMap.get(stock.ticker) ?? [];
                      const isUp = (q?.changePercent ?? 0) >= 0;
                      const changeColor = isUp ? "text-emerald-400" : "text-red-400";
                      const path = sparklinePath(values);
                      const sparkColor = isUp ? "#34d399" : "#f87171";
                      return (
                        <tr key={stock.ticker}
                          className={`border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors ${i === group.length - 1 ? "border-b-0" : ""}`}>
                          <td className="px-4 py-3">
                            <a href={`https://www.tradingview.com/symbols/${stock.ticker}/`}
                              target="_blank" rel="noopener noreferrer"
                              className="font-mono font-bold text-white hover:text-zinc-300 transition-colors text-sm">
                              {stock.ticker}
                            </a>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <div className="text-zinc-300 text-xs font-medium">{stock.name}</div>
                            <div className="text-zinc-600 text-xs mt-0.5 max-w-sm leading-relaxed">{stock.description}</div>
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
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-zinc-700 text-xs mt-10 font-mono">
        Prices refresh every 5 min via Financial Modeling Prep. Not financial advice.
      </p>
    </div>
  );
}
