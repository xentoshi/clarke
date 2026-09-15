// Occupancy-window operator attribution. The registry row's operator (curated
// or the UCS satellite that created the slug) is not always the majority
// operator inside the ±0.4° co-location window.

export interface OperatorShare {
  operator: string;
  count: number;
  share: number;
}

export function summarizeOperators(sats: { operator: string | null }[]): OperatorShare[] {
  const counts = new Map<string, number>();
  let attributed = 0;
  for (const s of sats) {
    const op = (s.operator ?? "").trim();
    if (!op) continue;
    counts.set(op, (counts.get(op) ?? 0) + 1);
    attributed++;
  }
  return [...counts.entries()]
    .map(([operator, count]) => ({ operator, count, share: attributed > 0 ? count / attributed : 0 }))
    .sort((a, b) => b.count - a.count || a.operator.localeCompare(b.operator));
}

export function formatOperatorMix(mix: OperatorShare[], satCount: number): string {
  if (mix.length === 0) return "No attributed operators";
  return mix.map((m) => `${m.operator} ${m.count}/${satCount}`).join(" · ");
}
