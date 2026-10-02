// Registry snapshots sit next to ingest_meta and slot_events. Each row is the
// occupancy, dispute, and FCC call-sign state after an ingest, plus file
// vintages. The delta feed diffs consecutive rows. It does not keep a second
// product database.

import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import { getDb } from "./db";
import { listAgentSlots, type AgentOccupancyObservation } from "./agent-slot";
import { getAllFccAuthorizations } from "./satellites";
import { getDataFreshness, type SourceFreshness } from "./freshness";
import { lonToSlug } from "./slot-utils";
import {
  assembleDeltaFeed,
  canonicalStateJson,
  isRealFccCallSign,
  toIsoUtc,
  type DeltaFeed,
  type DeltaFeedObserved,
  type DeltaVintage,
  type DisputeFact,
  type FccEventRow,
  type FccFact,
  type OccupancyFact,
  type RegistrySnapshotRecord,
  type RegistryState,
} from "./delta-feed";

const DB_PATH = path.join(process.cwd(), "data", "clarke.db");

interface SnapshotRow {
  id: number;
  capturedAt: string;
  kind: string;
  triggerSource: string | null;
  stateJson: string;
}

export function buildCurrentRegistryState(): RegistryState {
  const freshness = getDataFreshness();
  const slots = listAgentSlots();
  const occupancy: OccupancyFact[] = [];
  const disputes: DisputeFact[] = [];
  for (const slot of slots) {
    for (const row of slot.occupancy) {
      occupancy.push({
        slug: slot.slug,
        longitude: slot.longitude,
        noradId: clean(row.noradId),
        name: row.name,
        occupancyAuthority: row.occupancyAuthority,
        occupancyLongitude: occupancyLongitudeOf(row),
        tleLongitude: row.tleLongitude,
        ucsLongitude: row.ucsLongitude,
        tleEpoch: row.tleEpoch,
      });
    }
    for (const row of slot.disputes) {
      disputes.push({
        slug: slot.slug,
        longitude: slot.longitude,
        noradId: clean(row.noradId),
        name: row.name,
        kind: row.kind,
        deltaDeg: row.deltaDeg,
        positionSource: row.positionSource,
        ucsLongitude: row.ucsLongitude,
        tleLongitude: row.tleLongitude,
        occupancyLongitude: row.occupancyLongitude,
      });
    }
  }

  const fcc = fccFactsFromDb();

  return {
    vintage: vintageFromFreshness(freshness),
    registrySlotCount: slots.length,
    occupancy,
    disputes,
    fcc,
  };
}

export function observedFromFreshness(rows: SourceFreshness[]): DeltaFeedObserved {
  const ucs = rows.find((row) => row.source === "UCS");
  const fcc = rows.find((row) => row.source === "FCC-SSAL");
  const tle = rows.find((row) => row.source === "Space-Track TLE");
  return {
    vintage: vintageFromFreshness(rows),
    ucsIngestAt: ucs?.lastRun ?? null,
    fccIngestAt: fcc?.lastRun ?? null,
    tleIngestAt: tle?.lastRun ?? null,
  };
}

export function readRegistrySnapshots(): RegistrySnapshotRecord[] {
  const db = getDb();
  if (!db || !tableExists(db, "registry_snapshots")) return [];
  const rows = db.prepare(`
    SELECT id, captured_at as capturedAt, kind, trigger_source as triggerSource, state_json as stateJson
    FROM registry_snapshots
    ORDER BY captured_at ASC, id ASC
  `).all() as SnapshotRow[];
  return rows.map((row) => {
    const capturedAt = toIsoUtc(row.capturedAt);
    if (!capturedAt) throw new Error(`registry_snapshots id ${row.id} has an unreadable captured_at`);
    return {
      id: row.id,
      capturedAt,
      kind: row.kind,
      triggerSource: row.triggerSource,
      state: JSON.parse(row.stateJson) as RegistryState,
    };
  });
}

export function readFccSlotEvents(): FccEventRow[] {
  const db = getDb();
  if (!db || !tableExists(db, "slot_events")) return [];
  return db.prepare(`
    SELECT id, detected_at as detectedAt, event_type as eventType,
           longitude_geo as longitudeGeo, call_sign as callSign, detail
    FROM slot_events
    WHERE source = 'fcc'
      AND event_type IN ('new_authorization', 'authorization_lapsed', 'licensee_change', 'grant_status_change')
    ORDER BY detected_at ASC, id ASC
  `).all() as FccEventRow[];
}

export function fccFactsByCallSign(facts: FccFact[]): Map<string, FccFact> {
  const map = new Map<string, FccFact>();
  for (const fact of facts) map.set(fact.callSign, fact);
  return map;
}

export function buildDeltaFeedFromDb(): DeltaFeed {
  return assembleDeltaFeed({
    snapshots: readRegistrySnapshots(),
    fccEvents: readFccSlotEvents(),
    observed: observedFromFreshness(getDataFreshness()),
    fccByCallSign: fccFactsByCallSign(fccFactsFromDb()),
  });
}

export function fccFactsFromDb(): FccFact[] {
  const fcc: FccFact[] = [];
  for (const row of getAllFccAuthorizations()) {
    if (!isRealFccCallSign(row.callSign) || row.longitudeGeo == null || !Number.isFinite(row.longitudeGeo)) {
      continue;
    }
    fcc.push({
      slug: lonToSlug(row.longitudeGeo),
      longitude: row.longitudeGeo,
      callSign: row.callSign,
      satelliteName: clean(row.satelliteName),
      licensee: clean(row.licensee),
      grantStatus: clean(row.grantStatus),
    });
  }
  return fcc;
}

export interface PersistSnapshotResult {
  inserted: boolean;
  id: number;
  kind: string;
  triggerSource: string;
  occupancyCount: number;
  disputeCount: number;
  fccRowCount: number;
  registrySlotCount: number;
}

export function persistRegistrySnapshot(state: RegistryState, triggerSource: string): PersistSnapshotResult {
  if (!fs.existsSync(DB_PATH)) throw new Error(`Database not found: ${DB_PATH}`);
  const db = new Database(DB_PATH);
  db.pragma("busy_timeout = 5000");
  try {
    ensureRegistrySnapshots(db);
    const stateJson = canonicalStateJson(state);
    const latest = db.prepare(`
      SELECT id, state_json as stateJson FROM registry_snapshots ORDER BY id DESC LIMIT 1
    `).get() as { id: number; stateJson: string } | undefined;
    const counts = {
      occupancyCount: state.occupancy.length,
      disputeCount: state.disputes.length,
      fccRowCount: state.fcc.length,
      registrySlotCount: state.registrySlotCount,
    };
    if (latest && canonicalStateJson(JSON.parse(latest.stateJson) as RegistryState) === stateJson) {
      const kind = (db.prepare("SELECT kind FROM registry_snapshots WHERE id = ?").get(latest.id) as { kind: string }).kind;
      return { inserted: false, id: latest.id, kind, triggerSource, ...counts };
    }
    const existing = (db.prepare("SELECT COUNT(*) as n FROM registry_snapshots").get() as { n: number }).n;
    const kind = existing === 0 ? "bootstrap" : "ingest";
    const info = db.prepare(`
      INSERT INTO registry_snapshots (kind, trigger_source, state_json)
      VALUES (?, ?, ?)
    `).run(kind, triggerSource, stateJson);
    return { inserted: true, id: Number(info.lastInsertRowid), kind, triggerSource, ...counts };
  } finally {
    db.close();
  }
}

export function ensureRegistrySnapshots(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS registry_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      captured_at TEXT NOT NULL DEFAULT (datetime('now')),
      kind TEXT NOT NULL,
      trigger_source TEXT,
      state_json TEXT NOT NULL
    );
  `);
}

function vintageFromFreshness(rows: SourceFreshness[]): DeltaVintage {
  const ucs = rows.find((row) => row.source === "UCS");
  const fcc = rows.find((row) => row.source === "FCC-SSAL");
  const tle = rows.find((row) => row.source === "Space-Track TLE");
  return {
    ucsFileVintage: ucs?.fileVintage ?? ucs?.sourceAsOf ?? null,
    fccAsOf: fcc?.fileVintage ?? fcc?.sourceAsOf ?? null,
    tleEpochMin: tle?.tleEpochMin ?? null,
    tleEpochMax: tle?.tleEpochMax ?? null,
  };
}

function occupancyLongitudeOf(row: AgentOccupancyObservation): number | null {
  if (row.occupancyAuthority === "tle") return row.tleLongitude;
  if (row.occupancyAuthority === "ucs") return row.ucsLongitude;
  return null;
}

function clean(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function tableExists(db: Database.Database, name: string): boolean {
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(name) as
    | { name: string }
    | undefined;
  return !!row;
}
