import { slots as curatedSlots, type OrbitalSlot } from "../../data/orbital-slots";
import {
  mergeWithUcs,
  getGeoSatellites,
  getGeoSatellitesByLongitude,
  getFccAuthorizationsByLongitude,
  getFccSlugSet,
  getCongestion,
  lonToSlug,
  slugToLon,
  COLOCATION_TOLERANCE_DEG,
  type GeoSatellite,
  type FccAuthorization,
} from "../satellites";
import { valuateSlot, type SlotValuation } from "../valuation";
import { getDataFreshness } from "../freshness";
import type { FreshnessMeta } from "./envelope";
import { isSafeSlug } from "../slot-utils";
import { buildSlotPositionTrust, type SlotPositionTrust } from "../position-authority";
import { slotSourceVintage, type SlotSourceVintage } from "../source-vintage";
import { isLaunchVehicleOperator, resolveOperator, operatorMatchesQuery } from "../operator-identity";
import { ituPresence, ITU_RECORDED_DEFAULT, type ItuRecorded } from "../itu-presence";

export { isSafeSlug };

// All operations are pure read-only views over local data + SQLite.
// Shared by HTTP routes and the MCP server so they stay in sync.

// -------- Slots --------

// Additive enrichment: all original OrbitalSlot fields stay at the top level
// (so existing /slots consumers keep working), with congestion + valuation added.
export interface SlotListItem extends OrbitalSlot {
  // The path segment GET /api/v1/agents/slots/{slug} expects. Explicit
  // because it does not match `id` (e.g. id "19_2e" vs slug "19-2e", or
  // id "ucs_26052" vs slug "179-8w") — without this a caller has no way to
  // construct a valid detail URL from the list response alone.
  slug: string;
  congestionScore: number;
  valuation: SlotValuation;
  /** Product flag. SNS is not ingested. */
  ituRecorded: ItuRecorded;
}

export function listSlots(): SlotListItem[] {
  const fccSet = getFccSlugSet();
  return mergeWithUcs(curatedSlots).map((slot) => {
    const congestion = getCongestion(slot.longitude);
    const slug = lonToSlug(slot.longitude);
    const satellites = getGeoSatellitesByLongitude(slot.longitude, COLOCATION_TOLERANCE_DEG);
    return {
      ...slot,
      slug,
      congestionScore: congestion.score,
      valuation: valuateSlot(slot, congestion, {
        satellites,
        fccLicensed: fccSet.has(slug),
        satCount: satellites.length || congestion.factors.coLocated,
      }),
      ituRecorded: ITU_RECORDED_DEFAULT,
    };
  });
}

export interface SlotDossier {
  slot: OrbitalSlot;
  satellites: Array<GeoSatellite & { operatorCanonical: string; operatorRaw: string | null; aliases: string[] }>;
  fccAuthorizations: Array<FccAuthorization & { licenseeCanonical: string | null; licenseeRaw: string | null }>;
  congestion: ReturnType<typeof getCongestion>;
  valuation: SlotValuation;
  positionTrust: SlotPositionTrust;
  sourceVintage: SlotSourceVintage;
  ituRecorded: ItuRecorded;
}

export function getSlotDossier(slug: string): SlotDossier | null {
  if (!isSafeSlug(slug)) return null;
  const merged = mergeWithUcs(curatedSlots);
  const slot = merged.find((s) => lonToSlug(s.longitude) === slug);
  if (!slot) return null;
  const satellites = getGeoSatellitesByLongitude(slot.longitude, COLOCATION_TOLERANCE_DEG);
  const fccAuthorizations = getFccAuthorizationsByLongitude(slot.longitude);
  const congestion = getCongestion(slot.longitude);
  const valuation = valuateSlot(slot, congestion, {
    satellites,
    fccLicensed: fccAuthorizations.length > 0,
    satCount: satellites.length || congestion.factors.coLocated,
  });
  const positionTrust = buildSlotPositionTrust(slot.longitude, satellites, getGeoSatellites(), COLOCATION_TOLERANCE_DEG);
  const sourceVintage = slotSourceVintage(satellites, getDataFreshness());
  const itu = ituPresence();
  return {
    slot,
    satellites: satellites.map((s) => {
      if (isLaunchVehicleOperator(s.operator, s.launchVehicle)) {
        return { ...s, operatorCanonical: "", operatorRaw: s.operator, aliases: [] as string[] };
      }
      const op = resolveOperator(s.operator);
      return { ...s, operatorCanonical: op.display, operatorRaw: s.operator, aliases: op.aliases };
    }),
    fccAuthorizations: fccAuthorizations.map((a) => {
      const op = resolveOperator(a.licensee);
      return { ...a, licenseeCanonical: a.licensee ? op.display : null, licenseeRaw: a.licensee };
    }),
    congestion,
    valuation,
    positionTrust,
    sourceVintage,
    ituRecorded: itu.ituRecorded,
  };
}

// Adapter: data freshness in the snake_case shape used by the API envelope meta.
export function freshnessMeta(): FreshnessMeta[] {
  return getDataFreshness().map((f) => ({
    source: f.source,
    last_run: f.lastRun,
    row_count: f.rowCount,
    age_days: f.ageDays,
    file_vintage: f.fileVintage,
    source_as_of: f.sourceAsOf,
    vintage_age_days: f.vintageAgeDays,
    tle_epoch_min: f.tleEpochMin,
    tle_epoch_max: f.tleEpochMax,
  }));
}

// -------- Satellites --------

export interface SatellitesQuery {
  operator?: string;
  ownerCountry?: string;
  limit?: number;
}

export function listSatellites(q: SatellitesQuery = {}): GeoSatellite[] {
  const all = getGeoSatellites();
  let out = all;
  if (q.operator) {
    out = out.filter((s) => operatorMatchesQuery(s.operator, q.operator!));
  }
  if (q.ownerCountry) {
    const needle = q.ownerCountry.toLowerCase();
    out = out.filter((s) => (s.ownerCountry ?? "").toLowerCase().includes(needle));
  }
  if (q.limit && q.limit > 0) out = out.slice(0, Math.min(q.limit, 1000));
  return out.map((s) => {
    if (isLaunchVehicleOperator(s.operator, s.launchVehicle)) {
      return { ...s, operatorCanonical: "", operatorRaw: s.operator, aliases: [] as string[] };
    }
    const op = resolveOperator(s.operator);
    return { ...s, operatorCanonical: op.display, operatorRaw: s.operator, aliases: op.aliases };
  });
}

export { lonToSlug, slugToLon };
