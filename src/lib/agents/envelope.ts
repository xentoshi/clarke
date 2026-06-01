import { NextResponse } from "next/server";
import crypto from "crypto";

export const API_VERSION = "1.0";

export interface FreshnessMeta {
  source: string;
  last_run: string;
  row_count: number;
  age_days: number;
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
}

export function ok<T>(data: T, opts: OkOptions = {}): NextResponse {
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
  const etag = `W/"${crypto.createHash("sha1").update(serialized).digest("hex")}"`;
  const cacheSeconds = opts.cacheSeconds ?? 300;
  const staleSeconds = opts.staleSeconds ?? 60;

  return new NextResponse(serialized, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${staleSeconds}`,
      ETag: etag,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "If-None-Match",
      "Access-Control-Expose-Headers": "ETag",
    },
  });
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

export function preflight(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "If-None-Match",
      "Access-Control-Max-Age": "86400",
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
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
