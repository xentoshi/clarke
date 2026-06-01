import type { NextRequest } from "next/server";
import { getSlotDossier, isSafeSlug, freshnessMeta } from "@/lib/agents/operations";
import { ok, notFound, badRequest, rateLimited, preflight } from "@/lib/agents/envelope";
import { checkRateLimit, getClientIp } from "@/lib/agents/rate-limit";

export const OPTIONS = () => preflight();
export const revalidate = 300;

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const rl = checkRateLimit(getClientIp(req));
  if (!rl.allowed) return rateLimited(rl.retryAfter);

  const { slug } = await ctx.params;
  if (!isSafeSlug(slug)) return badRequest("Invalid slug");

  const dossier = getSlotDossier(slug);
  if (!dossier) return notFound(`No slot at slug '${slug}'`);

  return ok(dossier, { freshness: freshnessMeta() });
}
