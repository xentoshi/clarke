import Link from "next/link";
import { buildMeta } from "@/lib/metadata";
import { companies } from "@/data/companies";
import { stocks } from "@/data/stocks";
import { getFleetByKey } from "@/lib/fleet";
import { layerForSector } from "@/lib/value-chain";
import { buildExplorerRows } from "@/lib/explorer";
import SpaceEconomyMap, { type MapCompany } from "./SpaceEconomyMap";

export const metadata = buildMeta({
  title: "GEO Orbital Registry",
  description:
    "Clarke is a live registry of GEO orbital positions — congestion, operators, and FCC filing status — the reference-data layer for a market that runs on PDFs and phone calls.",
});

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export default function HomePage() {
  const registryRows = buildExplorerRows();
  const fccCount = registryRows.filter((r) => r.fccLicensed).length;
  const fleetByKey = getFleetByKey();

  // Reverse-map company slug -> stock ticker so the map can mark public names.
  const tickerBySlug: Record<string, string> = {};
  for (const s of stocks) {
    const sn = normalizeName(s.name);
    const match = companies.find((c) => {
      const cn = normalizeName(c.name);
      return cn.includes(sn) || sn.includes(cn);
    });
    if (match) tickerBySlug[match.slug] = s.ticker;
  }

  const mapped: MapCompany[] = companies.map((c) => ({
    slug: c.slug,
    name: c.name,
    sector: c.sector,
    layer: layerForSector(c.sector),
    description: c.description,
    hq: c.hq ?? null,
    founded: c.founded ?? null,
    website: c.website ?? null,
    fleet: fleetByKey[c.slug] ?? null,
    valuationUsd: c.funding?.valuationUsd ?? null,
    valuationAsOf: c.funding?.asOf ?? null,
    ticker: tickerBySlug[c.slug] ?? null,
  }));

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-10">
        <div className="text-sky-400/80 text-[11px] font-mono uppercase tracking-widest mb-3">
          Live registry
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">
          The registry for orbital infrastructure
        </h1>
        <p className="text-zinc-400 text-base max-w-2xl leading-relaxed mb-6">
          Clarke is a live registry of GEO orbital positions — congestion, operators, and FCC filing
          status — the reference-data layer for a market that runs on PDFs and phone calls.
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm mb-8">
          <span className="text-zinc-300 font-mono">{registryRows.length} <span className="text-zinc-600">positions tracked</span></span>
          <span className="text-zinc-300 font-mono">0–100 <span className="text-zinc-600">congestion score</span></span>
          <span className="text-zinc-300 font-mono">{fccCount} <span className="text-zinc-600">FCC filings flagged</span></span>
          <span className="text-zinc-300 font-mono">CSV <span className="text-zinc-600">export</span></span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/orbital"
            className="inline-flex items-center gap-2 bg-white text-black rounded-lg px-5 py-2.5 text-sm font-bold hover:bg-zinc-200 transition-colors">
            Explore the registry →
          </Link>
          <Link href="/orbital/faq" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
            How the data works
          </Link>
        </div>
      </div>

      <div className="border-t border-white/[0.05]">
        <SpaceEconomyMap companies={mapped} />
      </div>
    </>
  );
}
