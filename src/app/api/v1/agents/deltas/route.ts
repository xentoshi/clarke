import type { NextRequest } from "next/server";
import { freshnessMeta, listDeltas } from "@/lib/agents/operations";
import { DeltaQueryError } from "@/lib/delta-feed";
import { ok, badRequest, rateLimited, preflight } from "@/lib/agents/envelope";
import { checkRateLimit, getClientIp } from "@/lib/agents/rate-limit";
import { withPublicUsage } from "@/lib/agents/usage-log";

export const OPTIONS = () => preflight();
// Query filters, rate limit, and ETag are per request. A revalidate period would ISR-write each URL.
// Repeat reads stay on the process cache and the CDN Cache-Control header.
export const dynamic = "force-dynamic";

function param(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export const GET = withPublicUsage("/api/v1/agents/deltas", async function GET(req: NextRequest) {
  const rl = checkRateLimit(getClientIp(req));
  if (!rl.allowed) return rateLimited(rl.retryAfter);

  try {
    const data = listDeltas({
      slug: param(req.nextUrl.searchParams.get("slug")),
      domain: param(req.nextUrl.searchParams.get("domain")),
      since: param(req.nextUrl.searchParams.get("since")),
    });
    return ok(data, {
      count: data.changes.length,
      freshness: freshnessMeta(),
      cacheKey: `agents:deltas:${param(req.nextUrl.searchParams.get("slug")) ?? ""}:${param(req.nextUrl.searchParams.get("domain")) ?? ""}:${param(req.nextUrl.searchParams.get("since")) ?? ""}`,
      ifNoneMatch: req.headers.get("if-none-match"),
    });
  } catch (err) {
    if (err instanceof DeltaQueryError) return badRequest(err.message);
    throw err;
  }
});
