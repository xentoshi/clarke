import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import crypto from "crypto";

export const SESSION_COOKIE = "clarke_session";
export type Plan = "free" | "pro";

export interface Session {
  email: string;
  plan: Plan;
  demo: boolean;
  iat: number;
  exp: number;
}

export interface Entitlements {
  loggedIn: boolean;
  email: string | null;
  plan: Plan;
  pro: boolean;
  demo: boolean;
  features: {
    valuationBreakdown: boolean;
    compare: boolean;
    exportPlus: boolean;
    api: boolean;
    history: boolean;
  };
}

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret(): string {
  return process.env.AUTH_SECRET || process.env.PV_SECRET || "clarke-dev-auth-secret-not-for-production";
}

function b64url(buf: Buffer | string): string {
  const b = typeof buf === "string" ? Buffer.from(buf) : buf;
  return b.toString("base64url");
}

function sign(payloadB64: string): string {
  return crypto.createHmac("sha256", secret()).update(payloadB64).digest("base64url");
}

export function encodeSession(session: Omit<Session, "iat" | "exp"> & { expMs?: number }): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + Math.floor((session.expMs ?? COOKIE_MAX_AGE * 1000) / 1000);
  const body: Session = { email: session.email, plan: session.plan, demo: session.demo, iat, exp };
  const payload = b64url(JSON.stringify(body));
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(token: string | undefined | null): Session | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const body = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Session;
    if (!body.email || (body.plan !== "free" && body.plan !== "pro")) return null;
    if (body.exp * 1000 < Date.now()) return null;
    return body;
  } catch {
    return null;
  }
}

export function cookieOptions(maxAge = COOKIE_MAX_AGE) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return decodeSession(store.get(SESSION_COOKIE)?.value);
}

export function sessionFromRequest(req: NextRequest): Session | null {
  return decodeSession(req.cookies.get(SESSION_COOKIE)?.value);
}

export function entitlementsFor(session: Session | null): Entitlements {
  const pro = session?.plan === "pro";
  return {
    loggedIn: Boolean(session),
    email: session?.email ?? null,
    plan: session?.plan ?? "free",
    pro,
    demo: session?.demo ?? false,
    features: {
      valuationBreakdown: pro,
      compare: pro,
      exportPlus: pro,
      api: pro,
      history: pro,
    },
  };
}

export async function getEntitlements(): Promise<Entitlements> {
  return entitlementsFor(await getSession());
}

export function parseApiKey(header: string | null): string | null {
  if (!header) return null;
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  return header.trim() || null;
}

// Pro API keys are HMAC session tokens with a ck_live_ prefix so they can be
// verified without a writable user store. TODO: hash-and-store keys before
// metering production traffic.
export function sessionFromApiKey(raw: string | null | undefined): Session | null {
  if (!raw) return null;
  const token = raw.startsWith("ck_live_") ? raw.slice("ck_live_".length) : raw.startsWith("ck_demo_") ? raw.slice("ck_demo_".length) : null;
  if (!token) return null;
  const session = decodeSession(token);
  if (!session || session.plan !== "pro") return null;
  return session;
}

export function mintApiKey(session: Session): string {
  const token = encodeSession({ email: session.email, plan: "pro", demo: session.demo });
  return `${session.demo ? "ck_demo_" : "ck_live_"}${token}`;
}

export function resolveAccess(req: NextRequest): { session: Session | null; via: "cookie" | "api_key" | null } {
  const key = parseApiKey(req.headers.get("authorization")) ?? req.headers.get("x-clarke-key");
  const fromKey = sessionFromApiKey(key);
  if (fromKey) return { session: fromKey, via: "api_key" };
  const fromCookie = sessionFromRequest(req);
  if (fromCookie) return { session: fromCookie, via: "cookie" };
  return { session: null, via: null };
}
