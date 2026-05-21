"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Company } from "@/data/companies";

interface Props {
  companies: Company[];
  sectors: string[];
}

export default function CompaniesClient({ companies, sectors }: Props) {
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = companies;
    if (selectedSector) result = result.filter((c) => c.sector === selectedSector);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.sector.toLowerCase().includes(q) ||
          c.hq?.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [companies, selectedSector, search]);

  const countFor = (sector: string) =>
    companies.filter((c) => c.sector === sector).length;

  const toggle = (slug: string) =>
    setOpenSlug((prev) => (prev === slug ? null : slug));

  return (
    <div className="flex gap-0 min-h-screen">
      {/* Sidebar */}
      <aside className="hidden lg:block w-56 shrink-0 border-r border-white/[0.05] sticky top-0 h-screen overflow-y-auto">
        <div className="py-8 pr-4">
          <button
            onClick={() => setSelectedSector(null)}
            className={`w-full text-left flex items-center justify-between px-3 py-1.5 rounded text-xs font-mono transition-colors mb-1 ${
              selectedSector === null
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            <span>All sectors</span>
            <span className="text-white/25">{companies.length}</span>
          </button>
          <div className="h-px bg-white/[0.05] my-3" />
          {sectors.map((sector) => (
            <button
              key={sector}
              onClick={() => setSelectedSector(sector === selectedSector ? null : sector)}
              className={`w-full text-left flex items-center justify-between px-3 py-1.5 rounded text-xs transition-colors mb-0.5 ${
                selectedSector === sector
                  ? "bg-white/10 text-white font-medium"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              <span className="truncate pr-2">{sector}</span>
              <span className="text-white/20 font-mono shrink-0">{countFor(sector)}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 px-4 sm:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-white/30 text-[11px] font-mono tracking-[0.3em] uppercase mb-3">Directory</div>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white">Companies</h1>
            <p className="text-zinc-500 text-sm mt-1">
              {filtered.length} {selectedSector ? `in ${selectedSector}` : `across ${sectors.length} sectors`}
            </p>
          </div>

          <input
            type="text"
            placeholder="Search by name, sector, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/20 transition-colors"
          />

          {/* Mobile sector pills */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 lg:hidden">
            <button
              onClick={() => setSelectedSector(null)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-mono transition-colors ${
                selectedSector === null
                  ? "bg-white/15 text-white"
                  : "bg-white/[0.04] text-white/40 hover:text-white/60"
              }`}
            >
              All
            </button>
            {sectors.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSector(s === selectedSector ? null : s)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs transition-colors ${
                  selectedSector === s
                    ? "bg-white/15 text-white"
                    : "bg-white/[0.04] text-white/40 hover:text-white/60"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Company list */}
        {filtered.length === 0 ? (
          <div className="text-white/25 text-sm py-16 text-center font-mono">No companies match.</div>
        ) : (
          <div className="space-y-px bg-white/[0.03]">
            {filtered.map((company) => {
              const isOpen = openSlug === company.slug;
              return (
                <div key={company.slug} className="bg-zinc-950">
                  {/* Row */}
                  <button
                    onClick={() => toggle(company.slug)}
                    className="w-full flex items-start justify-between gap-4 px-5 py-4 hover:bg-zinc-900/50 transition-colors text-left group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-white text-sm font-semibold group-hover:text-white/80 transition-colors">
                          {company.name}
                        </span>
                        {!selectedSector && (
                          <span className="text-[9px] font-mono text-white/20 tracking-wide uppercase hidden sm:inline">
                            {company.sector}
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-500 text-xs leading-relaxed line-clamp-1">
                        {company.description}
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-3 pt-0.5">
                      {company.hq && (
                        <span className="text-white/20 text-[10px] font-mono hidden sm:block">{company.hq}</span>
                      )}
                      {company.founded && (
                        <span className="text-white/20 text-[10px] font-mono">{company.founded}</span>
                      )}
                      <span className={`text-white/20 text-[10px] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                        ▾
                      </span>
                    </div>
                  </button>

                  {/* Expanded panel */}
                  {isOpen && (
                    <div className="px-5 pb-5 border-t border-white/[0.05] bg-zinc-900/30">
                      <p className="text-zinc-300 text-sm leading-relaxed pt-4 mb-5">
                        {company.description}
                      </p>
                      <div className="flex flex-wrap gap-x-8 gap-y-3 mb-5">
                        {company.hq && (
                          <div>
                            <div className="text-white/20 text-[9px] font-mono tracking-widest uppercase mb-1">HQ</div>
                            <div className="text-white text-xs">{company.hq}</div>
                          </div>
                        )}
                        {company.founded && (
                          <div>
                            <div className="text-white/20 text-[9px] font-mono tracking-widest uppercase mb-1">Founded</div>
                            <div className="text-white text-xs font-mono">{company.founded}</div>
                          </div>
                        )}
                        <div>
                          <div className="text-white/20 text-[9px] font-mono tracking-widest uppercase mb-1">Sector</div>
                          <div className="text-white text-xs">{company.sector}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {company.website && (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-mono text-white/50 hover:text-white transition-colors border border-white/10 hover:border-white/30 px-3 py-1.5 rounded"
                          >
                            {new URL(company.website).hostname.replace("www.", "")} ↗
                          </a>
                        )}
                        <Link
                          href={`/companies/${company.slug}`}
                          className="text-xs font-mono text-white/30 hover:text-white/60 transition-colors"
                        >
                          Full profile →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
