import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

let _db: Database.Database | null = null;

export function getDb(): Database.Database | null {
  if (_db) return _db;
  const dbPath = path.join(process.cwd(), "data", "clarke.db");
  if (!fs.existsSync(dbPath)) return null;
  _db = new Database(dbPath, { readonly: true });
  return _db;
}

/** Release the cached read connection so a writer in this process can lock the file. */
export function closeDb(): void {
  if (!_db) return;
  _db.close();
  _db = null;
}
