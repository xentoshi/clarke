import Link from "next/link";
import { buildMeta } from "@/lib/metadata";

export const metadata = buildMeta({
  title: "FCC SSAL refresh",
  description: "How Clarke refreshes FCC license rows: committed ssal.xlsx, workbook vintage, weekly re-parse. Not a live fcc.gov scrape.",
  tag: "Docs",
  path: "/docs/fcc-refresh",
});

export default function FccRefreshDocsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <p className="text-zinc-600 text-xs font-mono mb-3">{"// FCC_REFRESH"}</p>
      <h1 className="text-3xl font-bold text-white mb-4">FCC SSAL refresh</h1>
      <p className="text-zinc-400 text-sm leading-relaxed mb-6">
        Clarke does not scrape fcc.gov (Akamai blocks automated fetches). License rows come from the committed
        workbook <span className="font-mono text-zinc-300">data/ssal.xlsx</span>. Product as-of is the sheet name
        (e.g. Updated 30 April 2026), not the ingest clock. Full runbook:{" "}
        <span className="font-mono text-zinc-300">docs/FCC_REFRESH.md</span>.
      </p>
      <ol className="text-zinc-400 text-sm leading-relaxed space-y-2 mb-8 list-decimal pl-5">
        <li>Download the Excel list from the FCC Approved Space Station List page.</li>
        <li>Replace <span className="font-mono text-zinc-300">data/ssal.xlsx</span>.</li>
        <li>Run <span className="font-mono text-zinc-300">npm run ingest:fcc</span>.</li>
        <li>Commit the workbook and <span className="font-mono text-zinc-300">data/clarke.db</span>.</li>
      </ol>
      <p className="text-zinc-500 text-sm leading-relaxed mb-8">
        Slot Terminal shows a stale banner when workbook as-of is older than 14 days. Occupancy remains TLE-primary.
      </p>
      <div className="flex gap-4 text-sm">
        <Link href="/orbital/101w" className="text-white hover:text-zinc-300">Open 101°W Terminal →</Link>
        <Link href="/docs/data-trust" className="text-zinc-500 hover:text-zinc-300">Data trust →</Link>
      </div>
    </div>
  );
}
