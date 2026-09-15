import type { NextRequest } from "next/server";
import { entitlementsFor, resolveAccess, type Entitlements, type Session } from "./auth";
import { checkRateLimit, getClientIp } from "./agents/rate-limit";
import { forbidden, rateLimited, unauthorized } from "./agents/envelope";

const FREE_MAX = 60;
const PRO_MAX = 300;

export function gateTerminal(req: NextRequest): {
  ok: true;
  session: Session;
  entitlements: Entitlements;
} | {
  ok: false;
  response: ReturnType<typeof unauthorized>;
} {
  const { session, via } = resolveAccess(req);
  const key = via === "api_key" ? (req.headers.get("x-clarke-key") || req.headers.get("authorization") || "key") : getClientIp(req);
  const max = session?.plan === "pro" ? PRO_MAX : FREE_MAX;
  const rl = checkRateLimit(`term:${key}`, max);
  if (!rl.allowed) return { ok: false, response: rateLimited(rl.retryAfter) };

  if (!session) {
    return {
      ok: false,
      response: unauthorized("Pro seat or API key required. Sign in at /login or send Authorization: Bearer ck_live_…"),
    };
  }
  if (session.plan !== "pro") {
    return { ok: false, response: forbidden("This endpoint is a Pro Terminal feature. Upgrade at /pricing.") };
  }
  return { ok: true, session, entitlements: entitlementsFor(session) };
}
