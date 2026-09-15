import Link from "next/link";
import { buildMeta } from "@/lib/metadata";

export const metadata = buildMeta({
  title: "Valuation v0",
  description: "How Clarke’s Slot Terminal implied fair value is computed, what it is not, and how history is stored.",
  tag: "Docs",
  path: "/docs/valuation",
});

export default function ValuationDocsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <p className="text-zinc-600 text-xs font-mono mb-3">{"// VALUATION_V0"}</p>
      <h1 className="text-3xl font-bold text-white mb-4">Valuation v0</h1>
      <p className="text-zinc-400 text-sm leading-relaxed mb-8">
        Clarke’s Slot Terminal fair-value figure is a model, not a live market price, appraisal, or offer to transact.
        There is no public GEO slot tape; v0 exists so operators and investors can inspect an implied range and its drivers.
        Full write-up: <span className="font-mono text-zinc-300">docs/VALUATION.md</span> in the repo.
        Data-trust audit: <span className="font-mono text-zinc-300">docs/DATA_TRUST.md</span>.
      </p>
      <pre className="text-zinc-400 text-xs font-mono bg-black/40 border border-zinc-800 rounded-xl p-4 overflow-x-auto mb-8">{`point = $30M baseline
      × arc desirability
      × coverage (GDP/pop heuristic)
      × occupancy (co-located satellite count)
      × remaining life / occupancy quality
      × operator tier
      × spectrum (bands, when known)
      × scarcity (congestion score)
      × license / brought-into-use`}</pre>
      <p className="text-zinc-500 text-sm leading-relaxed mb-6">
        Occupancy counts use TLE-primary longitude ±0.4° (UCS fallback). TLE longitude is not an FCC or ITU assignment.
        Confidence interval widens as confidence falls (±22% / ±35% / ±50%). Government/military-only UCS users are flagged
        non-commercial. History in <span className="font-mono">data/terminal.db</span> is a seeded model path until a daily job lands — not trade prints.
      </p>
      <div className="flex gap-4 text-sm">
        <Link href="/orbital/101w" className="text-white hover:text-zinc-300">Open 101°W Terminal →</Link>
        <Link href="/about#registry-methodology" className="text-zinc-500 hover:text-zinc-300">Registry methodology →</Link>
      </div>
    </div>
  );
}
