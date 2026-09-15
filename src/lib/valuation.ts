import { getCongestion, type CongestionData } from "./satellites";
import type { OrbitalSlot, SlotStatus } from "@/data/orbital-slots";
import { coverageProxy, type CoverageProxy } from "./coverage-proxy";
import { occupancyQuality, type LifetimeSat, type OccupancyQuality } from "./occupancy-quality";
import { formatMoney } from "./money";

export { formatMoney } from "./money";

// Transparent heuristic valuation for GEO orbital positions. Model version v0.
//
// This is NOT a market quote. It is a public-data heuristic that estimates an
// implied value RANGE for a position by multiplying a baseline against
// observable factors: where the slot sits relative to high-value markets, the
// GDP/population footprint of that longitude band, how commercially active it
// is, remaining satellite life, who operates it, what spectrum it carries, how
// scarce/contested its arc is, and FCC/license / brought-into-use signals.
// Every factor is surfaced so the number can be inspected rather than trusted
// blindly. Curated `valueEstimate` strings are a hand-checked overlay and
// do not replace the model range (see docs/VALUATION.md).

export const MODEL_VERSION = "v0";
const BASELINE_USD = 30_000_000; // mid baseline for an occupied GEO position

export type Confidence = "low" | "medium" | "high";

export interface ValuationFactor {
  label: string;
  multiplier: number;
  detail: string;
}

export type BiuHint = "brought_into_use" | "paper_filing" | "foreign_operating" | "unknown";

export interface LicenseSignal {
  fccLicensed: boolean;
  biuHint: BiuHint;
  biuLabel: string;
  multiplier: number;
  detail: string;
}

export interface ValuationContext {
  satellites?: LifetimeSat[];
  fccLicensed?: boolean;
  satCount?: number;
  asOf?: Date;
}

export interface SlotValuation {
  low: number;
  point: number;
  high: number;
  confidence: Confidence;
  basis: "model" | "curated";
  curatedEstimate?: string;
  factors: ValuationFactor[];
  formatted: { low: string; point: string; high: string; range: string };
  // True when the UCS "users" field indicates a government/military asset
  // with no commercial component. The figures above still get computed (so
  // this stays additive and nothing downstream has to special-case a missing
  // range), but a sovereign satellite isn't a leasable market position —
  // consumers should not present the dollar figures as a market estimate for
  // these rows. See nonCommercialReason for what triggered the flag.
  nonCommercial: boolean;
  nonCommercialReason?: string;
  modelVersion: typeof MODEL_VERSION;
  asOf: string;
  coverage: CoverageProxy;
  occupancyQuality: OccupancyQuality;
  license: LicenseSignal;
  disclaimer: string;
}

export const VALUATION_DISCLAIMER =
  "Valuation v0 is a model-based implied fair-value range from public registry data, not a live market price, appraisal, or offer to transact.";

// UCS "users" values that mean this satellite has no commercial component at
// all (pure "Government", "Military", "Government/Civil", etc.). Anything
// that mentions "Commercial" — including mixed hosted-payload cases like
// "Military/Commercial" — keeps a real (if partial) market dimension and is
// left alone. Absent data is not treated as evidence of government
// ownership — only an explicit non-commercial UCS classification flags it.
function nonCommercialFlag(users: string | undefined): { flagged: boolean; reason?: string } {
  if (!users) return { flagged: false };
  if (users.toLowerCase().includes("commercial")) return { flagged: false };
  return { flagged: true, reason: `UCS classifies this satellite's users as "${users}"` };
}

// Tier-1 GEO operators that consistently hold premium positions. Matched as
// case-insensitive substrings against the operator field.
const TIER_1 = [
  "ses", "intelsat", "eutelsat", "viasat", "telesat", "jsat", "sky perfect",
  "arabsat", "echostar", "hughes", "hispasat", "asiasat", "apt", "apstar",
  "thaicom", "measat", "optus", "yahsat", "nilesat", "turksat", "rscc",
  "china satcom", "chinasat", "embratel", "star one", "inmarsat", "telenor",
];

function arcDesirability(lon: number): { mult: number; detail: string } {
  // Normalize to (-180, 180]
  let l = lon;
  while (l > 180) l -= 360;
  while (l <= -180) l += 360;

  if (l >= -5 && l <= 35) return { mult: 1.8, detail: "European Ku/Ka corridor (highest-revenue arc)" };
  if (l > 35 && l <= 60) return { mult: 1.25, detail: "Middle East / West Asia" };
  if (l > 60 && l <= 105) return { mult: 1.4, detail: "South & Central Asia" };
  if (l > 105 && l <= 150) return { mult: 1.45, detail: "East & Southeast Asia" };
  if (l > 150 || l <= -160) return { mult: 0.8, detail: "Pacific (thin demand)" };
  if (l > -160 && l < -135) return { mult: 0.95, detail: "East Pacific" };
  if (l >= -135 && l <= -60) return { mult: 1.6, detail: "North America" };
  if (l > -60 && l <= -30) return { mult: 1.2, detail: "Latin America / Atlantic" };
  return { mult: 1.15, detail: "Atlantic / West Africa" }; // -30 < l < -5
}

function operatorTier(operator: string): { mult: number; detail: string } {
  const op = operator.trim().toLowerCase();
  if (!op) return { mult: 1.0, detail: "Operator unknown" };
  if (TIER_1.some((t) => op.includes(t))) return { mult: 1.3, detail: "Tier-1 operator" };
  return { mult: 1.05, detail: "Regional / other operator" };
}

function bandPremium(bands: OrbitalSlot["bands"]): { mult: number; detail: string } {
  if (!bands || bands.length === 0) return { mult: 1.0, detail: "No band data (UCS-derived)" };
  let mult = 1.0;
  const present: string[] = [];
  if (bands.includes("Ku")) { mult *= 1.2; present.push("Ku"); }
  if (bands.includes("Ka")) { mult *= 1.15; present.push("Ka"); }
  if (bands.includes("C")) { mult *= 1.1; present.push("C"); }
  if (bands.includes("X")) { mult *= 1.1; present.push("X"); }
  mult = Math.min(mult, 1.6); // cap stacked-band premium
  return { mult, detail: present.length ? `${present.join("/")}-band` : "Other bands" };
}

export function licenseSignal(args: {
  status: SlotStatus;
  fccLicensed: boolean;
  satCount: number;
}): LicenseSignal {
  const { status, fccLicensed, satCount } = args;
  let biuHint: BiuHint;
  let biuLabel: string;
  if (satCount > 0 && fccLicensed) {
    biuHint = "brought_into_use";
    biuLabel = "Brought into use (in-orbit + FCC record)";
  } else if (satCount === 0 && fccLicensed) {
    biuHint = "paper_filing";
    biuLabel = "Paper filing (FCC record, no UCS satellite in orbit)";
  } else if (satCount > 0) {
    biuHint = "foreign_operating";
    // Not a claim about nationality — many US government birds never appear
    // in FCC SSAL. This only means "in orbit, no FCC market-access row."
    biuLabel = "Operating (no FCC market-access row)";
  } else {
    biuHint = "unknown";
    biuLabel = "Unknown BIU — no in-orbit satellite and no FCC row";
  }

  let multiplier = 1.0;
  let detail = biuLabel;
  if (status === "squatted") {
    multiplier = 0.82;
    detail = `${biuLabel} · registry status squatted`;
  } else if (status === "inactive") {
    multiplier = 0.85;
    detail = `${biuLabel} · registry status inactive`;
  } else if (status === "filed" && satCount === 0) {
    multiplier = 0.88;
    detail = `${biuLabel} · filed, not occupied`;
  } else if (fccLicensed && satCount > 0) {
    multiplier = 1.1;
    detail = `${biuLabel} · US market access`;
  } else if (satCount > 0) {
    multiplier = 1.0;
  }

  return { fccLicensed, biuHint, biuLabel, multiplier: round2(multiplier), detail };
}

// Pass a precomputed congestion to avoid a redundant DB query when the caller
// already has one (e.g. list views that color by congestion and value together).
export function valuateSlot(
  slot: OrbitalSlot,
  congestion?: CongestionData,
  ctx: ValuationContext = {},
): SlotValuation {
  const asOf = ctx.asOf ?? new Date();
  const cong = congestion ?? getCongestion(slot.longitude);
  const coLocated = ctx.satCount ?? cong.factors.coLocated;
  const fccLicensed = ctx.fccLicensed ?? false;

  const arc = arcDesirability(slot.longitude);
  const coverage = coverageProxy(slot.longitude);
  const quality = occupancyQuality(ctx.satellites ?? [], asOf);
  const op = operatorTier(slot.operator ?? "");
  const band = bandPremium(slot.bands);
  const license = licenseSignal({
    status: slot.status,
    fccLicensed,
    satCount: coLocated,
  });
  const nonCommercial = nonCommercialFlag(slot.users);

  // Occupancy: an active, multi-satellite position is generating revenue.
  const occMult = 1 + Math.min(coLocated, 6) * 0.12;
  // Scarcity: contested, dense arcs command a premium (uses congestion score).
  const scarcityMult = 1 + (cong.score / 100) * 0.5;

  const factors: ValuationFactor[] = [
    { label: "Arc desirability", multiplier: arc.mult, detail: arc.detail },
    { label: "Coverage (GDP/pop)", multiplier: coverage.multiplier, detail: coverage.detail },
    { label: "Occupancy", multiplier: round2(occMult), detail: `${coLocated} co-located satellite${coLocated === 1 ? "" : "s"} (TLE-primary ±0.4°)` },
    { label: "Remaining life", multiplier: quality.multiplier, detail: quality.detail },
    { label: "Operator", multiplier: op.mult, detail: op.detail },
    { label: "Spectrum", multiplier: round2(band.mult), detail: band.detail },
    { label: "Scarcity", multiplier: round2(scarcityMult), detail: `Congestion score ${cong.score}` },
    { label: "License / BIU", multiplier: license.multiplier, detail: license.detail },
  ];
  if (nonCommercial.flagged) {
    factors.push({ label: "Ownership", multiplier: 1, detail: `${nonCommercial.reason} — not a leasable commercial position; figures below are the model's raw output, not a market estimate` });
  }

  const point = Math.round(
    BASELINE_USD *
      arc.mult *
      coverage.multiplier *
      occMult *
      quality.multiplier *
      op.mult *
      band.mult *
      scarcityMult *
      license.multiplier,
  );

  // Confidence reflects how much real data backs the estimate. A flagged
  // non-commercial asset is never medium/high confidence, regardless of how
  // dense its neighborhood is — density says nothing about a market value
  // that doesn't apply here.
  let confidence: Confidence;
  if (nonCommercial.flagged) confidence = "low";
  else if (slot.source === "curated") confidence = "high";
  else if ((slot.operator ?? "").trim() && coLocated >= 2) confidence = "medium";
  else confidence = "low";

  const spread = confidence === "high" ? 0.22 : confidence === "medium" ? 0.35 : 0.5;
  const low = Math.round(point * (1 - spread));
  const high = Math.round(point * (1 + spread));

  const curatedEstimate =
    slot.source === "curated" && slot.valueEstimate ? slot.valueEstimate : undefined;

  return {
    low,
    point,
    high,
    confidence,
    basis: curatedEstimate ? "curated" : "model",
    curatedEstimate,
    factors,
    nonCommercial: nonCommercial.flagged,
    nonCommercialReason: nonCommercial.reason,
    modelVersion: MODEL_VERSION,
    asOf: asOf.toISOString(),
    coverage,
    occupancyQuality: quality,
    license,
    disclaimer: VALUATION_DISCLAIMER,
    formatted: {
      low: formatMoney(low),
      point: formatMoney(point),
      high: formatMoney(high),
      range: `${formatMoney(low)}–${formatMoney(high)}`,
    },
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
