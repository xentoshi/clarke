import { getCongestion, type CongestionData } from "./satellites";
import type { OrbitalSlot } from "@/data/orbital-slots";

// Transparent heuristic valuation for GEO orbital positions.
//
// This is NOT a market quote. It is a public-data heuristic that estimates an
// implied value RANGE for a position by multiplying a baseline against five
// observable factors: where the slot sits relative to high-value markets, how
// commercially active it is, who operates it, what spectrum it carries, and how
// scarce/contested its arc is. Every factor is surfaced so the number can be
// inspected rather than trusted blindly. Curated positions carry a hand-checked
// estimate that takes precedence as the headline figure.

const BASELINE_USD = 30_000_000; // mid baseline for an occupied GEO position

export type Confidence = "low" | "medium" | "high";

export interface ValuationFactor {
  label: string;
  multiplier: number;
  detail: string;
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

function formatMoney(usd: number): string {
  if (usd >= 1e9) return `$${(usd / 1e9).toFixed(usd / 1e9 >= 10 ? 0 : 1)}B`;
  if (usd >= 1e6) return `$${Math.round(usd / 1e6)}M`;
  return `$${Math.round(usd / 1e3)}K`;
}

// Pass a precomputed congestion to avoid a redundant DB query when the caller
// already has one (e.g. list views that color by congestion and value together).
export function valuateSlot(slot: OrbitalSlot, congestion?: CongestionData): SlotValuation {
  const cong = congestion ?? getCongestion(slot.longitude);
  const coLocated = cong.factors.coLocated;

  const arc = arcDesirability(slot.longitude);
  const op = operatorTier(slot.operator ?? "");
  const band = bandPremium(slot.bands);

  // Occupancy: an active, multi-satellite position is generating revenue.
  const occMult = 1 + Math.min(coLocated, 6) * 0.12;
  // Scarcity: contested, dense arcs command a premium (uses congestion score).
  const scarcityMult = 1 + (cong.score / 100) * 0.5;

  const factors: ValuationFactor[] = [
    { label: "Arc desirability", multiplier: arc.mult, detail: arc.detail },
    { label: "Occupancy", multiplier: round2(occMult), detail: `${coLocated} co-located satellite${coLocated === 1 ? "" : "s"}` },
    { label: "Operator", multiplier: op.mult, detail: op.detail },
    { label: "Spectrum", multiplier: round2(band.mult), detail: band.detail },
    { label: "Scarcity", multiplier: round2(scarcityMult), detail: `Congestion score ${cong.score}` },
  ];

  const point = Math.round(
    BASELINE_USD * arc.mult * occMult * op.mult * band.mult * scarcityMult,
  );

  // Confidence reflects how much real data backs the estimate.
  let confidence: Confidence;
  if (slot.source === "curated") confidence = "high";
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
