import Link from "next/link";
import { buildMeta } from "@/lib/metadata";
import { getRecentSlotEvents, type SlotEvent } from "@/lib/events";
import { lonToSlug, formatLon, registryOrbitalHref } from "@/lib/slot-utils";
import { slots as curatedSlots } from "@/data/orbital-slots";
import { getAllRegistrySlugs } from "@/lib/satellites";

export const revalidate = false;

export const metadata = buildMeta({
  title: "What Changed",
  description: "New FCC authorizations, lapsed filings, licensee changes, and satellite relocations detected in the GEO arc since Clarke started tracking history.",
  tag: "Registry",
  path: "/orbital/changes",
  image: "/og/page/changes.png",
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

function EventRow({ event, built }: { event: SlotEvent; built: ReadonlySet<string> }) {
  const meta = eventMeta(event.eventType);
  const slug = event.longitudeGeo !== null ? lonToSlug(event.longitudeGeo) : null;
  const href = registryOrbitalHref(slug, built);
  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-line last:border-b-0">
      <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: meta.color }} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-xs text-muted">{meta.label}</span>
          <span className="text-xs text-faint">·</span>
          <span className="text-xs text-faint">{event.source}</span>
          {slug && (
            <>
              <span className="text-xs text-faint">·</span>
              {href ? (
                <Link href={href} className="text-xs font-mono text-ink hover:text-muted transition-colors">
                  {formatLon(event.longitudeGeo!)} →
                </Link>
              ) : (
                <span className="text-xs font-mono text-ink">{formatLon(event.longitudeGeo!)} →</span>
              )}
            </>
          )}
        </div>
        <p className="text-ink text-sm leading-relaxed">{event.summary}</p>
      </div>
      <div className="text-right shrink-0">
        <div className="text-muted text-sm font-mono">{formatDate(event.detectedAt)}</div>
        <div className="text-faint text-xs">{ageLabel(event.detectedAt)}</div>
      </div>
    </div>
  );
}

export default function ChangesPage() {
  const events = getRecentSlotEvents(100);
  const built = new Set(getAllRegistrySlugs(curatedSlots));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-muted text-sm mb-2">Registry</p>
          <h1 className="text-3xl font-semibold text-ink tracking-tight mb-3">What changed</h1>
          <p className="text-muted text-base leading-relaxed max-w-2xl">
            New FCC authorizations, lapsed filings, licensee and grant-status changes, and satellite
            relocations or decays, detected each time the registry is re-ingested. Detected from real
            differences between ingest runs, not a live feed — see{" "}
            <Link href="/about#data-sources" className="text-ink hover:text-muted underline">
              data freshness
            </Link>{" "}
            for how recently each source was last checked. Agents should read{" "}
            <Link href="/docs/agent-api" className="text-ink hover:text-muted underline">
              GET /api/v1/agents/deltas
            </Link>
            . That feed does not treat satellite relocations as occupancy enter or leave.
          </p>
        </div>
        <Link href="/orbital" className="text-muted text-sm hover:text-ink transition-colors shrink-0 mt-1">
          ← Registry
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="border border-line bg-surface px-6 py-10 text-center">
          <p className="text-muted text-sm mb-2">No changes recorded yet.</p>
          <p className="text-faint text-sm leading-relaxed max-w-md mx-auto">
            Stored events start at the first ingest kept after this feed shipped.
          </p>
        </div>
      ) : (
        <div className="border border-line bg-surface px-5">
          {events.map((e) => (
            <EventRow key={e.id} event={e} built={built} />
          ))}
        </div>
      )}
    </div>
  );
}
