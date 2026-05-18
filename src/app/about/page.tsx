import { buildMeta } from "@/lib/metadata";
import Link from "next/link";
import EmailCapture from "@/components/EmailCapture";
import { companies } from "@/data/companies";
import { getSatelliteStats, getFccCount, getGeoPositionCount } from "@/lib/satellites";
import { stocks } from "@/data/stocks";

export const metadata = buildMeta({
  title: "About Clarke",
  description: "Clarke is the intelligence and registry layer for the orbital economy, built from public ITU, FCC, and operator data that has never been aggregated into a single accessible system.",
  tag: "About",
});

export default function AboutPage() {
  const dbStats = getSatelliteStats();
  const geoCount = dbStats.geoCount > 0 ? dbStats.geoCount : 590;
  const fccCount = getFccCount() || 174;
  const positionCount = getGeoPositionCount() || 407;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">

      {/* What Clarke is */}
      <div className="mb-16">
        <p className="text-zinc-300 text-lg leading-relaxed mb-5">
          Clarke is the intelligence and registry layer for the orbital economy, built from public data
          that has never been aggregated into a single accessible system. The platform maps orbital
          occupancy, spectrum coordination, infrastructure ownership, and congestion risk across the
          geostationary belt, drawing on ITU coordination records, FCC licensing data, and operator
          disclosures that are individually public but have never been normalized together.
        </p>
        <p className="text-zinc-500 text-base leading-relaxed">
          Orbital infrastructure is worth hundreds of billions of dollars and changes hands constantly
          through satellite acquisitions, spectrum leasing, fleet consolidations, and regulatory transfers.
          There is no unified data layer, no public pricing index, and no canonical registry of ownership,
          congestion, or implied asset value. Clarke is building that infrastructure.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.04] rounded-xl overflow-hidden mb-16">
        {[
          { value: `${geoCount}`, label: "GEO satellites tracked" },
          { value: `${fccCount}`, label: "FCC authorizations" },
          { value: `${companies.length}`, label: "Companies indexed" },
          { value: `${stocks.length}`, label: "Live market prices" },
        ].map((s) => (
          <div key={s.label} className="bg-zinc-950 px-5 py-5 text-center">
            <div className="text-white font-bold font-mono text-xl mb-1">{s.value}</div>
            <div className="text-white/25 text-[10px] font-mono tracking-widest uppercase leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Explore */}
      <div className="mb-16">
        <div className="text-white/30 text-[11px] font-mono tracking-[0.3em] uppercase mb-6">Explore</div>
        <div className="space-y-2">
          {[
            { href: "/orbital",   title: "Orbital Registry", desc: `${geoCount} GEO satellites, ${positionCount} positions, FCC data, congestion scoring.` },
            { href: "/companies", title: "Companies",        desc: `${companies.length} organizations across the space infrastructure stack.` },
            { href: "/stocks",    title: "Space Markets",    desc: `Live prices for ${stocks.length} publicly traded space companies.` },
            { href: "/docs",      title: "Docs",             desc: "Full technical reference: registry methodology, data quality, on-chain program." },
            { href: "/data",      title: "Data Sources",     desc: "The public datasets Clarke normalizes and their integration status." },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className="flex items-center justify-between border border-zinc-800 rounded-lg px-4 py-3.5 hover:border-zinc-600 transition-colors group">
              <div>
                <span className="font-semibold text-white text-sm group-hover:text-zinc-200">{item.title}</span>
                <span className="text-zinc-600 text-xs ml-3">{item.desc}</span>
              </div>
              <span className="text-zinc-700 text-sm group-hover:text-zinc-400 transition-colors">→</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Email */}
      <div className="border border-white/[0.06] rounded-2xl p-8 bg-black/20">
        <h2 className="text-white font-bold text-lg mb-2">Get notified when live data launches.</h2>
        <p className="text-zinc-500 text-sm mb-6">
          ITU filing integration, SEC pricing layer, and the first live operator partnerships.
        </p>
        <EmailCapture label="Join the list" />
      </div>

    </div>
  );
}
