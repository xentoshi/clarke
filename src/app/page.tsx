import Link from "next/link";
import { companies, verticalLabels, Vertical } from "@/data/companies";
import { narratives } from "@/data/narratives";
import MarketOverview from "@/components/MarketOverview";

const verticals = Object.keys(verticalLabels) as Vertical[];

const accentHex: Record<Vertical, string> = {
  launch: "#f97316",
  lunar: "#818cf8",
  habitation: "#60a5fa",
  propulsion: "#a78bfa",
  power: "#fbbf24",
  isru: "#a3e635",
  manufacturing: "#22d3ee",
  food: "#4ade80",
  robotics: "#38bdf8",
  comms: "#2dd4bf",
  observation: "#c084fc",
  suits: "#fb7185",
  mining: "#facc15",
};

const US_STATES = new Set(["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"]);
const publicCount = companies.filter((c) => c.stage === "public").length;
const countryCount = new Set(companies.map((c) => {
  const last = c.hq.split(", ").pop() ?? "";
  return US_STATES.has(last) ? "USA" : last;
})).size;

export default function HomePage() {
  return (
    <div>

      <div>
        <div>
          {/* Mission status strip */}
          <div className="border-b border-white/[0.06] bg-black/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-9 flex items-center justify-between">
              <div className="flex items-center gap-3 font-mono text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 live-dot" />
                  <span className="text-amber-400/70 tracking-widest uppercase">Mission Active</span>
                </div>
                <span className="text-white/15 hidden sm:block">·</span>
                <span className="text-white/30 hidden sm:block tracking-widest">FRONTIER SPACE DIRECTORY</span>
              </div>
              <span className="font-mono text-xs text-white/20 hidden sm:block tracking-widest">EST. 2025</span>
            </div>
          </div>

          {/* Stats telemetry strip */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-stretch border-b border-white/[0.08] divide-x divide-white/[0.08]">
              {[
                { value: companies.length, label: "Companies" },
                { value: verticals.length, label: "Verticals" },
                { value: publicCount, label: "Public" },
                { value: `${countryCount}+`, label: "Nations" },
              ].map((s) => (
                <div key={s.label} className="px-6 py-5 first:pl-0">
                  <div className="text-2xl font-bold font-mono text-white">{s.value}</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-mono mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Vertical grid — tiles are semi-transparent so image shows through */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
            <div className="flex items-center justify-between mb-8">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.25em]">13 Verticals</span>
              <Link href="/companies" className="text-[10px] font-mono text-white/30 hover:text-white/70 transition-colors tracking-widest">
                All {companies.length} →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-px bg-white/[0.06]">
              {verticals.map((v, i) => {
                const vCompanies = companies.filter((c) => c.vertical === v);
                const top = vCompanies.slice(0, 2).map((c) => c.name);
                return (
                  <Link key={v} href={`/companies?vertical=${v}`}
                    className="group bg-[#060608] hover:bg-white/[0.03] transition-colors p-5 relative">
                    <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: accentHex[v], opacity: 0.6 }} />
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white/25 text-[10px] font-mono tracking-widest">{String(i + 1).padStart(2, "0")}</span>
                      <span className="text-white/30 text-[10px] font-mono">{vCompanies.length}</span>
                    </div>
                    <div className="text-white text-sm font-semibold mb-2 leading-tight group-hover:text-white/80 transition-colors">
                      {verticalLabels[v]}
                    </div>
                    <p className="text-white/30 text-xs leading-relaxed line-clamp-2">
                      {top.join(" · ")}{vCompanies.length > 2 ? ` +${vCompanies.length - 2}` : ""}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── MIDDLE SECTION ── */}
      <div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-16">
          <MarketOverview />

          <div>
            <div className="flex items-center justify-between mb-8">
              <span className="text-[10px] font-mono text-white/30 uppercase tracking-[0.25em]">Investment Theses</span>
              <Link href="/narratives" className="text-[10px] font-mono text-white/25 hover:text-white/60 transition-colors tracking-widest">All →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.04]">
              {narratives.map((n) => (
                <Link key={n.slug} href={`/narratives/${n.slug}`}
                  className="group bg-black/50 backdrop-blur-sm hover:bg-black/60 transition-colors p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-sm border font-mono uppercase tracking-wider ${n.conviction === "high" ? "text-amber-300/80 bg-amber-950/40 border-amber-800/40" : "text-white/40 bg-white/5 border-white/10"}`}>
                      {n.conviction === "high" ? "High Conviction" : "Medium"}
                    </span>
                  </div>
                  <h3 className="text-white text-sm font-bold mb-2 leading-snug group-hover:text-white/70 transition-colors">{n.title}</h3>
                  <p className="text-white/25 text-xs leading-relaxed line-clamp-3">{n.tagline}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/[0.04] pb-4">
            <Link href="/solana" className="group bg-black/50 backdrop-blur-sm hover:bg-black/60 transition-colors p-6">
              <div className="font-bold text-white text-sm mb-2 group-hover:text-white/70 transition-colors">Solana × Hardware →</div>
              <p className="text-white/25 text-xs leading-relaxed">Decentralized Physical Infrastructure Networks building the space economy on Solana.</p>
            </Link>
            <Link href="/api-docs" className="group bg-black/50 backdrop-blur-sm hover:bg-black/60 transition-colors p-6">
              <div className="font-bold text-white text-sm mb-2 group-hover:text-white/70 transition-colors">API →</div>
              <p className="text-white/25 text-xs leading-relaxed">Machine-readable company data across all 13 verticals.</p>
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
