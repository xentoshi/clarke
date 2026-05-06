import type { Metadata } from "next";
import Link from "next/link";
import { companies, verticalLabels, verticalAccent, Vertical } from "@/data/companies";
import { slots } from "@/data/orbital-slots";
import MarketOverview from "@/components/MarketOverview";
import { buildMeta } from "@/lib/metadata";

export const metadata: Metadata = buildMeta({
  title: "Clarke",
  description: "The first transparent market for geostationary orbital slots. Browse, tokenize, and invest in GEO orbital positions on Solana.",
  tag: "Space Infrastructure",
});

const verticals = Object.keys(verticalLabels) as Vertical[];

const US_STATES = new Set(["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"]);
const publicCount = companies.filter((c) => c.stage === "public").length;
const countryCount = new Set(companies.map((c) => {
  const last = c.hq.split(", ").pop() ?? "";
  return US_STATES.has(last) ? "USA" : last;
})).size;
const listedSlots = slots.filter((s) => s.tokenization?.status === "listed").length;
const activeSlots = slots.filter((s) => s.status === "active").length;
const squattedPct = Math.round((slots.filter((s) => s.status === "squatted").length / slots.length) * 100);

export default function HomePage() {
  return (
    <div>

      {/* ── HERO ── */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* Mission strip */}
          <div className="border-b border-white/[0.06] h-9 flex items-center justify-between">
            <div className="flex items-center gap-3 font-mono text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 live-dot" />
                <span className="text-amber-400/70 tracking-widest uppercase">Mission Active</span>
              </div>
              <span className="text-white/15 hidden sm:block">·</span>
              <span className="text-white/30 hidden sm:block tracking-widest">CLARKE SPACE DIRECTORY</span>
            </div>
            <span className="font-mono text-xs text-white/20 hidden sm:block tracking-widest">EST. 2025</span>
          </div>

          {/* Hero content */}
          <div className="py-20 sm:py-28 flex flex-col items-center text-center">
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-6 leading-tight max-w-3xl tracking-tight">
              The first transparent market<br className="hidden sm:block" /> for orbital slots
            </h1>
            <p className="text-zinc-400 text-base sm:text-lg max-w-xl leading-relaxed mb-10">
              ~1,800 geostationary positions. Each worth $100M–$500M.
              Allocated at zero cost. Traded in the dark. Completely inaccessible.
              <span className="text-white"> Clarke changes that.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/orbital"
                className="px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors">
                Explore the registry →
              </Link>
              <Link href="/orbital/list"
                className="px-6 py-3 border border-zinc-700 text-zinc-300 rounded-xl font-medium text-sm hover:border-zinc-500 hover:text-white transition-colors">
                I'm an operator
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-stretch border-b border-white/[0.08] divide-x divide-white/[0.08] mb-20">
            {[
              { value: "~1,800", label: "GEO Slots" },
              { value: `${activeSlots}`, label: "Active" },
              { value: `${squattedPct}%`, label: "Squatted" },
              { value: `${listedSlots}`, label: "Listed on Clarke" },
              { value: "$4.2B+", label: "Market Value" },
            ].map((s) => (
              <div key={s.label} className="px-6 py-5 first:pl-0">
                <div className="text-2xl font-bold font-mono text-white">{s.value}</div>
                <div className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-mono mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Problem cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/[0.04] mb-20">
            {[
              {
                num: "01",
                title: "No price discovery",
                body: "GEO slot deals happen in private rooms. No one outside knows what a position is worth until a deal leaks years later.",
              },
              {
                num: "02",
                title: "No liquidity",
                body: "Transferring a slot takes months of legal work, ITU coordination, and regulatory approvals in multiple jurisdictions.",
              },
              {
                num: "03",
                title: "No access",
                body: "Only nation-states and billion-dollar satellite companies participate. The entire market is invisible and closed.",
              },
            ].map((c) => (
              <div key={c.num} className="bg-black/30 backdrop-blur-sm p-6">
                <div className="text-white/15 text-xs font-mono mb-4">{c.num}</div>
                <div className="text-white font-bold text-sm mb-2">{c.title}</div>
                <p className="text-white/30 text-xs leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>

          {/* Clarke belt teaser */}
          <div className="border border-white/[0.06] rounded-2xl p-8 bg-black/20 backdrop-blur-sm mb-20 flex flex-col sm:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="text-white/25 text-xs font-mono mb-3 tracking-widest">// CLARKE BELT · 35,786 KM</div>
              <h2 className="text-white font-bold text-xl mb-3">
                Arthur C. Clarke described geostationary orbit in 1945.
              </h2>
              <p className="text-white/40 text-sm leading-relaxed mb-6">
                The ring of satellites above Earth's equator is named after him.
                Clarke tokenizes the orbital positions that make it possible -
                bringing transparency, liquidity, and access to the most valuable
                real estate in existence.
              </p>
              <Link href="/orbital" className="text-white/60 text-sm hover:text-white transition-colors font-medium">
                View the registry →
              </Link>
            </div>
            <div className="shrink-0 w-full sm:w-64 border border-white/[0.08] rounded-xl p-4 bg-black/30">
              {slots.filter((s) => s.tokenization?.status === "listed").map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-white/[0.06] last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-white font-mono text-xs font-bold">{s.label}</span>
                    <span className="text-white/30 text-xs">{s.operator}</span>
                  </div>
                  <span className="text-emerald-400/70 text-[10px] font-mono">{s.tokenization?.leaseYield}</span>
                </div>
              ))}
              <Link href="/orbital"
                className="block text-center text-white/30 text-xs mt-3 hover:text-white/70 transition-colors">
                + {slots.length - listedSlots} more slots →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── DIRECTORY ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-16">

        {/* Verticals */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.25em]">{verticals.length} Verticals</span>
            <Link href="/companies" className="text-[10px] font-mono text-white/30 hover:text-white/70 transition-colors tracking-widest">
              All {companies.length} →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {verticals.map((v, i) => {
              const vCompanies = companies.filter((c) => c.vertical === v);
              const top = vCompanies.slice(0, 2).map((c) => c.name);
              return (
                <Link key={v} href={`/companies?vertical=${v}`}
                  className="group border border-zinc-800 rounded-xl bg-zinc-900/10 hover:border-zinc-600 hover:bg-zinc-900/25 transition-colors p-5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: verticalAccent[v], opacity: 0.7 }} />
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

        <MarketOverview />

        {/* Bottom CTAs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/[0.04]">
          {[
            { href: "/orbital", title: "Orbital Slots →", desc: "The first tokenized market for GEO orbital positions. Browse listed slots and invest on Solana." },
            { href: "/orbital/list", title: "List a Slot →", desc: "Satellite operator? List your orbital position for fractional investment on Clarke." },
            { href: "/docs", title: "Documentation →", desc: "Data sources, methodology, ITU filing structure, and the tokenization thesis." },
          ].map((c) => (
            <Link key={c.href} href={c.href}
              className="group bg-black/50 backdrop-blur-sm hover:bg-black/60 transition-colors p-6">
              <div className="font-bold text-white text-sm mb-2 group-hover:text-white/70 transition-colors">{c.title}</div>
              <p className="text-white/25 text-xs leading-relaxed">{c.desc}</p>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
