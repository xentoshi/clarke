import type Database from "better-sqlite3";

export interface IngestExtra {
  fileVintage?: string | null;
  sourceAsOf?: string | null;
  fileSha256?: string | null;
  tleEpochMin?: string | null;
  tleEpochMax?: string | null;
}

export function ensureIngestMeta(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ingest_meta (
      source TEXT PRIMARY KEY,
      last_run TEXT NOT NULL,
      row_count INTEGER NOT NULL,
      note TEXT
    );
  `);
  const cols = new Set(
    (db.prepare("PRAGMA table_info(ingest_meta)").all() as { name: string }[]).map((c) => c.name),
  );
  const add = (name: string, ddl: string) => {
    if (!cols.has(name)) db.exec(`ALTER TABLE ingest_meta ADD COLUMN ${ddl}`);
  };
  add("file_vintage", "file_vintage TEXT");
  add("source_as_of", "source_as_of TEXT");
  add("file_sha256", "file_sha256 TEXT");
  add("tle_epoch_min", "tle_epoch_min TEXT");
  add("tle_epoch_max", "tle_epoch_max TEXT");
}

// Records when each data source was last ingested, how many rows it produced,
// and source vintage (file/workbook/TLE epoch) distinct from the ingest clock.
export function recordSourceVintage(
  db: Database.Database,
  source: string,
  extra: IngestExtra,
): void {
  ensureIngestMeta(db);
  const existing = db.prepare("SELECT source FROM ingest_meta WHERE source = ?").get(source) as { source: string } | undefined;
  if (!existing) return;
  db.prepare(`
    UPDATE ingest_meta SET
      file_vintage = COALESCE(@fileVintage, file_vintage),
      source_as_of = COALESCE(@sourceAsOf, source_as_of),
      file_sha256 = COALESCE(@fileSha256, file_sha256),
      tle_epoch_min = COALESCE(@tleEpochMin, tle_epoch_min),
      tle_epoch_max = COALESCE(@tleEpochMax, tle_epoch_max)
    WHERE source = @source
  `).run({
    source,
    fileVintage: extra.fileVintage ?? null,
    sourceAsOf: extra.sourceAsOf ?? extra.fileVintage ?? null,
    fileSha256: extra.fileSha256 ?? null,
    tleEpochMin: extra.tleEpochMin ?? null,
    tleEpochMax: extra.tleEpochMax ?? null,
  });
}

export function recordIngest(
  db: Database.Database,
  source: string,
  rowCount: number,
  note?: string,
  extra: IngestExtra = {},
): void {
  ensureIngestMeta(db);
  db.prepare(`
    INSERT INTO ingest_meta (
      source, last_run, row_count, note,
      file_vintage, source_as_of, file_sha256, tle_epoch_min, tle_epoch_max
    )
    VALUES (
      @source, datetime('now'), @rowCount, @note,
      @fileVintage, @sourceAsOf, @fileSha256, @tleEpochMin, @tleEpochMax
    )
    ON CONFLICT(source) DO UPDATE SET
      last_run = excluded.last_run,
      row_count = excluded.row_count,
      note = excluded.note,
      file_vintage = COALESCE(excluded.file_vintage, ingest_meta.file_vintage),
      source_as_of = COALESCE(excluded.source_as_of, ingest_meta.source_as_of),
      file_sha256 = COALESCE(excluded.file_sha256, ingest_meta.file_sha256),
      tle_epoch_min = COALESCE(excluded.tle_epoch_min, ingest_meta.tle_epoch_min),
      tle_epoch_max = COALESCE(excluded.tle_epoch_max, ingest_meta.tle_epoch_max)
  `).run({
    source,
    rowCount,
    note: note ?? null,
    fileVintage: extra.fileVintage ?? null,
    sourceAsOf: extra.sourceAsOf ?? extra.fileVintage ?? null,
    fileSha256: extra.fileSha256 ?? null,
    tleEpochMin: extra.tleEpochMin ?? null,
    tleEpochMax: extra.tleEpochMax ?? null,
  });
}
