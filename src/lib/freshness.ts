import { getDb } from "./db";
import {
  ageDaysFrom,
  deriveTleEpochRangeFromDb,
  deriveUcsVintageFromDb,
  fccIsStale,
} from "./source-vintage";

export interface SourceFreshness {
  source: string;
  lastRun: string; // ISO-ish "YYYY-MM-DD HH:MM:SS" (UTC, from SQLite datetime('now'))
  rowCount: number;
  note: string | null;
  ageDays: number; // ingest-clock age
  fileVintage: string | null;
  sourceAsOf: string | null;
  vintageAgeDays: number;
  tleEpochMin: string | null;
  tleEpochMax: string | null;
  stale: boolean;
}

function tableExists(name: string): boolean {
  const db = getDb();
  if (!db) return false;
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
    .get(name) as { name: string } | undefined;
  return !!row;
}

function ingestMetaColumns(): Set<string> {
  const db = getDb();
  if (!db) return new Set();
  const rows = db.prepare("PRAGMA table_info(ingest_meta)").all() as { name: string }[];
  return new Set(rows.map((r) => r.name));
}

// Reads the ingest_meta table populated by the ingest scripts. Returns an empty
// array if the table doesn't exist yet (DB ingested before freshness tracking).
export function getDataFreshness(now: Date = new Date()): SourceFreshness[] {
  const db = getDb();
  if (!db || !tableExists("ingest_meta")) return [];

  const cols = ingestMetaColumns();
  const hasVintage = cols.has("file_vintage");
  const sql = hasVintage
    ? `SELECT source, last_run as lastRun, row_count as rowCount, note,
              file_vintage as fileVintage, source_as_of as sourceAsOf,
              tle_epoch_min as tleEpochMin, tle_epoch_max as tleEpochMax
       FROM ingest_meta ORDER BY source ASC`
    : `SELECT source, last_run as lastRun, row_count as rowCount, note
       FROM ingest_meta ORDER BY source ASC`;

  const rows = db.prepare(sql).all() as {
    source: string;
    lastRun: string;
    rowCount: number;
    note: string | null;
    fileVintage?: string | null;
    sourceAsOf?: string | null;
    tleEpochMin?: string | null;
    tleEpochMax?: string | null;
  }[];

  const ucsDerived = rows.some((r) => r.source === "UCS" && !(r.fileVintage || r.sourceAsOf))
    ? deriveUcsVintageFromDb()
    : null;
  const tleRange = rows.some((r) => r.source === "Space-Track TLE" && !(r.tleEpochMin && r.tleEpochMax))
    ? deriveTleEpochRangeFromDb()
    : { min: null, max: null };

  return rows.map((r) => {
    const ingestAge = ageDaysFrom(r.lastRun, now);
    let fileVintage = r.fileVintage ?? null;
    let sourceAsOf = r.sourceAsOf ?? fileVintage;
    let tleEpochMin = r.tleEpochMin ?? null;
    let tleEpochMax = r.tleEpochMax ?? null;

    if (r.source === "UCS" && !fileVintage && ucsDerived) {
      fileVintage = ucsDerived;
      sourceAsOf = ucsDerived;
    }
    if (r.source === "Space-Track TLE") {
      tleEpochMin = tleEpochMin ?? tleRange.min;
      tleEpochMax = tleEpochMax ?? tleRange.max;
      if (!fileVintage && tleEpochMax) {
        fileVintage = tleEpochMax;
        sourceAsOf = tleEpochMax;
      }
    }
    if (r.source === "FCC-SSAL" && !fileVintage && sourceAsOf) {
      fileVintage = sourceAsOf;
    }

    const vintageAgeDays = ageDaysFrom(sourceAsOf ?? fileVintage, now);
    const stale = r.source === "FCC-SSAL" && fccIsStale(fileVintage ?? sourceAsOf, now);

    return {
      source: r.source,
      lastRun: r.lastRun,
      rowCount: r.rowCount,
      note: r.note,
      ageDays: ingestAge,
      fileVintage,
      sourceAsOf: sourceAsOf ?? fileVintage,
      vintageAgeDays,
      tleEpochMin,
      tleEpochMax,
      stale,
    };
  });
}

// Most recent ingest across all sources, or null if none recorded.
export function getLatestIngest(): SourceFreshness | null {
  const all = getDataFreshness();
  if (all.length === 0) return null;
  return all.reduce((latest, cur) => (cur.lastRun > latest.lastRun ? cur : latest));
}

export function getFccFreshness(): SourceFreshness | null {
  return getDataFreshness().find((f) => f.source === "FCC-SSAL") ?? null;
}
