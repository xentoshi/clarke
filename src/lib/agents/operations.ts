import {
  getGeoSatellites,
  lonToSlug,
  slugToLon,
  type GeoSatellite,
} from "../satellites";
import { getDataFreshness } from "../freshness";
import type { FreshnessMeta } from "./envelope";
import { isSafeSlug } from "../slot-utils";
import { isLaunchVehicleOperator, resolveOperator, operatorMatchesQuery } from "../operator-identity";
import { buildAgentSlot, listAgentSlots, type AgentSlotPayload } from "../agent-slot";
import { pageDeltaChanges, type DeltaFeed, type DeltaFeedQuery } from "../delta-feed";
import { buildDeltaFeedFromDb } from "../registry-snapshot";
import { cachedRead } from "../process-cache";

export { isSafeSlug };

// All operations are pure read-only views over local data + SQLite.
// Shared by HTTP routes and the MCP server so they stay in sync.
//
// Slot tools return the agent payload (occupancy, operator, FCC, disputes,
// source vintage). Valuation and congestion stay on the human Terminal.

export type SlotListItem = AgentSlotPayload;
export type SlotDossier = AgentSlotPayload;

export function listSlots(): AgentSlotPayload[] {
  return listAgentSlots();
}

export function getSlotDossier(slug: string): AgentSlotPayload | null {
  return buildAgentSlot(slug);
}

export function listDeltas(query: DeltaFeedQuery = {}): DeltaFeed {
  const slug = query.slug ?? "";
  const domain = query.domain ?? "";
  const since = query.since ?? "";
  return cachedRead(`deltas:${slug}:${domain}:${since}`, () => pageDeltaChanges(buildDeltaFeedFromDb(), query));
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

function mappedSatellites(): GeoSatellite[] {
  return cachedRead("satellites-mapped", () => {
    return getGeoSatellites()
      .filter((s) => s.catalogSource !== "tle-supplement")
      .map((s) => {
        if (isLaunchVehicleOperator(s.operator, s.launchVehicle)) {
          return { ...s, operatorCanonical: "", operatorRaw: s.operator, aliases: [] as string[] };
        }
        const op = resolveOperator(s.operator, s.ownerCountry);
        return { ...s, operatorCanonical: op.display, operatorRaw: s.operator, aliases: op.aliases };
      });
  });
}

export function listSatellites(q: SatellitesQuery = {}): GeoSatellite[] {
  let out = mappedSatellites();
  if (q.operator) {
    out = out.filter((s) => operatorMatchesQuery(s.operator, q.operator!));
  }
  if (q.ownerCountry) {
    const needle = q.ownerCountry.toLowerCase();
    out = out.filter((s) => (s.ownerCountry ?? "").toLowerCase().includes(needle));
  }
  if (q.limit && q.limit > 0) out = out.slice(0, Math.min(q.limit, 1000));
  return out;
}

export { lonToSlug, slugToLon };
