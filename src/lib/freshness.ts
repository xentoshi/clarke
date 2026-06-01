import { getDb } from "./db";

export interface SourceFreshness {
  source: string;
  lastRun: string; // ISO-ish "YYYY-MM-DD HH:MM:SS" (UTC, from SQLite datetime('now'))
  rowCount: number;
  note: string | null;
  ageDays: number;
}

function tableExists(name: string): boolean {
  const db = getDb();
  if (!db) return false;
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
    .get(name) as { name: string } | undefined;
  return !!row;
}

// Reads the ingest_meta table populated by the ingest scripts. Returns an empty
// array if the table doesn't exist yet (DB ingested before freshness tracking).
export function getDataFreshness(): SourceFreshness[] {
  const db = getDb();
  if (!db || !tableExists("ingest_meta")) return [];

  const rows = db
    .prepare("SELECT source, last_run as lastRun, row_count as rowCount, note FROM ingest_meta ORDER BY source ASC")
    .all() as { source: string; lastRun: string; rowCount: number; note: string | null }[];

  const now = Date.now();
  return rows.map((r) => {
    // SQLite stores datetime('now') as UTC without timezone; append Z to parse.
    const ts = Date.parse(r.lastRun.replace(" ", "T") + "Z");
    const ageDays = isNaN(ts) ? -1 : Math.floor((now - ts) / 86_400_000);
    return { ...r, ageDays };
  });
}

// Most recent ingest across all sources, or null if none recorded.
export function getLatestIngest(): SourceFreshness | null {
  const all = getDataFreshness();
  if (all.length === 0) return null;
  return all.reduce((latest, cur) => (cur.lastRun > latest.lastRun ? cur : latest));
}
