import { getDb } from "./db";
import { lonToSlug, slugToLon, formatLon } from "./slot-utils";
import { parseUcsLaunchYear } from "./occupancy-quality";
import { subSatelliteLongitudeDeg, parseTleElements } from "./orbit";
import { circularAbsDiffDeg, withinLongitudeWindow } from "./geo-angle";
import {
  resolveOccupancyPosition,
  COLOCATION_WINDOW_DEG,
  NEIGHBORHOOD_WINDOW_DEG,
  type PositionSource,
} from "./position-authority";
import type { OrbitalSlot } from "@/data/orbital-slots";

export { lonToSlug, slugToLon, formatLon } from "./slot-utils";
export { COLOCATION_WINDOW_DEG, NEIGHBORHOOD_WINDOW_DEG } from "./position-authority";

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
  /** Occupancy longitude (TLE-primary). Not an FCC assignment or ITU filing. */
  longitudeGeo: number | null;
  /** UCS-reported GEO longitude (catalog), wrap-normalized. */
  longitudeUcs: number | null;
  /** Space-Track TLE sub-satellite longitude at the TLE epoch, if computed. */
  longitudeTle: number | null;
  positionSource: PositionSource;
  positionDeltaDeg: number | null;
  positionDisputed: boolean;
  tleEpoch: string | null;
  tleAgeDays: number | null;
  tleUsable: boolean;
  tleRejectReason: string | null;
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
         longitude_geo as longitudeUcs, launch_date as launchDate,
         expected_lifetime_years as expectedLifetimeYears,
         contractor, launch_vehicle as launchVehicle,
         cospar_id as cosparId, norad_id as noradId, comments
  FROM satellites
`;

interface RawGeoSatellite {
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
  longitudeUcs: number | null;
  launchDate: string | null;
  expectedLifetimeYears: number | null;
  contractor: string | null;
  launchVehicle: string | null;
  cosparId: string | null;
  noradId: string | null;
  comments: string | null;
}

// Tolerance constants — different contexts use different values:
// 0.4° — co-location grouping (ITU coordination practice; occupancy window)
// 0.6° — FCC authorization matching (FCC records use coarser longitude precision)
export const COLOCATION_TOLERANCE_DEG = COLOCATION_WINDOW_DEG;
export const FCC_MATCH_TOLERANCE_DEG = 0.6;

let geoCache: GeoSatellite[] | null = null;

export function clearGeoSatelliteCache(): void {
  geoCache = null;
}

interface TleJoin {
  tle1: string;
  tle2: string;
  epoch: string | null;
  ingested_at: string | null;
}

interface SatcatJoin {
  object_type: string | null;
  decay_date: string | null;
  current: string | null;
}

function tableExists(name: string): boolean {
  const db = getDb();
  if (!db) return false;
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name) as { name: string } | undefined;
  return !!row;
}

function loadTleMap(): Map<string, TleJoin> {
  const db = getDb();
  if (!db || !tableExists("spacetrack_tles")) return new Map();
  const rows = db.prepare(
    "SELECT norad_id, tle1, tle2, epoch, ingested_at FROM spacetrack_tles",
  ).all() as (TleJoin & { norad_id: string })[];
  return new Map(rows.map((r) => [r.norad_id, r]));
}

function loadSatcatMap(): Map<string, SatcatJoin> {
  const db = getDb();
  if (!db || !tableExists("spacetrack_satcat")) return new Map();
  const rows = db.prepare(
    "SELECT norad_id, object_type, decay_date, current FROM spacetrack_satcat",
  ).all() as (SatcatJoin & { norad_id: string })[];
  return new Map(rows.map((r) => [r.norad_id, { object_type: r.object_type, decay_date: r.decay_date, current: r.current }]));
}

function enrichGeoSatellite(raw: RawGeoSatellite, tles: Map<string, TleJoin>, satcat: Map<string, SatcatJoin>): GeoSatellite {
  const tle = raw.noradId ? tles.get(raw.noradId) : undefined;
  const cat = raw.noradId ? satcat.get(raw.noradId) : undefined;
  let tleLongitude: number | null = null;
  let meanMotion: number | null = null;
  let eccentricity: number | null = null;
  if (tle) {
    tleLongitude = subSatelliteLongitudeDeg(tle.tle1, tle.tle2);
    const el = parseTleElements(tle.tle2);
    meanMotion = el.meanMotionRevPerDay;
    eccentricity = el.eccentricity;
  }
  const pos = resolveOccupancyPosition({
    ucsLongitude: raw.longitudeUcs,
    tleLongitude,
    tleEpoch: tle?.epoch ?? null,
    tleIngestedAt: tle?.ingested_at ?? null,
    tleMeanMotion: meanMotion,
    tleEccentricity: eccentricity,
    objectType: cat?.object_type ?? null,
    decayDate: cat?.decay_date ?? null,
    current: cat?.current ?? null,
  });
  return {
    ...raw,
    longitudeUcs: pos.ucsLongitude,
    longitudeTle: pos.tleLongitude,
    longitudeGeo: pos.occupancyLongitude,
    positionSource: pos.source,
    positionDeltaDeg: pos.deltaDeg,
    positionDisputed: pos.disputed,
    tleEpoch: pos.tleEpoch,
    tleAgeDays: pos.tleAgeDays,
    tleUsable: pos.tleUsable,
    tleRejectReason: pos.tleRejectReason,
  };
}

export function getGeoSatellites(): GeoSatellite[] {
  if (geoCache) return geoCache;
  const db = getDb();
  if (!db) return [];
  const raw = db.prepare(`${GEO_SELECT} WHERE orbit_class = 'GEO'`).all() as RawGeoSatellite[];
  const tles = loadTleMap();
  const satcat = loadSatcatMap();
  const enriched = raw.map((r) => enrichGeoSatellite(r, tles, satcat));
  enriched.sort((a, b) => (a.longitudeGeo ?? 999) - (b.longitudeGeo ?? 999));
  geoCache = enriched;
  return enriched;
}

export function getGeoSatellitesByLongitude(lon: number, toleranceDeg = COLOCATION_TOLERANCE_DEG): GeoSatellite[] {
  return getGeoSatellites()
    .filter((s) => s.longitudeGeo !== null && withinLongitudeWindow(s.longitudeGeo, lon, toleranceDeg))
    .sort((a, b) => (a.longitudeGeo ?? 0) - (b.longitudeGeo ?? 0));
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
  return getGeoSatellites()
    .filter((s): s is GeoSatellite & { longitudeGeo: number } => s.longitudeGeo !== null)
    .map((s) => ({
      longitudeGeo: s.longitudeGeo,
      label: formatLon(s.longitudeGeo),
      operator: s.operator ?? "",
      ownerCountry: s.ownerCountry ?? "",
      purpose: s.purpose,
    }));
}

export function getAllGeoSlugs(): string[] {
  const seen = new Set<string>();
  for (const sat of getGeoSatellites()) {
    if (sat.longitudeGeo !== null) seen.add(lonToSlug(sat.longitudeGeo));
  }
  return [...seen];
}

// Every slug that should have a working detail page. Deliberately additive
// on top of getAllGeoSlugs() rather than derived from mergeWithUcs()'s own
// slug set: a UCS satellite within 0.4° of a curated slot is absorbed into
// that slot's row in the merged registry (by design — see /orbital/faq), so
// its own raw-longitude slug (e.g. a satellite at 19.3° near curated 19.2°E)
// doesn't appear as a separate merged row. getAllGeoSlugs() still generates
// a page for it. Rederiving from mergeWithUcs() here would silently drop
// those pages; this only adds the FCC-only positions that have no page at
// all today.
export function getAllRegistrySlugs(curatedSlots: OrbitalSlot[]): string[] {
  const base = getAllGeoSlugs();
  const fccOnly = mergeWithUcs(curatedSlots)
    .filter((s) => s.source === "fcc")
    .map((s) => lonToSlug(s.longitude));
  return [...new Set([...base, ...fccOnly])];
}

export function getSatellitesBySlug(slug: string): GeoSatellite[] {
  const lon = slugToLon(slug);
  if (lon === null) return [];
  return getGeoSatellitesByLongitude(lon, COLOCATION_TOLERANCE_DEG);
}

export function getNearbySlots(
  lon: number,
  count = 4,
  minSeparationDeg = 0,
): { slug: string; label: string; lon: number }[] {
  // Group occupancy longitudes (TLE-primary) rather than raw UCS catalog
  // values, and skip the occupancy window so comps are not overlapping
  // views of the same co-located fleet.
  const bySlug = new Map<string, number>();
  for (const sat of getGeoSatellites()) {
    if (sat.longitudeGeo === null) continue;
    const slug = lonToSlug(sat.longitudeGeo);
    if (!bySlug.has(slug)) bySlug.set(slug, sat.longitudeGeo);
  }

  const ranked = [...bySlug.entries()]
    .map(([slug, occLon]) => ({ slug, occLon, d: circularAbsDiffDeg(occLon, lon) }))
    .filter((r) => r.d > 0)
    .sort((a, b) => a.d - b.d);

  const result: { slug: string; label: string; lon: number }[] = [];
  const seen = new Set<string>();
  for (const row of ranked) {
    if (minSeparationDeg > 0 && row.d <= minSeparationDeg) continue;
    if (seen.has(row.slug)) continue;
    seen.add(row.slug);
    const displayLon = slugToLon(row.slug) ?? row.occLon;
    result.push({ slug: row.slug, label: formatLon(displayLon), lon: displayLon });
    if (result.length >= count) break;
  }
  return result;
}

export type CongestionTier = "sparse" | "low" | "moderate" | "high" | "critical";

export interface CongestionFactors {
  coLocated: number;          // satellites within ±0.4° (direct co-location)
  neighborhood: number;       // satellites within ±2° (arc density)
  distinctOperators: number;  // distinct operators in the ±2° neighborhood
  dominantOperator: string | null;
  dominantShare: number;      // 0..1, share of the dominant operator in the neighborhood
}

export interface CongestionData {
  density: number;            // neighborhood count (back-compat alias of factors.neighborhood)
  score: number;              // normalized 0..100 congestion/coordination-risk score
  tier: CongestionTier;
  label: string;
  factors: CongestionFactors;
}

const EMPTY_CONGESTION: CongestionData = {
  density: 0,
  score: 0,
  tier: "sparse",
  label: "Sparse",
  factors: { coLocated: 0, neighborhood: 0, distinctOperators: 0, dominantOperator: null, dominantShare: 0 },
};

function tierForScore(score: number): { tier: CongestionTier; label: string } {
  if (score < 15) return { tier: "sparse", label: "Sparse" };
  if (score < 35) return { tier: "low", label: "Low" };
  if (score < 55) return { tier: "moderate", label: "Moderate" };
  if (score < 75) return { tier: "high", label: "High" };
  return { tier: "critical", label: "Critical" };
}

// Normalized congestion score blending three signals at a longitude:
//   density (±2° arc occupancy), co-location (±0.4° direct neighbors), and
//   contention (how many distinct operators share the arc). Positions are
//   TLE-primary occupancy longitudes (UCS fallback when no usable TLE).
//   A position packed by a single operator scores lower on contention than
//   an equally dense arc contested by many operators — the latter carries
//   more coordination risk.
//
// Excludes satellites Space-Track has confirmed decayed (spacetrack_satcat.
// decay_date). GEO objects essentially never decay in the atmospheric-drag
// sense — this mainly guards against counting a satellite Clarke's own
// second source already knows is gone, rather than trusting the UCS row
// forever. It intentionally does NOT try to detect graveyard-orbit
// retirement (satellites boosted above GEO but still catalogued): normal
// station-keeping and deliberate inclined-orbit operation produce
// apogee/perigee/inclination variation in the same range as a graveyard
// raise, so a naive altitude threshold would misclassify active fleet
// (e.g. operators running inclined-orbit satellites near end of life) as
// retired. That needs a more careful signal than this query provides.
export function getCongestion(lon: number): CongestionData {
  if (!getDb()) return EMPTY_CONGESTION;
  const decayed = getDecayedNoradIds();
  const rows = getGeoSatellites().filter((s) => {
    if (s.longitudeGeo === null) return false;
    if (s.noradId && decayed.has(s.noradId)) return false;
    return withinLongitudeWindow(s.longitudeGeo, lon, NEIGHBORHOOD_WINDOW_DEG);
  });

  const neighborhood = rows.length;
  const coLocated = rows.filter((r) => withinLongitudeWindow(r.longitudeGeo!, lon, COLOCATION_TOLERANCE_DEG)).length;

  const opCounts = new Map<string, number>();
  for (const r of rows) {
    const op = (r.operator ?? "").trim();
    if (op) opCounts.set(op, (opCounts.get(op) ?? 0) + 1);
  }
  const distinctOperators = opCounts.size;
  let dominantOperator: string | null = null;
  let dominantCount = 0;
  for (const [op, n] of opCounts) {
    if (n > dominantCount) { dominantCount = n; dominantOperator = op; }
  }
  const attributed = [...opCounts.values()].reduce((a, b) => a + b, 0);
  const dominantShare = attributed > 0 ? dominantCount / attributed : 0;

  const densityScore = Math.min(neighborhood / 20, 1) * 50;
  const coLocationScore = Math.min(coLocated / 6, 1) * 30;
  const contentionScore = Math.min(distinctOperators / 8, 1) * 20;
  const score = Math.round(densityScore + coLocationScore + contentionScore);

  const { tier, label } = tierForScore(score);

  return {
    density: neighborhood,
    score,
    tier,
    label,
    factors: { coLocated, neighborhood, distinctOperators, dominantOperator, dominantShare },
  };
}

// Normalized 0..100 congestion score per slot slug, consistent with
// getCongestion().score. Used by the orbital listing to color positions.
export function getAllCongestionScores(): Record<string, number> {
  const positions = new Set<number>();
  for (const sat of getGeoSatellites()) {
    if (sat.longitudeGeo !== null) positions.add(Math.round(sat.longitudeGeo * 10) / 10);
  }
  const result: Record<string, number> = {};
  for (const lon of positions) {
    result[lonToSlug(lon)] = getCongestion(lon).score;
  }
  return result;
}

export interface ConstellationRegime {
  regime: string; // LEO | MEO | ELLIPTICAL
  count: number;
}

export interface ConstellationPresence {
  total: number;
  regimes: ConstellationRegime[];
  operators: string[];
  topPurpose: string | null;
}

// Non-GEO ("constellation") satellite presence for a company, matched by
// company-name word boundary against the operator field. Descriptive coverage
// only — constellations are capacity assets, not priced GEO positions, so this
// deliberately carries no valuation.
export function getConstellationPresence(companyName: string): ConstellationPresence | null {
  const db = getDb();
  if (!db) return null;
  const clean = companyName.toLowerCase().replace(/\s*\(.*?\)/g, "").trim();
  if (!clean) return null;

  const candidates = db.prepare(
    "SELECT operator, UPPER(orbit_class) as regime, purpose FROM satellites WHERE orbit_class != 'GEO' AND operator IS NOT NULL AND LOWER(operator) LIKE ?"
  ).all(`%${clean}%`) as { operator: string; regime: string; purpose: string | null }[];

  const re = new RegExp(`\\b${clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
  const matched = candidates.filter((r) => re.test(r.operator));
  if (matched.length === 0) return null;

  const byRegime = new Map<string, number>();
  const purposeCounts = new Map<string, number>();
  const ops = new Set<string>();
  for (const r of matched) {
    byRegime.set(r.regime, (byRegime.get(r.regime) ?? 0) + 1);
    ops.add(r.operator);
    if (r.purpose) purposeCounts.set(r.purpose, (purposeCounts.get(r.purpose) ?? 0) + 1);
  }

  return {
    total: matched.length,
    regimes: [...byRegime.entries()].map(([regime, count]) => ({ regime, count })).sort((a, b) => b.count - a.count),
    operators: [...ops],
    topPurpose: [...purposeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
  };
}

export interface OperatorPosition {
  slug: string;
  label: string;
  lon: number;
  satelliteCount: number;
  names: string[];
}

export function getOperatorGeoPositions(operatorNames: string[]): OperatorPosition[] {
  if (operatorNames.length === 0) return [];
  const wanted = new Set(operatorNames);
  const bySlug = new Map<string, OperatorPosition>();
  for (const sat of getGeoSatellites()) {
    if (sat.longitudeGeo === null || !sat.operator || !wanted.has(sat.operator)) continue;
    const slug = lonToSlug(sat.longitudeGeo);
    if (!bySlug.has(slug)) {
      bySlug.set(slug, { slug, label: formatLon(sat.longitudeGeo), lon: sat.longitudeGeo, satelliteCount: 0, names: [] });
    }
    const pos = bySlug.get(slug)!;
    pos.satelliteCount++;
    if (pos.names.length < 3) pos.names.push(sat.name);
  }
  return [...bySlug.values()].sort((a, b) => a.lon - b.lon);
}

// NORAD IDs Space-Track has confirmed decayed (spacetrack_satcat.decay_date
// set). See the note on getCongestion() — this catches confirmed reentry,
// not graveyard-orbit retirement, which isn't reliably detectable from this
// data without misclassifying active inclined-orbit fleet.
function getDecayedNoradIds(): Set<string> {
  const db = getDb();
  if (!db) return new Set();
  const rows = db.prepare(
    "SELECT norad_id FROM spacetrack_satcat WHERE decay_date IS NOT NULL"
  ).all() as { norad_id: string }[];
  return new Set(rows.map((r) => r.norad_id));
}

function ucsToSlot(sat: GeoSatellite, decayedNoradIds: Set<string>): OrbitalSlot {
  const lon = sat.longitudeGeo ?? 0;
  const launchYear = parseUcsLaunchYear(sat.launchDate) ?? undefined;
  return {
    id: sat.noradId ? `ucs_${sat.noradId}` : sat.cosparId ? `ucs_${sat.cosparId.replace(/[^a-z0-9]/gi, "_")}` : `ucs_geo_${String(lon).replace(".", "_")}`,
    longitude: lon,
    label: formatLon(lon),
    operator: sat.operator ?? "",
    country: sat.ownerCountry ?? "",
    bands: [],
    status: sat.noradId && decayedNoradIds.has(sat.noradId) ? "inactive" : "active",
    satellite: sat.name,
    coverage: [],
    valueEstimate: "",
    description: [
      sat.purpose && sat.detailedPurpose ? `${sat.purpose}: ${sat.detailedPurpose}.` : sat.purpose ?? "",
      sat.operator ? `Operated by ${sat.operator}.` : "",
      sat.launchVehicle ? `Launched on ${sat.launchVehicle}.` : "",
      sat.comments ?? "",
    ].filter(Boolean).join(" "),
    launched: launchYear,
    source: "ucs",
    purpose: sat.purpose ?? undefined,
    cosparIds: sat.cosparId ? [sat.cosparId] : [],
    noradIds: sat.noradId ? [sat.noradId] : [],
    users: sat.users ?? undefined,
  };
}

export function mergeWithUcs(curatedSlots: OrbitalSlot[]): OrbitalSlot[] {
  const ucs = getGeoSatellites();
  if (ucs.length === 0) return curatedSlots.map((s) => ({ ...s, source: "curated" as const }));

  const TOLERANCE = COLOCATION_TOLERANCE_DEG;

  const enriched = curatedSlots.map((slot) => {
    const nearby = ucs.filter(
      (s) => s.longitudeGeo !== null && withinLongitudeWindow(s.longitudeGeo, slot.longitude, TOLERANCE)
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
  const decayedNoradIds = getDecayedNoradIds();
  const ucsDerived = ucs
    .filter((s) => s.longitudeGeo !== null && !curatedLons.some((lon) => withinLongitudeWindow(lon, s.longitudeGeo!, TOLERANCE)))
    .map((s) => ucsToSlot(s, decayedNoradIds));

  // FCC-authorized positions with no UCS satellite and no curated slot nearby
  // would otherwise have zero representation in the registry: no row, no
  // congestion score, no valuation — despite being a real, government-issued
  // authorization. Synthesize a minimal placeholder so they're findable.
  const ucsLons = ucs.filter((s) => s.longitudeGeo !== null).map((s) => s.longitudeGeo!);
  const allLons = [...curatedLons, ...ucsLons];
  const fccDerived = fccOnlySlots(allLons, TOLERANCE);

  return [...enriched, ...ucsDerived, ...fccDerived].sort((a, b) => a.longitude - b.longitude);
}

// Groups FCC authorizations by ~0.1°-rounded longitude, keeping only groups
// with no UCS satellite or curated slot within TOLERANCE, and synthesizes one
// placeholder OrbitalSlot per group.
function fccOnlySlots(coveredLons: number[], toleranceDeg: number): OrbitalSlot[] {
  const auths = getAllFccAuthorizations().filter((a) => a.longitudeGeo !== null);
  if (auths.length === 0) return [];

  const byLon = new Map<string, { lon: number; auths: FccAuthorization[] }>();
  for (const a of auths) {
    const lon = Math.round(a.longitudeGeo! * 10) / 10;
    const key = lonToSlug(lon);
    const group = byLon.get(key);
    if (group) group.auths.push(a);
    else byLon.set(key, { lon, auths: [a] });
  }

  const slots: OrbitalSlot[] = [];
  for (const { lon, auths: group } of byLon.values()) {
    if (coveredLons.some((c) => withinLongitudeWindow(c, lon, toleranceDeg))) continue;
    const primary = group[0];
    const callSigns = group.map((a) => a.callSign).filter(Boolean).join(", ");
    slots.push({
      id: `fcc_${lonToSlug(lon)}`,
      longitude: lon,
      label: formatLon(lon),
      operator: primary.licensee ?? "",
      country: primary.administration ?? "",
      bands: [],
      status: "filed",
      coverage: [],
      valueEstimate: "",
      description: [
        `FCC-authorized position with no UCS-tracked satellite in orbit here yet.`,
        group.length > 1 ? `${group.length} authorizations: ${callSigns}.` : callSigns ? `Authorization: ${callSigns}.` : "",
      ].filter(Boolean).join(" "),
      source: "fcc",
      cosparIds: [],
      noradIds: [],
    });
  }
  return slots;
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

export function getFccAuthorizationsByLongitude(lon: number, toleranceDeg = FCC_MATCH_TOLERANCE_DEG): FccAuthorization[] {
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
  return getGeoSatellites()
    .map((s) => s.longitudeGeo)
    .filter((lon): lon is number => lon !== null);
}

export function getGeoPositionCount(): number {
  const seen = new Set<string>();
  for (const lon of getGeoLongitudes()) seen.add(lonToSlug(lon));
  return seen.size;
}
