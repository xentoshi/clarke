import { NextResponse } from "next/server";
import crypto from "crypto";
import { gzipSync } from "zlib";
import { MAX_PUBLIC_JSON_BYTES, registryCacheToken, registryGeneratedAt } from "../process-cache";

export { MAX_PUBLIC_JSON_BYTES };

export const API_VERSION = "1.0";

export interface FreshnessMeta {
  source: string;
  last_run: string;
  row_count: number;
  age_days: number;
  file_vintage: string | null;
  source_as_of: string | null;
  vintage_age_days: number;
  tle_epoch_min: string | null;
  tle_epoch_max: string | null;
}

export interface Envelope<T> {
  data: T;
  meta: {
    version: string;
    generated_at: string;
    count?: number;
    data_freshness?: FreshnessMeta[];
    view?: string;
    total?: number;
    offset?: number;
    limit?: number | null;
    next_offset?: number | null;
  };
}

/**
 * Public CDN policy. Browser may reuse for a minute, so a new deploy is visible
 * without waiting out the edge TTL. The edge keeps the body for 30 days.
 * A production deploy uses a new CDN cache key, so this does not outlive the
 * monthly redeploy. age_days and the 45-day stale flags stay on the wall clock
 * of the request that filled the cache.
 */
export const PUBLIC_CACHE_CONTROL = "public, max-age=60, s-maxage=2592000, stale-while-revalidate=2592000";
export const PUBLIC_VARY = "Accept-Encoding";
export const VERCEL_CDN_CACHE_CONTROL = "public, s-maxage=2592000, stale-while-revalidate=2592000";

interface OkOptions {
  count?: number;
  cacheSeconds?: number;
  staleSeconds?: number;
  freshness?: FreshnessMeta[];
  /** Process-level response cache key. Set on public agent reads. Omit IP and cookies. */
  cacheKey?: string;
  ifNoneMatch?: string | null;
  /** Pro Terminal and other cookie- or key-gated bodies. Never a shared CDN entry. */
  private?: boolean;
  acceptEncoding?: string | null;
  view?: string;
  total?: number;
  offset?: number;
  limit?: number | null;
  nextOffset?: number | null;
}

interface CachedResponse {
  token: string;
  body: string;
  etag: string;
  cacheControl: string;
  /** Same bytes gzipSync would produce. Repeat hits skip the compress. */
  gzip: Buffer | null;
}

const responseCache = new Map<string, CachedResponse>();

function cacheControlFor(opts: OkOptions, cacheSeconds: number, staleSeconds: number): string {
  if (opts.private) return "private, no-store";
  if (opts.cacheKey) return PUBLIC_CACHE_CONTROL;
  return `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${staleSeconds}`;
}

function gzipBody(serialized: string): Buffer | null {
  if (serialized.length < 860) return null;
  return gzipSync(Buffer.from(serialized), { level: 6 });
}

function payloadFor(
  serialized: string,
  acceptEncoding: string | null | undefined,
  status: number,
  gzip: Buffer | null,
): { body: BodyInit | null; encoding: string | null } {
  if (status === 304) return { body: null, encoding: null };
  if (gzip && acceptEncoding && /\bgzip\b/.test(acceptEncoding)) {
    return { body: new Uint8Array(gzip), encoding: "gzip" };
  }
  return { body: serialized, encoding: null };
}

function etagMatches(header: string | null | undefined, etag: string): boolean {
  if (!header) return false;
  return header.split(",").some((part) => part.trim() === etag);
}

function jsonResponse(
  serialized: string,
  etag: string,
  cacheControl: string,
  status = 200,
  acceptEncoding: string | null = null,
  shared = true,
  gzip: Buffer | null = null,
): NextResponse {
  const encoded = payloadFor(serialized, acceptEncoding, status, gzip);
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": cacheControl,
    ETag: etag,
    Vary: PUBLIC_VARY,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "If-None-Match, Authorization, X-Clarke-Key, Content-Type",
    "Access-Control-Expose-Headers": "ETag",
  };
  if (shared) headers["Vercel-CDN-Cache-Control"] = VERCEL_CDN_CACHE_CONTROL;
  if (encoded.encoding) headers["Content-Encoding"] = encoded.encoding;
  return new NextResponse(encoded.body, { status, headers });
}

export function ok<T>(data: T, opts: OkOptions = {}): NextResponse {
  const cacheSeconds = opts.cacheSeconds ?? 3600;
  const staleSeconds = opts.staleSeconds ?? 60;
  const cacheControl = cacheControlFor(opts, cacheSeconds, staleSeconds);
  const token = opts.cacheKey ? registryCacheToken() : "";
  if (opts.cacheKey) {
    const hit = responseCache.get(opts.cacheKey);
    if (hit && hit.token === token) {
      const accept = opts.acceptEncoding ?? null;
      if (etagMatches(opts.ifNoneMatch, hit.etag)) return jsonResponse(hit.body, hit.etag, hit.cacheControl, 304, accept, !opts.private, hit.gzip);
      return jsonResponse(hit.body, hit.etag, hit.cacheControl, 200, accept, !opts.private, hit.gzip);
    }
  }

  const body: Envelope<T> = {
    data,
    meta: {
      version: API_VERSION,
      generated_at: opts.cacheKey ? registryGeneratedAt() : new Date().toISOString(),
      ...(opts.count !== undefined ? { count: opts.count } : {}),
      ...(opts.freshness ? { data_freshness: opts.freshness } : {}),
      ...(opts.view !== undefined ? { view: opts.view } : {}),
      ...(opts.total !== undefined ? { total: opts.total } : {}),
      ...(opts.offset !== undefined ? { offset: opts.offset } : {}),
      ...(opts.limit !== undefined ? { limit: opts.limit } : {}),
      ...(opts.nextOffset !== undefined ? { next_offset: opts.nextOffset } : {}),
    },
  };

  const serialized = JSON.stringify(body);
  if (serialized.length > MAX_PUBLIC_JSON_BYTES) {
    return NextResponse.json(
      { error: `Response exceeds ${MAX_PUBLIC_JSON_BYTES} bytes. Narrow the query.` },
      {
        status: 413,
        headers: {
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
  const etag = `W/"${crypto.createHash("sha1").update(serialized).digest("hex")}"`;
  const gzip = gzipBody(serialized);
  if (opts.cacheKey) responseCache.set(opts.cacheKey, { token, body: serialized, etag, cacheControl, gzip });
  const shared = !opts.private;
  const accept = opts.acceptEncoding ?? null;
  if (etagMatches(opts.ifNoneMatch, etag)) return jsonResponse(serialized, etag, cacheControl, 304, accept, shared, gzip);
  return jsonResponse(serialized, etag, cacheControl, 200, accept, shared, gzip);
}

export function notFound(message: string): NextResponse {
  return NextResponse.json(
    { error: message },
    {
      status: 404,
      headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" },
    },
  );
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json(
    { error: message },
    {
      status: 400,
      headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" },
    },
  );
}

export function unauthorized(message: string): NextResponse {
  return NextResponse.json(
    { error: message, upgrade: "/pricing" },
    {
      status: 401,
      headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" },
    },
  );
}

export function forbidden(message: string): NextResponse {
  return NextResponse.json(
    { error: message, upgrade: "/pricing" },
    {
      status: 403,
      headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" },
    },
  );
}

export function preflight(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "If-None-Match, Authorization, X-Clarke-Key, Content-Type",
      "Access-Control-Max-Age": "86400",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

export function rateLimited(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests" },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
