// GEO Slot Index delta feed (edition 2).
//
// Occupancy, FCC, and dispute changes between registry snapshots captured at
// ingest. slot_events already stores FCC call-sign diffs and TLE relocation
// rows. Relocation rows are not occupancy enter/leave. This module does not
// read them. When only one snapshot exists, FCC slot_events dated at or
// before that snapshot are the only dated changes. Occupancy and dispute
// changes are not invented.

import { lonToSlug } from "./slot-utils";
import { parseIsoDate } from "./source-vintage";
import type { PositionSource } from "./position-authority";
import type { AgentDisputeKind } from "./agent-slot";

export const DELTA_FEED_EDITION = 2 as const;
export const DELTA_DOMAINS = ["occupancy", "fcc", "dispute"] as const;

export type DeltaDomain = (typeof DELTA_DOMAINS)[number];
export type DeltaCoverage = "bootstrap" | "ingest_deltas";
export type OccupancyChangeKind = "enter" | "leave" | "authority_flip";
export type FccChangeKind = "new" | "lapsed" | "licensee" | "status" | "as_of";
export type DisputeChangeKind = "appear" | "clear" | "kind";
export type DeltaKind = OccupancyChangeKind | FccChangeKind | DisputeChangeKind;
export type DeltaScalar = string | number | null;
export type DeltaSide = Record<string, DeltaScalar>;

export interface DeltaVintage {
  ucsFileVintage: string | null;
  fccAsOf: string | null;
  tleEpochMin: string | null;
  tleEpochMax: string | null;
}

export interface OccupancyFact {
  slug: string;
  longitude: number;
  noradId: string | null;
  name: string;
  occupancyAuthority: PositionSource;
  occupancyLongitude: number | null;
  tleLongitude: number | null;
  ucsLongitude: number | null;
  tleEpoch: string | null;
}

export interface DisputeFact {
  slug: string;
  longitude: number;
  noradId: string | null;
  name: string;
  kind: AgentDisputeKind;
  deltaDeg: number | null;
  positionSource: PositionSource;
  ucsLongitude: number | null;
  tleLongitude: number | null;
  occupancyLongitude: number | null;
}

export interface FccFact {
  slug: string;
  longitude: number;
  callSign: string;
  satelliteName: string | null;
  licensee: string | null;
  grantStatus: string | null;
}

export interface RegistryState {
  vintage: DeltaVintage;
  registrySlotCount: number;
  occupancy: OccupancyFact[];
  disputes: DisputeFact[];
  fcc: FccFact[];
}

export interface DeltaProvenance {
  sources: string[];
  store: "slot_events" | "registry_snapshots";
  rule: string;
  eventId: number | null;
  fromSnapshotId: number | null;
  toSnapshotId: number | null;
  note: string;
}

export interface DeltaChange {
  id: string;
  domain: DeltaDomain;
  kind: DeltaKind;
  slug: string | null;
  longitude: number | null;
  detectedAt: string;
  vintage: DeltaVintage;
  subject: Record<string, string | null>;
  before: DeltaSide | null;
  after: DeltaSide | null;
  provenance: DeltaProvenance;
}

export interface DeltaBaseline {
  snapshotId: number;
  capturedAt: string;
  kind: string;
  triggerSource: string | null;
  registrySlotCount: number;
  occupancyCount: number;
  disputeCount: number;
  fccRowCount: number;
}

export interface DeltaFilter {
  slug: string | null;
  domain: DeltaDomain | null;
  since: string | null;
}

export interface DeltaFeed {
  edition: typeof DELTA_FEED_EDITION;
  name: "GEO Slot Index delta feed";
  cadence: "on_ingest";
  occupancyAuthority: "tle-primary";
  coverage: DeltaCoverage;
  coverageNote: string;
  limitations: string[];
  vintage: DeltaVintage & {
    ucsIngestAt: string | null;
    fccIngestAt: string | null;
    tleIngestAt: string | null;
  };
  baseline: DeltaBaseline | null;
  appliedFilter: DeltaFilter;
  changes: DeltaChange[];
}

export interface RegistrySnapshotRecord {
  id: number;
  /** ISO-8601 UTC. */
  capturedAt: string;
  kind: string;
  triggerSource: string | null;
  state: RegistryState;
}

export interface FccEventRow {
  id: number;
  detectedAt: string;
  eventType: string;
  longitudeGeo: number | null;
  callSign: string | null;
  detail: string | null;
}

export interface DeltaFeedObserved {
  vintage: DeltaVintage;
  ucsIngestAt: string | null;
  fccIngestAt: string | null;
  tleIngestAt: string | null;
}

export class DeltaQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeltaQueryError";
  }
}

const OCCUPANCY_SOURCES = ["Space-Track TLE", "UCS Satellite Database"];
const FCC_SOURCES = ["FCC-SSAL"];

const OCCUPANCY_NOTE =
  "Diff of TLE-primary occupancy membership between registry snapshots. The window is ±0.4 degrees. UCS longitude is the fallback when the TLE fails published gates. TLE longitude is not an FCC assignment or an ITU filing.";

const DISPUTE_NOTE =
  "Diff of dispute records between registry snapshots. tle_ucs_disagreement is an in-window pair whose absolute UCS-TLE difference is above 2 degrees. ucs_ghost is a UCS catalog longitude inside the slot window whose occupancy longitude is outside it and does not agree within 2 degrees.";

const FCC_SNAPSHOT_NOTE =
  "Diff of FCC SSAL rows with a real call sign between registry snapshots. Slug is lonToSlug of the authorization longitude, not the occupancy window. Call sign N/A is not a key.";

const FCC_AS_OF_NOTE =
  "FCC workbook file vintage changed between registry snapshots. ingest_meta.last_run is not this date.";

const FCC_EVENT_NOTE =
  "slot_events row written by FCC ingest when this call sign was new, lapsed, or changed licensee or grant status versus the previous fcc_authorizations table. The prior workbook as-of was not stored on the event.";

const EMPTY_FILTER: DeltaFilter = { slug: null, domain: null, since: null };

export function isRealFccCallSign(callSign: string | null | undefined): callSign is string {
  return !!callSign && callSign !== "N/A";
}

export function toIsoUtc(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = parseIsoDate(value);
  if (!d) return null;
  return d.toISOString();
}

export function emptyVintage(): DeltaVintage {
  return { ucsFileVintage: null, fccAsOf: null, tleEpochMin: null, tleEpochMax: null };
}

export function canonicalStateJson(state: RegistryState): string {
  const normalized: RegistryState = {
    vintage: {
      ucsFileVintage: state.vintage.ucsFileVintage,
      fccAsOf: state.vintage.fccAsOf,
      tleEpochMin: state.vintage.tleEpochMin,
      tleEpochMax: state.vintage.tleEpochMax,
    },
    registrySlotCount: state.registrySlotCount,
    occupancy: [...state.occupancy].sort(compareOccupancy),
    disputes: [...state.disputes].sort(compareDispute),
    fcc: [...state.fcc].sort(compareFcc),
  };
  return JSON.stringify(normalized);
}

export function diffRegistryStates(
  before: RegistryState,
  after: RegistryState,
  meta: { fromSnapshotId: number; toSnapshotId: number; detectedAt: string },
): DeltaChange[] {
  const changes: DeltaChange[] = [];
  const detectedAt = toIsoUtc(meta.detectedAt) ?? meta.detectedAt;
  const vintage = after.vintage;

  const prevOcc = indexBy(before.occupancy, occupancyKey);
  const nextOcc = indexBy(after.occupancy, occupancyKey);
  for (const [key, row] of nextOcc) {
    const prev = prevOcc.get(key);
    if (!prev) {
      changes.push(occupancyChange("enter", row, null, row, key, meta, detectedAt, vintage));
      continue;
    }
    if (prev.occupancyAuthority !== row.occupancyAuthority) {
      changes.push(occupancyChange("authority_flip", row, prev, row, key, meta, detectedAt, vintage));
    }
  }
  for (const [key, row] of prevOcc) {
    if (!nextOcc.has(key)) {
      changes.push(occupancyChange("leave", row, row, null, key, meta, detectedAt, vintage));
    }
  }

  const prevDis = indexBy(before.disputes, disputeKey);
  const nextDis = indexBy(after.disputes, disputeKey);
  for (const [key, row] of nextDis) {
    const prev = prevDis.get(key);
    if (!prev) {
      changes.push(disputeChange("appear", row, null, row, key, meta, detectedAt, vintage));
      continue;
    }
    if (prev.kind !== row.kind) {
      changes.push(disputeChange("kind", row, prev, row, key, meta, detectedAt, vintage));
    }
  }
  for (const [key, row] of prevDis) {
    if (!nextDis.has(key)) {
      changes.push(disputeChange("clear", row, row, null, key, meta, detectedAt, vintage));
    }
  }

  const prevFcc = indexBy(before.fcc.filter((row) => isRealFccCallSign(row.callSign)), (row) => row.callSign);
  const nextFcc = indexBy(after.fcc.filter((row) => isRealFccCallSign(row.callSign)), (row) => row.callSign);
  for (const [callSign, row] of nextFcc) {
    const prev = prevFcc.get(callSign);
    if (!prev) {
      changes.push(fccRowChange("new", row, null, row, meta, detectedAt, vintage));
      continue;
    }
    if (clean(prev.licensee) !== clean(row.licensee)) {
      changes.push(fccRowChange("licensee", row, prev, row, meta, detectedAt, vintage));
    }
    if (clean(prev.grantStatus) !== clean(row.grantStatus)) {
      changes.push(fccRowChange("status", row, prev, row, meta, detectedAt, vintage));
    }
  }
  for (const [callSign, row] of prevFcc) {
    if (!nextFcc.has(callSign)) {
      changes.push(fccRowChange("lapsed", row, row, null, meta, detectedAt, vintage));
    }
  }

  if (clean(before.vintage.fccAsOf) !== clean(after.vintage.fccAsOf)) {
    changes.push({
      id: `fcc:as_of:${meta.toSnapshotId}`,
      domain: "fcc",
      kind: "as_of",
      slug: null,
      longitude: null,
      detectedAt,
      vintage,
      subject: { field: "fccAsOf" },
      before: { fccAsOf: before.vintage.fccAsOf },
      after: { fccAsOf: after.vintage.fccAsOf },
      provenance: {
        sources: FCC_SOURCES,
        store: "registry_snapshots",
        rule: "ingest-meta-file-vintage",
        eventId: null,
        fromSnapshotId: meta.fromSnapshotId,
        toSnapshotId: meta.toSnapshotId,
        note: FCC_AS_OF_NOTE,
      },
    });
  }

  return changes.sort(compareChanges);
}

export function assembleDeltaFeed(input: {
  snapshots: RegistrySnapshotRecord[];
  fccEvents: FccEventRow[];
  observed: DeltaFeedObserved;
  fccByCallSign?: Map<string, FccFact>;
}): DeltaFeed {
  const snapshots = [...input.snapshots].sort((a, b) => {
    const ta = Date.parse(a.capturedAt);
    const tb = Date.parse(b.capturedAt);
    if (ta !== tb) return ta - tb;
    return a.id - b.id;
  });
  const first = snapshots[0] ?? null;
  const latest = snapshots[snapshots.length - 1] ?? null;
  const coverage: DeltaCoverage = snapshots.length >= 2 ? "ingest_deltas" : "bootstrap";
  const eventVintage = first?.state.vintage ?? input.observed.vintage;
  const firstMs = first ? Date.parse(first.capturedAt) : Number.POSITIVE_INFINITY;

  const pre: DeltaChange[] = [];
  for (const event of input.fccEvents) {
    const detectedAt = toIsoUtc(event.detectedAt);
    if (!detectedAt) continue;
    const ms = Date.parse(detectedAt);
    if (Number.isNaN(ms)) continue;
    if (first && ms > firstMs) continue;
    const change = mapFccSlotEvent(event, eventVintage, input.fccByCallSign, first?.id ?? null, detectedAt);
    if (change) pre.push(change);
  }

  const intervalChanges: DeltaChange[] = [];
  for (let i = 1; i < snapshots.length; i++) {
    const prev = snapshots[i - 1];
    const next = snapshots[i];
    intervalChanges.push(
      ...diffRegistryStates(prev.state, next.state, {
        fromSnapshotId: prev.id,
        toSnapshotId: next.id,
        detectedAt: next.capturedAt,
      }),
    );
  }

  const fileVintage = latest?.state.vintage ?? input.observed.vintage;
  return {
    edition: DELTA_FEED_EDITION,
    name: "GEO Slot Index delta feed",
    cadence: "on_ingest",
    occupancyAuthority: "tle-primary",
    coverage,
    coverageNote: coverageNote(coverage),
    limitations: limitationsFor(coverage),
    vintage: {
      ucsFileVintage: fileVintage.ucsFileVintage,
      fccAsOf: fileVintage.fccAsOf,
      tleEpochMin: fileVintage.tleEpochMin,
      tleEpochMax: fileVintage.tleEpochMax,
      ucsIngestAt: toIsoUtc(input.observed.ucsIngestAt),
      fccIngestAt: toIsoUtc(input.observed.fccIngestAt),
      tleIngestAt: toIsoUtc(input.observed.tleIngestAt),
    },
    baseline: latest
      ? {
          snapshotId: latest.id,
          capturedAt: latest.capturedAt,
          kind: latest.kind,
          triggerSource: latest.triggerSource,
          registrySlotCount: latest.state.registrySlotCount,
          occupancyCount: latest.state.occupancy.length,
          disputeCount: latest.state.disputes.length,
          fccRowCount: latest.state.fcc.length,
        }
      : null,
    appliedFilter: { ...EMPTY_FILTER },
    changes: [...pre, ...intervalChanges].sort(compareChanges),
  };
}

export interface DeltaFeedQuery {
  slug?: string;
  domain?: string;
  since?: string;
}

/** Filters apply to `changes` only. Baseline counts stay on the latest snapshot. `since` is exclusive. */
export function selectDeltaChanges(feed: DeltaFeed, query: DeltaFeedQuery = {}): DeltaFeed {
  const slug = query.slug?.trim() || null;
  const domainRaw = query.domain?.trim() || null;
  const sinceRaw = query.since?.trim() || null;

  if (slug && !/^[a-z0-9-]+$/.test(slug)) throw new DeltaQueryError("Invalid slug");
  if (domainRaw && !DELTA_DOMAINS.includes(domainRaw as DeltaDomain)) {
    throw new DeltaQueryError("Invalid domain");
  }
  const domain = domainRaw as DeltaDomain | null;
  let sinceIso: string | null = null;
  let sinceMs = Number.NEGATIVE_INFINITY;
  if (sinceRaw) {
    sinceIso = toIsoUtc(sinceRaw);
    if (!sinceIso) throw new DeltaQueryError("Invalid since");
    sinceMs = Date.parse(sinceIso);
  }

  const changes = feed.changes.filter((change) => {
    if (slug && change.slug !== slug) return false;
    if (domain && change.domain !== domain) return false;
    if (sinceIso) {
      const ms = Date.parse(change.detectedAt);
      if (Number.isNaN(ms) || ms <= sinceMs) return false;
    }
    return true;
  });

  return {
    ...feed,
    appliedFilter: { slug, domain, since: sinceIso },
    changes,
  };
}

export function mapFccSlotEvent(
  event: FccEventRow,
  vintage: DeltaVintage,
  fccByCallSign: Map<string, FccFact> | undefined,
  toSnapshotId: number | null,
  detectedAt: string,
): DeltaChange | null {
  const kind = fccEventKind(event.eventType);
  if (!kind) return null;
  const detail = parseDetail(event.detail);
  const callSign = clean(event.callSign) ?? clean(str(detail.callSign));
  if (!callSign || !isRealFccCallSign(callSign)) return null;
  const lookup = fccByCallSign?.get(callSign) ?? null;
  const longitude = finiteNumber(event.longitudeGeo) ?? lookup?.longitude ?? null;
  const slug = longitude == null ? null : lonToSlug(longitude);
  const satelliteName = lookup?.satelliteName ?? null;
  const licensee = clean(str(detail.licensee)) ?? clean(str(detail.newLicensee)) ?? lookup?.licensee ?? null;
  const oldLicensee = clean(str(detail.oldLicensee));
  const grantStatus = clean(str(detail.grantStatus)) ?? clean(str(detail.newStatus)) ?? lookup?.grantStatus ?? null;
  const oldStatus = clean(str(detail.oldStatus));

  let before: DeltaSide | null = null;
  let after: DeltaSide | null = null;
  if (kind === "new") {
    after = fccSide({
      callSign,
      satelliteName,
      licensee,
      grantStatus,
      longitude,
      orbitalLocation: clean(str(detail.orbitalLocation)),
    });
  } else if (kind === "lapsed") {
    before = fccSide({
      callSign,
      satelliteName,
      licensee,
      grantStatus: null,
      longitude,
      orbitalLocation: null,
    });
  } else if (kind === "licensee") {
    before = fccSide({
      callSign,
      satelliteName,
      licensee: oldLicensee,
      grantStatus,
      longitude,
      orbitalLocation: null,
    });
    after = fccSide({
      callSign,
      satelliteName,
      licensee,
      grantStatus,
      longitude,
      orbitalLocation: null,
    });
  } else {
    before = fccSide({
      callSign,
      satelliteName,
      licensee,
      grantStatus: oldStatus,
      longitude,
      orbitalLocation: null,
    });
    after = fccSide({
      callSign,
      satelliteName,
      licensee,
      grantStatus,
      longitude,
      orbitalLocation: null,
    });
  }

  return {
    id: `fcc:slot_event:${event.id}`,
    domain: "fcc",
    kind,
    slug,
    longitude,
    detectedAt,
    vintage,
    subject: { callSign, satelliteName },
    before,
    after,
    provenance: {
      sources: FCC_SOURCES,
      store: "slot_events",
      rule: "fcc-call-sign",
      eventId: event.id,
      fromSnapshotId: null,
      toSnapshotId,
      note: FCC_EVENT_NOTE,
    },
  };
}

function coverageNote(coverage: DeltaCoverage): string {
  if (coverage === "bootstrap") {
    return "Bootstrap only. Registry snapshots do not yet contain a prior vintage, so occupancy and dispute changes are not listed. FCC changes below are slot_events already recorded at ingest. This is not a reconstructed weekly history.";
  }
  return "Changes between registry snapshots are listed, starting at the first stored snapshot. There is no occupancy or dispute vintage before that snapshot. FCC slot_events at or before the first snapshot remain. Later FCC ingest diffs are the snapshot rows, not a second copy of slot_events.";
}

function limitationsFor(coverage: DeltaCoverage): string[] {
  const shared = [
    "ITU SNS is not ingested. This feed does not report ITU filings, brought-into-use, or network names.",
    "Valuation, congestion, bid/ask, comps, and dollar amounts are not in this feed. Labeled models on the human Slot Terminal are not facts here.",
    "slot_events rows of type satellite_relocated are not occupancy enter or leave. They are not included.",
    "FCC slug is lonToSlug of the authorization longitude. That can differ from the occupancy slot slug.",
    "Call sign N/A is not a diff key, matching FCC ingest.",
    "A call sign that remains listed and changes only longitude does not emit a separate kind. Longitude is included on new, lapsed, licensee, and status rows.",
    "A re-ingest that does not change occupancy membership, dispute records, FCC call-sign rows, or source file vintages does not append a snapshot.",
    "since is exclusive. Changes that share a detectedAt are omitted together when since equals that timestamp.",
  ];
  if (coverage === "bootstrap") {
    return [
      ...shared,
      "coverage is bootstrap. One registry snapshot, or none, is stored, so occupancy and dispute changes are not emitted. There is no earlier weekly occupancy or dispute vintage to diff.",
      "FCC new, lapsed, licensee, and status changes in this response are slot_events from FCC ingest diffs already in the database. They are not a backfilled weekly series.",
      "An as_of change is emitted only when two registry snapshots record different fccAsOf values. The prior workbook date was overwritten in ingest_meta and is not reconstructed here.",
    ];
  }
  return [
    ...shared,
    "coverage is ingest_deltas. Occupancy, dispute, and FCC changes between snapshots are diffs of registry_snapshots. There is no vintage before the first snapshot.",
    "FCC slot_events dated at or before the first snapshot stay in the feed. Later FCC slot_events are not repeated, because the snapshot diff is the record for those intervals.",
    "An as_of change is one row when fccAsOf differs between snapshots. It has no slug.",
  ];
}

function occupancyChange(
  kind: OccupancyChangeKind,
  anchor: OccupancyFact,
  before: OccupancyFact | null,
  after: OccupancyFact | null,
  key: string,
  meta: { fromSnapshotId: number; toSnapshotId: number },
  detectedAt: string,
  vintage: DeltaVintage,
): DeltaChange {
  const token = key.replace(/\|/g, ":");
  return {
    id: `occupancy:${kind}:${token}:${meta.toSnapshotId}`,
    domain: "occupancy",
    kind,
    slug: anchor.slug,
    longitude: anchor.longitude,
    detectedAt,
    vintage,
    subject: { noradId: anchor.noradId, name: anchor.name },
    before: before ? occupancySide(before) : null,
    after: after ? occupancySide(after) : null,
    provenance: {
      sources: OCCUPANCY_SOURCES,
      store: "registry_snapshots",
      rule: "tle-primary",
      eventId: null,
      fromSnapshotId: meta.fromSnapshotId,
      toSnapshotId: meta.toSnapshotId,
      note: OCCUPANCY_NOTE,
    },
  };
}

function disputeChange(
  kind: DisputeChangeKind,
  anchor: DisputeFact,
  before: DisputeFact | null,
  after: DisputeFact | null,
  key: string,
  meta: { fromSnapshotId: number; toSnapshotId: number },
  detectedAt: string,
  vintage: DeltaVintage,
): DeltaChange {
  const token = key.replace(/\|/g, ":");
  return {
    id: `dispute:${kind}:${token}:${meta.toSnapshotId}`,
    domain: "dispute",
    kind,
    slug: anchor.slug,
    longitude: anchor.longitude,
    detectedAt,
    vintage,
    subject: { noradId: anchor.noradId, name: anchor.name },
    before: before ? disputeSide(before) : null,
    after: after ? disputeSide(after) : null,
    provenance: {
      sources: OCCUPANCY_SOURCES,
      store: "registry_snapshots",
      rule: "tle-primary",
      eventId: null,
      fromSnapshotId: meta.fromSnapshotId,
      toSnapshotId: meta.toSnapshotId,
      note: DISPUTE_NOTE,
    },
  };
}

function fccRowChange(
  kind: Exclude<FccChangeKind, "as_of">,
  anchor: FccFact,
  before: FccFact | null,
  after: FccFact | null,
  meta: { fromSnapshotId: number; toSnapshotId: number },
  detectedAt: string,
  vintage: DeltaVintage,
): DeltaChange {
  const row = after ?? before ?? anchor;
  return {
    id: `fcc:${kind}:${anchor.callSign}:${meta.toSnapshotId}`,
    domain: "fcc",
    kind,
    slug: row.slug,
    longitude: row.longitude,
    detectedAt,
    vintage,
    subject: { callSign: anchor.callSign, satelliteName: row.satelliteName },
    before: before ? fccFactSide(before) : null,
    after: after ? fccFactSide(after) : null,
    provenance: {
      sources: FCC_SOURCES,
      store: "registry_snapshots",
      rule: "fcc-call-sign",
      eventId: null,
      fromSnapshotId: meta.fromSnapshotId,
      toSnapshotId: meta.toSnapshotId,
      note: FCC_SNAPSHOT_NOTE,
    },
  };
}

function occupancySide(row: OccupancyFact): DeltaSide {
  return {
    occupancyAuthority: row.occupancyAuthority,
    occupancyLongitude: row.occupancyLongitude,
    tleLongitude: row.tleLongitude,
    ucsLongitude: row.ucsLongitude,
    tleEpoch: row.tleEpoch,
  };
}

function disputeSide(row: DisputeFact): DeltaSide {
  return {
    kind: row.kind,
    deltaDeg: row.deltaDeg,
    positionSource: row.positionSource,
    ucsLongitude: row.ucsLongitude,
    tleLongitude: row.tleLongitude,
    occupancyLongitude: row.occupancyLongitude,
  };
}

function fccFactSide(row: FccFact): DeltaSide {
  return {
    callSign: row.callSign,
    satelliteName: row.satelliteName,
    licensee: row.licensee,
    grantStatus: row.grantStatus,
    longitude: row.longitude,
  };
}

function fccSide(row: {
  callSign: string;
  satelliteName: string | null;
  licensee: string | null;
  grantStatus: string | null;
  longitude: number | null;
  orbitalLocation: string | null;
}): DeltaSide {
  return {
    callSign: row.callSign,
    satelliteName: row.satelliteName,
    licensee: row.licensee,
    grantStatus: row.grantStatus,
    longitude: row.longitude,
    orbitalLocation: row.orbitalLocation,
  };
}

function occupancyKey(row: OccupancyFact): string {
  return `${row.slug}|${identityKey(row.noradId, row.name)}`;
}

function disputeKey(row: DisputeFact): string {
  return `${row.slug}|${identityKey(row.noradId, row.name)}`;
}

function identityKey(noradId: string | null, name: string): string {
  const norad = noradId?.trim();
  if (norad) return `norad:${norad}`;
  return `name:${name.toLowerCase().replace(/[^a-z0-9]+/g, "")}`;
}

function fccEventKind(eventType: string): Exclude<FccChangeKind, "as_of"> | null {
  switch (eventType) {
    case "new_authorization":
      return "new";
    case "authorization_lapsed":
      return "lapsed";
    case "licensee_change":
      return "licensee";
    case "grant_status_change":
      return "status";
    default:
      return null;
  }
}

function parseDetail(detail: string | null): Record<string, unknown> {
  if (!detail) return {};
  try {
    const value = JSON.parse(detail) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return value as Record<string, unknown>;
  } catch {
    return {};
  }
}

function str(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function clean(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function finiteNumber(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return value;
}

function indexBy<T>(rows: T[], keyFn: (row: T) => string): Map<string, T> {
  const map = new Map<string, T>();
  for (const row of rows) map.set(keyFn(row), row);
  return map;
}

function compareChanges(a: DeltaChange, b: DeltaChange): number {
  if (a.detectedAt !== b.detectedAt) return a.detectedAt < b.detectedAt ? -1 : 1;
  const domain = domainRank(a.domain) - domainRank(b.domain);
  if (domain !== 0) return domain;
  const as = a.slug ?? "\uffff";
  const bs = b.slug ?? "\uffff";
  if (as !== bs) return as < bs ? -1 : 1;
  if (a.kind !== b.kind) return a.kind < b.kind ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function domainRank(domain: DeltaDomain): number {
  if (domain === "occupancy") return 0;
  if (domain === "fcc") return 1;
  return 2;
}

function compareOccupancy(a: OccupancyFact, b: OccupancyFact): number {
  return chain([a.slug, b.slug], [a.noradId ?? "", b.noradId ?? ""], [a.name, b.name]);
}

function compareDispute(a: DisputeFact, b: DisputeFact): number {
  return chain([a.slug, b.slug], [a.noradId ?? "", b.noradId ?? ""], [a.name, b.name], [a.kind, b.kind]);
}

function compareFcc(a: FccFact, b: FccFact): number {
  return chain([a.callSign, b.callSign], [a.slug, b.slug]);
}

function chain(...pairs: [string, string][]): number {
  for (const [a, b] of pairs) {
    if (a !== b) return a < b ? -1 : 1;
  }
  return 0;
}
