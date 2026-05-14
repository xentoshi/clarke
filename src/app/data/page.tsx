import type { Metadata } from "next";
import { buildMeta } from "@/lib/metadata";

export const metadata: Metadata = buildMeta({
  title: "Data Sources",
  description: "The public data sources Clarke normalizes to build a legible view of the orbital asset market.",
  tag: "Data",
});

const sources = [
  {
    name: "ITU Space Network System",
    abbr: "ITU SNS",
    url: "https://www.itu.int/itu-r/space/apps/public/spaceexplorer/networks-explorer",
    cadence: "Continuous",
    what: "Every filed and coordinated orbital slot and frequency assignment across all regimes. The canonical registry for the international coordination of satellite positions. Publicly accessible, extremely messy to parse.",
    why: "The foundational dataset for any orbital asset registry. A filed ITU slot is the closest thing to a deed that orbital real estate currently has. Coverage includes GEO, MEO, and GSO filings from operators across all member states.",
  },
  {
    name: "FCC International Bureau Filing System",
    abbr: "FCC IBFS",
    url: "https://fcc.report/IBFS/",
    cadence: "Continuous",
    what: "Every US satellite license application, modification, grant, and revocation. Covers all operators licensed under US jurisdiction, including SpaceX Starlink, Amazon Kuiper, Viasat, Hughes, and hundreds of smaller operators.",
    why: "US licensing records include technical parameters, orbital positions, spectrum allocations, and operator details not always present in ITU filings. The US has the largest licensed satellite fleet in the world.",
  },
  {
    name: "Space-Track",
    abbr: "18th SDS / US Space Force",
    url: "https://www.space-track.org",
    cadence: "Daily",
    what: "Two-line element sets (TLEs) for all ~27,000 tracked orbital objects. The authoritative source for the position and trajectory of every catalogued object in Earth orbit, maintained by the US Space Force's 18th Space Defense Squadron.",
    why: "Orbital position data is required to map conjunction risk, debris density by altitude band, and the physical relationship between assets. Free with registration.",
  },
  {
    name: "UCS Satellite Database",
    abbr: "Union of Concerned Scientists",
    url: "https://www.ucsusa.org/resources/satellite-database",
    cadence: "Quarterly",
    what: "A curated database of all active satellites, with operator, country, purpose, orbital regime, launch date, and expected lifetime. Updated quarterly by analysts who reconcile multiple public sources.",
    why: "The cleanest normalized dataset of active satellites available publicly. Useful as a cross-reference against TLE data and ITU filings to identify which tracked objects belong to which operators.",
  },
  {
    name: "SEC EDGAR",
    abbr: "US Securities and Exchange Commission",
    url: "https://www.sec.gov/search-filings",
    cadence: "Quarterly / Annual",
    what: "Financial filings from publicly traded satellite operators including SES, Viasat, Eutelsat, Intelsat (post-emergence), and Telesat. 10-K and 20-F annual reports disclose slot utilization, contract lengths, revenue by region, and fleet composition.",
    why: "The only public source of economic data tied to specific orbital assets. Revenues, contract structures, and operator strategy can be extracted from these filings and mapped onto the orbital registry.",
  },
  {
    name: "Celestrak",
    abbr: "Dr. T.S. Kelso",
    url: "https://celestrak.org",
    cadence: "Daily",
    what: "Curated TLE datasets organized by category: active satellites, debris, rocket bodies, country of origin. A more accessible interface to Space-Track data with additional categorization and historical archives going back decades.",
    why: "Useful for historical orbital analysis and for working with specific satellite categories without processing the full Space-Track catalog.",
  },
  {
    name: "Gunter's Space Page",
    abbr: "Gunter Krebs",
    url: "https://space.skyrocket.de",
    cadence: "Ongoing",
    what: "A comprehensive reference database of spacecraft and launch vehicles maintained by a single dedicated researcher. Covers thousands of satellites with mission descriptions, launch records, operator details, and orbital parameters.",
    why: "One of the most complete historical records of spacecraft missions available anywhere. Particularly useful for tracking older GEO assets with sparse official documentation.",
  },
  {
    name: "Jonathan's Space Report",
    abbr: "Jonathan McDowell",
    url: "https://planet4589.org/space/jsr/jsr.html",
    cadence: "Ongoing",
    what: "Detailed launch and satellite records maintained by a Harvard astrophysicist who has tracked every orbital launch since the space age began. Includes subsatellite catalogs, orbital history, and launch manifests.",
    why: "The most meticulous public record of orbital launches and satellite histories. Useful for building historical context around assets and operators that ITU and FCC records alone do not fully describe.",
  },
];

export default function DataSourcesPage() {
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

      <div className="space-y-px bg-white/[0.04]">
        {sources.map((s) => (
          <div key={s.abbr} className="bg-zinc-950 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <div>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white font-bold text-base hover:text-white/70 transition-colors"
                >
                  {s.name} ↗
                </a>
                <div className="text-white/30 text-xs font-mono mt-1">{s.abbr}</div>
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
