import type { NextRequest } from "next/server";
import { listSatellites } from "@/lib/agents/operations";
import { ok, badRequest, rateLimited, preflight } from "@/lib/agents/envelope";
import { HEAVY_RATE_MAX, checkRateLimit, getClientIp } from "@/lib/agents/rate-limit";
import { withPublicUsage } from "@/lib/agents/usage-log";

export const OPTIONS = () => preflight();
// Query filters, rate limit, and ETag are per request. A revalidate period would ISR-write each URL.
// Repeat reads stay on the process cache and the CDN Cache-Control header.
export const dynamic = "force-dynamic";

const SAFE_QUERY = /^[A-Za-z0-9 .\-_]{1,80}$/;
const DEFAULT_LIMIT = 100;

export const GET = withPublicUsage("/api/v1/agents/satellites", async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const operator = url.searchParams.get("operator") ?? undefined;
  const ownerCountry = url.searchParams.get("ownerCountry") ?? undefined;
  const limitRaw = url.searchParams.get("limit");
  const offsetRaw = url.searchParams.get("offset");
  const all = url.searchParams.get("all") === "1";

  if (operator && !SAFE_QUERY.test(operator)) return badRequest("Invalid operator filter");
  if (ownerCountry && !SAFE_QUERY.test(ownerCountry)) return badRequest("Invalid ownerCountry filter");

  let limit = DEFAULT_LIMIT;
  if (limitRaw !== null) {
    const n = Number(limitRaw);
    if (!Number.isFinite(n) || n < 1 || n > 1000) return badRequest("limit must be 1..1000");
    limit = Math.floor(n);
  }
  let offset = 0;
  if (offsetRaw !== null) {
    const n = Number(offsetRaw);
    if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) return badRequest("offset must be an integer >= 0");
    offset = n;
  }

  const heavy = all || limit > DEFAULT_LIMIT;
  const rl = checkRateLimit(getClientIp(req), heavy ? HEAVY_RATE_MAX : undefined, heavy ? "sats-heavy" : "");
  if (!rl.allowed) return rateLimited(rl.retryAfter);

  const matched = listSatellites({ operator, ownerCountry });
  const page = all ? matched.slice(offset) : matched.slice(offset, offset + limit);
  const nextOffset = offset + page.length < matched.length ? offset + page.length : null;
  return ok(page, {
    count: page.length,
    total: matched.length,
    offset,
    limit: all ? null : limit,
    nextOffset,
    cacheKey: `agents:satellites:${operator ?? ""}:${ownerCountry ?? ""}:${all ? "all" : limit}:${offset}`,
    ifNoneMatch: req.headers.get("if-none-match"),
    acceptEncoding: req.headers.get("accept-encoding"),
  });
});
