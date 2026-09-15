import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

let _db: Database.Database | null = null;
let _missing = false;

export function terminalDbPath(): string {
  return path.join(process.cwd(), "data", "terminal.db");
}

export function getTerminalDb(): Database.Database | null {
  if (_db) return _db;
  if (_missing) return null;
  const dbPath = terminalDbPath();
  if (!fs.existsSync(dbPath)) {
    _missing = true;
    return null;
  }
  _db = new Database(dbPath, { readonly: true });
  return _db;
}

export function openTerminalDbWritable(): Database.Database {
  const dbPath = terminalDbPath();
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS model_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model_version TEXT NOT NULL,
      as_of TEXT NOT NULL,
      slot_count INTEGER NOT NULL,
      note TEXT
    );
    CREATE TABLE IF NOT EXISTS valuation_snapshots (
      slug TEXT NOT NULL,
      as_of TEXT NOT NULL,
      point INTEGER NOT NULL,
      low INTEGER NOT NULL,
      high INTEGER NOT NULL,
      confidence TEXT NOT NULL,
      non_commercial INTEGER NOT NULL DEFAULT 0,
      drivers_json TEXT NOT NULL,
      model_version TEXT NOT NULL DEFAULT 'v0',
      PRIMARY KEY (slug, as_of)
    );
    CREATE INDEX IF NOT EXISTS idx_val_slug ON valuation_snapshots(slug);
  `);
  return db;
}
