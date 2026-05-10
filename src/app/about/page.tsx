import { buildMeta } from "@/lib/metadata";
import Link from "next/link";
import EmailCapture from "@/components/EmailCapture";

export const metadata = buildMeta({
  title: "About Clarke",
  description: "Clarke tokenizes geostationary orbital slot lease revenue on Solana. Fractional investment in contracted satellite cash flows.",
  tag: "About",
});

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">

      {/* Hero */}
      <div className="mb-20">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-8 leading-tight">
          The infrastructure keeping the world connected generates $4.2B per year. None of it is on-chain.
        </h1>
        <p className="text-zinc-400 text-lg leading-relaxed mb-4">
          Every container ship crossing an ocean, every commercial flight, every oil platform, every military operation in a remote location depends on geostationary orbital slots. Satellite operators like SES and Eutelsat hold these positions and charge annual lease fees to anyone who needs them. 15-year fixed contracts. The cash flows have been running since the 1980s.
        </p>
        <p className="text-zinc-500 text-base leading-relaxed">
          Clarke puts that yield on-chain. Operators raise upfront capital. Investors get quarterly lease revenue. Everything settles on Solana.
        </p>
      </div>

      {/* Problem */}
      <div className="mb-20">
        <div className="text-white/30 text-[11px] font-mono tracking-[0.3em] uppercase mb-8">The problem</div>
        <div className="space-y-4">
          {[
            { title: "No one knows what slots are worth", body: "Every deal happens in private. There are no public prices. When Intelsat went through bankruptcy in 2020, its orbital slot portfolio was worth billions with essentially no public price history." },
            { title: "Operators can't raise capital against their slots", body: "A satellite operator with a 15-year lease generating $20M per year has no practical way to monetize that today. Clarke gives them a direct path to upfront capital without changing a single operational or legal detail." },
            { title: "Minimum ticket has always been eight figures", body: "Retail has never been an option. A $400M asset generating 6% annually has been invisible to 99.9% of investors. Clarke makes fractional ownership possible from any wallet." },
          ].map((c) => (
            <div key={c.title} className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/10">
              <div className="text-white font-semibold text-sm mb-2">{c.title}</div>
              <p className="text-zinc-500 text-sm leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Why satellites */}
      <div className="mb-20">
        <div className="text-white/30 text-[11px] font-mono tracking-[0.3em] uppercase mb-8">Why satellites</div>
        <p className="text-zinc-400 text-base leading-relaxed mb-4">
          There is no terrestrial alternative that connects a container ship in the Pacific, a drilling platform in the North Sea, or a military operation in a remote location. Geostationary orbit is the only infrastructure that works everywhere on Earth simultaneously.
        </p>
        <p className="text-zinc-500 text-sm leading-relaxed">
          Governments, airlines, shipping companies, and energy firms pay annual lease fees to use it. Those fees are fixed by contract and do not fluctuate with markets. Clarke tokenizes that revenue.
        </p>
      </div>

      {/* The asset */}
      <div className="mb-20">
        <div className="text-white/30 text-[11px] font-mono tracking-[0.3em] uppercase mb-8">The asset</div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { value: "~1,800", label: "GEO slots globally" },
            { value: "$4.2B+", label: "Annual lease revenue" },
            { value: "15yr",   label: "Avg. contract length" },
            { value: "5–9%",   label: "Annual yield on value" },
          ].map((s) => (
            <div key={s.label} className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/10">
              <div className="text-2xl font-bold font-mono text-white mb-1">{s.value}</div>
              <div className="text-zinc-600 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
        <p className="text-zinc-500 text-sm leading-relaxed">
          The International Telecommunication Union, the United Nations agency that manages global satellite coordination, allocates positions along geostationary orbit to member states. There are roughly 1,800 usable positions total. No new ones can be created. Prime positions over North America, Europe, and East Asia are fully occupied.
        </p>
      </div>

      {/* Tokens */}
      <div className="mb-20">
        <div className="text-white/30 text-[11px] font-mono tracking-[0.3em] uppercase mb-8">Slot tokens</div>
        <p className="text-zinc-400 text-base leading-relaxed mb-6">
          Each listed slot has its own yield token on Solana. The token is a fractional claim on that slot's quarterly transponder lease revenue. Claimable directly to any wallet.
        </p>
        <div className="space-y-3">
          {[
            { ticker: "$ASTRA19",   slot: "19.2°E · SES", yield: "6.2% APY", desc: "Most valuable GEO slot in Europe. Serves Sky Deutschland, Sky UK, and 120M+ homes." },
            { ticker: "$SES28",     slot: "28.2°E · SES", yield: "5.9% APY", desc: "Primary slot for Sky UK. 11M+ subscribers. No viable alternative orbit for Sky's coverage footprint." },
            { ticker: "$SATMEX101", slot: "101°W · SES",  yield: "5.8% APY", desc: "Premium North American slot. C-band and Ku-band serving major US cable operators." },
          ].map((t) => (
            <div key={t.ticker} className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/10 flex items-start justify-between gap-4">
              <div>
                <span className="text-white font-mono font-bold text-sm">{t.ticker}</span>
                <span className="text-zinc-500 text-xs ml-3">{t.slot}</span>
                <p className="text-zinc-600 text-xs mt-1">{t.desc}</p>
              </div>
              <span className="text-emerald-400 font-mono text-xs shrink-0">{t.yield}</span>
            </div>
          ))}
        </div>
      </div>

      {/* How Clarke works */}
      <div className="mb-20">
        <div className="text-white/30 text-[11px] font-mono tracking-[0.3em] uppercase mb-8">How it works</div>
        <p className="text-zinc-400 text-base leading-relaxed mb-6">
          Clarke does not transfer orbital slots or move any government filing. What gets tokenized is a Special Purpose Vehicle holding the operator's right to receive transponder lease revenue from a specific position. The operator keeps everything else.
        </p>
        <div className="space-y-0">
          {[
            { step: "01", text: "Operator submits their slot with a verified lease contract." },
            { step: "02", text: "Clarke structures a Special Purpose Vehicle. Operator keeps the government filing and full operational control." },
            { step: "03", text: "Yield tokens issued on Solana. Each token carries fractional rights to the slot's quarterly lease revenue." },
            { step: "04", text: "Investors buy yield tokens with SOL. Capital goes directly to the operator." },
            { step: "05", text: "Quarterly payments distributed on-chain. Holders claim yield to any Solana wallet." },
          ].map((s) => (
            <div key={s.step} className="flex items-start gap-4 py-4 border-b border-zinc-800/50 last:border-0">
              <span className="text-white/20 font-mono text-xs shrink-0 mt-0.5">{s.step}</span>
              <p className="text-zinc-400 text-sm">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="mb-20">
        <div className="text-white/30 text-[11px] font-mono tracking-[0.3em] uppercase mb-8">Common questions</div>
        <div className="space-y-3">
          {[
            { q: "What is a Special Purpose Vehicle?", a: "A standalone legal entity created for a single purpose. In Clarke's case: one SPV per slot, holding only the right to receive lease revenue from that position. It is ring-fenced from every other offering and from Clarke itself. Clarke plans to establish SPVs in the Cayman Islands, the standard jurisdiction for this structure." },
            { q: "Why would an operator share their revenue?", a: "They get cash today instead of waiting 15 years. An operator with a $20M/year lease contract can raise a lump sum against those future payments. They use that capital now to fund a new satellite launch, expand operations, or reduce debt. The trade is simple: a share of future revenue in exchange for upfront capital." },
            { q: "What do I actually own?", a: "A token representing fractional economic rights to lease revenue from one specific orbital position. Not the satellite, not the government filing. The right to receive a share of what broadcasters pay to use that slot's transponders." },
            { q: "Who is paying the lease?", a: "Broadcasters. Sky, DirecTV, Canal+. They pay annual transponder fees under long-term fixed contracts. They have been paying the same operators for decades and have no practical alternative." },
            { q: "Why can they not move to a different satellite?", a: "Their coverage depends on geography. A satellite at 19.2°E covers essentially all of Europe. Moving to a different longitude means re-pointing millions of customer dishes across the continent. It does not happen." },
            { q: "Is the yield guaranteed?", a: "No. The risk is operator default, satellite failure, or contract non-renewal. Clarke lists only operating slots with verified lease contracts. The risk profile is closer to real estate rental income than to equity or speculation." },
          ].map((item) => (
            <div key={item.q} className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/10">
              <div className="px-5 py-4 border-b border-zinc-800/50">
                <p className="text-white text-sm font-medium">{item.q}</p>
              </div>
              <div className="px-5 py-4">
                <p className="text-zinc-500 text-sm leading-relaxed">{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Business model */}
      <div className="mb-20">
        <div className="text-white/30 text-[11px] font-mono tracking-[0.3em] uppercase mb-8">Business model</div>
        <p className="text-zinc-400 text-base leading-relaxed mb-6">Clarke charges operators. Not investors.</p>
        <div className="space-y-3">
          {[
            { fee: "2% origination fee", body: "Charged on each capital raise at listing. A $10M offering generates $200K for Clarke." },
            { fee: "5% yield distribution fee", body: "Charged quarterly on yield flowing through the platform. Ten slots distributing $5M/year generates $250K/year for Clarke, recurring." },
          ].map((f) => (
            <div key={f.fee} className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/10">
              <div className="text-white font-bold text-sm mb-2">{f.fee}</div>
              <p className="text-zinc-500 text-xs">{f.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* The raise */}
      <div className="mb-20">
        <div className="text-white/30 text-[11px] font-mono tracking-[0.3em] uppercase mb-8">The raise</div>
        <p className="text-zinc-400 text-base leading-relaxed mb-6">Clarke is raising $400K to reach first live SPV on mainnet.</p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { value: "$400K", label: "Raise target" },
            { value: "$1.6M", label: "FDV" },
            { value: "25%",   label: "Token supply offered" },
            { value: "12mo",  label: "Runway" },
          ].map((s) => (
            <div key={s.label} className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/10">
              <div className="text-2xl font-bold font-mono text-white mb-1">{s.value}</div>
              <div className="text-zinc-600 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="space-y-0">
          {[
            { pct: "30%", use: "Legal", detail: "Cayman entity + first SPV structuring" },
            { pct: "15%", use: "Security audit", detail: "Anchor program audit by a Solana security firm" },
            { pct: "30%", use: "Business development", detail: "Operator outreach, World Satellite Business Week, legal counsel" },
            { pct: "25%", use: "Runway", detail: "12 months of operations" },
          ].map((u) => (
            <div key={u.use} className="flex items-center gap-4 py-3 border-b border-zinc-800/50 last:border-0">
              <span className="text-white font-mono text-sm w-10 shrink-0">{u.pct}</span>
              <span className="text-zinc-400 text-sm w-40 shrink-0">{u.use}</span>
              <span className="text-zinc-600 text-xs">{u.detail}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Why now */}
      <div className="mb-20">
        <div className="text-white/30 text-[11px] font-mono tracking-[0.3em] uppercase mb-8">Why now</div>
        <p className="text-zinc-400 text-base leading-relaxed mb-4">
          RWA tokenization crossed $33B in 2024. US Treasuries, private credit, real estate. All on-chain. Orbital slots are the most defensible asset class not yet tokenized. The lease revenue is older and more durable than most of what has already been put on-chain.
        </p>
        <p className="text-zinc-500 text-sm leading-relaxed">
          Clarke is a working proof of concept on Solana devnet. Three slots are deployed: $ASTRA19, $SES28, $SATMEX101. Mainnet deployment and the first live SPV require an operator partnership.
        </p>
      </div>

      {/* Explore */}
      <div className="mb-20">
        <div className="text-white/30 text-[11px] font-mono tracking-[0.3em] uppercase mb-6">Explore</div>
        <div className="space-y-2">
          {[
            { href: "/orbital",      title: "Orbital Slots",  desc: "Browse the registry and try the devnet demo." },
            { href: "/portfolio",    title: "Portfolio",      desc: "Track your positions and claim yield." },
            { href: "/stocks",       title: "Space Markets",  desc: "Publicly traded satellite companies." },
            { href: "/docs",         title: "Docs",           desc: "Technical reference and data sources." },
            { href: "/orbital/list", title: "List a Slot",    desc: "Operators: raise capital against your lease revenue." },
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
      <div className="border border-white/[0.06] rounded-2xl p-8 bg-black/20 mb-8">
        <h2 className="text-white font-bold text-lg mb-2">Get notified when the raise opens.</h2>
        <p className="text-zinc-500 text-sm mb-6">First SPV announcement and mainnet launch.</p>
        <EmailCapture label="Join the list" />
      </div>

    </div>
  );
}
