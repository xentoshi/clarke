import { twoline2satrec, sgp4, gstime, eciToGeodetic, degreesLong } from "satellite.js";

export interface TleElements {
  inclinationDeg: number | null;
  eccentricity: number | null;
  meanMotionRevPerDay: number | null;
}

// Sub-satellite longitude (degrees, −180..180) at the TLE's own epoch. GEO
// objects move very little in longitude day-to-day — evaluating each TLE at
// its own epoch (tsince=0) rather than propagating forward to "now" avoids
// compounding propagation error. This is a tracked-object longitude, not an
// FCC assignment or ITU filing location.
export function subSatelliteLongitudeDeg(tle1: string, tle2: string): number | null {
  try {
    const satrec = twoline2satrec(tle1, tle2);
    const pv = sgp4(satrec, 0);
    if (!pv.position || typeof pv.position === "boolean") return null;
    const gmst = gstime(satrec.jdsatepoch);
    const geo = eciToGeodetic(pv.position, gmst);
    const lon = degreesLong(geo.longitude);
    return Number.isFinite(lon) ? lon : null;
  } catch {
    return null;
  }
}

// TLE line-2 columns (1-indexed): inclination 9–16, eccentricity 27–33
// (leading decimal implied), mean motion 53–63.
export function parseTleElements(tle2: string): TleElements {
  if (!tle2 || tle2.length < 63) {
    return { inclinationDeg: null, eccentricity: null, meanMotionRevPerDay: null };
  }
  const inclinationDeg = parseFloat(tle2.slice(8, 16).trim());
  const eccRaw = tle2.slice(26, 33).trim();
  const eccentricity = eccRaw ? parseFloat(`0.${eccRaw}`) : NaN;
  const meanMotionRevPerDay = parseFloat(tle2.slice(52, 63).trim());
  return {
    inclinationDeg: Number.isFinite(inclinationDeg) ? inclinationDeg : null,
    eccentricity: Number.isFinite(eccentricity) ? eccentricity : null,
    meanMotionRevPerDay: Number.isFinite(meanMotionRevPerDay) ? meanMotionRevPerDay : null,
  };
}
