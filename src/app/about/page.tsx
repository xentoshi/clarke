import { buildMeta } from "@/lib/metadata";
import Link from "next/link";
import EmailCapture from "@/components/EmailCapture";
import { companies } from "@/data/companies";

export const metadata = buildMeta({
  title: "About Clarke",
  description: "Clarke is building capital markets for orbital infrastructure — the first registry, pricing layer, and exchange for orbital slots across GEO, LEO, and MEO.",
  tag: "About",
});

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">

      {/* Hero */}
      <div className="mb-20">
        <p className="text-zinc-400 text-lg leading-relaxed mb-6">
          Orbital slots are fixed positions in space where satellites park. There are roughly 1,800 of them
          in the most valuable orbital ring. They are allocated by international treaty, held by governments
          and operators, and worth hundreds of millions each. They cannot be created. They can be transferred.
        </p>
        <p className="text-zinc-500 text-base leading-relaxed">
          Clarke is the first market for them — the registry, the pricing layer, and eventually the exchange.
        </p>
      </div>

      {/* The opportunity */}
      <div className="mb-20">
        <div className="text-white/30 text-[11px] font-mono tracking-[0.3em] uppercase mb-8">The opportunity</div>
        <div className="space-y-4">
          {[
            {
              title: "All orbital regimes, not just GEO",
              body: `GEO has roughly 600 active satellites and is well-understood by the industry. LEO has over 7,000 active satellites today and is heading toward 50,000 as Starlink, Kuiper, and dozens of other constellations scale. MEO carries GPS, Galileo, and O3b. The orbital economy is three regimes, and the data problems in LEO are larger and less tractable than in GEO.`,
            },
            {
              title: "The data exists, the normalization does not",
              body: "ITU filings cover every coordinated GEO slot and frequency assignment ever filed. FCC IBFS records every US satellite license. Space-Track publishes TLE orbital elements for 27,000+ tracked objects daily. UCS maintains a curated satellite catalog updated quarterly. SEC filings from SES, Viasat, Intelsat, and Eutelsat reveal operator financials tied to specific assets. None of this has been normalized into a single, legible, priced dataset.",
            },
            {
              title: "The regulatory vacuum is the opportunity",
              body: "The Outer Space Treaty prohibits national sovereignty over space. It permits licensing, operational control, spectrum rights, traffic management, and economic monopolization. Orbital real estate is already emerging through de facto control systems, and the regulatory frameworks governing it are primitive and incomplete. The entity that builds the canonical data and coordination layer does so before governments create one badly.",
            },
          ].map((c) => (
            <div key={c.title} className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/10">
              <div className="text-white font-semibold text-sm mb-2">{c.title}</div>
              <p className="text-zinc-500 text-sm leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* What Clarke is building */}
      <div className="mb-20">
        <div className="text-white/30 text-[11px] font-mono tracking-[0.3em] uppercase mb-8">What Clarke builds</div>
        <div className="space-y-0">
          {[
            { step: "01", title: "The registry", text: "A normalized, cross-regime database of orbital assets. Who holds what slot, at what longitude, with what spectrum, and what it is worth. Built from ITU, FCC, Space-Track, UCS, and SEC public data that has never been aggregated into a single legible view." },
            { step: "02", title: "The pricing layer", text: "The first public pricing models for orbital assets. Derived from SEC disclosures, ITU coordination records, and the transaction history buried in M&A filings and bankruptcy proceedings. Real comps for an asset class that has never had them." },
            { step: "03", title: "The market", text: "An on-chain program on Solana that lets capital take fractional positions in orbital slot revenue — before a formal exchange infrastructure exists. Proof of concept live on devnet. GEO first, all regimes over time." },
          ].map((s) => (
            <div key={s.step} className="flex items-start gap-4 py-5 border-b border-zinc-800/50 last:border-0">
              <span className="text-white/20 font-mono text-xs shrink-0 mt-0.5">{s.step}</span>
              <div>
                <div className="text-white text-sm font-semibold mb-1">{s.title}</div>
                <p className="text-zinc-500 text-sm leading-relaxed">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Where it stands */}
      <div className="mb-20">
        <div className="text-white/30 text-[11px] font-mono tracking-[0.3em] uppercase mb-8">Where it stands today</div>
        <p className="text-zinc-400 text-base leading-relaxed mb-6">
          Clarke has a working proof of concept on Solana devnet. Three GEO slots are modeled as
          a technical demonstration: $ASTRA19, $SES28, and $SATMEX101. The invest and yield flow
          runs end-to-end on devnet. No real tokens have been issued. No operators are live.
          This is the proof that the on-chain mechanics work, not a live product.
        </p>
        <p className="text-zinc-500 text-sm leading-relaxed mb-6">
          GEO is the starting point because the data is cleaner and the asset structure is simpler.
          LEO and MEO coverage, real operator partnerships, and live data normalization follow.
        </p>
        <Link href="/orbital"
          className="inline-block px-5 py-2.5 border border-zinc-700 text-zinc-300 rounded-lg text-sm font-medium hover:border-zinc-500 hover:text-white transition-colors">
          Try the devnet demo →
        </Link>
      </div>

      {/* Explore */}
      <div className="mb-20">
        <div className="text-white/30 text-[11px] font-mono tracking-[0.3em] uppercase mb-6">Explore</div>
        <div className="space-y-2">
          {[
            { href: "/orbital",   title: "Orbital Registry", desc: "Browse the registry and try the devnet demo." },
            { href: "/companies", title: "Companies",        desc: "The space infrastructure stack, indexed." },
            { href: "/data",      title: "Data Sources",     desc: "The public datasets Clarke normalizes." },
            { href: "/blog",      title: "Blog",             desc: "Thinking on orbital infrastructure and the space economy." },
            { href: "/stocks",    title: "Space Markets",    desc: "Publicly traded companies in the orbital economy." },
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
        <p className="text-zinc-500 text-sm mb-6">LEO and MEO registry expansion, pricing intelligence, and the first live operator partnerships.</p>
        <EmailCapture label="Join the list" />
      </div>

    </div>
  );
}
