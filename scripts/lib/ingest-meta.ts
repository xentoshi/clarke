import type Database from "better-sqlite3";

// Records when each data source was last ingested, how many rows it produced,
// and a short human note. One row per source, upserted on every run. Read by
// src/lib/freshness.ts to surface data freshness in the UI and agents API.
export function recordIngest(
  db: Database.Database,
  source: string,
  rowCount: number,
  note?: string,
): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ingest_meta (
      source TEXT PRIMARY KEY,
      last_run TEXT NOT NULL,
      row_count INTEGER NOT NULL,
      note TEXT
    );
  `);
  db.prepare(`
    INSERT INTO ingest_meta (source, last_run, row_count, note)
    VALUES (@source, datetime('now'), @rowCount, @note)
    ON CONFLICT(source) DO UPDATE SET
      last_run = excluded.last_run,
      row_count = excluded.row_count,
      note = excluded.note
  `).run({ source, rowCount, note: note ?? null });
}
