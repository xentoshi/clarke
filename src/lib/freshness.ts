import { getDb } from "./db";
import { registryCacheToken } from "./process-cache";
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

interface PreparedIngest {
  source: string;
  lastRun: string;
  rowCount: number;
  note: string | null;
  fileVintage: string | null;
  sourceAsOf: string | null;
  tleEpochMin: string | null;
  tleEpochMax: string | null;
}

// SQL rows for one registry token. Ages are applied per call so a passed `now`
// still moves age_days. Repeat reads do not reopen ingest_meta.
let preparedMemo: { token: string; rows: PreparedIngest[] | null } | null = null;

function preparedIngestRows(): PreparedIngest[] | null {
  const token = registryCacheToken();
  if (preparedMemo && preparedMemo.token === token) return preparedMemo.rows;

  const db = getDb();
  if (!db) {
    preparedMemo = { token, rows: null };
    return null;
  }
  const table = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
    .get("ingest_meta") as { name: string } | undefined;
  if (!table) {
    preparedMemo = { token, rows: null };
    return null;
  }
  const cols = new Set(
    (db.prepare("PRAGMA table_info(ingest_meta)").all() as { name: string }[]).map((row) => row.name),
  );
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

  const ucsDerived = rows.some((row) => row.source === "UCS" && !(row.fileVintage || row.sourceAsOf))
    ? deriveUcsVintageFromDb()
    : null;
  const tleRange = rows.some((row) => row.source === "Space-Track TLE" && !(row.tleEpochMin && row.tleEpochMax))
    ? deriveTleEpochRangeFromDb()
    : { min: null, max: null };

  const prepared = rows.map((row) => {
    let fileVintage = row.fileVintage ?? null;
    let sourceAsOf = row.sourceAsOf ?? fileVintage;
    let tleEpochMin = row.tleEpochMin ?? null;
    let tleEpochMax = row.tleEpochMax ?? null;

    if (row.source === "UCS" && !fileVintage && ucsDerived) {
      fileVintage = ucsDerived;
      sourceAsOf = ucsDerived;
    }
    if (row.source === "Space-Track TLE") {
      tleEpochMin = tleEpochMin ?? tleRange.min;
      tleEpochMax = tleEpochMax ?? tleRange.max;
      if (!fileVintage && tleEpochMax) {
        fileVintage = tleEpochMax;
        sourceAsOf = tleEpochMax;
      }
    }
    if (row.source === "FCC-SSAL" && !fileVintage && sourceAsOf) {
      fileVintage = sourceAsOf;
    }

    return {
      source: row.source,
      lastRun: row.lastRun,
      rowCount: row.rowCount,
      note: row.note,
      fileVintage,
      sourceAsOf: sourceAsOf ?? fileVintage,
      tleEpochMin,
      tleEpochMax,
    };
  });
  preparedMemo = { token, rows: prepared };
  return prepared;
}

// Reads the ingest_meta table populated by the ingest scripts. Returns an empty
// array if the table doesn't exist yet (DB ingested before freshness tracking).
export function getDataFreshness(now: Date = new Date()): SourceFreshness[] {
  const rows = preparedIngestRows();
  if (!rows) return [];

  return rows.map((row) => {
    const sourceAsOf = row.sourceAsOf ?? row.fileVintage;
    return {
      source: row.source,
      lastRun: row.lastRun,
      rowCount: row.rowCount,
      note: row.note,
      ageDays: ageDaysFrom(row.lastRun, now),
      fileVintage: row.fileVintage,
      sourceAsOf,
      vintageAgeDays: ageDaysFrom(sourceAsOf ?? row.fileVintage, now),
      tleEpochMin: row.tleEpochMin,
      tleEpochMax: row.tleEpochMax,
      stale: row.source === "FCC-SSAL" && fccIsStale(row.fileVintage ?? sourceAsOf, now),
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

function dateOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  const day = value.trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}

/**
 * Absolute dates from the committed database, for pages that show counts.
 * Not the wall clock and not the filesystem mtime, so a stopped refresh
 * cannot leave the page looking like today.
 */
export function formatRegistryCountAsOf(): string | null {
  const rows = getDataFreshness();
  const tle = rows.find((row) => row.source === "Space-Track TLE");
  const fcc = rows.find((row) => row.source === "FCC-SSAL");
  const tleDay = dateOnly(tle?.tleEpochMax ?? tle?.sourceAsOf ?? tle?.fileVintage);
  const fccDay = dateOnly(fcc?.fileVintage ?? fcc?.sourceAsOf);
  if (tleDay && fccDay) return `Data as of ${tleDay}. FCC workbook ${fccDay}.`;
  if (tleDay) return `Data as of ${tleDay}.`;
  if (fccDay) return `Data as of ${fccDay}.`;
  return null;
}
