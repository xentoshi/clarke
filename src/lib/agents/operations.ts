import { slots as curatedSlots, type OrbitalSlot } from "../../data/orbital-slots";
import { companies, type Company } from "../../data/companies";
import { stocks, type Stock } from "../../data/stocks";
import {
  mergeWithUcs,
  getGeoSatellites,
  getGeoSatellitesByLongitude,
  getFccAuthorizationsByLongitude,
  getCongestion,
  lonToSlug,
  slugToLon,
  type GeoSatellite,
  type FccAuthorization,
} from "../satellites";

// All operations are pure read-only views over local data + SQLite.
// Shared by HTTP routes and the MCP server so they stay in sync.

// Slug validation — only lowercase letters, digits, and hyphens. Prevents
// path traversal and limits surface area to the shape produced by lonToSlug
// and src/data/orbital-slots.ts.
const SAFE_SLUG = /^[a-z0-9-]+$/;
const SAFE_TICKER = /^[A-Z0-9.-]{1,10}$/;

export function isSafeSlug(slug: string): boolean {
  return SAFE_SLUG.test(slug);
}

// -------- Slots --------

export function listSlots(): OrbitalSlot[] {
  return mergeWithUcs(curatedSlots);
}

export interface SlotDossier {
  slot: OrbitalSlot;
  satellites: GeoSatellite[];
  fccAuthorizations: FccAuthorization[];
  congestion: ReturnType<typeof getCongestion>;
}

export function getSlotDossier(slug: string): SlotDossier | null {
  if (!isSafeSlug(slug)) return null;
  const merged = mergeWithUcs(curatedSlots);
  const slot = merged.find((s) => lonToSlug(s.longitude) === slug);
  if (!slot) return null;
  const satellites = getGeoSatellitesByLongitude(slot.longitude);
  const fccAuthorizations = getFccAuthorizationsByLongitude(slot.longitude);
  const congestion = getCongestion(slot.longitude);
  return { slot, satellites, fccAuthorizations, congestion };
}

// -------- Satellites --------

export interface SatellitesQuery {
  operator?: string;
  ownerCountry?: string;
  limit?: number;
}

export function listSatellites(q: SatellitesQuery = {}): GeoSatellite[] {
  const all = getGeoSatellites();
  let out = all;
  if (q.operator) {
    const needle = q.operator.toLowerCase();
    out = out.filter((s) => (s.operator ?? "").toLowerCase().includes(needle));
  }
  if (q.ownerCountry) {
    const needle = q.ownerCountry.toLowerCase();
    out = out.filter((s) => (s.ownerCountry ?? "").toLowerCase().includes(needle));
  }
  if (q.limit && q.limit > 0) out = out.slice(0, Math.min(q.limit, 1000));
  return out;
}

// -------- Companies --------

export interface CompaniesQuery {
  sector?: string;
}

export function listCompanies(q: CompaniesQuery = {}): Company[] {
  if (q.sector) {
    const needle = q.sector.toLowerCase();
    return companies.filter((c) => c.sector.toLowerCase() === needle);
  }
  return companies;
}

export interface CompanyProfile {
  company: Company;
  stock: Stock | null;
  slots: OrbitalSlot[];
  satellites: GeoSatellite[];
}

function matchesAsWord(haystack: string, needle: string): boolean {
  if (!haystack || !needle) return false;
  if (haystack === needle) return true;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(haystack);
}

export function getCompanyProfile(slug: string): CompanyProfile | null {
  if (!isSafeSlug(slug)) return null;
  const company = companies.find((c) => c.slug === slug);
  if (!company) return null;

  const cleanName = company.name.toLowerCase().replace(/\s*\(.*?\)/g, "").trim();

  const stock = stocks.find((s) => matchesAsWord(s.name.toLowerCase(), cleanName)) ?? null;

  const merged = mergeWithUcs(curatedSlots);
  const matchedSlots = merged.filter((s) =>
    matchesAsWord((s.operator ?? "").toLowerCase(), cleanName),
  );

  const allSats = getGeoSatellites();
  const matchedSats = allSats.filter((s) =>
    matchesAsWord((s.operator ?? "").toLowerCase(), cleanName),
  );

  return {
    company,
    stock,
    slots: matchedSlots,
    satellites: matchedSats,
  };
}

export function listCompanySectors(): { sector: string; count: number }[] {
  const byKey = new Map<string, number>();
  for (const c of companies) {
    byKey.set(c.sector, (byKey.get(c.sector) ?? 0) + 1);
  }
  return [...byKey.entries()]
    .map(([sector, count]) => ({ sector, count }))
    .sort((a, b) => b.count - a.count);
}

// -------- Stocks --------

export interface StocksQuery {
  vertical?: string;
  ticker?: string;
}

export function listStocks(q: StocksQuery = {}): Stock[] {
  if (q.ticker) {
    if (!SAFE_TICKER.test(q.ticker)) return [];
    return stocks.filter((s) => s.ticker.toUpperCase() === q.ticker!.toUpperCase());
  }
  if (q.vertical) {
    const needle = q.vertical.toLowerCase();
    return stocks.filter((s) => s.vertical.toLowerCase() === needle);
  }
  return stocks;
}

// -------- Cross-cutting --------

export function isSafeTicker(ticker: string): boolean {
  return SAFE_TICKER.test(ticker);
}

export { lonToSlug, slugToLon };
