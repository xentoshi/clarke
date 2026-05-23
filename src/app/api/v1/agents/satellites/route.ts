import type { NextRequest } from "next/server";
import { listSatellites } from "@/lib/agents/operations";
import { ok, badRequest, rateLimited, preflight } from "@/lib/agents/envelope";
import { checkRateLimit, getClientIp } from "@/lib/agents/rate-limit";

export const OPTIONS = () => preflight();
export const revalidate = 300;

const SAFE_QUERY = /^[A-Za-z0-9 .\-_]{1,80}$/;

export async function GET(req: NextRequest) {
  const rl = checkRateLimit(getClientIp(req));
  if (!rl.allowed) return rateLimited(rl.retryAfter);

  const url = new URL(req.url);
  const operator = url.searchParams.get("operator") ?? undefined;
  const ownerCountry = url.searchParams.get("ownerCountry") ?? undefined;
  const limitRaw = url.searchParams.get("limit");

  if (operator && !SAFE_QUERY.test(operator)) return badRequest("Invalid operator filter");
  if (ownerCountry && !SAFE_QUERY.test(ownerCountry)) return badRequest("Invalid ownerCountry filter");

  let limit: number | undefined;
  if (limitRaw !== null) {
    const n = Number(limitRaw);
    if (!Number.isFinite(n) || n < 1 || n > 1000) return badRequest("limit must be 1..1000");
    limit = Math.floor(n);
  }

  const data = listSatellites({ operator, ownerCountry, limit });
  return ok(data, { count: data.length });
}
