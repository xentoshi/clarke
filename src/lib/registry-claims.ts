// One registry row per slot claim.
//
// UCS-derived rows used to be one OrbitalSlot per satellite. Satellites that
// share a lonToSlug (occupancy longitude rounded to 0.1°) then appeared as
// repeated labels (103.1°W SES ×2, 61°W Hispamar ×3) and linked to one page.
//
// Merge rule (do not widen this):
// - Group only satellites that are already outside a curated ±0.4° slot.
// - Group key is lonToSlug, the same 0.1° identity the dossier URL uses.
// - Do not merge different slugs, even inside ±0.4°. Nearby claims stay rows.
// - Do not blend operators into a new owner. The registry operator is the
//   canonical name with the most satellites in the slug. Ties break on
//   localeCompare of that canonical name.
// - A source string that equals the launch vehicle is not an operator.
//   It stays on operatorRaw. Nothing is invented in its place.
// - Every distinct source operator string is kept on operatorRaw.

import type { OrbitalSlot } from "@/data/orbital-slots";
import { isLaunchVehicleOperator, resolveOperator } from "./operator-identity";
import { parseUcsLaunchYear } from "./occupancy-quality";
import { formatLon, lonToSlug, slugToLon } from "./slot-utils";

export interface UcsClaimSatellite {
  name: string;
  operator: string | null;
  ownerCountry: string | null;
  purpose: string | null;
  detailedPurpose: string | null;
  longitudeGeo: number | null;
  launchDate: string | null;
  launchVehicle: string | null;
  cosparId: string | null;
  noradId: string | null;
  comments: string | null;
  users: string | null;
}

export interface ClaimOperatorPick {
  /** Canonical display. Empty when every source string was a launch vehicle or blank. */
  display: string;
  /** Distinct UCS operator strings, launch-vehicle strings included, sorted. */
  raws: string[];
}

export function pickClaimOperator(sats: UcsClaimSatellite[]): ClaimOperatorPick {
  const raws = [...new Set(sats.map((s) => (s.operator ?? "").trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
  const counts = new Map<string, number>();
  for (const sat of sats) {
    const raw = (sat.operator ?? "").trim();
    if (!raw || isLaunchVehicleOperator(raw, sat.launchVehicle)) continue;
    const display = resolveOperator(raw).display;
    if (!display) continue;
    counts.set(display, (counts.get(display) ?? 0) + 1);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return { display: ranked[0]?.[0] ?? "", raws };
}

function mode(values: string[]): string {
  const counts = new Map<string, number>();
  for (const value of values) {
    const v = value.trim();
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return ranked[0]?.[0] ?? "";
}

function singleId(sat: UcsClaimSatellite, lon: number): string {
  if (sat.noradId) return `ucs_${sat.noradId}`;
  if (sat.cosparId) return `ucs_${sat.cosparId.replace(/[^a-z0-9]/gi, "_")}`;
  return `ucs_geo_${String(lon).replace(".", "_")}`;
}

function sentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function singleDescription(sat: UcsClaimSatellite): string {
  return [
    sat.purpose && sat.detailedPurpose
      ? sentence(`${sat.purpose}: ${sat.detailedPurpose}`)
      : sentence(sat.purpose ?? ""),
    sat.operator && !isLaunchVehicleOperator(sat.operator, sat.launchVehicle) ? `Operated by ${sat.operator}.` : "",
    isLaunchVehicleOperator(sat.operator, sat.launchVehicle)
      ? `UCS operator string "${(sat.operator ?? "").trim()}" matches the launch vehicle and is not used as the GEO operator.`
      : "",
    sat.launchVehicle ? `Launched on ${sat.launchVehicle}.` : "",
    sat.comments ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

function claimDescription(sats: UcsClaimSatellite[], label: string, pick: ClaimOperatorPick): string {
  const names = [...sats.map((s) => s.name)].sort((a, b) => a.localeCompare(b));
  const operatorLine = pick.display
    ? `Registry operator is ${pick.display}, the canonical name with the most satellites in this slug. Other source strings are not merged into that name.`
    : "No GEO operator. Source strings that match a launch vehicle are not used as one.";
  return [
    `${sats.length} satellites share this registry row because occupancy rounds to the same 0.1° slug (${label}).`,
    `Satellites: ${names.join(", ")}.`,
    pick.raws.length ? `Source operator strings: ${pick.raws.join("; ")}.` : "",
    operatorLine,
  ]
    .filter(Boolean)
    .join(" ");
}

export function collapseUcsClaimSlots(
  sats: UcsClaimSatellite[],
  decayedNoradIds: Set<string>,
): OrbitalSlot[] {
  const groups = new Map<string, UcsClaimSatellite[]>();
  for (const sat of sats) {
    if (sat.longitudeGeo === null || !Number.isFinite(sat.longitudeGeo)) continue;
    const slug = lonToSlug(sat.longitudeGeo);
    const group = groups.get(slug);
    if (group) group.push(sat);
    else groups.set(slug, [sat]);
  }

  const slots: OrbitalSlot[] = [];
  for (const [slug, group] of groups) {
    const lon = slugToLon(slug);
    if (lon === null) continue;
    const ordered = [...group].sort((a, b) => a.name.localeCompare(b.name) || (a.noradId ?? "").localeCompare(b.noradId ?? ""));
    const pick = pickClaimOperator(ordered);
    const label = formatLon(lon);
    const primarySats = pick.display
      ? ordered.filter((s) => !isLaunchVehicleOperator(s.operator, s.launchVehicle) && resolveOperator(s.operator).display === pick.display)
      : [];
    const countryPool = (primarySats.length ? primarySats : ordered).map((s) => s.ownerCountry ?? "");
    const allDecayed = ordered.every((s) => s.noradId && decayedNoradIds.has(s.noradId));
    const names = ordered.map((s) => s.name);
    slots.push({
      id: ordered.length === 1 ? singleId(ordered[0], lon) : `ucs_${slug}`,
      longitude: lon,
      label,
      operator: pick.display,
      operatorRaw: pick.raws.join("; "),
      country: mode(countryPool),
      bands: [],
      status: allDecayed ? "inactive" : "active",
      satellite: names.join(", "),
      coverage: [],
      valueEstimate: "",
      description: ordered.length === 1 ? singleDescription(ordered[0]) : claimDescription(ordered, label, pick),
      launched: ordered.length === 1 ? parseUcsLaunchYear(ordered[0].launchDate) ?? undefined : undefined,
      source: "ucs",
      ucsCount: ordered.length,
      purpose: mode(ordered.map((s) => s.purpose ?? "")) || undefined,
      cosparIds: ordered.map((s) => s.cosparId).filter((id): id is string => Boolean(id)),
      noradIds: ordered.map((s) => s.noradId).filter((id): id is string => Boolean(id)),
      users: (primarySats.find((s) => s.users)?.users ?? ordered.find((s) => s.users)?.users) || undefined,
    });
  }
  return slots;
}
