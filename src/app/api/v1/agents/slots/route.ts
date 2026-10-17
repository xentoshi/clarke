import type { NextRequest } from "next/server";
import { listSlots, freshnessMeta } from "@/lib/agents/operations";
import { ok, rateLimited, preflight } from "@/lib/agents/envelope";
import { checkRateLimit, getClientIp } from "@/lib/agents/rate-limit";

export const OPTIONS = () => preflight();
export const revalidate = 3600;

export async function GET(req: NextRequest) {
  const rl = checkRateLimit(getClientIp(req));
  if (!rl.allowed) return rateLimited(rl.retryAfter);

  const data = listSlots();
  return ok(data, {
    count: data.length,
    freshness: freshnessMeta(),
    cacheKey: "agents:slots",
    ifNoneMatch: req.headers.get("if-none-match"),
  });
}
