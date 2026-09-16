import Link from "next/link";
import { buildMeta } from "@/lib/metadata";
import { getEntitlements } from "@/lib/auth";
import { buildSlotTerminal } from "@/lib/slot-terminal";
import { isSafeSlug } from "@/lib/slot-utils";
import { statusLabels } from "@/data/orbital-slots";
import { formatAsOfDate } from "@/lib/provenance";

export const metadata = buildMeta({
  title: "Compare slots",
  description: "Side-by-side Slot Terminal metrics for up to four GEO positions.",
  tag: "Terminal",
  path: "/orbital/compare",
});

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}) {
  const entitlements = await getEntitlements();
  const { s } = await searchParams;
  const slugs = [...new Set((s ?? "").split(",").map((x) => x.trim()).filter((x) => isSafeSlug(x)))].slice(0, 4);
  const models = slugs.map((slug) => buildSlotTerminal(slug)).filter((m) => m !== null);

  if (!entitlements.features.compare) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <p className="text-zinc-600 text-xs font-mono mb-3">{"// COMPARE"}</p>
        <h1 className="text-2xl font-bold text-white mb-3">Compare is a Pro Terminal feature</h1>
        <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
          Side-by-side fair value, congestion, occupancy, and license signals for up to four GEO slots.
          {slugs.length > 0 && <span className="block mt-2 font-mono text-zinc-400">{slugs.join(" · ")}</span>}
        </p>
        <Link href="/pricing" className="inline-block bg-white text-black rounded-lg px-5 py-2.5 text-sm font-bold hover:bg-zinc-200">
          Unlock Pro
        </Link>
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-white mb-3">Pick up to 4 slots</h1>
        <p className="text-zinc-500 text-sm mb-6">Use the compare checkboxes on the registry, or open a Slot Terminal and add it.</p>
        <Link href="/orbital" className="text-zinc-300 hover:text-white text-sm">← Registry</Link>
      </div>
    );
  }

  const rows: { key: string; label: string; get: (m: NonNullable<(typeof models)[number]>) => string }[] = [
    { key: "op", label: "Operator", get: (m) => m.operator || "—" },
    { key: "st", label: "Status", get: (m) => statusLabels[m.status] },
    { key: "sats", label: "Occupancy", get: (m) => String(m.satCount) },
    { key: "cong", label: "Congestion", get: (m) => `${m.congestion.score} · ${m.congestion.label}` },
    { key: "biu", label: "BIU / license", get: (m) => m.valuation.license.biuLabel },
    { key: "fcc", label: "FCC rows", get: (m) => String(m.fccAuthorizations.length) },
    { key: "asof", label: "As of", get: (m) => formatAsOfDate(m.asOf) },
    { key: "co", label: "Country", get: (m) => m.country || "—" },
    { key: "pur", label: "Purpose", get: (m) => m.purpose || "—" },
    { key: "cov", label: "Coverage proxy", get: (m) => m.valuation.coverage.band.label },
    { key: "life", label: "Remaining life", get: (m) => m.valuation.occupancyQuality.meanYearsRemaining == null ? "—" : `${m.valuation.occupancyQuality.meanYearsRemaining}y` },
    { key: "fv", label: "Fair value (v0)", get: (m) => m.valuation.nonCommercial ? "n/c" : m.valuation.formatted.point },
    { key: "ci", label: "Confidence interval", get: (m) => m.valuation.formatted.range },
    { key: "conf", label: "Confidence", get: (m) => m.valuation.confidence },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <Link href="/orbital" className="text-white/30 text-xs font-mono hover:text-white/60">← Registry</Link>
        <h1 className="text-2xl font-bold text-white mt-3">Compare</h1>
        <p className="text-zinc-500 text-sm mt-1">Terminal metrics, side by side. Valuation v0 is model-based, not a live print.</p>
      </div>
      <div className="overflow-x-auto border border-zinc-800 rounded-xl">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950">
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-zinc-600 font-medium w-44">Metric</th>
              {models.map((m) => (
                <th key={m.slug} className="text-left px-4 py-3">
                  <Link href={`/orbital/${m.slug}`} className="text-white font-mono text-sm hover:text-zinc-300">{m.label}</Link>
                  <div className="text-zinc-600 text-[10px] font-mono mt-0.5">{m.slug}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-b border-zinc-800/50 last:border-0">
                <td className="px-4 py-2.5 text-zinc-500 text-xs">{r.label}</td>
                {models.map((m) => (
                  <td key={m.slug} className="px-4 py-2.5 text-zinc-200 text-xs font-mono">{r.get(m)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
