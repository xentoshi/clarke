import type { NextRequest } from "next/server";

// In-memory token bucket per IP. Per-instance limit; on Vercel this means
// each serverless instance enforces independently — acceptable for a
// public read-only API until we move to a KV-backed limiter.

interface Bucket {
  count: number;
  reset: number;
}

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;
const DEFAULT_MAX = 60;
/** Full slot lists and unpaged satellite dumps. Separate bucket from ordinary reads. */
export const HEAVY_RATE_MAX = 12;

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfter: number;
}

export function checkRateLimit(ip: string, max = DEFAULT_MAX, scope = ""): RateLimitResult {
  const key = scope ? `${scope}:${ip}` : ip;
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now > entry.reset) {
    buckets.set(key, { count: 1, reset: now + WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count >= max) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((entry.reset - now) / 1000)),
    };
  }

  entry.count++;
  return { allowed: true, retryAfter: 0 };
}
