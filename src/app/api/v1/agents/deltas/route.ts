import type { NextRequest } from "next/server";
import { freshnessMeta, listDeltas } from "@/lib/agents/operations";
import { DeltaQueryError } from "@/lib/delta-feed";
import { ok, badRequest, rateLimited, preflight } from "@/lib/agents/envelope";
import { checkRateLimit, getClientIp } from "@/lib/agents/rate-limit";

export const OPTIONS = () => preflight();
// Query filters, rate limit, and ETag are per request. A revalidate period would ISR-write each URL.
// Repeat reads stay on the process cache and the CDN Cache-Control header.
export const dynamic = "force-dynamic";

function param(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export async function GET(req: NextRequest) {
  const rl = checkRateLimit(getClientIp(req));
  if (!rl.allowed) return rateLimited(rl.retryAfter);

  const slug = param(req.nextUrl.searchParams.get("slug"));
  const domain = param(req.nextUrl.searchParams.get("domain"));
  const since = param(req.nextUrl.searchParams.get("since"));
  const after = param(req.nextUrl.searchParams.get("after"));

  try {
    const data = listDeltas({ slug, domain, since, after });
    return ok(data, {
      count: data.changes.length,
      freshness: freshnessMeta(),
      cacheKey: `agents:deltas:${slug ?? ""}:${domain ?? ""}:${since ?? ""}:${after ?? ""}`,
      ifNoneMatch: req.headers.get("if-none-match"),
      acceptEncoding: req.headers.get("accept-encoding"),
    });
  } catch (err) {
    if (err instanceof DeltaQueryError) return badRequest(err.message);
    throw err;
  }
}
