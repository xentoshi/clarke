import type { SlotStatus } from "@/data/orbital-slots";

/**
 * Registry status from occupancy and FCC evidence.
 * A curated "squatted" or "inactive" label does not override a window that
 * has a satellite and an FCC authorization. Squatted means on station with
 * no FCC market-access row, so it requires a satellite.
 */
export function reconcileRegistryStatus(input: {
  curated: SlotStatus;
  occupied: boolean;
  fccLicensed: boolean;
}): SlotStatus {
  if (input.occupied && input.fccLicensed) return "active";
  if (input.occupied && input.curated === "inactive") return "active";
  if (!input.occupied && input.curated === "squatted") return "filed";
  return input.curated;
}
