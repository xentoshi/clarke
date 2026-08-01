import type Database from "better-sqlite3";

// Change-tracking tables. Populated by the ingest scripts' diff logic (see
// ingest-spacetrack.ts and ingest-fcc.ts) whenever a re-run detects a real
// difference from the previously stored state, rather than on every run.
// There is no backfill: history starts accumulating from the first ingest
// after these tables existed, not before.

export type SlotEventType =
  | "new_authorization"
  | "authorization_lapsed"
  | "licensee_change"
  | "grant_status_change"
  | "satellite_decayed"
  | "satellite_relocated";

export interface SlotEventInput {
  source: "spacetrack" | "fcc";
  eventType: SlotEventType;
  longitudeGeo?: number | null;
  noradId?: string | null;
  callSign?: string | null;
  summary: string;
  detail?: Record<string, unknown>;
}

export function ensureEventTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS slot_events (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      detected_at   TEXT NOT NULL DEFAULT (datetime('now')),
      source        TEXT NOT NULL,
      event_type    TEXT NOT NULL,
      longitude_geo REAL,
      norad_id      TEXT,
      call_sign     TEXT,
      summary       TEXT NOT NULL,
      detail        TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_slot_events_detected ON slot_events(detected_at DESC);
    CREATE INDEX IF NOT EXISTS idx_slot_events_lon ON slot_events(longitude_geo);

    CREATE TABLE IF NOT EXISTS congestion_history (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      slug         TEXT NOT NULL,
      score        INTEGER NOT NULL,
      computed_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_congestion_history_slug ON congestion_history(slug, computed_at DESC);
  `);
}

export function recordSlotEvent(db: Database.Database, event: SlotEventInput): void {
  db.prepare(`
    INSERT INTO slot_events (source, event_type, longitude_geo, norad_id, call_sign, summary, detail)
    VALUES (@source, @eventType, @longitudeGeo, @noradId, @callSign, @summary, @detail)
  `).run({
    source: event.source,
    eventType: event.eventType,
    longitudeGeo: event.longitudeGeo ?? null,
    noradId: event.noradId ?? null,
    callSign: event.callSign ?? null,
    summary: event.summary,
    detail: event.detail ? JSON.stringify(event.detail) : null,
  });
}

export function recordCongestionSnapshot(db: Database.Database, slug: string, score: number): void {
  db.prepare(`
    INSERT INTO congestion_history (slug, score) VALUES (?, ?)
  `).run(slug, score);
}
