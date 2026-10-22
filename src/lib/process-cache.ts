import fs from "fs";
import path from "path";
import { getDb } from "./db";

// Process-local memo for public registry reads. The key is the newest
// ingest_meta.last_run plus the SQLite file size. Vercel rewrites traced
// file mtimes to 2018-10-20T01:46:40Z (Unix 1540000000), so mtime is not a
// data clock. A cold instance pays the build once; later requests reuse it.

const DB_PATH = path.join(process.cwd(), "data", "clarke.db");

interface Entry {
  token: string;
  value: unknown;
}

/** Hard cap for a public JSON body. Delta pages and slot lists fit under this. */
export const MAX_PUBLIC_JSON_BYTES = 2_500_000;

const store = new Map<string, Entry>();
let hits = 0;
let misses = 0;

const FIXED_FILE_MTIME_MS = 1_540_000_000_000;

interface RegistryStamp {
  token: string;
  generatedAt: string;
  size: number;
  mtimeMs: number;
}

let stampMemo: RegistryStamp | null = null;

function lastRunToIso(lastRun: string | null | undefined): string | null {
  if (!lastRun) return null;
  const trimmed = lastRun.trim();
  if (!trimmed) return null;
  const isoish = trimmed.includes("T") ? trimmed : `${trimmed.replace(" ", "T")}Z`;
  const ms = Date.parse(isoish);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toISOString();
}

function newestIngestIso(): string | null {
  const db = getDb();
  if (!db) return null;
  try {
    const row = db.prepare("SELECT MAX(last_run) AS lastRun FROM ingest_meta").get() as
      | { lastRun: string | null }
      | undefined;
    return lastRunToIso(row?.lastRun);
  } catch {
    return null;
  }
}

function registryStamp(): RegistryStamp {
  let size = 0;
  let mtimeMs = 0;
  try {
    const stat = fs.statSync(DB_PATH);
    size = stat.size;
    mtimeMs = stat.mtimeMs;
  } catch {
    return { token: "missing", generatedAt: "1970-01-01T00:00:00.000Z", size: 0, mtimeMs: 0 };
  }
  if (stampMemo && stampMemo.size === size && stampMemo.mtimeMs === mtimeMs) return stampMemo;
  const generatedAt = newestIngestIso() ?? "1970-01-01T00:00:00.000Z";
  // Ignore the reproducible-build mtime. Size plus the ingest clock still
  // changes when a new clarke.db is deployed.
  const clock = Math.abs(mtimeMs - FIXED_FILE_MTIME_MS) < 1500 ? "fixed" : String(mtimeMs);
  stampMemo = { token: `${generatedAt}:${size}:${clock}`, generatedAt, size, mtimeMs };
  return stampMemo;
}

export function registryCacheToken(): string {
  return registryStamp().token;
}

/** Newest ingest_meta.last_run. Stable until the committed database changes. */
export function registryGeneratedAt(): string {
  return registryStamp().generatedAt;
}

export function cachedRead<T>(key: string, load: () => T): T {
  const token = registryCacheToken();
  const hit = store.get(key);
  if (hit && hit.token === token) {
    hits += 1;
    return hit.value as T;
  }
  misses += 1;
  const value = load();
  store.set(key, { token, value });
  return value;
}

export function processCacheStats(): { hits: number; misses: number } {
  return { hits, misses };
}
