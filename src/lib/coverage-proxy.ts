// Coverage-value proxy for GEO longitudes.
//
// This is a public-data heuristic, not a measured beam footprint. GEO slots
// "see" a third of the earth; Clarke maps each longitude to a coarse market
// band and assigns a GDP index and a population index from widely published
// regional shares (World Bank / UN-style aggregates, rounded). The numbers
// are inputs to valuation v0, not a claim that a satellite actually covers
// that entire band.

export interface CoverageBand {
  id: string;
  label: string;
  // Inclusive start, exclusive end on the (-180, 180] circle. A band may
  // wrap the antimeridian by setting start > end.
  start: number;
  end: number;
  gdpIndex: number; // 0.4 .. 1.6 relative to a mid GEO slot
  popIndex: number; // 0.4 .. 1.6
  detail: string;
}

export const COVERAGE_BANDS: CoverageBand[] = [
  { id: "eu-mea", label: "Europe / Mediterranean / West MEA", start: -5, end: 35, gdpIndex: 1.55, popIndex: 1.15, detail: "Highest-GDP GEO corridor; Europe + North Africa + Levant" },
  { id: "me-wasia", label: "Middle East / West Asia", start: 35, end: 60, gdpIndex: 1.15, popIndex: 1.05, detail: "Gulf energy + Levant/West Asia population" },
  { id: "s-asia", label: "South & Central Asia", start: 60, end: 105, gdpIndex: 1.2, popIndex: 1.6, detail: "Highest population footprint (India / subcontinent / SE Asia west)" },
  { id: "e-asia", label: "East & Southeast Asia", start: 105, end: 150, gdpIndex: 1.45, popIndex: 1.45, detail: "East Asia GDP + dense SE Asian population" },
  { id: "pacific", label: "Pacific", start: 150, end: -160, gdpIndex: 0.55, popIndex: 0.45, detail: "Thin addressable GDP and population over open ocean" },
  { id: "e-pac", label: "East Pacific", start: -160, end: -135, gdpIndex: 0.7, popIndex: 0.55, detail: "Hawaii / Pacific approaches; limited continental GDP" },
  { id: "n-am", label: "North America", start: -135, end: -60, gdpIndex: 1.6, popIndex: 1.1, detail: "Highest single-market GDP footprint (US/Canada/Mexico)" },
  { id: "latam-atl", label: "Latin America / Atlantic", start: -60, end: -30, gdpIndex: 1.05, popIndex: 1.15, detail: "Brazil + Southern Cone + Caribbean GDP/pop" },
  { id: "atl-waf", label: "Atlantic / West Africa", start: -30, end: -5, gdpIndex: 0.95, popIndex: 1.05, detail: "West Africa + mid-Atlantic; growing but lower GDP share" },
];

export interface CoverageProxy {
  band: CoverageBand;
  gdpIndex: number;
  popIndex: number;
  // Combined coverage score used as a valuation multiplier (geometric mean,
  // then lightly compressed so it does not dominate arc desirability).
  multiplier: number;
  detail: string;
}

function normalizeLon(lon: number): number {
  let l = lon;
  while (l > 180) l -= 360;
  while (l <= -180) l += 360;
  return l;
}

function inBand(lon: number, band: CoverageBand): boolean {
  if (band.start < band.end) return lon >= band.start && lon < band.end;
  return lon >= band.start || lon < band.end;
}

export function coverageProxy(longitude: number): CoverageProxy {
  const lon = normalizeLon(longitude);
  const band = COVERAGE_BANDS.find((b) => inBand(lon, b)) ?? COVERAGE_BANDS[0];
  const geo = Math.sqrt(band.gdpIndex * band.popIndex);
  // Compress toward 1.0 so this is an input, not a second copy of arc premium.
  const multiplier = round2(1 + (geo - 1) * 0.35);
  return {
    band,
    gdpIndex: band.gdpIndex,
    popIndex: band.popIndex,
    multiplier,
    detail: `${band.label} · GDP ${band.gdpIndex.toFixed(2)} · pop ${band.popIndex.toFixed(2)}`,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
