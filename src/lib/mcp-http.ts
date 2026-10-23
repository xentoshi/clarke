import type { NextRequest } from "next/server";
import crypto from "crypto";
import { gzipSync } from "zlib";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createServer } from "../mcp/server";
import { rateLimited } from "./agents/envelope";
import { checkRateLimit, getClientIp } from "./agents/rate-limit";
import { emitMcpUsage, MAX_USAGE_BODY_BYTES } from "./agents/usage-log";
import { registryCacheToken } from "./process-cache";

/**
 * Public remote MCP endpoint.
 *
 * Transport: stateless Streamable HTTP (MCP 2025-03-26 and later). Each POST
 * builds a fresh server and answers with one JSON-RPC `application/json`
 * body. The endpoint is stateless. GET returns 405 because this host does
 * not keep a server-push SSE stream. Clients continue with POST.
 *
 * Auth: unauthenticated reads. The same in-memory 60 requests per minute per
 * IP bucket as the other public agent routes. Tool JSON is the stdio
 * server's text result.
 */
export const MCP_PUBLIC_PATH = "/api/v1/mcp";
export const MCP_PUBLIC_URL = "https://www.clarkebelt.finance/api/v1/mcp";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Accept, MCP-Protocol-Version, Mcp-Session-Id, Last-Event-ID, Authorization, X-Clarke-Key, If-None-Match",
  "Access-Control-Expose-Headers": "Mcp-Session-Id, MCP-Protocol-Version",
  "Access-Control-Max-Age": "86400",
};

export const MAX_MCP_REQUEST_BYTES = 65_536;

/** Identical JSON-RPC bodies share one parsed response until clarke.db changes. */
const MCP_RESPONSE_CACHE_MAX = 32;
const MCP_RESPONSE_CACHE_BYTES = 750_000;

interface StoredMcp {
  token: string;
  status: number;
  statusText: string;
  headers: [string, string][];
  body: Uint8Array;
  gzip: Buffer | null;
}

const mcpResponseCache = new Map<string, StoredMcp>();
let mcpHits = 0;
let mcpMisses = 0;

export function mcpResponseCacheStats(): { hits: number; misses: number } {
  return { hits: mcpHits, misses: mcpMisses };
}

function mcpCacheKey(req: Request, body: ArrayBuffer | null): string {
  const hash = crypto.createHash("sha1");
  hash.update(req.method);
  hash.update("\n");
  hash.update(req.headers.get("accept") ?? "");
  hash.update("\n");
  hash.update(req.headers.get("content-type") ?? "");
  hash.update("\n");
  hash.update(req.headers.get("mcp-protocol-version") ?? "");
  hash.update("\n");
  if (body && body.byteLength) hash.update(Buffer.from(body));
  return hash.digest("hex");
}

function rememberMcp(key: string, stored: StoredMcp): void {
  if (stored.body.byteLength > MCP_RESPONSE_CACHE_BYTES || stored.status >= 500) return;
  mcpResponseCache.delete(key);
  mcpResponseCache.set(key, stored);
  while (mcpResponseCache.size > MCP_RESPONSE_CACHE_MAX) {
    const oldest = mcpResponseCache.keys().next().value;
    if (oldest === undefined) break;
    mcpResponseCache.delete(oldest);
  }
}

function storedToResponse(stored: StoredMcp, acceptEncoding: string | null): Response {
  const headers = new Headers(stored.headers);
  let body: BodyInit | null = stored.body.byteLength ? stored.body.slice() : null;
  if (
    stored.gzip &&
    acceptEncoding &&
    /\bgzip\b/.test(acceptEncoding) &&
    !headers.get("content-encoding")
  ) {
    body = new Uint8Array(stored.gzip);
    headers.delete("content-length");
    headers.set("content-encoding", "gzip");
    headers.set("vary", "Accept-Encoding");
  }
  return new Response(body, { status: stored.status, statusText: stored.statusText, headers });
}

async function captureMcp(res: Response): Promise<StoredMcp> {
  const raw = new Uint8Array(await res.arrayBuffer());
  const headers = [...res.headers.entries()].filter(([name]) => name.toLowerCase() !== "content-encoding");
  const gzip = raw.byteLength >= 860 ? gzipSync(Buffer.from(raw), { level: 6 }) : null;
  return { token: registryCacheToken(), status: res.status, statusText: res.statusText, headers, body: raw, gzip };
}

function withCors(res: Response, cacheControl = "no-store"): Response {
  const headers = new Headers(res.headers);
  for (const [key, value] of Object.entries(CORS)) headers.set(key, value);
  headers.set("Cache-Control", cacheControl);
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

function jsonRpcError(status: number, code: number, message: string, extra?: HeadersInit): Response {
  const headers = new Headers(extra);
  headers.set("Content-Type", "application/json");
  return new Response(
    JSON.stringify({ jsonrpc: "2.0", id: null, error: { code, message } }),
    { status, headers },
  );
}

export async function handleMcpHttp(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...CORS,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  }

  // Log on the way out. The line is stdout only. It is not a header and not
  // part of the JSON-RPC body. OPTIONS stays quiet so preflight does not
  // add a line. The 60 per minute check below is the same bucket as before.
  const finish = (res: Response, body?: ArrayBuffer | null): Response => {
    emitMcpUsage(req, res.status, body ?? null);
    return res;
  };

  const rl = checkRateLimit(getClientIp(req as NextRequest));
  if (!rl.allowed) return finish(withCors(rateLimited(rl.retryAfter)));

  // Spec: a server that does not offer server-to-client SSE MUST return 405.
  // A hanging GET would pin a serverless invocation and still deliver nothing,
  // because this host does not keep session state.
  if (req.method === "GET") {
    return finish(
      withCors(
        jsonRpcError(
          405,
          -32000,
          "Method Not Allowed. This endpoint is stateless Streamable HTTP. POST JSON-RPC messages here. GET returns 405 because this host does not keep a server-push SSE stream. Clients continue with POST.",
          {
            Allow: "POST, DELETE, OPTIONS",
            "Vercel-CDN-Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
          },
        ),
        "public, max-age=86400, stale-while-revalidate=604800",
      ),
    );
  }

  if (req.method !== "POST" && req.method !== "DELETE") {
    return finish(
      withCors(
        jsonRpcError(405, -32000, "Method Not Allowed", { Allow: "POST, DELETE, OPTIONS" }),
      ),
    );
  }

  let requestBody: ArrayBuffer | null = null;
  if (req.method === "POST") {
    requestBody = await req.arrayBuffer();
    if (requestBody.byteLength > MAX_MCP_REQUEST_BYTES) {
      return finish(withCors(jsonRpcError(413, -32600, `Request body exceeds ${MAX_MCP_REQUEST_BYTES} bytes.`)));
    }
  }
  // Skip a second parse of a fat-but-legal body. The handler still answers.
  const loggedBody =
    requestBody && requestBody.byteLength > 0 && requestBody.byteLength <= MAX_USAGE_BODY_BYTES ? requestBody : null;

  const acceptEncoding = req.headers.get("accept-encoding");
  const token = registryCacheToken();
  const cacheKey = mcpCacheKey(req, requestBody);
  const cached = mcpResponseCache.get(cacheKey);
  if (cached && cached.token === token) {
    mcpHits += 1;
    mcpResponseCache.delete(cacheKey);
    mcpResponseCache.set(cacheKey, cached);
    return finish(withCors(storedToResponse(cached, acceptEncoding)), loggedBody);
  }
  mcpMisses += 1;

  const rpcRequest =
    requestBody === null
      ? req
      : new Request(req.url, {
          method: req.method,
          headers: req.headers,
          body: requestBody.byteLength ? requestBody : undefined,
        });

  const server = createServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  try {
    await server.connect(transport);
    const raw = await transport.handleRequest(rpcRequest);
    const stored = await captureMcp(raw);
    stored.token = token;
    rememberMcp(cacheKey, stored);
    return finish(withCors(storedToResponse(stored, acceptEncoding)), loggedBody);
  } catch {
    return finish(withCors(jsonRpcError(500, -32603, "Internal error")), loggedBody);
  } finally {
    await Promise.allSettled([transport.close(), server.close()]);
  }
}
