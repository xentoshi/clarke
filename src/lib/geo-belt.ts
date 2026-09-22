// Flat GEO belt geometry and mark rules.
//
// Marks are TLE-primary occupancy longitudes only (same authority as Slot
// Terminal). UCS-fallback positions are omitted, never interpolated onto the
// belt. A mark opens a registry slot that already exists; it does not invent one.
// TLE longitude is a tracked-object location, not an FCC assignment or ITU filing.

import { circularAbsDiffDeg, formatLonFixed, normalizeLonDeg } from "./geo-angle";

export const BELT_LON_MIN = -180;
export const BELT_LON_MAX = 180;
/** Narrowest window. Wide enough to separate a co-located fleet (±0.4°). */
export const BELT_MIN_SPAN_DEG = 1.2;

export type BeltDisputeClass = "tle" | "disputed";

export interface GeoBeltModel {
  marks: BeltMark[];
  omittedUcs: number;
  omittedOther: number;
  unmatched: number;
  epochLabel: string;
  caption: string;
}

export interface BeltMark {
  id: string;
  name: string;
  /** TLE-primary occupancy longitude in (−180, 180]. Not an assignment. */
  longitude: number;
  /** UCS catalog operator, when the row has one. Not an alias-normalized name. */
  operator: string | null;
  dispute: BeltDisputeClass;
  deltaDeg: number | null;
  ucsLongitude: number | null;
  epoch: string | null;
  /** Existing registry slug. Never synthesized for the picture. */
  slug: string;
  slotId: string;
  slotLabel: string;
}

export function beltDisputeClass(positionDisputed: boolean): BeltDisputeClass {
  return positionDisputed ? "disputed" : "tle";
}

export function isTleBeltMark(sat: {
  positionSource: string;
  longitudeGeo: number | null;
  tleUsable: boolean;
}): boolean {
  return (
    sat.positionSource === "tle" &&
    sat.tleUsable &&
    sat.longitudeGeo !== null &&
    Number.isFinite(sat.longitudeGeo)
  );
}

export function projectLongitude(
  lon: number,
  width: number,
  lonMin = BELT_LON_MIN,
  lonMax = BELT_LON_MAX,
): number {
  const span = lonMax - lonMin;
  if (!(width > 0) || !(span > 0)) return 0;
  const clamped = Math.min(lonMax, Math.max(lonMin, normalizeLonDeg(lon)));
  return ((clamped - lonMin) / span) * width;
}

export function unprojectLongitude(
  x: number,
  width: number,
  lonMin = BELT_LON_MIN,
  lonMax = BELT_LON_MAX,
): number {
  const span = lonMax - lonMin;
  if (!(width > 0) || !(span > 0)) return lonMin;
  const lon = lonMin + (x / width) * span;
  return Math.min(lonMax, Math.max(lonMin, lon));
}

export interface RegistrySlotRef {
  id: string;
  slug: string;
  longitude: number;
}

/**
 * Nearest registry slot within the co-location window.
 * Returns null when nothing in `slots` qualifies, so the caller cannot link a slug
 * the registry did not already expose.
 */
export function matchRegistrySlot(
  occupancyLon: number,
  slots: RegistrySlotRef[],
  windowDeg: number,
): RegistrySlotRef | null {
  let best: { slot: RegistrySlotRef; d: number } | null = null;
  for (const slot of slots) {
    if (!slot.slug || !slot.id) continue;
    const d = circularAbsDiffDeg(occupancyLon, slot.longitude);
    if (d > windowDeg) continue;
    if (!best || closerSlot(d, slot, best.d, best.slot)) best = { slot, d };
  }
  return best ? best.slot : null;
}

function closerSlot(d: number, slot: RegistrySlotRef, bestD: number, best: RegistrySlotRef): boolean {
  if (d < bestD - 1e-9) return true;
  if (Math.abs(d - bestD) > 1e-9) return false;
  if (slot.slug !== best.slug) return slot.slug < best.slug;
  return slot.id < best.id;
}

export interface BeltPlacementInput {
  id: string;
  longitude: number;
}

export interface PlacedBeltMark {
  id: string;
  x: number;
  lane: number;
  longitude: number;
}

/**
 * Stack marks that would share an x so each stays a separate hit target.
 * Lanes are a drawing aid. They do not move the longitude.
 */
export function placeBeltMarks(
  marks: BeltPlacementInput[],
  opts: { width: number; lonMin: number; lonMax: number; minGapPx: number; maxLanes: number },
): PlacedBeltMark[] {
  const visible = marks
    .filter((m) => m.longitude >= opts.lonMin && m.longitude <= opts.lonMax)
    .slice()
    .sort((a, b) => a.longitude - b.longitude || a.id.localeCompare(b.id));

  const laneEnds: number[] = [];
  const placed: PlacedBeltMark[] = [];
  const cap = Math.max(1, opts.maxLanes);
  for (const m of visible) {
    const x = projectLongitude(m.longitude, opts.width, opts.lonMin, opts.lonMax);
    let lane = 0;
    while (lane < laneEnds.length && x < laneEnds[lane] + opts.minGapPx) lane += 1;
    if (lane >= cap) lane = cap - 1;
    laneEnds[lane] = x;
    placed.push({ id: m.id, x, lane, longitude: m.longitude });
  }
  return placed;
}

export function zoomLongitudeWindow(
  window: { min: number; max: number },
  anchorLon: number,
  factor: number,
): { min: number; max: number } {
  const span = Math.max(window.max - window.min, BELT_MIN_SPAN_DEG);
  const nextSpan = Math.min(BELT_LON_MAX - BELT_LON_MIN, Math.max(BELT_MIN_SPAN_DEG, span * factor));
  const anchor = Math.min(window.max, Math.max(window.min, anchorLon));
  const ratio = (anchor - window.min) / span;
  return clampWindow(anchor - ratio * nextSpan, nextSpan);
}

export function panLongitudeWindow(
  window: { min: number; max: number },
  deltaDeg: number,
): { min: number; max: number } {
  const span = window.max - window.min;
  return clampWindow(window.min + deltaDeg, span);
}

export function windowAround(lon: number, span: number): { min: number; max: number } {
  const width = Math.min(BELT_LON_MAX - BELT_LON_MIN, Math.max(BELT_MIN_SPAN_DEG, span));
  return clampWindow(lon - width / 2, width);
}

function clampWindow(min: number, span: number): { min: number; max: number } {
  const width = Math.min(BELT_LON_MAX - BELT_LON_MIN, Math.max(BELT_MIN_SPAN_DEG, span));
  let lo = min;
  let hi = lo + width;
  if (lo < BELT_LON_MIN) {
    lo = BELT_LON_MIN;
    hi = lo + width;
  }
  if (hi > BELT_LON_MAX) {
    hi = BELT_LON_MAX;
    lo = hi - width;
  }
  return { min: lo, max: hi };
}

export function parseBeltWindow(
  minRaw: string | undefined,
  maxRaw: string | undefined,
): { min: number; max: number } | null {
  if (minRaw == null || maxRaw == null) return null;
  const min = Number(minRaw);
  const max = Number(maxRaw);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  if (min < BELT_LON_MIN || max > BELT_LON_MAX) return null;
  if (max - min < BELT_MIN_SPAN_DEG) return null;
  return { min, max };
}

export interface BeltTick {
  lon: number;
  major: boolean;
}

export function beltTicks(lonMin: number, lonMax: number): BeltTick[] {
  const span = lonMax - lonMin;
  const step = span > 120 ? 30 : span > 40 ? 10 : span > 12 ? 5 : 1;
  const majorStep = step >= 10 ? 30 : step >= 5 ? 10 : 5;
  const ticks: BeltTick[] = [];
  const start = Math.ceil((lonMin - 1e-9) / step) * step;
  for (let i = 0; i < 800; i += 1) {
    const lon = Math.round((start + i * step) * 1000) / 1000;
    if (lon > lonMax + 1e-6) break;
    if (lon < lonMin - 1e-6) continue;
    if (lon <= BELT_LON_MIN || lon > BELT_LON_MAX) continue;
    const major = Math.abs(lon / majorStep - Math.round(lon / majorStep)) < 1e-6;
    ticks.push({ lon, major });
  }
  return ticks;
}

/** Keep degree labels from colliding. Majors win over minor ticks. */
export function selectTickLabels(
  ticks: BeltTick[],
  xOf: (lon: number) => number,
  minPx: number,
  labelMinors: boolean,
): Set<number> {
  const chosen: { lon: number; x: number }[] = [];
  const groups = [ticks.filter((t) => t.major)];
  if (labelMinors) groups.push(ticks.filter((t) => !t.major));
  for (const group of groups) {
    for (const tick of group) {
      const x = xOf(tick.lon);
      if (chosen.some((c) => Math.abs(c.x - x) < minPx)) continue;
      chosen.push({ lon: tick.lon, x });
    }
  }
  return new Set(chosen.map((c) => c.lon));
}

export function formatTickLabel(lon: number): string {
  const r = Math.round(lon * 10) / 10;
  if (Math.abs(r) < 0.05) return "0°";
  const abs = Number.isInteger(r) ? String(Math.abs(r)) : Math.abs(r).toFixed(1);
  return r > 0 ? `${abs}°E` : `${abs}°W`;
}

export function formatBeltLongitude(lon: number): string {
  return formatLonFixed(lon, 2);
}

export function formatBeltEpoch(epochs: (string | null | undefined)[]): string | null {
  const days = epochs
    .map((e) => (e ?? "").trim().slice(0, 10))
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
  if (days.length === 0) return null;
  let min = days[0];
  let max = days[0];
  for (const day of days) {
    if (day < min) min = day;
    if (day > max) max = day;
  }
  return min === max ? min : `${min} to ${max}`;
}

export function beltCaption(epochAsOf: string): string {
  return `Positions from Space-Track TLE as of ${epochAsOf} · catalog names from UCS · not an ITU assignment.`;
}

export function formatDisputeDetail(deltaDeg: number | null, ucsLongitude: number | null): string | null {
  if (ucsLongitude == null || !Number.isFinite(ucsLongitude)) return null;
  const ucs = formatLonFixed(ucsLongitude, 2);
  if (deltaDeg == null || !Number.isFinite(deltaDeg)) return `UCS catalog ${ucs}`;
  return `UCS catalog ${ucs} · differs by ${deltaDeg.toFixed(2)}°`;
}

export interface BeltReaderModel {
  longitude: string;
  name: string;
  operator: string | null;
  epoch: string | null;
  slotLabel: string;
  slotHref: string;
  dispute: BeltDisputeClass;
  disputeDetail: string | null;
}

export function beltReaderModel(mark: BeltMark): BeltReaderModel {
  return {
    longitude: formatBeltLongitude(mark.longitude),
    name: mark.name,
    operator: mark.operator,
    epoch: mark.epoch ? mark.epoch.slice(0, 10) : null,
    slotLabel: mark.slotLabel,
    slotHref: `/orbital/${mark.slug}`,
    dispute: mark.dispute,
    disputeDetail: mark.dispute === "disputed" ? formatDisputeDetail(mark.deltaDeg, mark.ucsLongitude) : null,
  };
}

export function stepBeltSelection(ids: string[], current: string | null, dir: 1 | -1): string | null {
  if (ids.length === 0) return null;
  if (!current) return dir === 1 ? ids[0] : ids[ids.length - 1];
  const idx = ids.indexOf(current);
  if (idx < 0) return dir === 1 ? ids[0] : ids[ids.length - 1];
  const next = idx + dir;
  if (next < 0 || next >= ids.length) return ids[idx];
  return ids[next];
}
