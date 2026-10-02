import type { NextRequest } from "next/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createServer } from "../mcp/server";
import { rateLimited } from "./agents/envelope";
import { checkRateLimit, getClientIp } from "./agents/rate-limit";

/**
 * Public remote MCP endpoint.
 *
 * Transport: stateless Streamable HTTP (MCP 2025-03-26 and later). Each POST
 * builds a fresh server and answers with one JSON-RPC `application/json`
 * body. There is no session id and no long-lived server-push SSE stream.
 * GET returns 405, which Streamable HTTP clients treat as "no server
 * messages" and then keep using POST.
 *
 * Auth: none. The same in-memory 60 requests per minute per IP bucket as the
 * other public agent routes. Tool JSON is the stdio server's text result.
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

function withCors(res: Response): Response {
  const headers = new Headers(res.headers);
  for (const [key, value] of Object.entries(CORS)) headers.set(key, value);
  headers.set("Cache-Control", "no-store");
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

async function buffer(res: Response): Promise<Response> {
  const body = await res.arrayBuffer();
  return new Response(body.byteLength ? body : null, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });
}

export async function handleMcpHttp(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { ...CORS, "Cache-Control": "no-store" } });
  }

  const rl = checkRateLimit(getClientIp(req as NextRequest));
  if (!rl.allowed) return withCors(rateLimited(rl.retryAfter));

  // Spec: a server that does not offer server-to-client SSE MUST return 405.
  // A hanging GET would pin a serverless invocation and still deliver nothing,
  // because this host does not keep session state.
  if (req.method === "GET") {
    return withCors(
      jsonRpcError(
        405,
        -32000,
        "Method Not Allowed. This endpoint is stateless Streamable HTTP. POST JSON-RPC messages here. A server-push SSE stream is not offered.",
        { Allow: "POST, DELETE, OPTIONS" },
      ),
    );
  }

  if (req.method !== "POST" && req.method !== "DELETE") {
    return withCors(
      jsonRpcError(405, -32000, "Method Not Allowed", { Allow: "POST, DELETE, OPTIONS" }),
    );
  }

  const server = createServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  try {
    await server.connect(transport);
    const raw = await transport.handleRequest(req);
    return withCors(await buffer(raw));
  } catch {
    return withCors(jsonRpcError(500, -32603, "Internal error"));
  } finally {
    await Promise.allSettled([transport.close(), server.close()]);
  }
}
