// Longitude arithmetic used by occupancy clustering and TLE/UCS comparison.
// Always use these instead of plain subtraction: 179° → −179° is a 2° move.

/** Normalize a longitude into (−180, 180]. */
export function normalizeLonDeg(lon: number): number {
  let l = lon;
  while (l > 180) l -= 360;
  while (l <= -180) l += 360;
  return l;
}

/** Shortest signed angular distance from `a` to `b`, degrees, in (−180, 180]. */
export function circularDiffDeg(a: number, b: number): number {
  let d = b - a;
  while (d > 180) d -= 360;
  while (d <= -180) d += 360;
  return d;
}

export function circularAbsDiffDeg(a: number, b: number): number {
  return Math.abs(circularDiffDeg(a, b));
}

export function withinLongitudeWindow(a: number, b: number, toleranceDeg: number): boolean {
  return circularAbsDiffDeg(a, b) <= toleranceDeg;
}

export function formatLonFixed(lon: number, digits = 1): string {
  const r = Number(lon.toFixed(digits));
  const abs = Math.abs(r).toFixed(digits);
  if (Object.is(r, -0) || r === 0) return `${(0).toFixed(digits)}°E`;
  return r > 0 ? `${abs}°E` : `${abs}°W`;
}

export function daysBetweenUtc(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000);
}

export function parseUtcDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const iso = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
  const withZone = /Z$|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : `${iso}Z`;
  const d = new Date(withZone);
  return Number.isNaN(d.getTime()) ? null : d;
}
