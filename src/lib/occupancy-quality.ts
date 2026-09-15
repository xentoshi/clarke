// Remaining-life / occupancy-quality signal from UCS launch date + expected
// lifetime. Missing lifetime is not treated as evidence of youth or expiry.

export interface LifetimeSat {
  launchDate: string | null;
  expectedLifetimeYears: number | null;
}

export interface OccupancyQuality {
  sampleSize: number;
  meanYearsRemaining: number | null;
  oldestLaunchYear: number | null;
  newestLaunchYear: number | null;
  multiplier: number;
  detail: string;
}

function parseYear(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const parts = dateStr.split(/[/-]/);
  const year = parseInt(parts[parts.length - 1] ?? "", 10);
  return Number.isFinite(year) && year > 1950 && year < 2100 ? year : null;
}

export function occupancyQuality(sats: LifetimeSat[], asOf: Date = new Date()): OccupancyQuality {
  const asOfYear = asOf.getUTCFullYear() + (asOf.getUTCMonth() + 1) / 12;
  const remaining: number[] = [];
  const years: number[] = [];

  for (const s of sats) {
    const launchYear = parseYear(s.launchDate);
    if (launchYear) years.push(launchYear);
    if (launchYear && s.expectedLifetimeYears && s.expectedLifetimeYears > 0) {
      remaining.push(s.expectedLifetimeYears - (asOfYear - launchYear));
    }
  }

  years.sort((a, b) => a - b);
  const mean =
    remaining.length > 0
      ? remaining.reduce((a, b) => a + b, 0) / remaining.length
      : null;

  let multiplier = 1.0;
  let detail: string;
  if (mean === null) {
    detail = sats.length
      ? `${sats.length} satellite${sats.length === 1 ? "" : "s"}; no usable lifetime data`
      : "No satellites in UCS snapshot";
  } else if (mean >= 10) {
    multiplier = 1.1;
    detail = `Young fleet · ~${mean.toFixed(1)}y remaining (n=${remaining.length})`;
  } else if (mean >= 5) {
    multiplier = 1.03;
    detail = `Mid-life · ~${mean.toFixed(1)}y remaining (n=${remaining.length})`;
  } else if (mean >= 2) {
    multiplier = 0.96;
    detail = `Late life · ~${mean.toFixed(1)}y remaining (n=${remaining.length})`;
  } else if (mean >= 0) {
    multiplier = 0.9;
    detail = `End of licensed life · ~${mean.toFixed(1)}y remaining (n=${remaining.length})`;
  } else {
    multiplier = 0.88;
    detail = `Life-extended / past UCS lifetime · ~${mean.toFixed(1)}y (n=${remaining.length})`;
  }

  return {
    sampleSize: remaining.length,
    meanYearsRemaining: mean === null ? null : Math.round(mean * 10) / 10,
    oldestLaunchYear: years[0] ?? null,
    newestLaunchYear: years[years.length - 1] ?? null,
    multiplier: Math.round(multiplier * 100) / 100,
    detail,
  };
}
