import Link from "next/link";
import { buildMeta } from "@/lib/metadata";
import OrbitalExplorer from "./OrbitalExplorer";
import { buildExplorerRows } from "@/lib/explorer";
import { getLatestIngest } from "@/lib/freshness";
import { getEntitlements } from "@/lib/auth";

export const metadata = buildMeta({
  title: "Orbital Registry",
  description: "Search, filter, and compare every tracked GEO orbital position. Occupancy, congestion scores, FCC filing status, and Slot Terminal.",
  tag: "Registry",
  path: "/orbital",
});

export default async function OrbitalPage() {
  const rows = buildExplorerRows();
  const latest = getLatestIngest();
  const { pro } = await getEntitlements();
  const updated = latest
    ? new Date(latest.lastRun.replace(" ", "T") + "Z").toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric", timeZone: "UTC",
      })
    : null;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-muted text-sm mb-2">Registry</p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-ink tracking-tight mb-3">Orbital Registry</h1>
          <p className="text-muted text-base leading-relaxed">
            Every tracked GEO position, by longitude. Who is on station, whether the FCC licensed it, and what is uncertain.
            Open a row for the Slot Terminal. Fair value is a labeled model, hidden by default.
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0 mt-1">
          <Link href="/orbital/101w" className="text-ink text-sm hover:text-muted transition-colors">
            Sample Terminal →
          </Link>
          <Link href="/orbital/changes" className="text-muted text-sm hover:text-ink transition-colors">
            Changes
          </Link>
          <Link href="/orbital/faq" className="text-muted text-sm hover:text-ink transition-colors">
            FAQ
          </Link>
          <Link href="/docs" className="text-muted text-sm hover:text-ink transition-colors">
            Docs
          </Link>
        </div>
      </div>
      <OrbitalExplorer rows={rows} updated={updated} pro={pro} />
    </div>
  );
}
