import { getDb } from "./db";

// Company key (public stock ticker, or private company slug) -> the exact UCS
// operator strings whose satellites count toward that company's fleet. Counts
// are real rows in Clarke's registry (UCS dataset) and can lag the very latest
// launches, so they are presented as "in registry", not a real-time census.
const FLEET_OPERATORS: Record<string, string[]> = {
  // public tickers
  IRDM: ["Iridium Communications, Inc."],
  GSAT: ["Globalstar"],
  SPIR: ["Spire Global Inc."],
  PL: ["Planet Labs, Inc."],
  BKSY: ["BlackSky Global"],
  SATL: ["Satellogic S.A."],
  VSAT: ["ViaSat, Inc."],
  "SESG.PA": ["SES S.A."],
  "ETL.PA": ["EUTELSAT S.A.", "EUTELSAT Americas", "OneWeb Satellites"],
  SATS: ["Echostar Satellite Services, LLC"],
  TSAT: ["Telesat Canada Ltd. (BCE, Inc.)"],
  SIRI: ["Sirius XM Holdings"],
  // company slugs (used by the Space Economy Map, which is companies.ts-based)
  spacex: ["SpaceX", "Spacex"],
  "planet-labs": ["Planet Labs, Inc."],
  "spire-global": ["Spire Global Inc."],
  oneweb: ["OneWeb Satellites"],
  "maxar-technologies": ["Maxar Technologies Inc."],
  ses: ["SES S.A."],
  eutelsat: ["EUTELSAT S.A.", "EUTELSAT Americas", "OneWeb Satellites"],
  intelsat: ["Intelsat S.A.", "PanAmSat (Intelsat S.A.)"],
  telesat: ["Telesat Canada Ltd. (BCE, Inc.)"],
  arabsat: ["Arab Satellite Communications Org. (ASCO)", "Arabsat"],
  hispasat: ["Hispasat", "Hispamar (subsidiary of Hispasat - Spain)"],
  "satellogic-analytics": ["Satellogic S.A."],
};

// Returns a map of company key -> satellite count, computed from the registry.
export function getFleetByKey(): Record<string, number> {
  const db = getDb();
  if (!db) return {};

  const allOps = Array.from(new Set(Object.values(FLEET_OPERATORS).flat()));
  if (allOps.length === 0) return {};

  const placeholders = allOps.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT operator, COUNT(*) as n FROM satellites WHERE operator IN (${placeholders}) GROUP BY operator`
    )
    .all(...allOps) as { operator: string; n: number }[];

  const byOp = new Map(rows.map((r) => [r.operator, r.n]));
  const out: Record<string, number> = {};
  for (const [key, ops] of Object.entries(FLEET_OPERATORS)) {
    const total = ops.reduce((sum, op) => sum + (byOp.get(op) ?? 0), 0);
    if (total > 0) out[key] = total;
  }
  return out;
}
