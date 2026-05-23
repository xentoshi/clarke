import type { Metadata } from "next";
import Link from "next/link";
import { slots } from "@/data/orbital-slots";
import EmailCapture from "@/components/EmailCapture";
import OrbitalDiagram from "@/components/OrbitalDiagram";
import { buildMeta } from "@/lib/metadata";
import { companies } from "@/data/companies";
import { getSatelliteStats, getGeoLongitudes } from "@/lib/satellites";
import { posts } from "@/data/posts";

export const metadata: Metadata = buildMeta({
  title: "Clarke",
  description: "Capital markets for orbital infrastructure. Clarke maps the market behind the next layer of global infrastructure.",
  tag: "Orbital Infrastructure",
});

const listedSlots = slots.filter((s) => s.tokenization?.status === "listed").length;

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-white/30 text-[11px] font-mono tracking-[0.3em] uppercase mb-4">{children}</div>
  );
}

function SectionDivider() {
  return <div className="border-t border-white/[0.05] my-20" />;
}

export default function HomePage() {
  const dbStats = getSatelliteStats();
  const geoLongitudes = getGeoLongitudes();
  const curatedLons = slots.map((s) => s.longitude);
  const geoTracked = dbStats.geoCount > 0 ? `${dbStats.geoCount}+` : "590+";
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6">

      {/* Hero */}
      <div className="pt-20 sm:pt-32 pb-24">
        <h1 className="text-3xl sm:text-5xl font-bold text-white mb-5 leading-[1.08] tracking-tight">
          Capital markets for orbital infrastructure.
        </h1>
        <p className="text-zinc-400 text-base sm:text-lg leading-relaxed mb-10 max-w-xl">
          Orbit is becoming the next layer of global infrastructure. Clarke maps the market behind it.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/orbital"
            className="px-8 py-3.5 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors">
            Browse the registry →
          </Link>
          <Link href="/data"
            className="px-8 py-3.5 border border-zinc-700 text-zinc-300 rounded-xl font-medium text-sm hover:border-zinc-500 hover:text-white transition-colors">
            View data sources
          </Link>
        </div>
      </div>

      <SectionDivider />

      {/* What is orbital infrastructure */}
      <div className="mb-20">
        <Label>What is orbital infrastructure?</Label>
        <p className="text-zinc-300 text-base leading-relaxed mb-4">
          Satellites power GPS, global internet, broadcast television, weather forecasting, navigation,
          and military communications. The physical and regulatory systems underlying this (satellites,
          orbital positions, spectrum rights, and operating licenses) form a global infrastructure layer
          worth hundreds of billions of dollars.
        </p>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Prices are buried across private transactions, ITU filings, spectrum coordination agreements,
          SEC disclosures, and satellite acquisitions. Clarke aggregates and normalizes this fragmented
          market into a single intelligence and pricing layer.
        </p>
      </div>

      <SectionDivider />

      {/* What is an orbital slot */}
      <div className="mb-20">
        <Label>What is an orbital slot?</Label>
        <p className="text-zinc-300 text-base leading-relaxed mb-4">
          Most commercial communications satellites operate in geostationary orbit (GEO), a narrow
          ring approximately 35,786 km above Earth where satellites move at the same speed Earth
          rotates. From the ground, they appear fixed in the sky.
        </p>
        <p className="text-zinc-400 text-sm leading-relaxed mb-6">
          Because satellites operating too closely together interfere with one another, the commercially
          viable positions within this ring are finite and unevenly distributed across coverage regions,
          spectrum bands, and regulatory regimes. These positions are known as orbital slots.
        </p>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Orbital positions are coordinated internationally through the International Telecommunication
          Union and licensed through national regulators. Operators regularly acquire, lease, transfer,
          and consolidate these rights through private agreements and corporate transactions. Prime GEO
          coverage regions serving North America, Europe, and Asia can underpin infrastructure worth
          billions of dollars over a satellite's lifetime.
        </p>
      </div>

      <SectionDivider />

      {/* GEO / LEO / MEO */}
      <div className="mb-20">
        <Label>GEO, LEO, and MEO</Label>
        <p className="text-zinc-400 text-sm leading-relaxed mb-8">
          Not all orbital regimes work the same way. Each has different physics, economics, and value models.
        </p>

        <OrbitalDiagram satellites={geoLongitudes} curatedLons={curatedLons} />

        <div className="space-y-px bg-white/[0.04] rounded-xl overflow-hidden mt-8">
          {[
            {
              orbit: "GEO",
              name: "Geostationary Orbit",
              alt: "35,786 km",
              tag: "The most economically concentrated orbital regime.",
              body: "Satellites in GEO remain fixed relative to Earth, allowing continuous coverage over the same geographic region. GEO powers television broadcasting, weather systems, military communications, and long-duration telecommunications infrastructure. Value in GEO is driven by regulatory incumbency, spectrum rights, coverage geography, and the growing range of infrastructure types the positions can support. This is the primary market Clarke focuses on.",
            },
            {
              orbit: "LEO",
              name: "Low Earth Orbit",
              alt: "200–2,000 km",
              tag: "The fastest-growing orbital regime.",
              body: "LEO satellites move rapidly relative to Earth, requiring large constellations for continuous coverage. SpaceX's Starlink, Amazon Kuiper, and OneWeb all operate in LEO. The valuable assets in LEO are not fixed positions but spectrum rights, orbital shell access, launch cadence, and congestion management.",
            },
            {
              orbit: "MEO",
              name: "Medium Earth Orbit",
              alt: "2,000–36,000 km",
              tag: "Primarily used for navigation infrastructure.",
              body: "MEO hosts GPS, Galileo, and BeiDou navigation systems. MEO occupies the middle ground between GEO persistence and LEO latency.",
            },
          ].map((o) => (
            <div key={o.orbit} className="bg-zinc-950 p-6 sm:p-8">
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-white font-bold font-mono text-sm">{o.orbit}</span>
                <span className="text-zinc-500 text-xs">{o.name}</span>
                <span className="text-zinc-600 text-xs font-mono ml-auto">{o.alt}</span>
              </div>
              <p className="text-white/50 text-xs mb-3">{o.tag}</p>
              <p className="text-zinc-500 text-xs leading-relaxed">{o.body}</p>
            </div>
          ))}
        </div>
      </div>

      <SectionDivider />

      {/* Can it be priced and traded */}
      <div className="mb-20">
        <Label>Can orbital infrastructure be priced and traded?</Label>

        <div className="mb-10">
          <h3 className="text-white font-semibold text-base mb-3">Pricing</h3>
          <p className="text-zinc-400 text-sm leading-relaxed mb-4">
            Orbital infrastructure changes hands constantly through satellite acquisitions, spectrum
            leasing, hosted payload agreements, coordination settlements, fleet consolidations, and
            regulatory transfers. But there is no unified market data layer, no public pricing index,
            and no canonical registry of ownership, congestion, utilization, or implied asset value.
            Clarke is building the first one.
          </p>
        </div>

        <div>
          <h3 className="text-white font-semibold text-base mb-3">Trading</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Orbital rights are tied to international coordination frameworks, national licensing
            regimes, and spectrum approvals. The economic interests surrounding these assets already
            move through private markets, however, and Clarke's long-term thesis is that orbital
            infrastructure will evolve into a recognizable capital market, with registries, indices,
            leasing markets, liquidity layers, and exchange infrastructure, as the systems surrounding
            it come to resemble the financial infrastructure that developed around terrestrial real
            estate, spectrum, energy, and telecommunications networks.
          </p>
        </div>
      </div>

      <SectionDivider />

      {/* Why now */}
      <div className="mb-20">
        <Label>Why now?</Label>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Launch costs have collapsed, orbital congestion is accelerating, and space infrastructure
          is becoming commercially indispensable. Orbit is now complex enough, contested enough,
          and economically important enough to support dedicated market infrastructure.
        </p>
      </div>

      <SectionDivider />

      {/* What Clarke is */}
      <div className="mb-20">
        <Label>What Clarke is</Label>
        <p className="text-zinc-300 text-base leading-relaxed mb-6">
          Clarke is the market intelligence and registry layer for orbital infrastructure.
        </p>
        <p className="text-zinc-400 text-sm leading-relaxed mb-4">The platform maps:</p>
        <ul className="space-y-1.5 mb-8">
          {[
            "orbital occupancy",
            "spectrum coordination",
            "infrastructure ownership",
            "congestion risk",
            "operator relationships",
            "historical transactions",
            "implied asset valuations",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2 text-zinc-500 text-sm">
              <span className="w-1 h-1 rounded-full bg-zinc-600 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-zinc-500 text-sm leading-relaxed mb-8">
          Built from public ITU, FCC, SEC, and operator data that has never been normalized into
          a single system.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-px bg-white/[0.06] rounded-xl overflow-hidden mb-8">
          {[
            { value: geoTracked, label: "GEO satellites tracked" },
            { value: `${companies.length}`, label: "Companies indexed" },
            { value: `${listedSlots}`, label: "On-chain (devnet)" },
          ].map((s) => (
            <div key={s.label} className="bg-zinc-950 px-6 py-6 text-center">
              <div className="text-2xl sm:text-3xl font-bold font-mono text-white mb-1">{s.value}</div>
              <div className="text-[10px] text-white/35 uppercase tracking-[0.2em] font-mono">{s.label}</div>
            </div>
          ))}
        </div>

        <p className="text-zinc-400 text-sm leading-relaxed mb-4">
          Clarke covers all major orbital regimes, beginning with GEO, where regulatory incumbency
          is durable, infrastructure values are highest, and the market structure is most mature.
        </p>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Over time, Clarke aims to become the financial coordination layer for the orbital economy.
        </p>
      </div>

      <SectionDivider />

      {/* Devnet demo */}
      <div className="border border-white/[0.06] rounded-2xl p-8 bg-black/20 mb-20">
        <div className="text-white/25 text-xs font-mono mb-3 tracking-widest">// PROOF OF CONCEPT · SOLANA DEVNET</div>
        <h2 className="text-white font-bold text-lg mb-3">Three GEO slots on devnet.</h2>
        <p className="text-white/40 text-sm leading-relaxed mb-6">
          $ASTRA19, $SES28, and $SATMEX101 are modeled on Solana devnet. Connect a wallet,
          get free devnet SOL, and try the invest and yield flow end-to-end.
        </p>
        <div className="border border-white/[0.06] rounded-xl p-4 bg-black/20 mb-6">
          {slots.filter((s) => s.tokenization?.status === "listed").map((s) => (
            <div key={s.id} className="py-2.5 border-b border-white/[0.06] last:border-0">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-white font-mono text-xs font-bold">{s.tokenization?.ticker}</span>
                  <span className="text-white/30 text-xs">{s.label}</span>
                </div>
                <span className="text-emerald-400 text-[10px] font-mono">{s.tokenization?.leaseYield}</span>
              </div>
              <p className="text-white/20 text-[10px] pl-3.5">{s.operator} · {s.valueEstimate}</p>
            </div>
          ))}
        </div>
        <Link href="/orbital" className="inline-block px-5 py-2.5 bg-white text-black rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors">
          View the registry →
        </Link>
      </div>

      {/* Latest from Clarke */}
      {posts.length > 0 && (() => {
        const latest = posts[0];
        return (
          <>
            <SectionDivider />
            <div className="mb-20">
              <Label>Latest from Clarke</Label>
              <Link href={`/blog/${latest.slug}`} className="group block border border-white/[0.06] rounded-2xl p-8 bg-black/20 hover:border-white/[0.12] transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[10px] font-mono text-white/25 tracking-widest uppercase">{latest.tag}</span>
                  <span className="text-white/10 text-xs">·</span>
                  <span className="text-[10px] font-mono text-white/25">{latest.readingMinutes} min read</span>
                </div>
                <h3 className="text-white font-bold text-lg leading-snug mb-3 group-hover:text-zinc-200 transition-colors">{latest.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed mb-5">{latest.subtitle}</p>
                <span className="text-zinc-600 text-xs font-mono group-hover:text-zinc-400 transition-colors">Read →</span>
              </Link>
            </div>
          </>
        );
      })()}

      {/* Email */}
      <div className="border border-white/[0.06] rounded-2xl p-10 bg-black/20 mb-24 text-center">
        <div className="text-white/25 text-xs font-mono mb-4 tracking-widest">// GET NOTIFIED</div>
        <h2 className="text-white font-bold text-xl mb-3">Be first when the market opens.</h2>
        <p className="text-zinc-500 text-sm mb-8 max-w-sm mx-auto">
          Live pricing data, real operator partnerships, and the first tradeable orbital positions.
        </p>
        <div className="flex justify-center">
          <EmailCapture label="Join the list" />
        </div>
      </div>

    </div>
  );
}
