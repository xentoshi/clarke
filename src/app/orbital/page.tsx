import Link from "next/link";
import { buildMeta } from "@/lib/metadata";
import OrbitalExplorer from "./OrbitalExplorer";
import { buildExplorerRows } from "@/lib/explorer";
import { getLatestIngest } from "@/lib/freshness";

export const metadata = buildMeta({
  title: "Orbital Registry",
  description: "Search, filter, and compare every tracked GEO orbital position — operators, congestion scores, FCC filing status, and CSV export.",
  tag: "Registry",
  path: "/orbital",
});

export default function OrbitalPage() {
  const rows = buildExplorerRows();
  const latest = getLatestIngest();
  const updated = latest
    ? new Date(latest.lastRun.replace(" ", "T") + "Z").toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric", timeZone: "UTC",
      })
    : null;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-zinc-600 text-xs font-mono mb-3">// ORBITAL_REGISTRY</p>
          <h1 className="text-2xl font-bold text-white mb-2">Orbital Registry</h1>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Every tracked GEO position, by longitude. Search, filter, compare, export.
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0 mt-1">
          <Link href="/orbital/faq" className="text-zinc-600 text-xs hover:text-zinc-300 transition-colors">
            FAQ →
          </Link>
          <Link href="/docs" className="text-zinc-600 text-xs hover:text-zinc-300 transition-colors">
            Docs →
          </Link>
        </div>
      </div>
      <OrbitalExplorer rows={rows} updated={updated} />
    </div>
  );
}
