import { getDb } from "./db";
import { lonToSlug, slugToLon, formatLon } from "./slot-utils";
import type { OrbitalSlot } from "@/data/orbital-slots";

export { lonToSlug, slugToLon, formatLon } from "./slot-utils";

export interface GeoSatellite {
  id: number;
  name: string;
  officialName: string | null;
  ownerCountry: string | null;
  operator: string | null;
  users: string | null;
  purpose: string | null;
  detailedPurpose: string | null;
  orbitClass: string;
  orbitType: string | null;
  longitudeGeo: number | null;
  launchDate: string | null;
  expectedLifetimeYears: number | null;
  contractor: string | null;
  launchVehicle: string | null;
  cosparId: string | null;
  noradId: string | null;
  comments: string | null;
}

const GEO_SELECT = `
  SELECT id, name, official_name as officialName, owner_country as ownerCountry,
         operator, users, purpose, detailed_purpose as detailedPurpose,
         orbit_class as orbitClass, orbit_type as orbitType,
         longitude_geo as longitudeGeo, launch_date as launchDate,
         expected_lifetime_years as expectedLifetimeYears,
         contractor, launch_vehicle as launchVehicle,
         cospar_id as cosparId, norad_id as noradId, comments
  FROM satellites
`;

export function getGeoSatellites(): GeoSatellite[] {
  const db = getDb();
  if (!db) return [];
  return db.prepare(`${GEO_SELECT} WHERE orbit_class = 'GEO' ORDER BY longitude_geo ASC`).all() as GeoSatellite[];
}

// Tolerance constants — different contexts use different values:
// 0.3° — tight lookup (general proximity)
// 0.4° — co-location grouping (ITU coordination practice tolerance)
// 0.6° — FCC authorization matching (FCC records use coarser longitude precision)

export function getGeoSatellitesByLongitude(lon: number, toleranceDeg = 0.3): GeoSatellite[] {
  const db = getDb();
  if (!db) return [];
  return db.prepare(
    `${GEO_SELECT} WHERE orbit_class = 'GEO' AND longitude_geo BETWEEN ? AND ? ORDER BY longitude_geo ASC`
  ).all(lon - toleranceDeg, lon + toleranceDeg) as GeoSatellite[];
}

export interface SatelliteStats {
  total: number;
  geoCount: number;
  purposeCounts: Record<string, number>;
}

export function getSatelliteStats(): SatelliteStats {
  const db = getDb();
  if (!db) return { total: 0, geoCount: 0, purposeCounts: {} };

  const { total } = db.prepare("SELECT COUNT(*) as total FROM satellites").get() as { total: number };
  const { geoCount } = db.prepare("SELECT COUNT(*) as geoCount FROM satellites WHERE orbit_class = 'GEO'").get() as { geoCount: number };

  const rows = db.prepare(
    "SELECT purpose, COUNT(*) as n FROM satellites WHERE orbit_class = 'GEO' AND purpose IS NOT NULL GROUP BY purpose ORDER BY n DESC"
  ).all() as { purpose: string; n: number }[];

  const purposeCounts: Record<string, number> = {};
  for (const row of rows) purposeCounts[row.purpose] = row.n;

  return { total, geoCount, purposeCounts };
}

export interface SlotSummary {
  longitudeGeo: number;
  label: string;
  operator: string;
  ownerCountry: string;
  purpose: string | null;
}

export function getGeoSlotSummaries(): SlotSummary[] {
  const db = getDb();
  if (!db) return [];
  const rows = db.prepare(`
    SELECT longitude_geo as longitudeGeo, operator, owner_country as ownerCountry, purpose
    FROM satellites
    WHERE orbit_class = 'GEO' AND longitude_geo IS NOT NULL
    ORDER BY longitude_geo ASC
  `).all() as { longitudeGeo: number; operator: string | null; ownerCountry: string | null; purpose: string | null }[];

  return rows.map((r) => ({
    longitudeGeo: r.longitudeGeo,
    label: formatLon(r.longitudeGeo),
    operator: r.operator ?? "",
    ownerCountry: r.ownerCountry ?? "",
    purpose: r.purpose,
  }));
}

export function getAllGeoSlugs(): string[] {
  const db = getDb();
  if (!db) return [];
  const rows = db.prepare(
    "SELECT longitude_geo FROM satellites WHERE orbit_class = 'GEO' AND longitude_geo IS NOT NULL"
  ).all() as { longitude_geo: number }[];
  const seen = new Set<string>();
  for (const row of rows) {
    seen.add(lonToSlug(row.longitude_geo));
  }
  return [...seen];
}

export function getSatellitesBySlug(slug: string): GeoSatellite[] {
  const lon = slugToLon(slug);
  if (lon === null) return [];
  return getGeoSatellitesByLongitude(lon, 0.4);
}

export function getNearbySlots(lon: number, count = 4): { slug: string; label: string; lon: number }[] {
  const db = getDb();
  if (!db) return [];
  const rows = db.prepare(`
    SELECT longitude_geo, COUNT(*) as n
    FROM satellites
    WHERE orbit_class = 'GEO' AND longitude_geo IS NOT NULL
      AND longitude_geo != ?
    GROUP BY longitude_geo
    ORDER BY ABS(longitude_geo - ?) ASC
    LIMIT ?
  `).all(lon, lon, count) as { longitude_geo: number; n: number }[];

  const seen = new Set<string>();
  const result: { slug: string; label: string; lon: number }[] = [];
  for (const row of rows) {
    const slug = lonToSlug(row.longitude_geo);
    if (!seen.has(slug)) {
      seen.add(slug);
      result.push({ slug, label: formatLon(row.longitude_geo), lon: row.longitude_geo });
    }
    if (result.length >= count) break;
  }
  return result;
}

export type CongestionTier = "sparse" | "low" | "moderate" | "high" | "critical";

export interface CongestionData {
  density: number;
  tier: CongestionTier;
  label: string;
}

export function getCongestion(lon: number): CongestionData {
  const db = getDb();
  const density = db
    ? (db.prepare("SELECT COUNT(*) as n FROM satellites WHERE orbit_class = 'GEO' AND longitude_geo BETWEEN ? AND ?")
        .get(lon - 2, lon + 2) as { n: number }).n
    : 0;

  let tier: CongestionTier;
  let label: string;
  if (density <= 2) { tier = "sparse"; label = "Sparse"; }
  else if (density <= 5) { tier = "low"; label = "Low"; }
  else if (density <= 10) { tier = "moderate"; label = "Moderate"; }
  else if (density <= 18) { tier = "high"; label = "High"; }
  else { tier = "critical"; label = "Critical"; }

  return { density, tier, label };
}

export function getAllCongestionScores(): Record<string, number> {
  const db = getDb();
  if (!db) return {};
  const positions = db.prepare(
    "SELECT DISTINCT ROUND(longitude_geo,1) as lon FROM satellites WHERE orbit_class = 'GEO' AND longitude_geo IS NOT NULL"
  ).all() as { lon: number }[];
  const stmt = db.prepare(
    "SELECT COUNT(*) as n FROM satellites WHERE orbit_class = 'GEO' AND longitude_geo BETWEEN ? AND ?"
  );
  const result: Record<string, number> = {};
  for (const { lon } of positions) {
    const { n } = stmt.get(lon - 2, lon + 2) as { n: number };
    result[lonToSlug(lon)] = n;
  }
  return result;
}

export interface OperatorPosition {
  slug: string;
  label: string;
  lon: number;
  satelliteCount: number;
  names: string[];
}

export function getOperatorGeoPositions(operatorNames: string[]): OperatorPosition[] {
  const db = getDb();
  if (!db || operatorNames.length === 0) return [];
  const placeholders = operatorNames.map(() => "?").join(",");
  const rows = db.prepare(`
    SELECT longitude_geo, operator, name
    FROM satellites
    WHERE orbit_class = 'GEO' AND longitude_geo IS NOT NULL AND operator IN (${placeholders})
    ORDER BY longitude_geo ASC
  `).all(...operatorNames) as { longitude_geo: number; operator: string; name: string }[];

  const bySlug = new Map<string, OperatorPosition>();
  for (const row of rows) {
    const slug = lonToSlug(row.longitude_geo);
    if (!bySlug.has(slug)) {
      bySlug.set(slug, { slug, label: formatLon(row.longitude_geo), lon: row.longitude_geo, satelliteCount: 0, names: [] });
    }
    const pos = bySlug.get(slug)!;
    pos.satelliteCount++;
    if (pos.names.length < 3) pos.names.push(row.name);
  }
  return [...bySlug.values()];
}

function ucsToSlot(sat: GeoSatellite): OrbitalSlot {
  const lon = sat.longitudeGeo ?? 0;
  const launchYear = sat.launchDate ? parseInt(sat.launchDate.split("/").pop() ?? "0") : undefined;
  return {
    id: sat.noradId ? `ucs_${sat.noradId}` : sat.cosparId ? `ucs_${sat.cosparId.replace(/[^a-z0-9]/gi, "_")}` : `ucs_geo_${String(lon).replace(".", "_")}`,
    longitude: lon,
    label: formatLon(lon),
    operator: sat.operator ?? "",
    country: sat.ownerCountry ?? "",
    bands: [],
    status: "active",
    satellite: sat.name,
    coverage: [],
    valueEstimate: "",
    description: [
      sat.purpose && sat.detailedPurpose ? `${sat.purpose}: ${sat.detailedPurpose}.` : sat.purpose ?? "",
      sat.operator ? `Operated by ${sat.operator}.` : "",
      sat.launchVehicle ? `Launched on ${sat.launchVehicle}.` : "",
      sat.comments ?? "",
    ].filter(Boolean).join(" "),
    launched: launchYear && !isNaN(launchYear) ? launchYear : undefined,
    source: "ucs",
    purpose: sat.purpose ?? undefined,
    cosparIds: sat.cosparId ? [sat.cosparId] : [],
    noradIds: sat.noradId ? [sat.noradId] : [],
  };
}

export function mergeWithUcs(curatedSlots: OrbitalSlot[]): OrbitalSlot[] {
  const ucs = getGeoSatellites();
  if (ucs.length === 0) return curatedSlots.map((s) => ({ ...s, source: "curated" as const }));

  const TOLERANCE = 0.4;

  const enriched = curatedSlots.map((slot) => {
    const nearby = ucs.filter(
      (s) => s.longitudeGeo !== null && Math.abs(s.longitudeGeo - slot.longitude) <= TOLERANCE
    );
    const inferredPurpose = nearby[0]?.purpose ?? "Communications";
    return {
      ...slot,
      source: "curated" as const,
      ucsCount: nearby.length,
      cosparIds: nearby.map((s) => s.cosparId).filter(Boolean) as string[],
      noradIds: nearby.map((s) => s.noradId).filter(Boolean) as string[],
      purpose: slot.purpose ?? inferredPurpose,
    };
  });

  const curatedLons = curatedSlots.map((s) => s.longitude);
  const ucsDerived = ucs
    .filter((s) => s.longitudeGeo !== null && !curatedLons.some((lon) => Math.abs(lon - s.longitudeGeo!) <= TOLERANCE))
    .map(ucsToSlot);

  return [...enriched, ...ucsDerived].sort((a, b) => a.longitude - b.longitude);
}

export interface FccAuthorization {
  id: number;
  orbitalLocation: string | null;
  longitudeGeo: number | null;
  satelliteName: string | null;
  callSign: string | null;
  licensee: string | null;
  administration: string | null;
  service: string | null;
  frequencyRange: string | null;
  dateInOrbit: string | null;
  grantStatus: string | null;
  notes: string | null;
}

const FCC_SELECT = `
  SELECT id, orbital_location as orbitalLocation, longitude_geo as longitudeGeo,
         satellite_name as satelliteName, call_sign as callSign, licensee,
         administration, service, frequency_range as frequencyRange,
         date_in_orbit as dateInOrbit, grant_status as grantStatus, notes
  FROM fcc_authorizations
`;

export function getFccAuthorizationsByLongitude(lon: number, toleranceDeg = 0.6): FccAuthorization[] {
  const db = getDb();
  if (!db) return [];
  return db.prepare(
    `${FCC_SELECT} WHERE longitude_geo BETWEEN ? AND ? ORDER BY longitude_geo ASC`
  ).all(lon - toleranceDeg, lon + toleranceDeg) as FccAuthorization[];
}

export function getAllFccAuthorizations(): FccAuthorization[] {
  const db = getDb();
  if (!db) return [];
  return db.prepare(`${FCC_SELECT} ORDER BY longitude_geo ASC`).all() as FccAuthorization[];
}

export function getFccSlugSet(): Set<string> {
  const db = getDb();
  if (!db) return new Set();
  const rows = db.prepare(
    "SELECT longitude_geo FROM fcc_authorizations WHERE longitude_geo IS NOT NULL"
  ).all() as { longitude_geo: number }[];
  const seen = new Set<string>();
  for (const row of rows) seen.add(lonToSlug(row.longitude_geo));
  return seen;
}

export function getFccCount(): number {
  const db = getDb();
  if (!db) return 0;
  return (db.prepare("SELECT COUNT(*) as n FROM fcc_authorizations").get() as { n: number }).n;
}

export function getGeoLongitudes(): number[] {
  const db = getDb();
  if (!db) return [];
  const rows = db.prepare(
    "SELECT longitude_geo FROM satellites WHERE orbit_class = 'GEO' AND longitude_geo IS NOT NULL"
  ).all() as { longitude_geo: number }[];
  return rows.map((r) => r.longitude_geo);
}

export function getGeoPositionCount(): number {
  const db = getDb();
  if (!db) return 0;
  const rows = db.prepare(
    "SELECT longitude_geo FROM satellites WHERE orbit_class = 'GEO' AND longitude_geo IS NOT NULL"
  ).all() as { longitude_geo: number }[];
  const seen = new Set(rows.map(r => lonToSlug(r.longitude_geo)));
  return seen.size;
}
