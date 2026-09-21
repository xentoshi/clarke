// Occupancy-window operator attribution. The registry row's operator (curated
// or the UCS satellite that created the slug) is not always the majority
// operator inside the ±0.4° co-location window.
//
// Mix grouping uses the curated alias map (class M). Raw UCS strings stay on
// `operatorRaw`. Congestion *score* still counts raw source strings.

import { resolveOperator } from "./operator-identity";

export interface OperatorShare {
  operator: string;
  count: number;
  share: number;
  /** Distinct source strings that rolled up into `operator`. */
  operatorRaw: string[];
}

export function summarizeOperators(sats: { operator: string | null }[]): OperatorShare[] {
  const groups = new Map<string, { count: number; raws: Map<string, number> }>();
  let attributed = 0;
  for (const s of sats) {
    const raw = (s.operator ?? "").trim();
    if (!raw) continue;
    const display = resolveOperator(raw).display;
    const g = groups.get(display) ?? { count: 0, raws: new Map() };
    g.count++;
    g.raws.set(raw, (g.raws.get(raw) ?? 0) + 1);
    groups.set(display, g);
    attributed++;
  }
  return [...groups.entries()]
    .map(([operator, g]) => ({
      operator,
      count: g.count,
      share: attributed > 0 ? g.count / attributed : 0,
      operatorRaw: [...g.raws.keys()].sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => b.count - a.count || a.operator.localeCompare(b.operator));
}

export function formatOperatorMix(mix: OperatorShare[], satCount: number): string {
  if (mix.length === 0) return "No attributed operators";
  return mix.map((m) => `${m.operator} ${m.count}/${satCount}`).join(" · ");
}
