import type { Metadata } from "next";
import { buildMeta } from "@/lib/metadata";
import { getDataFreshness } from "@/lib/freshness";

export const metadata: Metadata = buildMeta({
  title: "Data Sources",
  description: "The public data sources Clarke normalizes to build a legible view of the orbital asset market.",
  tag: "Data",
});

const sources: { name: string; abbr: string; url: string; cadence: string; what: string; why: string; status: "live" | "planned" }[] = [
  {
    name: "UCS Satellite Database",
    abbr: "Union of Concerned Scientists",
    url: "https://www.ucsusa.org/resources/satellite-database",
    cadence: "Bi-annual",
    status: "live",
    what: "A normalized database of all active satellites with operator, country, purpose, orbital regime, launch date, and expected lifetime. Clarke currently ingests 590 GEO satellites from the May 2023 snapshot, covering 407 distinct orbital positions (the Orbital Registry lists more rows than that — co-located satellites outside Clarke's curated position set are currently listed individually rather than grouped by position, which is on the list to fix).",
    why: "The most accessible normalized dataset of active satellites available publicly. Powers Clarke's orbital registry, operator attribution, and congestion scoring. Satellite names and orbital positions are reliable; individual satellite identifiers (NORAD/COSPAR) have known accuracy issues in the UCS source and are not displayed.",
  },
  {
    name: "FCC Approved Space Station List",
    abbr: "FCC International Bureau",
    url: "https://www.fcc.gov/approved-space-station-list",
    cadence: "Updated as granted",
    status: "live",
    what: "The official FCC list of all space stations authorized to operate in or serve the United States. Clarke ingests 174 GEO authorizations covering US-licensed operators and foreign operators with US market access grants. Fields include call sign, licensee, authorized frequency bands (C/Ku/Ka/L), service type, administration, and in-orbit date.",
    why: "The only government-issued, per-satellite licensing record Clarke currently has. Directly expresses the spectrum coordination pillar: which frequencies are authorized at which position, under which jurisdiction. A position absent from this list has no FCC authorization, which is itself a meaningful signal for US market access.",
  },
  {
    name: "ITU Space Network System",
    abbr: "ITU SNS",
    url: "https://www.itu.int/itu-r/space/apps/public/spaceexplorer/networks-explorer",
    cadence: "Continuous",
    status: "planned",
    what: "Every filed and coordinated orbital slot and frequency assignment across all regimes. The canonical international registry for satellite positions. A filed ITU slot is the closest thing to a deed that orbital real estate currently has. Publicly accessible via web, paywalled for bulk data.",
    why: "The foundational dataset Clarke does not yet have. ITU data would cover all operators regardless of US jurisdiction, add coordination dispute history, and make congestion scores authoritative rather than approximate. Bulk access requires an ITU BR IFIC subscription.",
  },
  {
    name: "SEC EDGAR",
    abbr: "US Securities and Exchange Commission",
    url: "https://www.sec.gov/search-filings",
    cadence: "Quarterly / Annual",
    status: "planned",
    what: "Financial filings from publicly traded satellite operators including SES, Viasat, Eutelsat, Intelsat, and Telesat. 10-K and 20-F annual reports disclose slot utilization, contract lengths, revenue by region, and fleet composition.",
    why: "The only public source of economic data tied to specific orbital assets. Extracting transponder revenue by position from SEC filings is the path to Clarke's implied asset valuation layer.",
  },
  {
    name: "Space-Track",
    abbr: "18th SDS / US Space Force",
    url: "https://www.space-track.org",
    cadence: "Daily",
    status: "live",
    what: "Two-line element sets (TLEs) for all ~27,000 tracked orbital objects. The authoritative source for the position and trajectory of every catalogued object in Earth orbit, maintained by the US Space Force.",
    why: "Adding TLE cross-reference would let Clarke validate and correct UCS orbital positions, identify decommissioned satellites still listed as active, and map physical proximity risk between assets. Free with registration.",
  },
  {
    name: "Celestrak",
    abbr: "Dr. T.S. Kelso",
    url: "https://celestrak.org",
    cadence: "Daily",
    status: "planned",
    what: "Curated TLE datasets organized by category: active satellites, debris, rocket bodies, country of origin. A more accessible interface to Space-Track data with historical archives going back decades.",
    why: "Planned as the cross-reference layer for validating UCS satellite identifiers. A spot-check against Celestrak surfaced significant NORAD ID errors in the current UCS import, which is why those identifiers are currently omitted from Clarke.",
  },
  {
    name: "Gunter's Space Page",
    abbr: "Gunter Krebs",
    url: "https://space.skyrocket.de",
    cadence: "Ongoing",
    status: "planned",
    what: "A comprehensive reference database of spacecraft and launch vehicles. Covers thousands of satellites with mission descriptions, launch records, operator details, and orbital parameters.",
    why: "Particularly useful for tracking older GEO assets and alternative names. Many satellites in the UCS database carry multiple aliases that complicate operator matching across sources.",
  },
  {
    name: "Jonathan's Space Report",
    abbr: "Jonathan McDowell",
    url: "https://planet4589.org/space/jsr/jsr.html",
    cadence: "Ongoing",
    status: "planned",
    what: "Detailed launch and satellite records maintained by a Harvard astrophysicist. Includes subsatellite catalogs, orbital history, and launch manifests going back to the beginning of the space age.",
    why: "The most meticulous public record of orbital launches and satellite histories. Useful for building historical transaction context that neither ITU filings nor FCC records fully describe.",
  },
];

function formatDate(lastRun: string): string {
  const d = new Date(lastRun.replace(" ", "T") + "Z");
  if (isNaN(d.getTime())) return lastRun;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

function ageLabel(ageDays: number): string {
  if (ageDays < 0) return "";
  if (ageDays === 0) return "today";
  if (ageDays === 1) return "1 day ago";
  return `${ageDays} days ago`;
}

export default function DataSourcesPage() {
  const freshness = getDataFreshness();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-16">
        <div className="text-white/30 text-[11px] font-mono tracking-[0.3em] uppercase mb-4">Data</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6">Data Sources</h1>
        <p className="text-zinc-400 text-base leading-relaxed max-w-2xl">
          The orbital asset market is opaque, fragmented, and priced through information asymmetry.
          The data to change that is almost entirely public. It is just scattered across a dozen
          institutions, each with a different format, cadence, and level of accessibility.
          Clarke normalizes these sources into a single legible view.
        </p>
      </div>

      {freshness.length > 0 && (
        <div className="mb-16">
          <div className="text-white/30 text-[11px] font-mono tracking-[0.3em] uppercase mb-4">Live data freshness</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/[0.04] border border-white/[0.04]">
            {freshness.map((f) => (
              <div key={f.source} className="bg-zinc-950 p-4">
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <span className="text-white text-sm font-bold">{f.source}</span>
                  <span className="text-emerald-400/90 font-mono text-xs tabular-nums">{f.rowCount.toLocaleString()} rows</span>
                </div>
                <div className="text-white/30 text-xs font-mono">
                  Updated {formatDate(f.lastRun)}
                  {ageLabel(f.ageDays) && <span className="text-white/20"> · {ageLabel(f.ageDays)}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-px bg-white/[0.04]">
        {sources.map((s) => (
          <div key={s.abbr} className="bg-zinc-950 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white font-bold text-base hover:text-white/70 transition-colors"
                  >
                    {s.name} ↗
                  </a>
                  {s.status === "live" ? (
                    <span className="text-[10px] font-mono text-emerald-400 border border-emerald-800/60 bg-emerald-950/40 px-1.5 py-0.5 rounded leading-none">Live</span>
                  ) : (
                    <span className="text-[10px] font-mono text-zinc-600 border border-zinc-800 px-1.5 py-0.5 rounded leading-none">Planned</span>
                  )}
                </div>
                <div className="text-white/30 text-xs font-mono">{s.abbr}</div>
              </div>
              <div className="text-[10px] font-mono text-white/20 tracking-widest uppercase shrink-0 pt-1">
                {s.cadence}
              </div>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed mb-3">{s.what}</p>
            <p className="text-zinc-400 text-sm leading-relaxed border-l border-white/[0.08] pl-4">
              {s.why}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
