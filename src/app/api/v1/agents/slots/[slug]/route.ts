import type { NextRequest } from "next/server";
import { getSlotDossier, isSafeSlug, freshnessMeta } from "@/lib/agents/operations";
import { ok, notFound, badRequest, rateLimited, preflight } from "@/lib/agents/envelope";
import { checkRateLimit, getClientIp } from "@/lib/agents/rate-limit";
import { withPublicUsage } from "@/lib/agents/usage-log";

export const OPTIONS = () => preflight();
// Request-aware (rate limit and ETag). A revalidate period would ISR-write each slug.
// Repeat reads stay on the process cache and the CDN Cache-Control header.
export const dynamic = "force-dynamic";

export const GET = withPublicUsage("/api/v1/agents/slots/[slug]", async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const rl = checkRateLimit(getClientIp(req));
  if (!rl.allowed) return rateLimited(rl.retryAfter);

  const { slug } = await ctx.params;
  if (!isSafeSlug(slug)) return badRequest("Invalid slug");

  const dossier = getSlotDossier(slug);
  if (!dossier) return notFound(`No slot at slug '${slug}'`);

  return ok(dossier, {
    freshness: freshnessMeta(),
    cacheKey: `agents:slot:${slug}`,
    ifNoneMatch: req.headers.get("if-none-match"),
    acceptEncoding: req.headers.get("accept-encoding"),
  });
});
