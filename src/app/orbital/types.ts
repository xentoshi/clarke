import type { Band, SlotStatus } from "@/data/orbital-slots";
import type { CongestionTier } from "@/lib/satellites";
import type { SlotValuation } from "@/lib/valuation";

// One row per orbital position, built server-side by buildExplorerRows() and
// passed to the client explorer as props. Type-only — safe to import into
// client components without pulling in server (SQLite) code.
export interface ExplorerRow {
  id: string;
  slug: string;
  longitude: number;
  label: string;
  operator: string;
  operatorRaw: string;
  country: string;
  purpose: string | null;
  status: SlotStatus;
  satCount: number;
  satelliteNames: string[];
  positionDisputedCount: number;
  ucsGhostCount: number;
  congestionScore: number;
  congestionTier: CongestionTier;
  region: string;
  fccLicensed: boolean;
  bands: Band[];
  coverage: string[];
  description: string;
  satellite?: string;
  launched?: number;
  valuation: SlotValuation;
  valueDisplay: string; // modeled v0 range (curated overlay is separate)
  biuHint: SlotValuation["license"]["biuHint"];
}

export type SortKey = "longitude" | "operator" | "status" | "satCount" | "congestionScore" | "value";
export type SortDir = "asc" | "desc";

export interface Facets {
  search: string;
  regions: string[];
  operators: string[];
  bands: Band[];
  statuses: SlotStatus[];
  congestionMin: number;
  congestionMax: number;
  fccOnly: boolean;
  /** Registry rows with a UCS/TLE disagreement inside the occupancy window. */
  disputesOnly: boolean;
  /** Inclusive occupancy-longitude window from the registry belt strip. */
  lonMin: number | null;
  lonMax: number | null;
}

export const EMPTY_FACETS: Facets = {
  search: "",
  regions: [],
  operators: [],
  bands: [],
  statuses: [],
  congestionMin: 0,
  congestionMax: 100,
  fccOnly: false,
  disputesOnly: false,
  lonMin: null,
  lonMax: null,
};
