import { notFound } from "next/navigation";
import Link from "next/link";
import { buildMeta } from "@/lib/metadata";
import { companiesBySlug, companies } from "@/data/companies";
import { stocks } from "@/data/stocks";
import { slugToOperators } from "@/lib/operator-map";
import { buildOperatorExposure } from "@/lib/exposure";
import { getConstellationPresence, type CongestionTier } from "@/lib/satellites";

const REGIME_LABEL: Record<string, string> = {
  LEO: "LEO", MEO: "MEO", ELLIPTICAL: "Elliptical",
};

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const congestionColor: Record<CongestionTier, string> = {
  sparse: "#3f3f46", low: "#3b82f6", moderate: "#f59e0b", high: "#f97316", critical: "#ef4444",
};

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const company = companiesBySlug[slug];
  if (!company) return {};
  return buildMeta({
    title: company.name,
    description: company.description,
    tag: company.sector,
  });
}

export async function generateStaticParams() {
  return companies.map((c) => ({ slug: c.slug }));
}

export default async function CompanyPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const company = companiesBySlug[slug];
  if (!company) notFound();

  const related = companies.filter(
    (c) => c.sector === company.sector && c.slug !== company.slug
  ).slice(0, 4);

  const operatorNames = slugToOperators(slug);
  const exposure = buildOperatorExposure(operatorNames);
  const constellation = getConstellationPresence(company.name);

  const cn = normalizeName(company.name);
  const matchingStock = stocks.find((s) => {
    const sn = normalizeName(s.name);
    return sn.includes(cn) || cn.includes(sn);
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-12">
        <Link href="/companies" className="text-white/30 text-xs font-mono hover:text-white/60 transition-colors">
          ← Companies
        </Link>
      </div>

      <div className="mb-2 flex items-center gap-3">
        <span className="text-[10px] font-mono text-white/25 tracking-widest uppercase">{company.sector}</span>
        {matchingStock && (
          <Link
            href="/stocks"
            className="text-[10px] font-mono text-zinc-500 hover:text-white border border-zinc-800 hover:border-zinc-600 px-1.5 py-0.5 rounded transition-colors"
          >
            {matchingStock.ticker}
          </Link>
        )}
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">{company.name}</h1>

      {company.website && (
        <a
          href={company.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs font-mono text-zinc-600 hover:text-zinc-300 transition-colors mb-8"
        >
          {new URL(company.website).hostname.replace("www.", "")} ↗
        </a>
      )}
      {!company.website && <div className="mb-8" />}

      <p className="text-zinc-300 text-base leading-relaxed mb-12">{company.description}</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-white/[0.04] mb-16">
        {company.founded && (
          <div className="bg-zinc-950 px-5 py-5">
            <div className="text-white font-bold font-mono text-xl mb-1">{company.founded}</div>
            <div className="text-white/25 text-[10px] font-mono tracking-widest uppercase">Founded</div>
          </div>
        )}
        {company.hq && (
          <div className="bg-zinc-950 px-5 py-5">
            <div className="text-white font-bold text-sm mb-1">{company.hq}</div>
            <div className="text-white/25 text-[10px] font-mono tracking-widest uppercase">HQ</div>
          </div>
        )}
        <div className="bg-zinc-950 px-5 py-5">
          <div className="text-white font-bold text-sm mb-1">{company.sector}</div>
          <div className="text-white/25 text-[10px] font-mono tracking-widest uppercase">Sector</div>
        </div>
      </div>

      {exposure && (
        <div className="mb-16">
          <div className="text-white/25 text-[10px] font-mono tracking-widest uppercase mb-4">
            Orbital exposure ({exposure.positionCount} GEO position{exposure.positionCount !== 1 ? "s" : ""})
          </div>

          {/* Portfolio aggregates */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-white/[0.04] mb-4">
            <div className="bg-zinc-950 px-5 py-4">
              <div className="text-white font-bold font-mono text-base mb-1">{exposure.valueRange}</div>
              <div className="text-white/25 text-[10px] font-mono tracking-widest uppercase">Implied value</div>
            </div>
            <div className="bg-zinc-950 px-5 py-4">
              <div className="text-white font-bold font-mono text-base mb-1">{exposure.avgCongestion}</div>
              <div className="text-white/25 text-[10px] font-mono tracking-widest uppercase">Avg congestion</div>
            </div>
            <div className="bg-zinc-950 px-5 py-4">
              <div className="text-white font-bold font-mono text-base mb-1">{exposure.fccCount}</div>
              <div className="text-white/25 text-[10px] font-mono tracking-widest uppercase">FCC licensed</div>
            </div>
          </div>

          {/* Longitude strip */}
          <div className="relative h-12 bg-zinc-950 border border-zinc-800 rounded-lg mb-4 overflow-hidden">
            {[25, 50, 75].map((p) => (
              <div key={p} className="absolute top-0 bottom-4 w-px bg-white/[0.05]" style={{ left: `${p}%` }} />
            ))}
            {exposure.positions.map((p) => (
              <div key={p.slug} className="absolute -translate-x-1/2 group" style={{ left: `${((p.longitude + 180) / 360) * 100}%`, top: "10px" }}>
                <div className="w-2 h-2 rounded-full ring-2 ring-zinc-950" style={{ background: congestionColor[p.congestionTier] }} />
              </div>
            ))}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-[9px] font-mono text-white/25">
              <span>180°W</span><span>0°</span><span>180°E</span>
            </div>
          </div>

          {/* Positions table */}
          <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium">Slot</th>
                  <th className="text-left px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium hidden sm:table-cell">Region</th>
                  <th className="text-left px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium hidden md:table-cell">Bands</th>
                  <th className="text-right px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium">Cong.</th>
                  <th className="text-right px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {exposure.positions.map((p) => (
                  <tr key={p.slug} className="border-b border-zinc-800/50 last:border-b-0 hover:bg-zinc-900/40 transition-colors">
                    <td className="px-4 py-2.5">
                      <Link href={`/orbital/${p.slug}`} className="flex items-center gap-2 group">
                        <span className="text-white text-xs font-mono font-bold group-hover:text-white/70 transition-colors">{p.label}</span>
                        {p.fccLicensed && <span className="text-sky-400/80 text-[9px] border border-sky-900/60 px-1 rounded font-mono leading-none">FCC</span>}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 hidden sm:table-cell"><span className="text-zinc-600 text-xs">{p.region}</span></td>
                    <td className="px-4 py-2.5 hidden md:table-cell"><span className="text-zinc-500 text-xs font-mono">{p.bands.length ? p.bands.join("/") : "—"}</span></td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="inline-flex items-center justify-end gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: congestionColor[p.congestionTier] }} />
                        <span className="text-zinc-500 text-xs font-mono">{p.congestionScore}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right"><span className="text-zinc-500 text-xs font-mono">{p.valueDisplay}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Agent callout */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-zinc-600">
            <span>Agents query this via</span>
            <code className="font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5">GET /api/v1/agents/companies/{slug}</code>
            <Link href="/docs" className="text-zinc-600 hover:text-zinc-400 underline">docs →</Link>
          </div>
          <p className="text-zinc-700 text-[10px] font-mono mt-2 leading-relaxed">
            Implied value is a heuristic model over public data (range across {exposure.positionCount} position{exposure.positionCount !== 1 ? "s" : ""}), not a quote.
          </p>
        </div>
      )}

      {constellation && (
        <div className="mb-16">
          <div className="text-white/25 text-[10px] font-mono tracking-widest uppercase mb-4">
            Constellation presence ({constellation.total.toLocaleString()} active satellite{constellation.total !== 1 ? "s" : ""})
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.04] mb-3">
            {constellation.regimes.map((r) => (
              <div key={r.regime} className="bg-zinc-950 px-5 py-4">
                <div className="text-white font-bold font-mono text-base mb-1">{r.count.toLocaleString()}</div>
                <div className="text-white/25 text-[10px] font-mono tracking-widest uppercase">{REGIME_LABEL[r.regime] ?? r.regime} satellites</div>
              </div>
            ))}
          </div>
          {constellation.topPurpose && (
            <p className="text-zinc-500 text-xs mb-2">Primary purpose: {constellation.topPurpose}</p>
          )}
          <p className="text-zinc-700 text-[10px] font-mono leading-relaxed">
            Constellations are capacity assets, not priced orbital positions — shown for coverage, not valuation. Source: UCS Satellite Database.
          </p>
        </div>
      )}

      {related.length > 0 && (
        <div>
          <div className="text-white/25 text-[10px] font-mono tracking-widest uppercase mb-4">
            Also in {company.sector}
          </div>
          <div className="space-y-px bg-white/[0.03]">
            {related.map((c) => (
              <Link
                key={c.slug}
                href={`/companies/${c.slug}`}
                className="group flex items-center justify-between bg-zinc-950 px-5 py-3 hover:bg-zinc-900/60 transition-colors"
              >
                <span className="text-white text-sm group-hover:text-white/70 transition-colors">{c.name}</span>
                {c.hq && <span className="text-white/20 text-xs font-mono hidden sm:block">{c.hq}</span>}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
