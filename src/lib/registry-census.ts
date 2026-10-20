import { buildGeoBelt } from "./belt-data";
import { buildExplorerRows } from "./explorer";
import { getFccCount, getGeoSatellites, getSatelliteStats } from "./satellites";

export interface RegistryCensus {
  /** Registry table rows. One per slug. */
  positions: number;
  /** Rows with at least one satellite in the ±0.4° occupancy window. */
  onStation: number;
  onStationLicensed: number;
  onStationUnlicensed: number;
  paperFilings: number;
  inactive: number;
  /** UCS `satellites` rows with orbit_class GEO. Includes rows with no occupancy longitude. */
  ucsGeoRows: number;
  /** Every satellite row in the UCS snapshot, all regimes. */
  ucsSatellites: number;
  /** GEO satellites with an occupancy longitude, including post-UCS TLE supplements. */
  geoSatellitesWithOccupancy: number;
  /** Rows in fcc_authorizations. */
  fccAuthorizations: number;
  /** Registry rows whose slug matches an FCC authorization longitude. */
  fccLicensedPositions: number;
  /** TLE occupancy marks drawn on the belt. */
  tleOccupancyMarks: number;
}

let cached: RegistryCensus | null = null;

export function getRegistryCensus(): RegistryCensus {
  if (cached) return cached;
  const rows = buildExplorerRows();
  const stats = getSatelliteStats();
  const geo = getGeoSatellites();
  const belt = buildGeoBelt();
  cached = {
    positions: rows.length,
    onStation: rows.filter((row) => row.satCount > 0).length,
    onStationLicensed: rows.filter((row) => row.status === "active").length,
    onStationUnlicensed: rows.filter((row) => row.status === "squatted").length,
    paperFilings: rows.filter((row) => row.status === "filed").length,
    inactive: rows.filter((row) => row.status === "inactive").length,
    ucsGeoRows: stats.geoCount,
    ucsSatellites: stats.total,
    geoSatellitesWithOccupancy: geo.filter((sat) => sat.longitudeGeo !== null).length,
    fccAuthorizations: getFccCount(),
    fccLicensedPositions: rows.filter((row) => row.fccLicensed).length,
    tleOccupancyMarks: belt.marks.length,
  };
  return cached;
}

export function formatRegistryCensus(census: RegistryCensus): string {
  return `${census.positions.toLocaleString("en-US")} positions, ${census.onStation.toLocaleString("en-US")} on station`;
}

export function formatRegistryCensusDetail(census: RegistryCensus): string {
  return `${formatRegistryCensus(census)}. Positions are registry rows, one per slug. On station means at least one satellite in the ±0.4° occupancy window.`;
}
