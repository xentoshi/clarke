import Link from "next/link";
import { buildMeta } from "@/lib/metadata";
import {
  narratives,
  convictionColors,
  convictionLabels,
  horizonColors,
  horizonLabels,
} from "@/data/narratives";
import { format } from "date-fns";

export const metadata = buildMeta({
  title: "Narratives",
  description: "Investment theses for the space industry verticals — structured arguments on the companies and technologies building humanity's future beyond Earth.",
  tag: "Narratives",
});

const convictionOrder = { high: 0, medium: 1, watch: 2 };

const sorted = [...narratives].sort(
  (a, b) => convictionOrder[a.conviction] - convictionOrder[b.conviction]
);

export default function NarrativesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <p className="text-zinc-600 text-xs font-mono mb-3">// INVESTMENT_THESES</p>
        <h1 className="text-2xl font-bold text-white mb-3">Narratives</h1>
        <p className="text-zinc-500 text-sm max-w-2xl leading-relaxed">
          Structured investment theses for the space industry verticals — catalysts, risks, key companies, and time horizons.
          These are analytical frameworks, not financial advice.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-12">
        {(["high", "medium", "watch"] as const).map((c) => (
          <div key={c} className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/20 pcb-bracket">
            <div className="text-2xl font-bold font-mono text-white mb-1">
              {narratives.filter((n) => n.conviction === c).length}
            </div>
            <div className={`text-xs px-1.5 py-0.5 rounded border font-medium inline-block ${convictionColors[c]}`}>
              {convictionLabels[c]}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {sorted.map((n, i) => (
          <Link
            key={n.slug}
            href={`/narratives/${n.slug}`}
            className="block border border-zinc-800 rounded-xl p-6 bg-zinc-900/10 hover:border-zinc-600 hover:bg-zinc-900/25 transition-colors group"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-zinc-700 text-xs font-mono">N{String(i + 1).padStart(2, "0")}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${convictionColors[n.conviction]}`}>
                    {convictionLabels[n.conviction]}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${horizonColors[n.horizon]}`}>
                    {horizonLabels[n.horizon]}
                  </span>
                  {n.verticals.map((v) => (
                    <span key={v} className="text-xs text-zinc-600 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
                      {v}
                    </span>
                  ))}
                </div>

                <h2 className="text-white font-bold text-base mb-1 group-hover:text-zinc-200 transition-colors">
                  {n.title}
                </h2>
                <p className="text-zinc-500 text-sm leading-relaxed mb-4">{n.tagline}</p>

                <div className="flex flex-wrap gap-1.5">
                  {n.keyTickers.map((t) => (
                    <span key={t} className="font-mono text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
                      {t}
                    </span>
                  ))}
                  {n.keyPrivate.slice(0, 3).map((p) => (
                    <span key={p} className="text-xs text-zinc-600 bg-zinc-900/50 border border-zinc-800/50 px-1.5 py-0.5 rounded">
                      {p}
                    </span>
                  ))}
                  {n.keyPrivate.length > 3 && (
                    <span className="text-xs text-zinc-700 px-1.5 py-0.5">
                      +{n.keyPrivate.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-zinc-700 text-xs font-mono">
                  {format(new Date(n.updatedAt), "MMM yyyy")}
                </div>
                <div className="text-zinc-600 text-xs mt-1">{n.catalysts.length} catalysts</div>
                <div className="text-zinc-600 text-xs">{n.risks.length} risks</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <p className="text-zinc-700 text-xs mt-10 leading-relaxed max-w-2xl">
        Narratives are updated when material new information changes the thesis, catalyst set, or risk profile.
        Last review: {format(new Date(Math.max(...narratives.map((n) => new Date(n.updatedAt).getTime()))), "MMMM yyyy")}.
        Not financial advice.
      </p>
    </div>
  );
}
