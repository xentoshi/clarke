import type { NextRequest } from "next/server";
import crypto from "crypto";
import { getClientIp } from "./rate-limit";

/**
 * One stdout line per public agent or MCP origin hit.
 *
 * Vercel Observability reads this line. A log drain on the project receives
 * the same stdout. Nothing is written to a database and nothing is fetched.
 * The write is not awaited and must not change the response.
 *
 * Fluid Active CPU stays a short hash plus this line. Response bytes stay
 * the same, so Fast Origin Transfer does not grow. OPTIONS is skipped.
 * MCP POST bodies over MAX_USAGE_BODY_BYTES are counted without a second parse.
 */

export const USAGE_EVENT = "clarke.usage";
export const MAX_USAGE_BODY_BYTES = 8192;

const SLUG_RE = /^[a-z0-9-]{1,64}$/;
const TOOL_RE = /^clarke_[a-z0-9_]{1,40}$/;
const SINCE_RE =
  /^[0-9]{4}-[0-9]{2}-[0-9]{2}(?:[T ][0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]{1,3})?(?:Z|[+-][0-9]{2}:?[0-9]{2})?)?$/;

const RPC_METHODS = new Set([
  "initialize",
  "notifications/initialized",
  "ping",
  "tools/list",
  "tools/call",
  "resources/list",
  "resources/templates/list",
  "prompts/list",
  "logging/setLevel",
]);

export interface UsageLine {
  event: typeof USAGE_EVENT;
  ts: string;
  transport: "http" | "mcp";
  route: string;
  method: string;
  status: number;
  ipHash: string;
  ua?: string;
  rpc?: string;
  tool?: string;
  slug?: string;
  limit?: number;
  since?: string;
}

export function usageSalt(): string {
  return process.env.USAGE_LOG_SALT || process.env.AUTH_SECRET || "clarke-usage";
}

/** First 16 hex chars of SHA-256(salt, UTC day, IP). Stable until the next UTC day. */
export function dailyIpHash(ip: string, now = new Date(), salt = usageSalt()): string {
  const day = now.toISOString().slice(0, 10);
  return crypto.createHash("sha256").update(`${salt}\n${day}\n${ip}`).digest("hex").slice(0, 16);
}

export function whitelistSlug(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return SLUG_RE.test(trimmed) ? trimmed : undefined;
}

export function whitelistLimit(value: unknown): number | undefined {
  const n = typeof value === "number" ? value : typeof value === "string" && /^[0-9]{1,4}$/.test(value) ? Number(value) : NaN;
  if (!Number.isInteger(n) || n < 1 || n > 1000) return undefined;
  return n;
}

export function whitelistSince(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return SINCE_RE.test(trimmed) ? trimmed : undefined;
}

export function whitelistTool(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return TOOL_RE.test(value) ? value : undefined;
}

function whitelistFields(input: Record<string, unknown>): Pick<UsageLine, "slug" | "limit" | "since"> {
  const out: Pick<UsageLine, "slug" | "limit" | "since"> = {};
  const slug = whitelistSlug(input.slug);
  const limit = whitelistLimit(input.limit);
  const since = whitelistSince(input.since);
  if (slug) out.slug = slug;
  if (limit !== undefined) out.limit = limit;
  if (since) out.since = since;
  return out;
}

export function cleanUserAgent(raw: string | null): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
  if (!cleaned) return undefined;
  if (/bearer\s|ck_live_|authorization/i.test(cleaned)) return "[redacted]";
  return cleaned;
}

function baseUsage(
  req: { method: string; headers: Headers },
  opts: { transport: UsageLine["transport"]; route: string; status: number; now: Date },
): UsageLine {
  const line: UsageLine = {
    event: USAGE_EVENT,
    ts: opts.now.toISOString(),
    transport: opts.transport,
    route: opts.route,
    method: req.method,
    status: opts.status,
    ipHash: dailyIpHash(getClientIp(req as NextRequest), opts.now),
  };
  const ua = cleanUserAgent(req.headers.get("user-agent"));
  if (ua) line.ua = ua;
  return line;
}

export function whitelistFromUrl(url: string): Pick<UsageLine, "slug" | "limit" | "since"> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return {};
  }
  const fields: Record<string, unknown> = {};
  const pathMatch = parsed.pathname.match(/^\/api\/v1\/agents\/slots\/([^/]+)$/);
  if (pathMatch) {
    try {
      fields.slug = decodeURIComponent(pathMatch[1]);
    } catch {
      fields.slug = "";
    }
  } else {
    const slug = parsed.searchParams.get("slug");
    if (slug !== null) fields.slug = slug;
  }
  const limit = parsed.searchParams.get("limit");
  if (limit !== null) fields.limit = limit;
  const since = parsed.searchParams.get("since");
  if (since !== null) fields.since = since;
  return whitelistFields(fields);
}

export function buildHttpUsage(req: Request, route: string, status: number, now = new Date()): UsageLine {
  return {
    ...baseUsage(req, { transport: "http", route, status, now }),
    ...whitelistFromUrl(req.url),
  };
}

export function applyRpc(line: UsageLine, text: string): UsageLine {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return line;
  }
  if (Array.isArray(parsed)) return { ...line, rpc: "batch" };
  if (!parsed || typeof parsed !== "object") return line;
  const message = parsed as { method?: unknown; params?: unknown };
  const next: UsageLine = { ...line };
  if (typeof message.method === "string" && RPC_METHODS.has(message.method)) next.rpc = message.method;
  if (message.method !== "tools/call" || !message.params || typeof message.params !== "object" || Array.isArray(message.params)) {
    return next;
  }
  const params = message.params as { name?: unknown; arguments?: unknown };
  const tool = whitelistTool(params.name);
  if (tool) next.tool = tool;
  if (params.arguments && typeof params.arguments === "object" && !Array.isArray(params.arguments)) {
    Object.assign(next, whitelistFields(params.arguments as Record<string, unknown>));
  }
  return next;
}

export function buildMcpUsage(req: Request, status: number, body: ArrayBuffer | null, now = new Date()): UsageLine {
  const line = baseUsage(req, { transport: "mcp", route: "/api/v1/mcp", status, now });
  if (!body || body.byteLength === 0 || body.byteLength > MAX_USAGE_BODY_BYTES) return line;
  try {
    return applyRpc(line, new TextDecoder().decode(body));
  } catch {
    return line;
  }
}

export function emitUsage(line: UsageLine): void {
  try {
    console.log(JSON.stringify(line));
  } catch {
    // Logging must not change the HTTP or JSON-RPC response.
  }
}

export function emitMcpUsage(req: Request, status: number, body: ArrayBuffer | null): void {
  try {
    emitUsage(buildMcpUsage(req, status, body));
  } catch {
    // Logging must not change the JSON-RPC response.
  }
}

export function withPublicUsage<Args extends unknown[]>(
  route: string,
  handler: (req: NextRequest, ...args: Args) => Promise<Response> | Response,
) {
  return async function publicUsage(req: NextRequest, ...args: Args): Promise<Response> {
    if (req.method === "OPTIONS") return handler(req, ...args);
    try {
      const res = await handler(req, ...args);
      emitUsage(buildHttpUsage(req, route, res.status));
      return res;
    } catch (err) {
      emitUsage(buildHttpUsage(req, route, 500));
      throw err;
    }
  };
}
