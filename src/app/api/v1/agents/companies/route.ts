import type { NextRequest } from "next/server";
import { listCompanies, listCompanySectors } from "@/lib/agents/operations";
import { ok, badRequest, rateLimited, preflight } from "@/lib/agents/envelope";
import { checkRateLimit, getClientIp } from "@/lib/agents/rate-limit";

export const OPTIONS = () => preflight();
export const revalidate = 300;

const SAFE_QUERY = /^[A-Za-z0-9 .\-_&]{1,80}$/;

export async function GET(req: NextRequest) {
  const rl = checkRateLimit(getClientIp(req));
  if (!rl.allowed) return rateLimited(rl.retryAfter);

  const url = new URL(req.url);
  const sector = url.searchParams.get("sector") ?? undefined;
  const view = url.searchParams.get("view");

  if (sector && !SAFE_QUERY.test(sector)) return badRequest("Invalid sector filter");

  if (view === "sectors") {
    const sectors = listCompanySectors();
    return ok(sectors, { count: sectors.length });
  }

  const data = listCompanies({ sector });
  return ok(data, { count: data.length });
}
