import { getDb } from "./db";
import { parseUcsLaunchYear } from "./occupancy-quality";

/** FCC SSAL is treated stale when the workbook as-of is older than this. */
export const FCC_STALE_AFTER_DAYS = 14;

const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

/** Parse "Updated 30 April 2026" (FCC SSAL sheet name) → YYYY-MM-DD. */
export function parseFccSheetVintage(sheetName: string | null | undefined): string | null {
  if (!sheetName) return null;
  const m = sheetName.trim().match(/updated\s+(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = MONTHS[m[2].toLowerCase()];
  const year = parseInt(m[3], 10);
  if (!month || day < 1 || day > 31 || year < 1990) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const d = new Date(`${trimmed}T00:00:00Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const ts = Date.parse(trimmed.includes("T") || trimmed.endsWith("Z") ? trimmed : trimmed.replace(" ", "T") + "Z");
  if (Number.isNaN(ts)) return null;
  return new Date(ts);
}

export function ageDaysFrom(iso: string | null | undefined, now: Date = new Date()): number {
  const d = parseIsoDate(iso);
  if (!d) return -1;
  return Math.floor((now.getTime() - d.getTime()) / 86_400_000);
}

export function fccIsStale(fileVintage: string | null | undefined, now: Date = new Date()): boolean {
  const age = ageDaysFrom(fileVintage, now);
  return age > FCC_STALE_AFTER_DAYS;
}

export interface FreshnessLike {
  source: string;
  lastRun: string;
  fileVintage: string | null;
  sourceAsOf: string | null;
  tleEpochMin: string | null;
  tleEpochMax: string | null;
}

export interface SlotSourceVintage {
  ucsFileVintage: string | null;
  ucsIngestAt: string | null;
  fccAsOf: string | null;
  fccIngestAt: string | null;
  fccStale: boolean;
  fccStaleAfterDays: number;
  tleEpochMin: string | null;
  tleEpochMax: string | null;
  tleIngestAt: string | null;
}

function sourceRow(freshness: FreshnessLike[], name: string): FreshnessLike | undefined {
  return freshness.find((f) => f.source === name);
}

export function slotSourceVintage(
  satellites: { tleEpoch: string | null }[],
  freshness: FreshnessLike[],
  now: Date = new Date(),
): SlotSourceVintage {
  const ucs = sourceRow(freshness, "UCS");
  const fcc = sourceRow(freshness, "FCC-SSAL");
  const tle = sourceRow(freshness, "Space-Track TLE");
  const epochs = satellites.map((s) => s.tleEpoch).filter((e): e is string => Boolean(e)).sort();
  const fccAsOf = fcc?.fileVintage ?? fcc?.sourceAsOf ?? null;
  return {
    ucsFileVintage: ucs?.fileVintage ?? ucs?.sourceAsOf ?? null,
    ucsIngestAt: ucs?.lastRun ?? null,
    fccAsOf,
    fccIngestAt: fcc?.lastRun ?? null,
    fccStale: fccIsStale(fccAsOf, now),
    fccStaleAfterDays: FCC_STALE_AFTER_DAYS,
    tleEpochMin: epochs[0] ?? null,
    tleEpochMax: epochs[epochs.length - 1] ?? null,
    tleIngestAt: tle?.lastRun ?? null,
  };
}

/** Derive UCS file vintage from catalog launch dates when ingest_meta has none. */
export function ucsVintageFromLaunchDates(launchDates: (string | null)[]): string | null {
  let max: string | null = null;
  let maxYear = 0;
  for (const raw of launchDates) {
    const year = parseUcsLaunchYear(raw);
    if (!year || year < maxYear) continue;
    maxYear = year;
    const iso = toLaunchIso(raw, year);
    if (!max || (iso && iso > max) || year > parseInt(max.slice(0, 4), 10)) {
      max = iso ?? `${year}-12-31`;
    }
  }
  return max;
}

function toLaunchIso(raw: string | null, year: number): string | null {
  if (!raw) return null;
  const iso = raw.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const mdY = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!mdY) return `${year}-01-01`;
  const month = mdY[1].padStart(2, "0");
  const day = mdY[2].padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Read UCS launch dates from clarke.db when ingest_meta vintage is empty. */
export function deriveUcsVintageFromDb(): string | null {
  const db = getDb();
  if (!db) return null;
  try {
    const rows = db.prepare(
      "SELECT launch_date as launchDate FROM satellites WHERE orbit_class = 'GEO' AND launch_date IS NOT NULL",
    ).all() as { launchDate: string | null }[];
    return ucsVintageFromLaunchDates(rows.map((r) => r.launchDate));
  } catch {
    return null;
  }
}

export function deriveTleEpochRangeFromDb(): { min: string | null; max: string | null } {
  const db = getDb();
  if (!db) return { min: null, max: null };
  try {
    const row = db.prepare("SELECT MIN(epoch) as min, MAX(epoch) as max FROM spacetrack_tles WHERE epoch IS NOT NULL").get() as
      | { min: string | null; max: string | null }
      | undefined;
    return { min: row?.min ?? null, max: row?.max ?? null };
  } catch {
    return { min: null, max: null };
  }
}
