import { slots as curatedSlots } from "@/data/orbital-slots";
import { COLOCATION_WINDOW_DEG } from "./position-authority";
import { isLaunchVehicleOperator } from "./operator-identity";
import { getGeoSatellites, lonToSlug, mergeWithUcs } from "./satellites";
import { formatLon } from "./slot-utils";
import {
  beltCaption,
  beltDisputeClass,
  formatBeltEpoch,
  isTleBeltMark,
  matchRegistrySlot,
  type BeltMark,
  type GeoBeltModel,
  type RegistrySlotRef,
} from "./geo-belt";

export type { GeoBeltModel };

/**
 * TLE-primary occupancy marks for the flat belt.
 * UCS-only rows are counted and left off. No longitude is invented.
 */
export function buildGeoBelt(): GeoBeltModel {
  const sats = getGeoSatellites();
  const merged = mergeWithUcs(curatedSlots);
  const slots: RegistrySlotRef[] = [];
  const slotLabel = new Map<string, string>();
  for (const slot of merged) {
    slots.push({
      id: slot.id,
      slug: lonToSlug(slot.longitude),
      longitude: slot.longitude,
    });
    slotLabel.set(slot.id, slot.label || formatLon(slot.longitude));
  }

  let omittedUcs = 0;
  let omittedOther = 0;
  let unmatched = 0;
  const marks: BeltMark[] = [];

  for (const sat of sats) {
    if (sat.positionSource === "ucs") {
      omittedUcs += 1;
      continue;
    }
    if (!isTleBeltMark(sat) || sat.longitudeGeo === null) {
      omittedOther += 1;
      continue;
    }
    const slot = matchRegistrySlot(sat.longitudeGeo, slots, COLOCATION_WINDOW_DEG);
    if (!slot) {
      unmatched += 1;
      continue;
    }
    marks.push({
      id: sat.noradId ? `norad-${sat.noradId}` : `sat-${sat.id}`,
      name: sat.name,
      longitude: sat.longitudeGeo,
      operator: isLaunchVehicleOperator(sat.operator, sat.launchVehicle) ? null : sat.operator?.trim() || null,
      dispute: beltDisputeClass(sat.positionDisputed),
      deltaDeg: sat.positionDeltaDeg,
      ucsLongitude: sat.longitudeUcs,
      epoch: sat.tleEpoch,
      slug: slot.slug,
      slotId: slot.id,
      slotLabel: slotLabel.get(slot.id) ?? formatLon(slot.longitude),
    });
  }

  marks.sort((a, b) => a.longitude - b.longitude || a.id.localeCompare(b.id));
  const epochLabel = formatBeltEpoch(marks.map((m) => m.epoch)) ?? "the stored TLE epoch";
  return {
    marks,
    omittedUcs,
    omittedOther,
    unmatched,
    epochLabel,
    caption: beltCaption(epochLabel),
  };
}
