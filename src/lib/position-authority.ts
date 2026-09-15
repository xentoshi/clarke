import { circularAbsDiffDeg, normalizeLonDeg, parseUtcDate, daysBetweenUtc } from "./geo-angle";

// Position authority for GEO occupancy clustering.
//
// Rules (see docs/DATA_TRUST.md):
//   1. Prefer Space-Track / Clarke TLE-derived sub-satellite longitude when
//      the TLE was fresh at ingest and passes GEO-payload quality gates.
//   2. Fall back to the UCS-reported longitude when no usable TLE exists.
//   3. Record both longitudes, the circular Δ, and which source occupancy used.
//   4. Never invent a position (no interpolation, no 0° pile-up).
//   5. TLE longitude is a tracked-object location, never an FCC assignment
//      or ITU filing location.
//
// Occupancy / congestion / comps / valuation v0 consume occupancyLongitude
// inside COLOCATION_WINDOW_DEG (±0.4°, ITU co-location practice). FCC matching
// stays on the authorization's own longitude.

export const COLOCATION_WINDOW_DEG = 0.4;
export const NEIGHBORHOOD_WINDOW_DEG = 2;
export const POSITION_DISPUTE_DEG = 2;
export const MAX_TLE_AGE_AT_INGEST_DAYS = 30;
export const MAX_TLE_ECCENTRICITY = 0.01;
export const MIN_TLE_MEAN_MOTION = 0.99;
export const MAX_TLE_MEAN_MOTION = 1.01;

export type PositionSource = "tle" | "ucs" | "none";

const REJECT_OBJECT_TYPES = new Set(["DEBRIS", "ROCKET BODY", "UNKNOWN"]);

export interface PositionAuthorityInput {
  ucsLongitude: number | null;
  tleLongitude: number | null;
  tleEpoch: string | null;
  tleIngestedAt?: string | null;
  tleMeanMotion?: number | null;
  tleEccentricity?: number | null;
  objectType?: string | null;
  decayDate?: string | null;
  current?: string | null;
  /** Wall-clock / page as-of, used only to *display* TLE age. */
  asOf?: Date;
}

export interface OccupancyPosition {
  occupancyLongitude: number | null;
  source: PositionSource;
  ucsLongitude: number | null;
  tleLongitude: number | null;
  deltaDeg: number | null;
  disputed: boolean;
  tleEpoch: string | null;
  tleAgeDays: number | null;
  tleUsable: boolean;
  tleRejectReason: string | null;
}

export function resolveOccupancyPosition(input: PositionAuthorityInput): OccupancyPosition {
  const ucsLongitude = finiteLon(input.ucsLongitude);
  const tleLongitude = finiteLon(input.tleLongitude);
  const asOf = input.asOf ?? new Date();
  const tleEpochDate = parseUtcDate(input.tleEpoch);
  const tleAgeDays = tleEpochDate ? daysBetweenUtc(tleEpochDate, asOf) : null;

  const { usable: tleUsable, reason: tleRejectReason } = tleQuality(input, tleLongitude);

  let occupancyLongitude: number | null = null;
  let source: PositionSource = "none";
  if (tleUsable && tleLongitude !== null) {
    occupancyLongitude = tleLongitude;
    source = "tle";
  } else if (ucsUsableAsFallback(ucsLongitude)) {
    occupancyLongitude = ucsLongitude;
    source = "ucs";
  }

  const deltaDeg =
    ucsLongitude !== null && tleLongitude !== null
      ? round2(circularAbsDiffDeg(ucsLongitude, tleLongitude))
      : null;
  const disputed = deltaDeg !== null && deltaDeg > POSITION_DISPUTE_DEG;

  return {
    occupancyLongitude,
    source,
    ucsLongitude,
    tleLongitude,
    deltaDeg,
    disputed,
    tleEpoch: input.tleEpoch ?? null,
    tleAgeDays,
    tleUsable,
    tleRejectReason,
  };
}

function tleQuality(
  input: PositionAuthorityInput,
  tleLongitude: number | null,
): { usable: boolean; reason: string | null } {
  if (tleLongitude === null) return { usable: false, reason: "no_tle_longitude" };
  if (input.decayDate && input.decayDate.trim()) return { usable: false, reason: "decayed" };
  if (input.current && input.current.trim().toUpperCase() === "N") {
    return { usable: false, reason: "satcat_not_current" };
  }
  const objectType = (input.objectType ?? "").trim().toUpperCase();
  if (objectType && REJECT_OBJECT_TYPES.has(objectType)) {
    return { usable: false, reason: `object_type_${objectType.toLowerCase().replace(/\s+/g, "_")}` };
  }

  const ingestAt = parseUtcDate(input.tleIngestedAt ?? null);
  const epoch = parseUtcDate(input.tleEpoch);
  if (!epoch) return { usable: false, reason: "missing_tle_epoch" };
  const freshnessAnchor = ingestAt ?? epoch;
  const ageAtIngest = daysBetweenUtc(epoch, freshnessAnchor);
  if (ageAtIngest > MAX_TLE_AGE_AT_INGEST_DAYS) {
    return { usable: false, reason: "tle_stale_at_ingest" };
  }

  if (input.tleEccentricity != null && input.tleEccentricity > MAX_TLE_ECCENTRICITY) {
    return { usable: false, reason: "eccentricity" };
  }
  if (
    input.tleMeanMotion != null &&
    (input.tleMeanMotion < MIN_TLE_MEAN_MOTION || input.tleMeanMotion > MAX_TLE_MEAN_MOTION)
  ) {
    return { usable: false, reason: "mean_motion" };
  }
  return { usable: true, reason: null };
}

// UCS reports longitude_geo = 0 for many classified / undisclosed GEO payloads
// rather than leaving it blank. That is not evidence the bird is at 0°E, so it
// is not a usable occupancy fallback. A usable TLE that independently places
// the object at ~0° still wins via the TLE-primary branch.
function ucsUsableAsFallback(ucsLongitude: number | null): boolean {
  if (ucsLongitude === null) return false;
  if (ucsLongitude === 0) return false;
  return true;
}

function finiteLon(lon: number | null | undefined): number | null {
  if (lon === null || lon === undefined) return null;
  if (!Number.isFinite(lon)) return null;
  return normalizeLonDeg(lon);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface PositionTagged {
  name: string;
  noradId: string | null;
  longitudeUcs: number | null;
  longitudeTle: number | null;
  longitudeGeo: number | null;
  positionSource: PositionSource;
  positionDeltaDeg: number | null;
  positionDisputed: boolean;
}

export interface DisputedOccupant {
  name: string;
  noradId: string | null;
  ucsLongitude: number | null;
  tleLongitude: number | null;
  occupancyLongitude: number | null;
  deltaDeg: number | null;
  positionSource: PositionSource;
}

export interface SlotPositionTrust {
  occupancyAuthority: "tle-primary";
  windowDeg: number;
  disputeThresholdDeg: number;
  tlePrimaryCount: number;
  ucsFallbackCount: number;
  unknownCount: number;
  disputedCount: number;
  disputedSatellites: DisputedOccupant[];
  /** UCS still lists these inside the window; occupancy longitude is elsewhere. */
  ucsGhosts: DisputedOccupant[];
}

export function buildSlotPositionTrust(
  slotLongitude: number,
  windowSats: PositionTagged[],
  allSats: PositionTagged[],
  windowDeg = COLOCATION_WINDOW_DEG,
): SlotPositionTrust {
  const inWindow = (lon: number | null) =>
    lon !== null && circularAbsDiffDeg(lon, slotLongitude) <= windowDeg;

  const disputedSatellites = windowSats
    .filter((s) => s.positionDisputed)
    .map(toDisputed);

  const ucsGhosts = allSats
    .filter((s) => inWindow(s.longitudeUcs) && !inWindow(s.longitudeGeo))
    .map(toDisputed);

  return {
    occupancyAuthority: "tle-primary",
    windowDeg,
    disputeThresholdDeg: POSITION_DISPUTE_DEG,
    tlePrimaryCount: windowSats.filter((s) => s.positionSource === "tle").length,
    ucsFallbackCount: windowSats.filter((s) => s.positionSource === "ucs").length,
    unknownCount: windowSats.filter((s) => s.positionSource === "none").length,
    disputedCount: disputedSatellites.length,
    disputedSatellites,
    ucsGhosts,
  };
}

function toDisputed(s: PositionTagged): DisputedOccupant {
  return {
    name: s.name,
    noradId: s.noradId,
    ucsLongitude: s.longitudeUcs,
    tleLongitude: s.longitudeTle,
    occupancyLongitude: s.longitudeGeo,
    deltaDeg: s.positionDeltaDeg,
    positionSource: s.positionSource,
  };
}
