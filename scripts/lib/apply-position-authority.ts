import type Database from "better-sqlite3";
import { subSatelliteLongitudeDeg, parseTleElements } from "./orbit";
import { normalizeLonDeg } from "../../src/lib/geo-angle";
import { resolveOccupancyPosition, type PositionSource } from "../../src/lib/position-authority";

export interface PositionApplyStats {
  geoRows: number;
  tleMatched: number;
  tlePrimary: number;
  ucsFallback: number;
  unknown: number;
  disputedGt2: number;
  disputedGt10: number;
  wrapNormalized: number;
}

const POSITION_COLUMNS: { name: string; ddl: string }[] = [
  { name: "longitude_ucs", ddl: "ALTER TABLE satellites ADD COLUMN longitude_ucs REAL" },
  { name: "longitude_tle", ddl: "ALTER TABLE satellites ADD COLUMN longitude_tle REAL" },
  { name: "longitude_occupancy", ddl: "ALTER TABLE satellites ADD COLUMN longitude_occupancy REAL" },
  { name: "position_source", ddl: "ALTER TABLE satellites ADD COLUMN position_source TEXT" },
  { name: "position_delta_deg", ddl: "ALTER TABLE satellites ADD COLUMN position_delta_deg REAL" },
  { name: "position_disputed", ddl: "ALTER TABLE satellites ADD COLUMN position_disputed INTEGER" },
  { name: "tle_epoch", ddl: "ALTER TABLE satellites ADD COLUMN tle_epoch TEXT" },
  { name: "tle_age_days", ddl: "ALTER TABLE satellites ADD COLUMN tle_age_days INTEGER" },
  { name: "tle_reject_reason", ddl: "ALTER TABLE satellites ADD COLUMN tle_reject_reason TEXT" },
];

export function ensureSatellitePositionColumns(db: Database.Database): void {
  const existing = new Set(
    (db.prepare("PRAGMA table_info(satellites)").all() as { name: string }[]).map((c) => c.name),
  );
  for (const col of POSITION_COLUMNS) {
    if (!existing.has(col.name)) db.exec(col.ddl);
  }
}

interface GeoRow {
  id: number;
  longitude_geo: number | null;
  norad_id: string | null;
}

interface TleRow {
  norad_id: string;
  tle1: string;
  tle2: string;
  epoch: string | null;
  ingested_at: string | null;
}

interface SatcatRow {
  norad_id: string;
  object_type: string | null;
  decay_date: string | null;
  current: string | null;
}

// Dual-track occupancy: UCS catalog longitude stays in longitude_geo (after
// wrap-normalize only). TLE-derived occupancy is written to longitude_occupancy
// plus provenance columns. Live clustering reads TLE at query time from the
// TLE table; these columns are the ingest audit trail so a silent overwrite
// of longitude_geo can never be the only record of a move.
export function applyPositionAuthority(db: Database.Database, asOf: Date = new Date()): PositionApplyStats {
  ensureSatellitePositionColumns(db);

  const wrap = db.prepare(
    "SELECT id, longitude_geo FROM satellites WHERE orbit_class = 'GEO' AND longitude_geo IS NOT NULL AND (longitude_geo > 180 OR longitude_geo <= -180)",
  ).all() as { id: number; longitude_geo: number }[];
  const updateWrap = db.prepare("UPDATE satellites SET longitude_geo = ? WHERE id = ?");
  for (const row of wrap) updateWrap.run(normalizeLonDeg(row.longitude_geo), row.id);

  const geo = db.prepare(
    "SELECT id, longitude_geo, norad_id FROM satellites WHERE orbit_class = 'GEO'",
  ).all() as GeoRow[];

  const tleByNorad = new Map<string, TleRow>(
    (db.prepare("SELECT norad_id, tle1, tle2, epoch, ingested_at FROM spacetrack_tles").all() as TleRow[])
      .map((r) => [r.norad_id, r]),
  );
  const satcatByNorad = new Map<string, SatcatRow>(
    (db.prepare("SELECT norad_id, object_type, decay_date, current FROM spacetrack_satcat").all() as SatcatRow[])
      .map((r) => [r.norad_id, r]),
  );

  const update = db.prepare(`
    UPDATE satellites SET
      longitude_ucs = @longitude_ucs,
      longitude_tle = @longitude_tle,
      longitude_occupancy = @longitude_occupancy,
      position_source = @position_source,
      position_delta_deg = @position_delta_deg,
      position_disputed = @position_disputed,
      tle_epoch = @tle_epoch,
      tle_age_days = @tle_age_days,
      tle_reject_reason = @tle_reject_reason
    WHERE id = @id
  `);

  const stats: PositionApplyStats = {
    geoRows: geo.length,
    tleMatched: 0,
    tlePrimary: 0,
    ucsFallback: 0,
    unknown: 0,
    disputedGt2: 0,
    disputedGt10: 0,
    wrapNormalized: wrap.length,
  };

  const run = db.transaction(() => {
    for (const row of geo) {
      const tle = row.norad_id ? tleByNorad.get(row.norad_id) : undefined;
      const satcat = row.norad_id ? satcatByNorad.get(row.norad_id) : undefined;
      let tleLongitude: number | null = null;
      let elements = { inclinationDeg: null as number | null, eccentricity: null as number | null, meanMotionRevPerDay: null as number | null };
      if (tle) {
        tleLongitude = subSatelliteLongitudeDeg(tle.tle1, tle.tle2);
        elements = parseTleElements(tle.tle2);
        if (tleLongitude !== null) stats.tleMatched++;
      }
      const resolved = resolveOccupancyPosition({
        ucsLongitude: row.longitude_geo,
        tleLongitude,
        tleEpoch: tle?.epoch ?? null,
        tleIngestedAt: tle?.ingested_at ?? null,
        tleMeanMotion: elements.meanMotionRevPerDay,
        tleEccentricity: elements.eccentricity,
        objectType: satcat?.object_type ?? null,
        decayDate: satcat?.decay_date ?? null,
        current: satcat?.current ?? null,
        asOf,
      });
      if (resolved.source === "tle") stats.tlePrimary++;
      else if (resolved.source === "ucs") stats.ucsFallback++;
      else stats.unknown++;
      if (resolved.disputed) stats.disputedGt2++;
      if ((resolved.deltaDeg ?? 0) > 10) stats.disputedGt10++;

      update.run({
        id: row.id,
        longitude_ucs: resolved.ucsLongitude,
        longitude_tle: resolved.tleLongitude,
        longitude_occupancy: resolved.occupancyLongitude,
        position_source: resolved.source as PositionSource,
        position_delta_deg: resolved.deltaDeg,
        position_disputed: resolved.disputed ? 1 : 0,
        tle_epoch: resolved.tleEpoch,
        tle_age_days: resolved.tleAgeDays,
        tle_reject_reason: resolved.tleRejectReason,
      });
    }
  });
  run();
  return stats;
}

export function formatPositionApplyStats(stats: PositionApplyStats): string {
  return [
    `GEO rows ${stats.geoRows}`,
    `TLE matched ${stats.tleMatched}`,
    `occupancy TLE-primary ${stats.tlePrimary} / UCS-fallback ${stats.ucsFallback} / unknown ${stats.unknown}`,
    `|UCS−TLE| >2° ${stats.disputedGt2} / >10° ${stats.disputedGt10}`,
    `wrap-normalized ${stats.wrapNormalized}`,
  ].join(" · ");
}
