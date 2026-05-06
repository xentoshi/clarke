import Link from "next/link";
import { buildMeta } from "@/lib/metadata";
import { companies } from "@/data/companies";
import { stocks } from "@/data/stocks";

export const metadata = buildMeta({
  title: "API Reference",
  description: "Machine-readable company and market data.",
  tag: "API",
});

const endpoints = [
  {
    method: "GET",
    path: "/api/companies",
    description: "Full company dataset name, slug, vertical, stage, HQ, ticker, website.",
    params: [
      { name: "vertical", desc: "launch | lunar | habitation | propulsion | power | isru | manufacturing | food | robotics | comms | observation | suits | mining" },
      { name: "stage", desc: "public | series-c+ | series-b | series-a | seed | stealth" },
      { name: "ticker", desc: "Pass any value to return only publicly traded companies" },
    ],
    example: "/api/companies?vertical=lunar",
    count: `${companies.length} companies`,
    revalidate: "1 hour",
  },
  {
    method: "GET",
    path: "/api/quotes",
    description: "Live stock quotes for all tracked public companies price, change, market cap, volume, 52w high/low.",
    params: [],
    example: "/api/quotes",
    count: `${stocks.length} tickers`,
    revalidate: "5 minutes",
  },
  {
    method: "GET",
    path: "/api/sparklines",
    description: "90-day price sparkline data (array of closing prices) for all tracked tickers.",
    params: [],
    example: "/api/sparklines",
    count: `${stocks.length} tickers`,
    revalidate: "1 hour",
  },
];

export default function ApiDocsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-white mb-4">API Reference</h1>
        <p className="text-zinc-400 text-sm leading-relaxed max-w-xl">
          All endpoints are public and JSON. No auth required for free tier (100 calls/day).
        </p>
      </div>

      <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/20 mb-10 flex items-center gap-3">
        <span className="text-zinc-500 text-xs uppercase tracking-widest shrink-0">Base URL</span>
        <code className="font-mono text-sm text-white">https://sigma.fyi</code>
      </div>

      <div className="space-y-6">
        {endpoints.map((ep) => (
          <div key={ep.path} className="border border-zinc-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800 bg-zinc-900/20">
              <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">
                {ep.method}
              </span>
              <code className="font-mono text-sm text-white">{ep.path}</code>
              <div className="ml-auto flex items-center gap-3 text-xs text-zinc-600">
                <span>{ep.count}</span>
                <span>·</span>
                <span>revalidates every {ep.revalidate}</span>
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="text-zinc-400 text-sm mb-4">{ep.description}</p>
              {ep.params.length > 0 && (
                <div className="mb-4">
                  <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Query Parameters</div>
                  <div className="space-y-1.5">
                    {ep.params.map((p) => (
                      <div key={p.name} className="flex items-start gap-3 text-xs">
                        <code className="font-mono text-zinc-300 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded shrink-0">{p.name}</code>
                        <span className="text-zinc-500">{p.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <code className="font-mono text-xs text-zinc-500 bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded flex-1 truncate">
                  GET {ep.example}
                </code>
                <a href={ep.example} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-zinc-500 hover:text-white border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 rounded transition-colors shrink-0">
                  Try it →
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <a href="mailto:hello@sigma.fyi" className="text-sm text-zinc-500 hover:text-white transition-colors">
          Questions? hello@sigma.fyi →
        </a>
      </div>
    </div>
  );
}
