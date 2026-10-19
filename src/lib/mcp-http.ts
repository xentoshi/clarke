import type { NextRequest } from "next/server";
import { gzipSync } from "zlib";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createServer } from "../mcp/server";
import { rateLimited } from "./agents/envelope";
import { checkRateLimit, getClientIp } from "./agents/rate-limit";
import { emitMcpUsage, MAX_USAGE_BODY_BYTES } from "./agents/usage-log";

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

async function buffer(res: Response, acceptEncoding: string | null): Promise<Response> {
  const raw = await res.arrayBuffer();
  const headers = new Headers(res.headers);
  let body: BodyInit | null = raw.byteLength ? raw : null;
  if (raw.byteLength >= 860 && acceptEncoding && /\bgzip\b/.test(acceptEncoding) && !headers.get("content-encoding")) {
    body = gzipSync(Buffer.from(raw), { level: 6 });
    headers.set("content-encoding", "gzip");
    headers.set("vary", "Accept-Encoding");
  }
  return new Response(body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

export async function handleMcpHttp(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { ...CORS, "Cache-Control": "public, max-age=86400" } });
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
          { Allow: "POST, DELETE, OPTIONS" },
        ),
        "public, max-age=3600",
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

  let rpcRequest = req;
  let loggedBody: ArrayBuffer | null = null;
  if (req.method === "POST") {
    const buf = await req.arrayBuffer();
    if (buf.byteLength > MAX_MCP_REQUEST_BYTES) {
      return finish(withCors(jsonRpcError(413, -32600, `Request body exceeds ${MAX_MCP_REQUEST_BYTES} bytes.`)));
    }
    // Skip a second parse of a fat-but-legal body. The handler still answers.
    if (buf.byteLength > 0 && buf.byteLength <= MAX_USAGE_BODY_BYTES) loggedBody = buf;
    rpcRequest = new Request(req.url, {
      method: req.method,
      headers: req.headers,
      body: buf.byteLength ? buf : undefined,
    });
  }

  const server = createServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  try {
    await server.connect(transport);
    const raw = await transport.handleRequest(rpcRequest);
    return finish(withCors(await buffer(raw, req.headers.get("accept-encoding"))), loggedBody);
  } catch {
    return finish(withCors(jsonRpcError(500, -32603, "Internal error")), loggedBody);
  } finally {
    await Promise.allSettled([transport.close(), server.close()]);
  }
}
