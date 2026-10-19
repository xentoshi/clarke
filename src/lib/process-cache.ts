import fs from "fs";
import path from "path";

// Process-local memo for public registry reads. The key is the SQLite file
// mtime and size, so a new ingest in this process drops the cache. Vercel
// Fluid still runs one instance at a time; a cold instance pays the build
// once, and later requests in that process reuse it.

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

export function registryCacheToken(): string {
  try {
    const stat = fs.statSync(DB_PATH);
    return `${stat.mtimeMs}:${stat.size}`;
  } catch {
    return "missing";
  }
}

/** Stable envelope time. Public ETags stay put until clarke.db changes. */
export function registryGeneratedAt(): string {
  const token = registryCacheToken();
  const ms = Number(token.split(":")[0]);
  if (!Number.isFinite(ms) || token === "missing") return "1970-01-01T00:00:00.000Z";
  return new Date(ms).toISOString();
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
