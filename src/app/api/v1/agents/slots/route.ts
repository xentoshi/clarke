import type { NextRequest } from "next/server";
import { listSlots, freshnessMeta } from "@/lib/agents/operations";
import { ok, rateLimited, preflight } from "@/lib/agents/envelope";
import { checkRateLimit, getClientIp } from "@/lib/agents/rate-limit";
import { withPublicUsage } from "@/lib/agents/usage-log";

export const OPTIONS = () => preflight();
// Request-aware (rate limit and ETag). A revalidate period would ISR-write this body.
// Repeat reads stay on the process cache and the CDN Cache-Control header.
export const dynamic = "force-dynamic";

export const GET = withPublicUsage("/api/v1/agents/slots", async function GET(req: NextRequest) {
  const rl = checkRateLimit(getClientIp(req));
  if (!rl.allowed) return rateLimited(rl.retryAfter);

  const data = listSlots();
  return ok(data, {
    count: data.length,
    freshness: freshnessMeta(),
    cacheKey: "agents:slots",
    ifNoneMatch: req.headers.get("if-none-match"),
  });
});
