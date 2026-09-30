// Agent slot payload.
//
// The human Slot Terminal (buildSlotTerminal) still carries valuation, congestion,
// a simulated capacity book, and comps. Agents do not see that model. This module
// builds the registry record they do see: occupancy, operator identity, FCC rows,
// disputes, and source vintage. It does not call the valuation model.

import { slots as curatedSlots, type OrbitalSlot, type SlotStatus } from "@/data/orbital-slots";
import {
  mergeWithUcs,
  getGeoSatellites,
  getGeoSatellitesByLongitude,
  getFccAuthorizationsByLongitude,
  lonToSlug,
  slugToLon,
  COLOCATION_TOLERANCE_DEG,
  type GeoSatellite,
  type FccAuthorization,
} from "./satellites";
import { isLaunchVehicleOperator, resolveOperator } from "./operator-identity";
import { summarizeOperators, type OperatorShare } from "./operator-mix";
import { ituPresence, type ItuRecorded } from "./itu-presence";
import {
  buildSlotPositionTrust,
  type DisputedOccupant,
  type PositionSource,
} from "./position-authority";
import { slotSourceVintage, type SlotSourceVintage } from "./source-vintage";
import { getDataFreshness, getLatestIngest } from "./freshness";
import { ingestAsOf } from "./provenance";
import { regionForLongitude } from "./regions";
import { isSafeSlug } from "./slot-utils";
import { buildRecordedProvenance, type RecordedProvenance } from "./slot-terminal";

export interface AgentOccupancyObservation {
  id: number;
  name: string;
  noradId: string | null;
  operator: string | null;
  operatorRaw: string | null;
  launchDate: string | null;
  tleLongitude: number | null;
  tleEpoch: string | null;
  ucsLongitude: number | null;
  deltaDeg: number | null;
  disputed: boolean;
  /** Source that supplied this object's occupancy longitude: tle, ucs fallback, or none. */
  occupancyAuthority: PositionSource;
}

export interface AgentFccAuthorization extends FccAuthorization {
  licenseeCanonical: string | null;
  licenseeRaw: string | null;
}

export type AgentDisputeKind = "tle_ucs_disagreement" | "ucs_ghost";

export interface AgentDispute {
  kind: AgentDisputeKind;
  name: string;
  noradId: string | null;
  ucsLongitude: number | null;
  tleLongitude: number | null;
  occupancyLongitude: number | null;
  deltaDeg: number | null;
  positionSource: PositionSource;
}

/** Who is in the occupancy window. Not a slot holder. */
export type OperatorIdentity = "split" | "single" | "none";

export function operatorIdentityOf(mix: OperatorShare[]): OperatorIdentity {
  if (mix.length > 1) return "split";
  if (mix.length === 1) return "single";
  return "none";
}

export interface AgentSlotPayload {
  slug: string;
  label: string;
  longitude: number;
  region: string;
  /**
   * split: more than one canonical operator in the window.
   * single: one operator in the window.
   * none: no attributed occupancy operator.
   * The names live on operatorMix, with raw source strings on each share.
   */
  operatorIdentity: OperatorIdentity;
  operatorMix: OperatorShare[];
  country: string;
  status: SlotStatus;
  ituRecorded: ItuRecorded;
  /** Existing product sentence. SNS is not ingested. */
  ituDetail: string;
  satCount: number;
  /** Slot rule: TLE when it passes the published gates, otherwise UCS. */
  occupancyAuthority: "tle-primary";
  fccAuthorizations: AgentFccAuthorization[];
  occupancy: AgentOccupancyObservation[];
  disputes: AgentDispute[];
  sourceVintage: SlotSourceVintage;
  provenance: RecordedProvenance;
}

const FORBIDDEN_AGENT_KEYS = new Set([
  "valuation",
  "congestion",
  "congestionscore",
  "bidask",
  "comps",
  "valueestimate",
  "curatedestimate",
  "fairvalue",
  "valuedisplay",
  "history",
  "rightschain",
]);

const CURATED_DOLLAR = /\$\s*\d/;

export function agentPayloadViolations(value: unknown, path = "$"): string[] {
  const out: string[] = [];
  if (Array.isArray(value)) {
    value.forEach((item, i) => out.push(...agentPayloadViolations(item, `${path}[${i}]`)));
    return out;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (FORBIDDEN_AGENT_KEYS.has(key.toLowerCase())) out.push(`${path}.${key}`);
      out.push(...agentPayloadViolations(child, `${path}.${key}`));
    }
    return out;
  }
  if (typeof value === "string" && CURATED_DOLLAR.test(value)) {
    out.push(`${path} matches a curated dollar string`);
  }
  return out;
}

function formatLon(lon: number) {
  return lon >= 0 ? `${lon}°E` : `${Math.abs(lon)}°W`;
}

function lookupSlot(slug: string, lon: number): OrbitalSlot | undefined {
  const merged = mergeWithUcs(curatedSlots);
  return (
    merged.find((s) => lonToSlug(s.longitude) === slug) ??
    merged.find((s) => Math.abs(s.longitude - lon) <= COLOCATION_TOLERANCE_DEG)
  );
}

function toObservation(sat: GeoSatellite): AgentOccupancyObservation {
  const refused = isLaunchVehicleOperator(sat.operator, sat.launchVehicle);
  const raw = sat.operator;
  return {
    id: sat.id,
    name: sat.name,
    noradId: sat.noradId,
    operator: refused || !raw ? null : resolveOperator(raw).display,
    operatorRaw: raw,
    launchDate: sat.launchDate,
    tleLongitude: sat.longitudeTle,
    tleEpoch: sat.tleEpoch,
    ucsLongitude: sat.longitudeUcs,
    deltaDeg: sat.positionDeltaDeg,
    disputed: sat.positionDisputed,
    occupancyAuthority: sat.positionSource,
  };
}

function toFcc(row: FccAuthorization): AgentFccAuthorization {
  const op = resolveOperator(row.licensee);
  return {
    ...row,
    licenseeCanonical: row.licensee ? op.display : null,
    licenseeRaw: row.licensee,
  };
}

function toDispute(kind: AgentDisputeKind, row: DisputedOccupant): AgentDispute {
  return {
    kind,
    name: row.name,
    noradId: row.noradId,
    ucsLongitude: row.ucsLongitude,
    tleLongitude: row.tleLongitude,
    occupancyLongitude: row.occupancyLongitude,
    deltaDeg: row.deltaDeg,
    positionSource: row.positionSource,
  };
}

function assemble(input: {
  slug: string;
  lon: number;
  curated: OrbitalSlot | undefined;
  sats: GeoSatellite[];
  fccAuths: FccAuthorization[];
  allSats: GeoSatellite[];
  freshness: ReturnType<typeof getDataFreshness>;
  asOf: string;
}): AgentSlotPayload {
  const { slug, lon, curated, sats, fccAuths, allSats, freshness, asOf } = input;
  const attributed = sats.map((s) => ({
    ...s,
    operator: isLaunchVehicleOperator(s.operator, s.launchVehicle) ? null : s.operator,
  }));
  const mix = summarizeOperators(attributed);
  const itu = ituPresence();
  const country = curated?.country || sats[0]?.ownerCountry || fccAuths[0]?.administration || "";
  const status: SlotStatus = curated?.status ?? (sats.length > 0 ? "active" : "filed");
  const positionTrust = buildSlotPositionTrust(lon, sats, allSats, COLOCATION_TOLERANCE_DEG);
  const sourceVintage = slotSourceVintage(sats, freshness);
  const provenance: RecordedProvenance = buildRecordedProvenance({
    satCount: sats.length,
    tlePrimaryCount: positionTrust.tlePrimaryCount,
    sourceVintage,
    freshness,
    asOf,
  });

  return {
    slug,
    label: curated?.label ?? formatLon(lon),
    longitude: lon,
    region: regionForLongitude(lon),
    operatorIdentity: operatorIdentityOf(mix),
    operatorMix: mix,
    country,
    status,
    ituRecorded: itu.ituRecorded,
    ituDetail: itu.detail,
    satCount: sats.length,
    occupancyAuthority: positionTrust.occupancyAuthority,
    fccAuthorizations: fccAuths.map(toFcc),
    occupancy: sats.map(toObservation),
    disputes: [
      ...positionTrust.disputedSatellites.map((row) => toDispute("tle_ucs_disagreement", row)),
      ...positionTrust.ucsGhosts.map((row) => toDispute("ucs_ghost", row)),
    ],
    sourceVintage,
    provenance,
  };
}

export function buildAgentSlot(slug: string): AgentSlotPayload | null {
  if (!isSafeSlug(slug)) return null;
  const lon = slugToLon(slug);
  if (lon === null) return null;

  const sats = getGeoSatellitesByLongitude(lon, COLOCATION_TOLERANCE_DEG);
  const fccAuths = getFccAuthorizationsByLongitude(lon);
  const curated = lookupSlot(slug, lon);
  if (sats.length === 0 && fccAuths.length === 0 && !curated) return null;

  const latest = getLatestIngest();
  const asOf = ingestAsOf(latest?.lastRun ?? null);
  return assemble({
    slug,
    lon,
    curated,
    sats,
    fccAuths,
    allSats: getGeoSatellites(),
    freshness: getDataFreshness(),
    asOf,
  });
}

export function listAgentSlots(): AgentSlotPayload[] {
  const merged = mergeWithUcs(curatedSlots);
  const allSats = getGeoSatellites();
  const freshness = getDataFreshness();
  const asOf = ingestAsOf(getLatestIngest()?.lastRun ?? null);
  return merged.map((slot) => {
    const slug = lonToSlug(slot.longitude);
    return assemble({
      slug,
      lon: slot.longitude,
      curated: slot,
      sats: getGeoSatellitesByLongitude(slot.longitude, COLOCATION_TOLERANCE_DEG),
      fccAuths: getFccAuthorizationsByLongitude(slot.longitude),
      allSats,
      freshness,
      asOf,
    });
  });
}
