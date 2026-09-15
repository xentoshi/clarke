import { buildSlotTerminal, type SlotTerminalModel } from "./slot-terminal";
import { withinLongitudeWindow, formatLonFixed } from "./geo-angle";
import { COLOCATION_TOLERANCE_DEG } from "./satellites";

export const GEO_SLOT_INDEX_EDITION = 1;
export const GEO_SLOT_INDEX_SLUGS = ["101w", "19-2e", "13e", "72e", "163w"] as const;
export type IndexSlug = (typeof GEO_SLOT_INDEX_SLUGS)[number];

export interface OccupancyMove {
  name: string;
  operator: string | null;
  kind: "entered" | "left";
  ucsLon: number | null;
  tleLon: number | null;
  detail: string;
}

export interface DisputeFlip {
  name: string;
  deltaDeg: number | null;
  ucsLon: number | null;
  tleLon: number | null;
}

export interface IndexFccRow {
  callSign: string | null;
  licensee: string | null;
  satelliteName: string | null;
  longitudeGeo: number | null;
}

export interface GeoSlotIndexDossier {
  slug: IndexSlug;
  label: string;
  operator: string;
  satCount: number;
  occupancyNames: string[];
  entered: OccupancyMove[];
  left: OccupancyMove[];
  disputeFlips: DisputeFlip[];
  fccRows: IndexFccRow[];
  fccNotInOccupancy: string[];
  occupancyNotInFcc: string[];
  biuHint: string;
  congestionScore: number;
  congestionLabel: string;
  paperFiling: boolean;
  tleEpochMin: string | null;
  tleEpochMax: string | null;
  fccAsOf: string | null;
  ucsFileVintage: string | null;
}

export interface GeoSlotIndexEdition {
  edition: number;
  title: string;
  dossiers: GeoSlotIndexDossier[];
  vintage: {
    ucsFileVintage: string | null;
    fccAsOf: string | null;
    tleEpochMax: string | null;
  };
}

export function buildIndexDossier(slug: IndexSlug): GeoSlotIndexDossier | null {
  const model = buildSlotTerminal(slug);
  if (!model) return null;
  return dossierFromModel(slug, model);
}

export function buildGeoSlotIndex(): GeoSlotIndexEdition {
  const dossiers = GEO_SLOT_INDEX_SLUGS.map((slug) => {
    const d = buildIndexDossier(slug);
    if (!d) throw new Error(`GEO Slot Index missing dossier for ${slug}`);
    return d;
  });
  return {
    edition: GEO_SLOT_INDEX_EDITION,
    title: "GEO Slot Index #1 — occupancy, disputes, FCC",
    dossiers,
    vintage: {
      ucsFileVintage: dossiers[0]?.ucsFileVintage ?? null,
      fccAsOf: dossiers[0]?.fccAsOf ?? null,
      tleEpochMax: dossiers.map((d) => d.tleEpochMax).filter(Boolean).sort().at(-1) ?? null,
    },
  };
}

function dossierFromModel(slug: IndexSlug, model: SlotTerminalModel): GeoSlotIndexDossier {
  const lon = model.longitude;
  const entered: OccupancyMove[] = [];
  for (const sat of model.satellites) {
    const ucsIn = sat.longitudeUcs != null && withinLongitudeWindow(sat.longitudeUcs, lon, COLOCATION_TOLERANCE_DEG);
    const tleIn = sat.longitudeTle != null && withinLongitudeWindow(sat.longitudeTle, lon, COLOCATION_TOLERANCE_DEG);
    if (tleIn && !ucsIn) {
      entered.push({
        name: sat.name,
        operator: sat.operator,
        kind: "entered",
        ucsLon: sat.longitudeUcs,
        tleLon: sat.longitudeTle,
        detail: `TLE ${sat.longitudeTle != null ? formatLonFixed(sat.longitudeTle, 1) : "—"} is in the ±0.4° window; UCS catalog ${sat.longitudeUcs != null ? formatLonFixed(sat.longitudeUcs, 1) : "—"} is not.`,
      });
    }
  }
  const left: OccupancyMove[] = model.positionTrust.ucsGhosts.map((g) => ({
    name: g.name,
    operator: null,
    kind: "left" as const,
    ucsLon: g.ucsLongitude,
    tleLon: g.occupancyLongitude,
    detail: `UCS still lists this bird at the slot; TLE occupancy places it at ${g.occupancyLongitude != null ? formatLonFixed(g.occupancyLongitude, 1) : "unknown"}.`,
  }));

  const disputeFlips: DisputeFlip[] = model.satellites
    .filter((s) => s.positionDisputed)
    .map((s) => ({
      name: s.name,
      deltaDeg: s.positionDeltaDeg,
      ucsLon: s.longitudeUcs,
      tleLon: s.longitudeTle,
    }));

  const fccRows: IndexFccRow[] = model.fccAuthorizations.map((a) => ({
    callSign: a.callSign,
    licensee: a.licensee,
    satelliteName: a.satelliteName,
    longitudeGeo: a.longitudeGeo,
  }));

  const occKeys = new Set(model.satellites.map((s) => nameKey(s.name)));
  const fccKeys = fccRows.map((r) => ({ row: r, key: nameKey(r.satelliteName ?? "") }));
  const fccNotInOccupancy = fccKeys
    .filter((f) => f.key && ![...occKeys].some((o) => namesOverlap(o, f.key)))
    .map((f) => f.row.satelliteName ?? f.row.callSign ?? "unnamed FCC row");
  const occupancyNotInFcc =
    fccRows.length === 0
      ? []
      : model.satellites
          .filter((s) => !fccKeys.some((f) => f.key && namesOverlap(nameKey(s.name), f.key)))
          .map((s) => s.name);

  return {
    slug,
    label: model.label,
    operator: model.operator,
    satCount: model.satCount,
    occupancyNames: model.satellites.map((s) => s.name),
    entered,
    left,
    disputeFlips,
    fccRows,
    fccNotInOccupancy,
    occupancyNotInFcc,
    biuHint: model.valuation.license.biuHint,
    congestionScore: model.congestion.score,
    congestionLabel: model.congestion.label,
    paperFiling: model.satCount === 0 && model.fccAuthorizations.length > 0,
    tleEpochMin: model.sourceVintage.tleEpochMin,
    tleEpochMax: model.sourceVintage.tleEpochMax,
    fccAsOf: model.sourceVintage.fccAsOf,
    ucsFileVintage: model.sourceVintage.ucsFileVintage,
  };
}

function nameKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function namesOverlap(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a.includes(b) || b.includes(a)) return true;
  // AT&T T16 / DIRECTV D16
  const compact = (s: string) => s.replace(/directv|att|eutelsat|hotbird|intelsat|ses/g, "");
  const ca = compact(a);
  const cb = compact(b);
  return ca.length >= 4 && cb.length >= 4 && (ca.includes(cb) || cb.includes(ca));
}
