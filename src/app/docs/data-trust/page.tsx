import Link from "next/link";
import { buildMeta } from "@/lib/metadata";

export const metadata = buildMeta({
  title: "Data trust",
  description: "What a paying operator can trust on Slot Terminal: occupancy, FCC, freshness, and labeled model — not simulated markets.",
  tag: "Docs",
  path: "/docs/data-trust",
});

export default function DataTrustDocsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <p className="text-zinc-600 text-xs font-mono mb-3">{"// DATA_TRUST"}</p>
      <h1 className="text-3xl font-bold text-white mb-4">Data trust</h1>
      <p className="text-zinc-400 text-sm leading-relaxed mb-6">
        Clarke v0 is a public-registry view (TLE-primary occupancy, UCS identity, FCC SSAL licenses) plus a
        transparent heuristic implied-value range. It is not a live market, not an ITU deed, and not an appraisal.
        Full audit: <span className="font-mono text-zinc-300">docs/DATA_TRUST.md</span>.
      </p>
      <h2 className="text-white font-semibold text-sm mb-2">Default Slot Terminal</h2>
      <p className="text-zinc-500 text-sm leading-relaxed mb-4">
        The first screen is occupancy, recorded FCC layers, ingest freshness, and a labeled v0 model
        (last among KPIs). Warnings share one Trust bar with expand-in-place. Simulated capacity books,
        ITU filing stubs, sub-lease stubs, and seeded valuation sparklines are quarantined behind an
        explicit Experimental disclosure. They must not look like filled market panels. Fair value is
        hidden by default on the registry.
      </p>
      <p className="text-zinc-500 text-sm leading-relaxed mb-8">
        Legend: <span className="font-mono text-emerald-400">V</span> verified from a named public source ·{" "}
        <span className="font-mono text-sky-400">M</span> modeled / hand estimate ·{" "}
        <span className="font-mono text-amber-400">S</span> stub or simulated.
        Curated dollar overlays ($350M+ etc.) are class M hand estimates, secondary to the model range.
      </p>
      <div className="flex gap-4 text-sm">
        <Link href="/orbital/101w" className="text-white hover:text-zinc-300">Open 101°W Terminal →</Link>
        <Link href="/docs/valuation" className="text-zinc-500 hover:text-zinc-300">Valuation v0 →</Link>
      </div>
    </div>
  );
}
