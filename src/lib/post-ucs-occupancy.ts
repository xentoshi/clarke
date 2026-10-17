// GEO payloads launched after the UCS file vintage are missing from occupancy
// when clustering only reads the UCS catalog. Space-Track still has them.
//
// Included when all of these hold:
// - NORAD id is not already on a UCS row
// - launch date is after the UCS file vintage (latest GEO launch in that snapshot)
// - satcat object type is PAYLOAD, not decayed, and still current
// - satcat period is 1434 to 1438 minutes (station-kept GEO, about one sidereal day)
// - the stored TLE passes the same occupancy quality gates as a UCS row
//
// That station-kept band is what leaves drifting objects (period well off 1436
// minutes) out. On the current snapshot it is about 73 satellites.
// Operator is filled only from an FCC licensee whose satellite name matches.
// Country codes are not turned into operator names.

import { getDb } from "./db";
import { withinLongitudeWindow } from "./geo-angle";
import { subSatelliteLongitudeDeg, parseTleElements } from "./orbit";
import { ucsLaunchToIso } from "./occupancy-quality";
import { resolveOccupancyPosition } from "./position-authority";
import { isDodPlaceholderAuthorization } from "./fcc-placeholder";
import type { GeoSatellite } from "./satellites";

export const STATION_KEPT_PERIOD_MIN = 1434;
export const STATION_KEPT_PERIOD_MAX = 1438;
const FCC_NAME_MATCH_DEG = 0.6;

export interface PostUcsCandidate {
  noradId: string;
  launchDate: string | null;
  periodMin: number | null;
  objectType: string | null;
  decayDate: string | null;
  current: string | null;
  noradInUcs: boolean;
}

export function isStationKeptPostUcsPayload(row: PostUcsCandidate, vintageIso: string | null): boolean {
  if (!vintageIso || !/^\d{4}-\d{2}-\d{2}$/.test(vintageIso)) return false;
  if (row.noradInUcs) return false;
  if (!row.noradId.trim()) return false;
  const objectType = (row.objectType ?? "").trim().toUpperCase();
  if (objectType !== "PAYLOAD") return false;
  if ((row.decayDate ?? "").trim()) return false;
  if ((row.current ?? "").trim().toUpperCase() === "N") return false;
  const launch = (row.launchDate ?? "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(launch) || launch <= vintageIso) return false;
  if (row.periodMin == null || !Number.isFinite(row.periodMin)) return false;
  if (row.periodMin < STATION_KEPT_PERIOD_MIN || row.periodMin > STATION_KEPT_PERIOD_MAX) return false;
  return true;
}

const COUNTRY_CODES: Record<string, string> = {
  US: "USA",
  PRC: "China",
  IND: "India",
  FR: "France",
  GER: "Germany",
  JPN: "Japan",
  INDO: "Indonesia",
  SWED: "Sweden",
  PAKI: "Pakistan",
  TURK: "Turkey",
  SKOR: "South Korea",
  AUS: "Australia",
  UK: "United Kingdom",
  UAE: "United Arab Emirates",
  SPN: "Spain",
  CIS: "Russia",
  ISRA: "Israel",
  IRAN: "Iran",
  AB: "Multinational",
  EUTE: "Multinational",
  SES: "Luxembourg",
};

function ownerCountryFromCode(code: string | null): string | null {
  const key = (code ?? "").trim().toUpperCase();
  if (!key) return null;
  return COUNTRY_CODES[key] ?? key;
}

function normName(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

interface FccNameRow {
  longitudeGeo: number | null;
  satelliteName: string | null;
  licensee: string | null;
  callSign: string | null;
}

function matchFccLicensee(lon: number, name: string, auths: FccNameRow[]): string | null {
  const key = normName(name);
  if (key.length < 4) return null;
  const licensees = new Set<string>();
  for (const auth of auths) {
    if (auth.longitudeGeo === null || isDodPlaceholderAuthorization(auth)) continue;
    if (!withinLongitudeWindow(auth.longitudeGeo, lon, FCC_NAME_MATCH_DEG)) continue;
    const other = normName(auth.satelliteName ?? "");
    if (other.length < 4) continue;
    if (other.includes(key) || key.includes(other)) {
      const licensee = (auth.licensee ?? "").trim();
      if (licensee) licensees.add(licensee);
    }
  }
  return licensees.size === 1 ? [...licensees][0] : null;
}

export function ucsFileVintageIso(): string | null {
  const db = getDb();
  if (!db) return null;
  const stored = db.prepare(
    "SELECT file_vintage as vintage FROM ingest_meta WHERE source = 'UCS'",
  ).get() as { vintage: string | null } | undefined;
  const fromMeta = stored?.vintage?.slice(0, 10) ?? "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(fromMeta)) return fromMeta;
  const dates = db.prepare(
    "SELECT launch_date as launchDate FROM satellites WHERE orbit_class = 'GEO' AND launch_date IS NOT NULL",
  ).all() as { launchDate: string }[];
  let best: string | null = null;
  for (const row of dates) {
    const iso = ucsLaunchToIso(row.launchDate);
    if (iso && (!best || iso > best)) best = iso;
  }
  return best;
}

interface SupplementRow {
  norad_id: string;
  object_name: string | null;
  intldes: string | null;
  country: string | null;
  launch_date: string | null;
  period_min: number | null;
  object_type: string | null;
  decay_date: string | null;
  current: string | null;
  tle1: string;
  tle2: string;
  epoch: string | null;
  ingested_at: string | null;
}

export function loadPostUcsGeoOccupants(knownNoradIds: Set<string>): GeoSatellite[] {
  const db = getDb();
  if (!db) return [];
  const vintage = ucsFileVintageIso();
  if (!vintage) return [];

  const rows = db.prepare(`
    SELECT s.norad_id, s.object_name, s.intldes, s.country, s.launch_date, s.period_min,
           s.object_type, s.decay_date, s.current, t.tle1, t.tle2, t.epoch, t.ingested_at
    FROM spacetrack_satcat s
    JOIN spacetrack_tles t ON t.norad_id = s.norad_id
  `).all() as SupplementRow[];

  const fcc = db.prepare(`
    SELECT longitude_geo as longitudeGeo, satellite_name as satelliteName,
           licensee, call_sign as callSign
    FROM fcc_authorizations
  `).all() as FccNameRow[];

  const out: GeoSatellite[] = [];
  for (const row of rows) {
    const candidate: PostUcsCandidate = {
      noradId: row.norad_id,
      launchDate: row.launch_date,
      periodMin: row.period_min,
      objectType: row.object_type,
      decayDate: row.decay_date,
      current: row.current,
      noradInUcs: knownNoradIds.has(row.norad_id),
    };
    if (!isStationKeptPostUcsPayload(candidate, vintage)) continue;
    const tleLongitude = subSatelliteLongitudeDeg(row.tle1, row.tle2);
    const elements = parseTleElements(row.tle2);
    const pos = resolveOccupancyPosition({
      ucsLongitude: null,
      tleLongitude,
      tleEpoch: row.epoch,
      tleIngestedAt: row.ingested_at,
      tleMeanMotion: elements.meanMotionRevPerDay,
      tleEccentricity: elements.eccentricity,
      objectType: row.object_type,
      decayDate: row.decay_date,
      current: row.current,
    });
    if (pos.source !== "tle" || pos.occupancyLongitude === null) continue;
    const noradNum = Number(row.norad_id);
    if (!Number.isFinite(noradNum)) continue;
    const name = (row.object_name ?? "").trim() || `NORAD ${row.norad_id}`;
    const licensee = matchFccLicensee(pos.occupancyLongitude, name, fcc);
    out.push({
      id: -noradNum,
      name,
      officialName: name,
      ownerCountry: ownerCountryFromCode(row.country),
      operator: licensee,
      users: null,
      purpose: null,
      detailedPurpose: null,
      orbitClass: "GEO",
      orbitType: null,
      longitudeGeo: pos.occupancyLongitude,
      longitudeUcs: null,
      longitudeTle: pos.tleLongitude,
      positionSource: pos.source,
      positionDeltaDeg: pos.deltaDeg,
      positionDisputed: pos.disputed,
      tleEpoch: pos.tleEpoch,
      tleAgeDays: pos.tleAgeDays,
      tleUsable: pos.tleUsable,
      tleRejectReason: pos.tleRejectReason,
      servicing: null,
      launchDate: row.launch_date,
      expectedLifetimeYears: null,
      contractor: null,
      launchVehicle: null,
      cosparId: row.intldes,
      noradId: row.norad_id,
      comments: "Launched after the UCS file vintage. Occupancy longitude is the Space-Track TLE. The UCS catalog has no row for this object.",
      catalogSource: "tle-supplement",
    });
  }
  return out;
}
