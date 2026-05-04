"use client";

import Link from "next/link";
import { investors, typeLabels, typeColors } from "@/data/investors";
import { companies } from "@/data/companies";
import { useState, useMemo } from "react";

type InvestorType = keyof typeof typeLabels;

export default function InvestorsClient() {
  const [typeFilter, setTypeFilter] = useState<InvestorType | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() =>
    investors.filter((inv) => {
      const matchType = typeFilter === "all" || inv.type === typeFilter;
      const q = search.toLowerCase();
      const matchSearch =
        q === "" ||
        inv.name.toLowerCase().includes(q) ||
        inv.thesis.toLowerCase().includes(q) ||
        inv.focus.some((f) => f.toLowerCase().includes(q));
      return matchType && matchSearch;
    }),
    [typeFilter, search]
  );

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          placeholder="Search investors, thesis, focus area..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setTypeFilter("all")}
            className={`text-xs px-3 py-1.5 rounded border font-medium transition-colors ${
              typeFilter === "all"
                ? "text-white bg-zinc-700 border-zinc-600"
                : "text-zinc-500 bg-zinc-900 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300"
            }`}
          >
            All
          </button>
          {(Object.keys(typeLabels) as InvestorType[]).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(typeFilter === type ? "all" : type)}
              className={`text-xs px-3 py-1.5 rounded border font-medium transition-opacity ${typeColors[type]} ${
                typeFilter !== "all" && typeFilter !== type ? "opacity-30" : "opacity-100"
              }`}
            >
              {typeLabels[type]}
            </button>
          ))}
        </div>
      </div>

      <p className="text-zinc-600 text-xs mb-4">{filtered.length} investors</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((inv) => (
          <div key={inv.slug} className="relative border border-zinc-800 rounded-xl p-6 bg-zinc-900/10 hover:border-zinc-600 transition-colors group">
            <Link href={`/investors/${inv.slug}`} className="absolute inset-0 rounded-xl z-0" aria-label={inv.name} />
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-bold text-white text-base group-hover:text-zinc-200 transition-colors">
                    {inv.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${typeColors[inv.type]}`}>
                    {typeLabels[inv.type]}
                  </span>
                  {inv.aum && (
                    <span className="text-zinc-600 text-xs font-mono">{inv.aum} AUM</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-4">
              {inv.focus.map((f) => (
                <span key={f} className="text-xs text-zinc-600 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
                  {f}
                </span>
              ))}
            </div>

            <p className="text-zinc-400 text-xs leading-relaxed mb-5">{inv.thesis}</p>

            <div>
              <div className="text-zinc-600 text-xs uppercase tracking-wider mb-2 font-medium">Notable Bets</div>
              <div className="space-y-1.5">
                {inv.notableBets.map((bet) => {
                  const linked = companies.find(
                    (c) => c.name.toLowerCase() === bet.company.toLowerCase() ||
                      bet.company.toLowerCase().includes(c.name.toLowerCase())
                  );
                  return (
                    <div key={bet.company} className="flex items-center justify-between">
                      {linked ? (
                        <Link href={`/companies/${linked.slug}`} className="relative z-10 text-zinc-300 text-xs hover:text-white transition-colors underline underline-offset-2">
                          {bet.company}
                        </Link>
                      ) : (
                        <span className="text-zinc-300 text-xs">{bet.company}</span>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-600 text-xs">{bet.round}</span>
                        <span className="text-xs text-zinc-600 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
                          {bet.vertical}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {inv.partners && inv.partners.length > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <span className="text-zinc-600 text-xs">Key partners: </span>
                <span className="text-zinc-400 text-xs">{inv.partners.join(", ")}</span>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 py-16 text-center text-zinc-600 text-sm">No investors match the current filters.</div>
        )}
      </div>
    </>
  );
}
