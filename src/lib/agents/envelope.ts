import { NextResponse } from "next/server";
import crypto from "crypto";
import { MAX_PUBLIC_JSON_BYTES, registryCacheToken } from "../process-cache";

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
  };
}

interface OkOptions {
  count?: number;
  cacheSeconds?: number;
  staleSeconds?: number;
  freshness?: FreshnessMeta[];
  /** Process-level response cache key. Set on public agent reads. */
  cacheKey?: string;
  ifNoneMatch?: string | null;
}

interface CachedResponse {
  token: string;
  body: string;
  etag: string;
  cacheControl: string;
}

const responseCache = new Map<string, CachedResponse>();

function cacheControlFor(opts: OkOptions, cacheSeconds: number, staleSeconds: number): string {
  if (!opts.cacheKey) {
    return `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${staleSeconds}`;
  }
  return `public, max-age=60, s-maxage=${cacheSeconds}, stale-while-revalidate=${staleSeconds}`;
}

function etagMatches(header: string | null | undefined, etag: string): boolean {
  if (!header) return false;
  return header.split(",").some((part) => part.trim() === etag);
}

function jsonResponse(serialized: string, etag: string, cacheControl: string, status = 200): NextResponse {
  return new NextResponse(status === 304 ? null : serialized, {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": cacheControl,
      ETag: etag,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "If-None-Match, Authorization, X-Clarke-Key, Content-Type",
      "Access-Control-Expose-Headers": "ETag",
    },
  });
}

export function ok<T>(data: T, opts: OkOptions = {}): NextResponse {
  const cacheSeconds = opts.cacheSeconds ?? 3600;
  const staleSeconds = opts.staleSeconds ?? 60;
  const cacheControl = cacheControlFor(opts, cacheSeconds, staleSeconds);
  const token = opts.cacheKey ? registryCacheToken() : "";
  if (opts.cacheKey) {
    const hit = responseCache.get(opts.cacheKey);
    if (hit && hit.token === token) {
      if (etagMatches(opts.ifNoneMatch, hit.etag)) return jsonResponse(hit.body, hit.etag, hit.cacheControl, 304);
      return jsonResponse(hit.body, hit.etag, hit.cacheControl);
    }
  }

  const body: Envelope<T> = {
    data,
    meta: {
      version: API_VERSION,
      generated_at: new Date().toISOString(),
      ...(opts.count !== undefined ? { count: opts.count } : {}),
      ...(opts.freshness ? { data_freshness: opts.freshness } : {}),
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
  if (opts.cacheKey) responseCache.set(opts.cacheKey, { token, body: serialized, etag, cacheControl });
  if (etagMatches(opts.ifNoneMatch, etag)) return jsonResponse(serialized, etag, cacheControl, 304);
  return jsonResponse(serialized, etag, cacheControl);
}

export function notFound(message: string): NextResponse {
  return NextResponse.json(
    { error: message },
    {
      status: 404,
      headers: { "Access-Control-Allow-Origin": "*" },
    },
  );
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json(
    { error: message },
    {
      status: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
    },
  );
}

export function unauthorized(message: string): NextResponse {
  return NextResponse.json(
    { error: message, upgrade: "/pricing" },
    {
      status: 401,
      headers: { "Access-Control-Allow-Origin": "*" },
    },
  );
}

export function forbidden(message: string): NextResponse {
  return NextResponse.json(
    { error: message, upgrade: "/pricing" },
    {
      status: 403,
      headers: { "Access-Control-Allow-Origin": "*" },
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
