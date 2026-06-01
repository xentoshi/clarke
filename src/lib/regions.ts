// Maps a GEO sub-satellite longitude (-180..180, negative = West) to a coarse
// market region, used for the orbital explorer's Region facet. Boundaries are
// approximate service-area buckets, not strict geography.
export const REGIONS = [
  "Europe / Africa / MEA",
  "Asia-Pacific",
  "Pacific",
  "North America",
  "Atlantic / Latin America",
] as const;

export type Region = (typeof REGIONS)[number];

export function regionForLongitude(lon: number): Region {
  // Normalize to (-180, 180]
  let l = lon;
  while (l > 180) l -= 360;
  while (l <= -180) l += 360;

  if (l >= -30 && l < 60) return "Europe / Africa / MEA";
  if (l >= 60 && l < 150) return "Asia-Pacific";
  if (l >= 150 || l < -160) return "Pacific";
  if (l >= -160 && l < -55) return "North America";
  return "Atlantic / Latin America"; // -55 <= l < -30
}
