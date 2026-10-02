import type { NextRequest } from "next/server";
import { freshnessMeta, listDeltas } from "@/lib/agents/operations";
import { DeltaQueryError } from "@/lib/delta-feed";
import { ok, badRequest, rateLimited, preflight } from "@/lib/agents/envelope";
import { checkRateLimit, getClientIp } from "@/lib/agents/rate-limit";

export const OPTIONS = () => preflight();
export const revalidate = 300;

function param(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export async function GET(req: NextRequest) {
  const rl = checkRateLimit(getClientIp(req));
  if (!rl.allowed) return rateLimited(rl.retryAfter);

  try {
    const data = listDeltas({
      slug: param(req.nextUrl.searchParams.get("slug")),
      domain: param(req.nextUrl.searchParams.get("domain")),
      since: param(req.nextUrl.searchParams.get("since")),
    });
    return ok(data, { count: data.changes.length, freshness: freshnessMeta() });
  } catch (err) {
    if (err instanceof DeltaQueryError) return badRequest(err.message);
    throw err;
  }
}
