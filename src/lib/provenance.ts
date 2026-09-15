export interface Provenance {
  source: string;
  asOf: string; // ISO-8601 UTC
  note?: string;
}

export function ingestAsOf(lastRun: string | null | undefined, fallback = new Date()): string {
  if (!lastRun) return fallback.toISOString();
  const ts = Date.parse(lastRun.replace(" ", "T") + "Z");
  if (Number.isNaN(ts)) return fallback.toISOString();
  return new Date(ts).toISOString();
}

export function formatAsOf(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

export function formatAsOfDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
