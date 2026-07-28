import { slots as curatedSlots, type OrbitalSlot, type Band } from "@/data/orbital-slots";
import {
  mergeWithUcs,
  getOperatorGeoPositions,
  getCongestion,
  getFccSlugSet,
  lonToSlug,
  type CongestionTier,
} from "@/lib/satellites";
import { valuateSlot, formatMoney, type SlotValuation } from "@/lib/valuation";
import { regionForLongitude } from "@/lib/regions";

// "Orbital exposure" for an operator: the GEO positions it holds, each enriched
// with congestion + heuristic valuation, plus portfolio-level aggregates. This
// is the analyst-facing view the strategy doc calls the wedge artifact, scoped
// to a single operator's positions so it stays cheap to build per company page.

export interface ExposurePosition {
  slug: string;
  label: string;
  longitude: number;
  region: string;
  bands: Band[];
  satCount: number;
  congestionScore: number;
  congestionTier: CongestionTier;
  fccLicensed: boolean;
  valuation: SlotValuation;
  valueDisplay: string;
}

export interface OperatorExposure {
  positions: ExposurePosition[];
  positionCount: number;
  valueLow: number;
  valuePoint: number;
  valueHigh: number;
  valueRange: string;
  avgCongestion: number;
  fccCount: number;
}

export function buildOperatorExposure(operatorNames: string[]): OperatorExposure | null {
  const positions = getOperatorGeoPositions(operatorNames);
  if (positions.length === 0) return null;

  const slotBySlug = new Map(mergeWithUcs(curatedSlots).map((s) => [lonToSlug(s.longitude), s]));
  const fccSet = getFccSlugSet();

  const items: ExposurePosition[] = positions.map((pos) => {
    const slot: OrbitalSlot = slotBySlug.get(pos.slug) ?? {
      id: `op_${pos.slug}`,
      longitude: pos.lon,
      label: pos.label,
      operator: operatorNames[0] ?? "",
      country: "",
      bands: [],
      status: "active",
      coverage: [],
      valueEstimate: "",
      description: "",
      source: "ucs",
    };
    const congestion = getCongestion(pos.lon);
    const valuation = valuateSlot(slot, congestion);
    return {
      slug: pos.slug,
      label: pos.label,
      longitude: pos.lon,
      region: regionForLongitude(pos.lon),
      bands: slot.bands,
      satCount: pos.satelliteCount,
      congestionScore: congestion.score,
      congestionTier: congestion.tier,
      fccLicensed: fccSet.has(pos.slug),
      valuation,
      valueDisplay: slot.valueEstimate || valuation.formatted.range,
    };
  }).sort((a, b) => a.longitude - b.longitude);

  const valueLow = items.reduce((s, p) => s + p.valuation.low, 0);
  const valuePoint = items.reduce((s, p) => s + p.valuation.point, 0);
  const valueHigh = items.reduce((s, p) => s + p.valuation.high, 0);

  return {
    positions: items,
    positionCount: items.length,
    valueLow,
    valuePoint,
    valueHigh,
    valueRange: `${formatMoney(valueLow)}–${formatMoney(valueHigh)}`,
    avgCongestion: Math.round(items.reduce((s, p) => s + p.congestionScore, 0) / items.length),
    fccCount: items.filter((p) => p.fccLicensed).length,
  };
}
