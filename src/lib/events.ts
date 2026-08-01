import { getDb } from "./db";

export interface SlotEvent {
  id: number;
  detectedAt: string; // "YYYY-MM-DD HH:MM:SS" UTC, from SQLite datetime('now')
  source: "spacetrack" | "fcc";
  eventType: string;
  longitudeGeo: number | null;
  noradId: string | null;
  callSign: string | null;
  summary: string;
  detail: string | null;
}

function tableExists(name: string): boolean {
  const db = getDb();
  if (!db) return false;
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
    .get(name) as { name: string } | undefined;
  return !!row;
}

// Reads the slot_events table populated by the ingest scripts' diff logic.
// Returns an empty array if the table doesn't exist yet (DB predates change
// tracking) or if nothing has changed since tracking started — there is no
// backfill, so a quiet feed on a freshly-migrated DB is expected, not a bug.
export function getRecentSlotEvents(limit = 100): SlotEvent[] {
  const db = getDb();
  if (!db || !tableExists("slot_events")) return [];

  const rows = db
    .prepare(`
      SELECT id, detected_at as detectedAt, source, event_type as eventType,
             longitude_geo as longitudeGeo, norad_id as noradId, call_sign as callSign,
             summary, detail
      FROM slot_events
      ORDER BY detected_at DESC, id DESC
      LIMIT ?
    `)
    .all(limit) as SlotEvent[];

  return rows;
}
