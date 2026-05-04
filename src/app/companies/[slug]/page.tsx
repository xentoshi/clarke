import { notFound } from "next/navigation";
import { companies, verticalLabels, stageLabels } from "@/data/companies";
import { fetchQuote, formatMarketCap, formatVolume } from "@/lib/fetchStocks";
import VerticalBadge from "@/components/VerticalBadge";
import TradingViewChart from "@/components/TradingViewChart";
import CompanyLogo from "@/components/CompanyLogo";
import Link from "next/link";

export const revalidate = 300;

export function generateStaticParams() {
  return companies.map((c) => ({ slug: c.slug }));
}

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const company = companies.find((c) => c.slug === slug);
  if (!company) notFound();

  const quote = company.ticker ? await fetchQuote(company.ticker) : null;
  const isUp = (quote?.changePercent ?? 0) >= 0;
  const similar = companies.filter((c) => c.slug !== company.slug && c.vertical === company.vertical).slice(0, 4);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <Link href="/companies" className="text-xs text-zinc-600 hover:text-white transition-colors mb-8 inline-block">
        ← All Companies
      </Link>

      <div className="border border-zinc-800 rounded-xl p-8 bg-zinc-900/20 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <CompanyLogo website={company.website} name={company.name} size={40} />
              <h1 className="text-3xl font-bold text-white">{company.name}</h1>
              {company.ticker && (
                <span className="font-mono text-sm text-zinc-400 bg-zinc-800 border border-zinc-700 px-2 py-1 rounded">
                  {company.ticker}
                </span>
              )}
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4 max-w-xl">{company.description}</p>
            <div className="flex flex-wrap items-center gap-3">
              <VerticalBadge vertical={company.vertical} />
              <span className="text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">{stageLabels[company.stage]}</span>
              <span className="text-zinc-600 text-xs">{company.hq}</span>
              <span className="text-zinc-700">·</span>
              <span className="text-zinc-600 text-xs">Est. {company.founded}</span>
            </div>
          </div>

          {quote && (
            <div className="border border-zinc-800 rounded-lg p-5 bg-zinc-950 min-w-[160px] shrink-0">
              <div className="text-xs text-zinc-600 mb-1 font-mono">{company.ticker}</div>
              <div className="text-3xl font-bold text-white font-mono mb-1">${quote.price.toFixed(2)}</div>
              <div className={`text-sm font-mono font-bold ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                {isUp ? "+" : ""}{quote.change.toFixed(2)} ({isUp ? "+" : ""}{quote.changePercent.toFixed(2)}%)
              </div>
              <div className="mt-4 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-600">Mkt Cap</span>
                  <span className="font-mono text-zinc-400">{formatMarketCap(quote.marketCap)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Volume</span>
                  <span className="font-mono text-zinc-400">{formatVolume(quote.volume)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">52w High</span>
                  <span className="font-mono text-zinc-400">${quote.high52w?.toFixed(2) ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">52w Low</span>
                  <span className="font-mono text-zinc-400">${quote.low52w?.toFixed(2) ?? "—"}</span>
                </div>
              </div>
              <a href={`https://www.tradingview.com/symbols/${company.ticker}/`} target="_blank" rel="noopener noreferrer"
                className="mt-4 block text-center text-xs text-zinc-600 hover:text-zinc-400 transition-colors border border-zinc-800 rounded py-1.5">
                TradingView →
              </a>
            </div>
          )}
        </div>

        {company.notable && (
          <div className="mt-6 pt-6 border-t border-zinc-800">
            <div className="text-zinc-600 text-xs uppercase tracking-wider mb-1">Notable</div>
            <div className="text-zinc-300 text-sm">{company.notable}</div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a href={company.website} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-700 rounded text-sm text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors">
            Website →
          </a>
          {company.twitter && (
            <a href={company.twitter} target="_blank" rel="noopener noreferrer"
              className="px-3 py-2 border border-zinc-800 rounded text-xs text-zinc-500 hover:text-white hover:border-zinc-600 transition-colors">X/Twitter</a>
          )}
          {company.linkedin && (
            <a href={company.linkedin} target="_blank" rel="noopener noreferrer"
              className="px-3 py-2 border border-zinc-800 rounded text-xs text-zinc-500 hover:text-white hover:border-zinc-600 transition-colors">LinkedIn</a>
          )}
          {company.crunchbase && (
            <a href={company.crunchbase} target="_blank" rel="noopener noreferrer"
              className="px-3 py-2 border border-zinc-800 rounded text-xs text-zinc-500 hover:text-white hover:border-zinc-600 transition-colors">Crunchbase</a>
          )}
        </div>
      </div>

      {company.ticker && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Live Chart</h2>
            <a href={`https://www.tradingview.com/symbols/${company.ticker}/`} target="_blank" rel="noopener noreferrer"
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
              Open in TradingView →
            </a>
          </div>
          <TradingViewChart ticker={company.ticker} />
        </div>
      )}

      {similar.length > 0 && (
        <div>
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4 font-medium">
            More · {verticalLabels[company.vertical]}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {similar.map((c) => (
              <Link key={c.slug} href={`/companies/${c.slug}`}
                className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/10 hover:border-zinc-600 transition-colors group">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white text-sm font-medium group-hover:text-zinc-200">{c.name}</span>
                  {c.ticker && <span className="font-mono text-xs text-zinc-600">{c.ticker}</span>}
                </div>
                <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2">{c.description}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
