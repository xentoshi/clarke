import { buildMeta } from "@/lib/metadata";
import { stocks } from "@/data/stocks";
import { companies } from "@/data/companies";
import { fetchAllQuotes } from "@/lib/fetchStocks";
import { fetchSparkline } from "@/lib/fetchSparkline";
import StocksExplorer from "./StocksExplorer";

export const metadata = buildMeta({
  title: "Space Markets",
  description: "Live prices for publicly traded satellite and space infrastructure companies, grouped by sector.",
  tag: "Markets",
});

export const revalidate = 300;

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export default async function StocksPage() {
  const tickers = stocks.map((s) => s.ticker);
  const [quotes, sparklines] = await Promise.all([
    fetchAllQuotes(tickers),
    Promise.all(stocks.map(async (s) => ({ ticker: s.ticker, values: await fetchSparkline(s.ticker) }))),
  ]);

  const sparklineMap: Record<string, number[]> = {};
  for (const s of sparklines) sparklineMap[s.ticker] = s.values;

  // Map each stock to a company profile slug where one exists (same heuristic
  // the company page uses), so the drawer can open the matching profile.
  const slugByTicker: Record<string, string> = {};
  for (const s of stocks) {
    const sn = normalizeName(s.name);
    const match = companies.find((c) => {
      const cn = normalizeName(c.name);
      return cn.includes(sn) || sn.includes(cn);
    });
    if (match) slugByTicker[s.ticker] = match.slug;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-white mb-2">Space Markets</h1>
        <p className="text-zinc-500 text-sm max-w-2xl leading-relaxed">
          Publicly traded satellite and space infrastructure companies. GEO operators are direct candidates to list orbital slots on Clarke. The broader sector represents the infrastructure those assets support.
        </p>
      </div>
      <StocksExplorer quotes={quotes} sparklines={sparklineMap} slugByTicker={slugByTicker} />
    </div>
  );
}
