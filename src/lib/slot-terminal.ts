import { slots as curatedSlots, type OrbitalSlot } from "@/data/orbital-slots";
import {
  mergeWithUcs,
  getGeoSatellitesByLongitude,
  getFccAuthorizationsByLongitude,
  getNearbySlots,
  getFccSlugSet,
  getCongestion,
  lonToSlug,
  slugToLon,
  type GeoSatellite,
  type FccAuthorization,
  type CongestionData,
} from "./satellites";
import { valuateSlot, type SlotValuation } from "./valuation";
import { buildRightsChain, type RightsLink } from "./rights-chain";
import { simulatedCapacityBook, type CapacityBook } from "./capacity-book";
import { getValuationHistory, latestModelRun, type ValuationSnapshot } from "./valuation-history";
import { getLatestIngest } from "./freshness";
import { ingestAsOf, type Provenance } from "./provenance";
import { regionForLongitude } from "./regions";
import { isSafeSlug } from "./slot-utils";

export interface TerminalComp {
  slug: string;
  label: string;
  lon: number;
  operator: string;
  satCount: number;
  congestionScore: number;
  valuation: SlotValuation;
  deltaDeg: number;
}

export interface MetricProvenance {
  [key: string]: Provenance;
}

export interface SlotTerminalModel {
  slug: string;
  label: string;
  longitude: number;
  region: string;
  slot: OrbitalSlot;
  operator: string;
  country: string;
  purpose: string | null;
  status: OrbitalSlot["status"];
  satCount: number;
  satellites: GeoSatellite[];
  bands: OrbitalSlot["bands"];
  coverage: string[];
  congestion: CongestionData;
  fccAuthorizations: FccAuthorization[];
  valuation: SlotValuation;
  history: ValuationSnapshot[];
  historySource: "persisted" | "backfill";
  rightsChain: RightsLink[];
  bidAsk: CapacityBook;
  comps: TerminalComp[];
  provenance: MetricProvenance;
  asOf: string;
  modelRunAsOf: string | null;
}

function formatLon(lon: number) {
  return lon >= 0 ? `${lon}°E` : `${Math.abs(lon)}°W`;
}

function primaryOperator(sats: GeoSatellite[]): string {
  const counts: Record<string, number> = {};
  for (const s of sats) if (s.operator) counts[s.operator] = (counts[s.operator] ?? 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

function primaryUsers(sats: GeoSatellite[], operator: string): string | undefined {
  return sats.find((s) => s.operator === operator && s.users)?.users ?? undefined;
}

function lookupSlot(slug: string, lon: number): OrbitalSlot | undefined {
  const merged = mergeWithUcs(curatedSlots);
  return (
    merged.find((s) => lonToSlug(s.longitude) === slug) ??
    merged.find((s) => Math.abs(s.longitude - lon) <= 0.4)
  );
}

export function buildSlotTerminal(slug: string): SlotTerminalModel | null {
  if (!isSafeSlug(slug)) return null;
  const lon = slugToLon(slug);
  if (lon === null) return null;

  const sats = getGeoSatellitesByLongitude(lon, 0.4);
  const fccAuths = getFccAuthorizationsByLongitude(lon);
  const curated = lookupSlot(slug, lon);
  if (sats.length === 0 && fccAuths.length === 0 && !curated) return null;

  const label = curated?.label ?? formatLon(lon);
  const operator = primaryOperator(sats) || fccAuths[0]?.licensee || curated?.operator || "";
  const country = curated?.country || sats[0]?.ownerCountry || fccAuths[0]?.administration || "";
  const congestion = getCongestion(lon);
  const latest = getLatestIngest();
  const asOf = ingestAsOf(latest?.lastRun ?? null);
  const asOfDate = new Date(asOf);

  const valuationSlot: OrbitalSlot = curated ?? {
    id: slug,
    longitude: lon,
    label,
    operator,
    country,
    bands: [],
    status: sats.length > 0 ? "active" : "filed",
    coverage: [],
    valueEstimate: "",
    description: "",
    source: sats.length > 0 ? "ucs" : "fcc",
    users: primaryUsers(sats, operator),
    purpose: sats[0]?.purpose ?? undefined,
  };

  const valuation = valuateSlot(valuationSlot, congestion, {
    satellites: sats,
    fccLicensed: fccAuths.length > 0,
    satCount: sats.length || congestion.factors.coLocated,
    asOf: asOfDate,
  });

  const history = getValuationHistory(slug, valuation, 30, asOfDate);
  const nearby = getNearbySlots(lon, 6);
  const comps: TerminalComp[] = nearby.map((n) => {
    const nSats = getGeoSatellitesByLongitude(n.lon, 0.4);
    const nFcc = getFccAuthorizationsByLongitude(n.lon);
    const nCurated = lookupSlot(n.slug, n.lon);
    const nCong = getCongestion(n.lon);
    const nOp = primaryOperator(nSats) || nFcc[0]?.licensee || nCurated?.operator || "";
    const nSlot: OrbitalSlot = nCurated ?? {
      id: n.slug,
      longitude: n.lon,
      label: n.label,
      operator: nOp,
      country: nSats[0]?.ownerCountry || nFcc[0]?.administration || "",
      bands: [],
      status: nSats.length > 0 ? "active" : "filed",
      coverage: [],
      valueEstimate: "",
      description: "",
      source: nSats.length > 0 ? "ucs" : "fcc",
      users: primaryUsers(nSats, nOp),
    };
    return {
      slug: n.slug,
      label: n.label,
      lon: n.lon,
      operator: nOp,
      satCount: nSats.length,
      congestionScore: nCong.score,
      valuation: valuateSlot(nSlot, nCong, {
        satellites: nSats,
        fccLicensed: nFcc.length > 0,
        satCount: nSats.length || nCong.factors.coLocated,
        asOf: asOfDate,
      }),
      deltaDeg: Math.abs(n.lon - lon),
    };
  });

  const ucsAsOf = asOf;
  const fccAsOf = asOf;
  const modelRun = latestModelRun();

  return {
    slug,
    label,
    longitude: lon,
    region: regionForLongitude(lon),
    slot: valuationSlot,
    operator,
    country,
    purpose: valuationSlot.purpose ?? sats[0]?.purpose ?? null,
    status: valuationSlot.status,
    satCount: sats.length,
    satellites: sats,
    bands: valuationSlot.bands,
    coverage: valuationSlot.coverage,
    congestion,
    fccAuthorizations: fccAuths,
    valuation,
    history,
    historySource: history[0]?.source === "persisted" ? "persisted" : "backfill",
    rightsChain: buildRightsChain({ operator, country, fccAuths, asOf }),
    bidAsk: simulatedCapacityBook(valuation, congestion, asOf),
    comps,
    asOf,
    modelRunAsOf: modelRun?.asOf ?? null,
    provenance: {
      fairValue: {
        source: `Clarke valuation ${valuation.modelVersion} (${valuation.basis})`,
        asOf: valuation.asOf,
        note: valuation.disclaimer,
      },
      occupancy: { source: "UCS Satellite Database", asOf: ucsAsOf },
      congestion: { source: "Clarke congestion v0 ← UCS GEO positions", asOf: ucsAsOf },
      fcc: { source: "FCC Approved Space Station List", asOf: fccAsOf },
      license: { source: "FCC SSAL + UCS occupancy", asOf },
      coverage: { source: "Clarke GDP/pop longitude-band heuristic", asOf: valuation.asOf },
      rights: { source: "FCC SSAL + UCS; ITU stub", asOf },
      bidAsk: { source: "Simulated (not a market)", asOf, note: "See strip disclaimer" },
    },
  };
}

export function listTerminalSummaries() {
  const merged = mergeWithUcs(curatedSlots);
  const latest = getLatestIngest();
  const asOfDate = new Date(ingestAsOf(latest?.lastRun ?? null));
  const fccSet = getFccSlugSet();
  return merged.map((slot) => {
    const slug = lonToSlug(slot.longitude);
    const congestion = getCongestion(slot.longitude);
    const valuation = valuateSlot(slot, congestion, {
      fccLicensed: fccSet.has(slug),
      satCount: congestion.factors.coLocated,
      asOf: asOfDate,
    });
    return { slug, slot, congestion, valuation, satCount: congestion.factors.coLocated };
  });
}
