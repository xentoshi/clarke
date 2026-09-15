import { getTerminalDb } from "./terminal-db";
import type { SlotValuation } from "./valuation";
import { MODEL_VERSION } from "./valuation";

export interface ValuationSnapshot {
  slug: string;
  asOf: string; // YYYY-MM-DD
  point: number;
  low: number;
  high: number;
  confidence: SlotValuation["confidence"];
  nonCommercial: boolean;
  modelVersion: string;
  source: "persisted" | "backfill";
}

function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addUtcDays(d: Date, days: number): Date {
  const out = new Date(d.getTime());
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

// Deterministic model path used to seed history so charts have a series
// before a daily job exists. This is a BACKFILL of the v0 model, not
// observed transaction prints. Same function is used by the seed script
// and the runtime fallback so numbers stay in sync.
export function synthesizeHistory(
  slug: string,
  valuation: Pick<SlotValuation, "point" | "low" | "high" | "confidence" | "nonCommercial">,
  days = 30,
  asOf: Date = new Date(),
): ValuationSnapshot[] {
  const end = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate()));
  const phase = (hash32(slug) % 628) / 100;
  const out: ValuationSnapshot[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = addUtcDays(end, -i);
    const drift = i === 0 ? 1 : 1 + 0.035 * Math.sin(phase + i / 18);
    const point = Math.round(valuation.point * drift);
    const ratio = valuation.point > 0 ? point / valuation.point : 1;
    out.push({
      slug,
      asOf: ymd(day),
      point,
      low: Math.round(valuation.low * ratio),
      high: Math.round(valuation.high * ratio),
      confidence: valuation.confidence,
      nonCommercial: valuation.nonCommercial,
      modelVersion: MODEL_VERSION,
      source: "backfill",
    });
  }
  return out;
}

export function readPersistedHistory(slug: string): ValuationSnapshot[] {
  const db = getTerminalDb();
  if (!db) return [];
  try {
    const rows = db.prepare(`
      SELECT slug, as_of as asOf, point, low, high, confidence, non_commercial as nonCommercial, model_version as modelVersion
      FROM valuation_snapshots
      WHERE slug = ?
      ORDER BY as_of ASC
    `).all(slug) as {
      slug: string;
      asOf: string;
      point: number;
      low: number;
      high: number;
      confidence: SlotValuation["confidence"];
      nonCommercial: number;
      modelVersion: string;
    }[];
    return rows.map((r) => ({
      ...r,
      nonCommercial: Boolean(r.nonCommercial),
      source: "persisted" as const,
    }));
  } catch {
    return [];
  }
}

export function getValuationHistory(
  slug: string,
  valuation: Pick<SlotValuation, "point" | "low" | "high" | "confidence" | "nonCommercial">,
  days = 30,
  asOf: Date = new Date(),
): ValuationSnapshot[] {
  const persisted = readPersistedHistory(slug);
  if (persisted.length > 0) return persisted.slice(-days);
  return synthesizeHistory(slug, valuation, days, asOf);
}

export function latestModelRun(): { asOf: string; slotCount: number; modelVersion: string } | null {
  const db = getTerminalDb();
  if (!db) return null;
  try {
    const row = db.prepare(`
      SELECT as_of as asOf, slot_count as slotCount, model_version as modelVersion
      FROM model_runs ORDER BY id DESC LIMIT 1
    `).get() as { asOf: string; slotCount: number; modelVersion: string } | undefined;
    return row ?? null;
  } catch {
    return null;
  }
}
