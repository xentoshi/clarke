import type { Metadata } from "next";
import Link from "next/link";
import { slots } from "@/data/orbital-slots";
import MarketOverview from "@/components/MarketOverview";
import EmailCapture from "@/components/EmailCapture";
import { buildMeta } from "@/lib/metadata";

export const metadata: Metadata = buildMeta({
  title: "Clarke",
  description: "Geostationary orbital slots are the most defensible infrastructure in existence. Clarke puts fractional ownership on Solana.",
  tag: "RWA · Solana",
});

const listedSlots = slots.filter((s) => s.tokenization?.status === "listed").length;

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6">

      {/* Hero */}
      <div className="pt-20 sm:pt-32 pb-20 flex flex-col items-center text-center">
        <h1 className="text-3xl sm:text-6xl font-bold text-white mb-6 leading-[1.08] max-w-4xl tracking-tight">
          Every ship, flight, and oil rig<br className="hidden sm:block" /> depends on orbital slots.
        </h1>
        <p className="text-zinc-400 text-base sm:text-lg max-w-xl leading-relaxed mb-10">
          Geostationary orbital positions are leased under long-term fixed contracts to the world's most critical infrastructure operators.
          Clarke puts fractional ownership on Solana.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/orbital"
            className="px-8 py-3.5 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors">
            View open offerings →
          </Link>
          <Link href="/orbital/list"
            className="px-8 py-3.5 border border-zinc-700 text-zinc-300 rounded-xl font-medium text-sm hover:border-zinc-500 hover:text-white transition-colors">
            I operate a satellite
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.06] mb-24 rounded-xl overflow-hidden">
        {[
          { value: "~1,800", label: "GEO slots" },
          { value: "$0",     label: "Currently on-chain" },
          { value: "15yr",   label: "Avg. contract length" },
          { value: `${listedSlots}`,    label: "Listed on Clarke" },
        ].map((s) => (
          <div key={s.label} className="bg-zinc-950 px-6 py-6 text-center sm:text-left">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-white mb-1">{s.value}</div>
            <div className="text-[10px] text-white/35 uppercase tracking-[0.2em] font-mono">{s.label}</div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="mb-24">
        <div className="text-white/30 text-[11px] font-mono tracking-[0.3em] uppercase mb-4">How it works</div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-12">Three steps.</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/[0.04]">
          {[
            { num: "01", title: "Operator lists a slot", body: "A satellite operator submits their orbital position to Clarke. Clarke verifies the lease contract and creates an on-chain offering." },
            { num: "02", title: "Yield shares issued on Solana", body: "The slot's lease revenue is fractionalized into on-chain positions. Each share is a fractional claim on quarterly transponder lease payments." },
            { num: "03", title: "Yield flows quarterly", body: "Lease payments hit the on-chain offering every quarter. Yield share holders claim their cut directly to any Solana wallet." },
          ].map((c) => (
            <div key={c.num} className="bg-black/20 p-8">
              <div className="text-white/15 text-xs font-mono mb-6">{c.num}</div>
              <div className="text-white font-bold text-base mb-3">{c.title}</div>
              <p className="text-white/40 text-sm leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Why it works */}
      <div className="mb-24">
        <div className="text-white/30 text-[11px] font-mono tracking-[0.3em] uppercase mb-4">Why it works</div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-12">Why it works.</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            { title: "Fixed supply", body: "There are ~1,800 GEO slots. No new ones can be created. The ITU allocates positions along a fixed arc — prime locations have been fully occupied for decades." },
            { title: "Captive demand", body: "Ships, aircraft, oil platforms, and ground stations are built around specific orbital positions. Moving to a different slot means years of ITU recoordination. It does not happen." },
            { title: "Contracted revenue", body: "These are not ad revenues or subscriptions. They are fixed-rate, long-term transponder lease contracts. The cash flow is predictable by design." },
            { title: "No public market", body: "Every deal happens in private between a handful of operators. No price discovery. No retail access. No on-chain presence. Clarke changes that." },
          ].map((c) => (
            <div key={c.title} className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/10">
              <div className="text-white font-semibold text-sm mb-3">{c.title}</div>
              <p className="text-zinc-500 text-xs leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Live offerings */}
      <div className="border border-white/[0.06] rounded-2xl p-8 bg-black/20 mb-24 flex flex-col sm:flex-row items-start gap-8">
        <div className="flex-1">
          <div className="text-white/25 text-xs font-mono mb-3 tracking-widest">// PROOF OF CONCEPT · SOLANA DEVNET</div>
          <h2 className="text-white font-bold text-xl mb-3">Three slots on devnet.</h2>
          <p className="text-white/40 text-sm leading-relaxed mb-6 max-w-sm">
            $ASTRA19, $SES28, and $SATMEX101 are deployed on Solana devnet for testing. Connect a wallet, get free devnet SOL, and try the full invest and yield flow.
          </p>
          <Link href="/orbital" className="inline-block px-5 py-2.5 bg-white text-black rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors">
            View offerings →
          </Link>
        </div>
        <div className="shrink-0 w-full sm:w-64 border border-white/[0.08] rounded-xl p-4 bg-black/30">
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
      </div>

      {/* Space markets */}
      <div className="mb-24">
        <div className="text-white/30 text-[11px] font-mono tracking-[0.3em] uppercase mb-4">Space markets</div>
        <MarketOverview />
      </div>

      {/* Email */}
      <div className="border border-white/[0.06] rounded-2xl p-10 bg-black/20 mb-24 text-center">
        <div className="text-white/25 text-xs font-mono mb-4 tracking-widest">// GET NOTIFIED</div>
        <h2 className="text-white font-bold text-2xl mb-3">Be first when the raise opens.</h2>
        <p className="text-zinc-500 text-sm mb-8 max-w-sm mx-auto">
          Clarke is preparing the first mainnet SPV. Get notified when it opens.
        </p>
        <div className="flex justify-center">
          <EmailCapture label="Join the list" />
        </div>
      </div>

      {/* CTAs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/[0.04] mb-24">
        {[
          { href: "/orbital",      title: "Open offerings →",  desc: "Browse the GEO registry and invest in yield positions." },
          { href: "/portfolio",    title: "My portfolio →",    desc: "View your positions and claim accrued yield." },
          { href: "/orbital/list", title: "Operators →",       desc: "Raise upfront capital against your transponder lease revenue." },
        ].map((c) => (
          <Link key={c.href} href={c.href}
            className="group bg-black/50 hover:bg-black/70 transition-colors p-8">
            <div className="font-bold text-white text-sm mb-2 group-hover:text-white/70 transition-colors">{c.title}</div>
            <p className="text-white/25 text-xs leading-relaxed">{c.desc}</p>
          </Link>
        ))}
      </div>

    </div>
  );
}
