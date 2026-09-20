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
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14">
      <div className="mb-12 max-w-2xl">
        <p className="text-muted text-[14px] mb-3">Registry</p>
        <h1 className="text-4xl sm:text-5xl font-semibold text-ink tracking-tight mb-5">Orbital Registry</h1>
        <p className="text-muted text-lg leading-relaxed">
          Every tracked GEO position, by longitude. Who is on station, whether the FCC licensed it, and what is uncertain.
          Open a row for the Slot Terminal. Fair value is a labeled model, hidden by default.
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-6 text-[14px]">
          <Link href="/orbital/101w" className="text-ink hover:text-muted transition-colors">
            Sample Terminal
          </Link>
          <Link href="/orbital/changes" className="text-muted hover:text-ink transition-colors">
            Changes
          </Link>
          <Link href="/orbital/faq" className="text-muted hover:text-ink transition-colors">
            FAQ
          </Link>
          <Link href="/docs" className="text-muted hover:text-ink transition-colors">
            Docs
          </Link>
        </div>
      </div>
      <OrbitalExplorer rows={rows} updated={updated} pro={pro} />
    </div>
  );
}
