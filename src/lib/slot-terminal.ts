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
  COLOCATION_TOLERANCE_DEG,
  type GeoSatellite,
  type FccAuthorization,
  type CongestionData,
} from "./satellites";
import { valuateSlot, type SlotValuation } from "./valuation";
import { buildRightsChain, type RightsLink } from "./rights-chain";
import { simulatedCapacityBook, type CapacityBook } from "./capacity-book";
import { getValuationHistory, latestModelRun, type ValuationSnapshot } from "./valuation-history";
import { getLatestIngest, getDataFreshness } from "./freshness";
import { ingestAsOf, type Provenance } from "./provenance";
import { regionForLongitude } from "./regions";
import { isSafeSlug } from "./slot-utils";
import { summarizeOperators, type OperatorShare } from "./operator-mix";

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
  occupancyMajority: string;
  operatorMix: OperatorShare[];
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

function occupancyMajorityOf(sats: GeoSatellite[]): string {
  return summarizeOperators(sats)[0]?.operator ?? "";
}

function primaryUsers(sats: GeoSatellite[], operator: string): string | undefined {
  return sats.find((s) => s.operator === operator && s.users)?.users ?? undefined;
}

function lookupSlot(slug: string, lon: number): OrbitalSlot | undefined {
  const merged = mergeWithUcs(curatedSlots);
  return (
    merged.find((s) => lonToSlug(s.longitude) === slug) ??
    merged.find((s) => Math.abs(s.longitude - lon) <= COLOCATION_TOLERANCE_DEG)
  );
}

export function buildSlotTerminal(slug: string): SlotTerminalModel | null {
  if (!isSafeSlug(slug)) return null;
  const lon = slugToLon(slug);
  if (lon === null) return null;

  const sats = getGeoSatellitesByLongitude(lon, COLOCATION_TOLERANCE_DEG);
  const fccAuths = getFccAuthorizationsByLongitude(lon);
  const curated = lookupSlot(slug, lon);
  if (sats.length === 0 && fccAuths.length === 0 && !curated) return null;

  const label = curated?.label ?? formatLon(lon);
  const mix = summarizeOperators(sats);
  const occupancyMajority = occupancyMajorityOf(sats);
  // Headline operator is the registry/curated row, not the ±0.4° majority.
  // 101°W is SES in the curated registry and DirecTV in the occupancy window.
  const operator = curated?.operator || occupancyMajority || fccAuths[0]?.licensee || "";
  const country = curated?.country || sats[0]?.ownerCountry || fccAuths[0]?.administration || "";
  const congestion = getCongestion(lon);
  const latest = getLatestIngest();
  const asOf = ingestAsOf(latest?.lastRun ?? null);
  const asOfDate = new Date(asOf);
  const freshness = getDataFreshness();
  const sourceAsOf = (name: string) =>
    ingestAsOf(freshness.find((f) => f.source === name)?.lastRun ?? null, new Date(asOf));

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
    users: primaryUsers(sats, occupancyMajority || operator),
    purpose: sats[0]?.purpose ?? undefined,
  };

  const valuation = valuateSlot(valuationSlot, congestion, {
    satellites: sats,
    fccLicensed: fccAuths.length > 0,
    satCount: sats.length || congestion.factors.coLocated,
    asOf: asOfDate,
  });

  const history = getValuationHistory(slug, valuation, 30, asOfDate);
  const nearby = getNearbySlots(lon, 6, COLOCATION_TOLERANCE_DEG);
  const comps: TerminalComp[] = nearby.map((n) => {
    const nSats = getGeoSatellitesByLongitude(n.lon, COLOCATION_TOLERANCE_DEG);
    const nFcc = getFccAuthorizationsByLongitude(n.lon);
    const nCurated = lookupSlot(n.slug, n.lon);
    const nCong = getCongestion(n.lon);
    const nMix = summarizeOperators(nSats);
    const nOp = nCurated?.operator || nMix[0]?.operator || nFcc[0]?.licensee || "";
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
      users: primaryUsers(nSats, nMix[0]?.operator || nOp),
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

  const ucsAsOf = sourceAsOf("UCS");
  const fccAsOf = sourceAsOf("FCC-SSAL");
  const modelRun = latestModelRun();

  return {
    slug,
    label,
    longitude: lon,
    region: regionForLongitude(lon),
    slot: valuationSlot,
    operator,
    occupancyMajority,
    operatorMix: mix,
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
    rightsChain: buildRightsChain({ operator, country, fccAuths, asOf: fccAsOf }),
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
      occupancy: {
        source: "UCS Satellite Database",
        asOf: ucsAsOf,
        note: `±${COLOCATION_TOLERANCE_DEG}° occupancy window · last_run is ingest time, not UCS observation time`,
      },
      congestion: { source: "Clarke congestion v0 ← UCS GEO positions", asOf: ucsAsOf },
      fcc: { source: "FCC Approved Space Station List", asOf: fccAsOf },
      license: { source: "FCC SSAL + UCS occupancy", asOf: fccAsOf },
      coverage: { source: "Clarke GDP/pop longitude-band heuristic", asOf: valuation.asOf },
      rights: { source: "FCC SSAL + UCS; ITU stub", asOf: fccAsOf },
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
    const sats = getGeoSatellitesByLongitude(slot.longitude, COLOCATION_TOLERANCE_DEG);
    const valuation = valuateSlot(slot, congestion, {
      satellites: sats,
      fccLicensed: fccSet.has(slug),
      satCount: sats.length || congestion.factors.coLocated,
      asOf: asOfDate,
    });
    return { slug, slot, congestion, valuation, satCount: sats.length || congestion.factors.coLocated };
  });
}
