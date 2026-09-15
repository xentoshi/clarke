import { slots as curatedSlots } from "@/data/orbital-slots";
import {
  mergeWithUcs,
  getGeoSatellites,
  getCongestion,
  getFccSlugSet,
  lonToSlug,
  type GeoSatellite,
} from "@/lib/satellites";
import { valuateSlot } from "@/lib/valuation";
import { regionForLongitude } from "@/lib/regions";
import { getLatestIngest } from "@/lib/freshness";
import { ingestAsOf } from "@/lib/provenance";
import type { ExplorerRow } from "@/app/orbital/types";

// Server-side builder for the orbital explorer. Computes one enriched row per
// orbital position. Congestion is computed exactly once per slot and fed to the
// valuation, avoiding the duplicate work the page previously did.
export function buildExplorerRows(): ExplorerRow[] {
  const merged = mergeWithUcs(curatedSlots);
  const fccSet = getFccSlugSet();
  const asOf = new Date(ingestAsOf(getLatestIngest()?.lastRun ?? null));

  const geo = getGeoSatellites().filter((s): s is GeoSatellite & { longitudeGeo: number } => s.longitudeGeo !== null);

  return merged.map((slot) => {
    const slug = lonToSlug(slot.longitude);
    const congestion = getCongestion(slot.longitude);
    // Same ±0.4° co-location window as Slot Terminal / ITU grouping, not the
    // sat's own rounded slug (which would split 101.08°W from curated 101°W).
    const sats = geo.filter((s) => Math.abs(s.longitudeGeo - slot.longitude) <= 0.4);
    const satelliteNames = sats.map((s) => s.name);
    const fccLicensed = fccSet.has(slug);
    const valuation = valuateSlot(slot, congestion, {
      satellites: sats,
      fccLicensed,
      satCount: sats.length || congestion.factors.coLocated,
      asOf,
    });

    return {
      id: slot.id,
      slug,
      longitude: slot.longitude,
      label: slot.label,
      operator: slot.operator,
      country: slot.country,
      purpose: slot.purpose ?? null,
      status: slot.status,
      satCount: sats.length || congestion.factors.coLocated,
      satelliteNames,
      congestionScore: congestion.score,
      congestionTier: congestion.tier,
      region: regionForLongitude(slot.longitude),
      fccLicensed,
      bands: slot.bands,
      coverage: slot.coverage,
      description: slot.description,
      satellite: slot.satellite,
      launched: slot.launched,
      valuation,
      valueDisplay: slot.valueEstimate || valuation.formatted.range,
      biuHint: valuation.license.biuHint,
    };
  });
}
