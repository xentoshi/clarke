import Link from "next/link";
import { buildMeta } from "@/lib/metadata";
import { getRecentSlotEvents, type SlotEvent } from "@/lib/events";
import { lonToSlug, formatLon } from "@/lib/slot-utils";

export const metadata = buildMeta({
  title: "What Changed",
  description: "New FCC authorizations, lapsed filings, licensee changes, and satellite relocations detected in the GEO arc since Clarke started tracking history.",
  tag: "Registry",
  path: "/orbital/changes",
});

const EVENT_META: Record<string, { label: string; color: string }> = {
  new_authorization: { label: "New FCC authorization", color: "#60a5fa" },
  authorization_lapsed: { label: "Authorization lapsed", color: "#fbbf24" },
  licensee_change: { label: "Licensee change", color: "#a78bfa" },
  grant_status_change: { label: "Grant status change", color: "#fbbf24" },
  satellite_decayed: { label: "Satellite decayed", color: "#ef4444" },
  satellite_relocated: { label: "Satellite relocated", color: "#34d399" },
};

function eventMeta(eventType: string) {
  return EVENT_META[eventType] ?? { label: eventType, color: "#71717a" };
}

function formatDate(detectedAt: string): string {
  const d = new Date(detectedAt.replace(" ", "T") + "Z");
  if (isNaN(d.getTime())) return detectedAt;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

function ageLabel(detectedAt: string): string {
  const d = new Date(detectedAt.replace(" ", "T") + "Z");
  if (isNaN(d.getTime())) return "";
  const ageDays = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (ageDays <= 0) return "today";
  if (ageDays === 1) return "1 day ago";
  return `${ageDays} days ago`;
}

function EventRow({ event }: { event: SlotEvent }) {
  const meta = eventMeta(event.eventType);
  const slug = event.longitudeGeo !== null ? lonToSlug(event.longitudeGeo) : null;
  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-zinc-800/60 last:border-b-0">
      <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: meta.color }} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">{meta.label}</span>
          <span className="text-[10px] font-mono text-zinc-700">·</span>
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-600">{event.source}</span>
          {slug && (
            <>
              <span className="text-[10px] font-mono text-zinc-700">·</span>
              <Link href={`/orbital/${slug}`} className="text-[10px] font-mono text-blue-400/80 hover:text-blue-300 transition-colors">
                {formatLon(event.longitudeGeo!)} →
              </Link>
            </>
          )}
        </div>
        <p className="text-zinc-300 text-sm leading-relaxed">{event.summary}</p>
      </div>
      <div className="text-right shrink-0">
        <div className="text-zinc-600 text-xs font-mono">{formatDate(event.detectedAt)}</div>
        <div className="text-zinc-700 text-[10px] font-mono">{ageLabel(event.detectedAt)}</div>
      </div>
    </div>
  );
}

export default function ChangesPage() {
  const events = getRecentSlotEvents(100);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-zinc-600 text-xs font-mono mb-3">{"// WHAT_CHANGED"}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">What changed</h1>
          <p className="text-zinc-500 text-sm leading-relaxed max-w-2xl">
            New FCC authorizations, lapsed filings, licensee and grant-status changes, and satellite
            relocations or decays, detected each time the registry is re-ingested. Detected from real
            differences between ingest runs, not a live feed — see{" "}
            <Link href="/data" className="text-zinc-400 hover:text-zinc-300 underline">
              data freshness
            </Link>{" "}
            for how recently each source was last checked.
          </p>
        </div>
        <Link href="/orbital" className="text-zinc-600 text-xs hover:text-zinc-300 transition-colors shrink-0 mt-1">
          ← Registry
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="border border-zinc-800 rounded-xl px-6 py-10 text-center">
          <p className="text-zinc-400 text-sm mb-2">No changes recorded yet.</p>
          <p className="text-zinc-600 text-xs leading-relaxed max-w-md mx-auto">
            Change tracking has no backfill — it only starts counting from the first ingest run after
            this feed shipped. Re-run <span className="font-mono">npm run ingest:spacetrack</span> or{" "}
            <span className="font-mono">npm run ingest:fcc</span> to check for updates against the
            current registry.
          </p>
        </div>
      ) : (
        <div className="border border-zinc-800 rounded-xl px-5">
          {events.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}
