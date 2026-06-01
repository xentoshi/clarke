import { slots as curatedSlots } from "@/data/orbital-slots";
import {
  mergeWithUcs,
  getGeoSatellites,
  getCongestion,
  getFccSlugSet,
  lonToSlug,
} from "@/lib/satellites";
import { valuateSlot } from "@/lib/valuation";
import { regionForLongitude } from "@/lib/regions";
import type { ExplorerRow } from "@/app/orbital/types";

// Server-side builder for the orbital explorer. Computes one enriched row per
// orbital position. Congestion is computed exactly once per slot and fed to the
// valuation, avoiding the duplicate work the page previously did.
export function buildExplorerRows(): ExplorerRow[] {
  const merged = mergeWithUcs(curatedSlots);
  const fccSet = getFccSlugSet();

  // One pass over all GEO satellites, grouped by slot slug, for co-located
  // names + counts (used for the Sats column and satellite-name search).
  const namesBySlug = new Map<string, string[]>();
  for (const sat of getGeoSatellites()) {
    if (sat.longitudeGeo === null) continue;
    const slug = lonToSlug(sat.longitudeGeo);
    const list = namesBySlug.get(slug);
    if (list) list.push(sat.name);
    else namesBySlug.set(slug, [sat.name]);
  }

  return merged.map((slot) => {
    const slug = lonToSlug(slot.longitude);
    const congestion = getCongestion(slot.longitude);
    const valuation = valuateSlot(slot, congestion);
    const satelliteNames = namesBySlug.get(slug) ?? [];

    return {
      id: slot.id,
      slug,
      longitude: slot.longitude,
      label: slot.label,
      operator: slot.operator,
      country: slot.country,
      purpose: slot.purpose ?? null,
      status: slot.status,
      satCount: satelliteNames.length || congestion.factors.coLocated,
      satelliteNames,
      congestionScore: congestion.score,
      congestionTier: congestion.tier,
      region: regionForLongitude(slot.longitude),
      fccLicensed: fccSet.has(slug),
      listed: slot.tokenization?.status === "listed",
      bands: slot.bands,
      coverage: slot.coverage,
      description: slot.description,
      satellite: slot.satellite,
      launched: slot.launched,
      valuation,
      valueDisplay: slot.valueEstimate || valuation.formatted.range,
      tokenization: slot.tokenization,
    };
  });
}
