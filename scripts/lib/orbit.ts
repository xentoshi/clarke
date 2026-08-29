import { twoline2satrec, sgp4, gstime, eciToGeodetic, degreesLong } from "satellite.js";

// Sub-satellite longitude (degrees, -180..180) at the TLE's own epoch. GEO
// objects move very little in longitude day-to-day — evaluating each TLE at
// its own epoch (tsince=0) rather than propagating either one forward to
// "now" avoids compounding propagation error and keeps old-vs-new a fair
// comparison of two independently-fit element sets.
export function subSatelliteLongitudeDeg(tle1: string, tle2: string): number | null {
  try {
    const satrec = twoline2satrec(tle1, tle2);
    const pv = sgp4(satrec, 0);
    if (!pv.position || typeof pv.position === "boolean") return null;
    const gmst = gstime(satrec.jdsatepoch);
    const geo = eciToGeodetic(pv.position, gmst);
    return degreesLong(geo.longitude);
  } catch {
    return null;
  }
}

// Normalize a longitude into (-180, 180], the convention used everywhere in
// Clarke. UCS occasionally reports a GEO longitude in the 0..360 convention
// instead (e.g. 359 rather than -1), which sorts and groups wrong against
// data that's otherwise all in -180..180.
export function normalizeLonDeg(lon: number): number {
  let l = lon;
  while (l > 180) l -= 360;
  while (l <= -180) l += 360;
  return l;
}

// Shortest signed angular distance from a to b, degrees, in (-180, 180].
// Plain subtraction breaks at the antimeridian (e.g. 179 -> -179 is a 2°
// move, not a 358° one).
export function circularDiffDeg(a: number, b: number): number {
  let d = b - a;
  while (d > 180) d -= 360;
  while (d <= -180) d += 360;
  return d;
}
