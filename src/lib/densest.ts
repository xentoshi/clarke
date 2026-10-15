/** Densest registry row by satellites in the occupancy window, not by congestion score. */
export function densestBySatelliteCount<T extends { satCount: number }>(rows: T[]): T | null {
  let best: T | null = null;
  for (const row of rows) {
    if (!best || row.satCount > best.satCount) best = row;
  }
  return best;
}
