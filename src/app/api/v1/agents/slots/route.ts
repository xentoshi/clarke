import type { NextRequest } from "next/server";
import { freshnessMeta } from "@/lib/agents/operations";
import { pageSlotList, parseSlotListSearch, slotListIsHeavy } from "@/lib/agents/slot-page";
import { ok, badRequest, rateLimited, preflight } from "@/lib/agents/envelope";
import { HEAVY_RATE_MAX, checkRateLimit, getClientIp } from "@/lib/agents/rate-limit";
import { withPublicUsage } from "@/lib/agents/usage-log";

export const OPTIONS = () => preflight();
// Request-aware (rate limit and ETag). A revalidate period would ISR-write this body.
// Repeat reads stay on the process cache and the CDN Cache-Control header.
// The cache key is the query, not the client IP or cookie.
export const dynamic = "force-dynamic";

export const GET = withPublicUsage("/api/v1/agents/slots", async function GET(req: NextRequest) {
  const parsed = parseSlotListSearch(req.nextUrl.searchParams);
  if (!parsed.ok) return badRequest(parsed.error);

  const heavy = slotListIsHeavy(parsed.query);
  const rl = checkRateLimit(getClientIp(req), heavy ? HEAVY_RATE_MAX : undefined, heavy ? "slots-heavy" : "");
  if (!rl.allowed) return rateLimited(rl.retryAfter);

  const page = pageSlotList(parsed.query);
  const { view, offset, limit, all } = parsed.query;
  return ok(page.slots, {
    count: page.slots.length,
    freshness: freshnessMeta(),
    view: page.view,
    total: page.total,
    offset: page.offset,
    limit: page.limit,
    nextOffset: page.nextOffset,
    cacheKey: `agents:slots:${view}:${all ? "all" : "page"}:${offset}:${limit ?? ""}`,
    ifNoneMatch: req.headers.get("if-none-match"),
    acceptEncoding: req.headers.get("accept-encoding"),
  });
});
