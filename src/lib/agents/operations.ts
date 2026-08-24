import { slots as curatedSlots, type OrbitalSlot } from "../../data/orbital-slots";
import {
  mergeWithUcs,
  getGeoSatellites,
  getGeoSatellitesByLongitude,
  getFccAuthorizationsByLongitude,
  getCongestion,
  lonToSlug,
  slugToLon,
  type GeoSatellite,
  type FccAuthorization,
} from "../satellites";
import { valuateSlot, type SlotValuation } from "../valuation";
import { getDataFreshness } from "../freshness";
import type { FreshnessMeta } from "./envelope";

// All operations are pure read-only views over local data + SQLite.
// Shared by HTTP routes and the MCP server so they stay in sync.

// Slug validation — only lowercase letters, digits, and hyphens. Prevents
// path traversal and limits surface area to the shape produced by lonToSlug
// and src/data/orbital-slots.ts.
const SAFE_SLUG = /^[a-z0-9-]+$/;

export function isSafeSlug(slug: string): boolean {
  return SAFE_SLUG.test(slug);
}

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
}

export function listSlots(): SlotListItem[] {
  return mergeWithUcs(curatedSlots).map((slot) => {
    const congestion = getCongestion(slot.longitude);
    return {
      ...slot,
      slug: lonToSlug(slot.longitude),
      congestionScore: congestion.score,
      valuation: valuateSlot(slot, congestion),
    };
  });
}

export interface SlotDossier {
  slot: OrbitalSlot;
  satellites: GeoSatellite[];
  fccAuthorizations: FccAuthorization[];
  congestion: ReturnType<typeof getCongestion>;
  valuation: SlotValuation;
}

export function getSlotDossier(slug: string): SlotDossier | null {
  if (!isSafeSlug(slug)) return null;
  const merged = mergeWithUcs(curatedSlots);
  const slot = merged.find((s) => lonToSlug(s.longitude) === slug);
  if (!slot) return null;
  const satellites = getGeoSatellitesByLongitude(slot.longitude);
  const fccAuthorizations = getFccAuthorizationsByLongitude(slot.longitude);
  const congestion = getCongestion(slot.longitude);
  const valuation = valuateSlot(slot, congestion);
  return { slot, satellites, fccAuthorizations, congestion, valuation };
}

// Adapter: data freshness in the snake_case shape used by the API envelope meta.
export function freshnessMeta(): FreshnessMeta[] {
  return getDataFreshness().map((f) => ({
    source: f.source,
    last_run: f.lastRun,
    row_count: f.rowCount,
    age_days: f.ageDays,
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
    const needle = q.operator.toLowerCase();
    out = out.filter((s) => (s.operator ?? "").toLowerCase().includes(needle));
  }
  if (q.ownerCountry) {
    const needle = q.ownerCountry.toLowerCase();
    out = out.filter((s) => (s.ownerCountry ?? "").toLowerCase().includes(needle));
  }
  if (q.limit && q.limit > 0) out = out.slice(0, Math.min(q.limit, 1000));
  return out;
}

export { lonToSlug, slugToLon };
