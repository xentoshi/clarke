"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { companies, verticalLabels, Vertical } from "@/data/companies";
import VerticalBadge from "@/components/VerticalBadge";
import CompanyLogo from "@/components/CompanyLogo";
import Link from "next/link";

const verticals = Object.keys(verticalLabels) as Vertical[];

function CompaniesContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [vertical, setVertical] = useState<Vertical | "all">(
    (searchParams.get("vertical") as Vertical) ?? "all"
  );
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      const matchSearch =
        search === "" ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase()) ||
        c.hq.toLowerCase().includes(search.toLowerCase());
      const matchVertical = vertical === "all" || c.vertical === vertical;
      return matchSearch && matchVertical;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [search, vertical]);

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          placeholder="Search companies, descriptions, locations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
        />
        <select
          value={vertical}
          onChange={(e) => setVertical(e.target.value as Vertical | "all")}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
        >
          <option value="all">All Verticals</option>
          {verticals.map((v) => (
            <option key={v} value={v}>{verticalLabels[v]}</option>
          ))}
        </select>
        <div className="flex border border-zinc-800 rounded-lg overflow-hidden shrink-0">
          <button onClick={() => setView("grid")}
            className={`px-3 py-2 text-xs transition-colors ${view === "grid" ? "bg-zinc-800 text-white" : "text-zinc-600 hover:text-zinc-300"}`}>
            Grid
          </button>
          <button onClick={() => setView("list")}
            className={`px-3 py-2 text-xs transition-colors ${view === "list" ? "bg-zinc-800 text-white" : "text-zinc-600 hover:text-zinc-300"}`}>
            List
          </button>
        </div>
      </div>

      <p className="text-zinc-600 text-xs mb-6 font-mono">{filtered.length} companies</p>

      {view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((company) => (
            <Link key={company.slug} href={`/companies/${company.slug}`}
              className="group border border-zinc-800 rounded-xl p-5 bg-zinc-900/10 hover:border-zinc-600 hover:bg-zinc-900/30 transition-all">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <CompanyLogo website={company.website} name={company.name} size={28} />
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-base group-hover:text-zinc-200 transition-colors leading-tight truncate">
                      {company.name}
                    </h3>
                    <p className="text-zinc-600 text-xs mt-0.5">{company.hq} · Est. {company.founded}</p>
                  </div>
                </div>
                {company.ticker && (
                  <span className="font-mono text-xs text-zinc-400 bg-zinc-800 border border-zinc-700 px-2 py-1 rounded shrink-0">
                    {company.ticker}
                  </span>
                )}
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed mb-4 line-clamp-2">{company.description}</p>
              <div className="flex items-center justify-between">
                <VerticalBadge vertical={company.vertical} />
                {company.funding && (
                  <span className="text-zinc-600 text-xs font-mono">{company.funding}</span>
                )}
              </div>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 py-20 text-center text-zinc-600 text-sm">No companies found.</div>
          )}
        </div>
      ) : (
        <div className="border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="text-left px-4 py-3 text-zinc-500 text-xs uppercase tracking-wider font-medium">Company</th>
                <th className="text-left px-4 py-3 text-zinc-500 text-xs uppercase tracking-wider font-medium hidden sm:table-cell">Vertical</th>
                <th className="text-left px-4 py-3 text-zinc-500 text-xs uppercase tracking-wider font-medium hidden lg:table-cell">HQ</th>
                <th className="text-left px-4 py-3 text-zinc-500 text-xs uppercase tracking-wider font-medium hidden md:table-cell">Raised</th>
                <th className="text-left px-4 py-3 text-zinc-500 text-xs uppercase tracking-wider font-medium hidden md:table-cell">Ticker</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((company, i) => (
                <tr key={company.slug} className={`border-b border-zinc-800/50 hover:bg-zinc-900/40 transition-colors ${i === filtered.length - 1 ? "border-b-0" : ""}`}>
                  <td className="px-4 py-3">
                    <Link href={`/companies/${company.slug}`} className="font-medium text-white hover:text-zinc-300 transition-colors block">
                      {company.name}
                    </Link>
                    <span className="text-zinc-500 text-xs mt-0.5 hidden sm:block line-clamp-1">{company.description}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell"><VerticalBadge vertical={company.vertical} /></td>
                  <td className="px-4 py-3 text-zinc-400 text-xs hidden lg:table-cell">{company.hq}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs font-mono hidden md:table-cell">{company.funding ?? "—"}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {company.ticker
                      ? <span className="text-xs font-mono text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">{company.ticker}</span>
                      : <span className="text-zinc-700 text-xs">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="py-16 text-center text-zinc-600 text-sm">No companies found.</div>}
        </div>
      )}
    </>
  );
}

export default function CompaniesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Companies</h1>
        <p className="text-zinc-500 text-sm">
          {companies.length} companies across {Object.keys(verticalLabels).length} verticals — every organization building the space industry.
        </p>
      </div>
      <Suspense fallback={<div className="text-zinc-600 text-sm">Loading...</div>}>
        <CompaniesContent />
      </Suspense>
    </div>
  );
}
