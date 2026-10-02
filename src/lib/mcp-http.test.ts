import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { agentPayloadViolations, buildAgentSlot } from "./agent-slot";
import { listDeltas } from "./agents/operations";
import { checkRateLimit } from "./agents/rate-limit";
import { DELETE, GET, OPTIONS, POST } from "../app/api/v1/mcp/route";
import { MCP_PUBLIC_PATH, MCP_PUBLIC_URL, handleMcpHttp } from "./mcp-http";

const ACCEPT = "application/json, text/event-stream";
const PROTOCOL = "2025-11-25";

function mcpRequest(method: string, body?: unknown, ip = "203.0.113.10", headers: Record<string, string> = {}) {
  return new Request(MCP_PUBLIC_URL, {
    method,
    headers: {
      accept: ACCEPT,
      "content-type": "application/json",
      "mcp-protocol-version": PROTOCOL,
      "x-forwarded-for": ip,
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function initializeBody(id = 1) {
  return {
    jsonrpc: "2.0",
    id,
    method: "initialize",
    params: {
      protocolVersion: PROTOCOL,
      capabilities: {},
      clientInfo: { name: "clarke-test", version: "0.0.0" },
    },
  };
}

async function readJson(res: Response): Promise<Record<string, unknown>> {
  return JSON.parse(await res.text()) as Record<string, unknown>;
}

function toolText(result: { content?: Array<{ type?: string; text?: string }> }): string {
  const block = result.content?.find((item) => item.type === "text");
  assert.ok(block?.text, "tool result text");
  return block.text;
}

describe("public MCP Streamable HTTP", () => {
  it("answers CORS preflight without a session or an API key", async () => {
    const res = await OPTIONS(mcpRequest("OPTIONS", undefined, "203.0.113.11"));
    assert.equal(res.status, 204);
    assert.equal(res.headers.get("access-control-allow-origin"), "*");
    assert.match(res.headers.get("access-control-allow-methods") ?? "", /POST/);
    assert.match(res.headers.get("access-control-allow-headers") ?? "", /MCP-Protocol-Version/);
    assert.equal(res.headers.get("mcp-session-id"), null);
  });

  it("returns 405 on GET so clients do not wait on a server-push SSE stream", async () => {
    const res = await GET(
      mcpRequest("GET", undefined, "203.0.113.12", { accept: "text/event-stream" }),
    );
    assert.equal(res.status, 405);
    assert.match(res.headers.get("allow") ?? "", /POST/);
    assert.equal(res.headers.get("content-type"), "application/json");
    const body = await readJson(res);
    const error = body.error as { message?: string };
    assert.match(error.message ?? "", /stateless Streamable HTTP/);
    assert.equal(res.headers.get("mcp-session-id"), null);
  });

  it("initializes over POST JSON and lists the same tools, with no API key and no session", async () => {
    const init = await POST(mcpRequest("POST", initializeBody(), "203.0.113.13"));
    assert.equal(init.status, 200);
    assert.match(init.headers.get("content-type") ?? "", /application\/json/);
    assert.doesNotMatch(init.headers.get("content-type") ?? "", /text\/event-stream/);
    assert.equal(init.headers.get("mcp-session-id"), null);
    const initBody = await readJson(init);
    const result = initBody.result as {
      serverInfo?: { name?: string };
      capabilities?: { tools?: unknown };
      protocolVersion?: string;
    };
    assert.equal(result.serverInfo?.name, "clarke");
    assert.equal(result.protocolVersion, PROTOCOL);
    assert.ok(result.capabilities && "tools" in result.capabilities);

    const listed = await handleMcpHttp(
      mcpRequest("POST", { jsonrpc: "2.0", id: 2, method: "tools/list" }, "203.0.113.13"),
    );
    assert.equal(listed.status, 200);
    const listedBody = await readJson(listed);
    const tools = (listedBody.result as { tools: Array<{ name: string }> }).tools.map((tool) => tool.name);
    assert.deepEqual(tools.sort(), [
      "clarke_get_slot",
      "clarke_get_terminal",
      "clarke_list_deltas",
      "clarke_list_satellites",
      "clarke_list_slots",
    ]);
  });

  it("rejects an unsupported MCP-Protocol-Version and a missing Accept header", async () => {
    const badVersion = await handleMcpHttp(
      mcpRequest("POST", { jsonrpc: "2.0", id: 3, method: "tools/list" }, "203.0.113.14", {
        "mcp-protocol-version": "1999-01-01",
      }),
    );
    assert.equal(badVersion.status, 400);
    const badBody = await readJson(badVersion);
    assert.match(JSON.stringify(badBody.error), /Unsupported protocol version/);

    const missingAccept = await handleMcpHttp(
      mcpRequest("POST", initializeBody(4), "203.0.113.15", { accept: "application/json" }),
    );
    assert.equal(missingAccept.status, 406);
  });

  it("shares the public agents rate limit and returns the same 429 body", async () => {
    const ip = "198.51.100.61";
    for (let i = 0; i < 60; i++) checkRateLimit(ip);
    const res = await POST(mcpRequest("POST", initializeBody(), ip));
    assert.equal(res.status, 429);
    assert.ok(Number(res.headers.get("retry-after")) >= 1);
    assert.deepEqual(await readJson(res), { error: "Too many requests" });
  });

  it("speaks stateless Streamable HTTP to the official client and returns the slot JSON", { timeout: 60_000 }, async () => {
    const ip = "203.0.113.20";
    const transport = new StreamableHTTPClientTransport(new URL(MCP_PUBLIC_URL), {
      requestInit: { headers: { "x-forwarded-for": ip } },
      fetch: (input, init) => handleMcpHttp(new Request(input, init)),
    });
    const client = new Client({ name: "clarke-test", version: "0.0.0" });
    try {
      await client.connect(transport);
      assert.equal(transport.sessionId, undefined);

      const slot = await client.callTool({ name: "clarke_get_slot", arguments: { slug: "101w" } });
      const terminal = await client.callTool({ name: "clarke_get_terminal", arguments: { slug: "101w" } });
      const slotJson = JSON.parse(toolText(slot)) as { ituRecorded?: string; operator?: unknown };
      const terminalJson = JSON.parse(toolText(terminal));
      assert.deepEqual(slotJson, terminalJson);
      assert.deepEqual(slotJson, JSON.parse(JSON.stringify(buildAgentSlot("101w"))));
      assert.equal(slotJson.ituRecorded, "not_in_product");
      assert.equal("operator" in slotJson, false);
      assert.deepEqual(agentPayloadViolations(slotJson), []);

      const deltas = await client.callTool({
        name: "clarke_list_deltas",
        arguments: { slug: "101w", domain: "fcc" },
      });
      const deltaJson = JSON.parse(toolText(deltas)) as { coverage?: string; changes?: unknown; meta?: unknown };
      assert.deepEqual(deltaJson, JSON.parse(JSON.stringify(listDeltas({ slug: "101w", domain: "fcc" }))));
      assert.equal(deltaJson.meta, undefined);
      assert.match(deltaJson.coverage ?? "", /bootstrap|ingest_deltas/);
      assert.ok(Array.isArray(deltaJson.changes));
      assert.deepEqual(agentPayloadViolations(deltaJson), []);

      const missing = await client.callTool({
        name: "clarke_get_slot",
        arguments: { slug: "zz-no-such-slot" },
      });
      assert.equal(missing.isError, true);
      assert.deepEqual(JSON.parse(toolText(missing)), { error: "No slot at slug 'zz-no-such-slot'" });

      const listed = await client.callTool({ name: "clarke_list_slots", arguments: {} });
      const rows = JSON.parse(toolText(listed)) as Array<{ ituRecorded?: string }>;
      assert.ok(rows.length > 1);
      assert.ok(rows.every((row) => row.ituRecorded === "not_in_product"));
      assert.deepEqual(agentPayloadViolations(rows), []);
    } finally {
      await client.close();
    }
  });

  it("accepts DELETE without a session and does not require Authorization", async () => {
    const res = await DELETE(mcpRequest("DELETE", undefined, "203.0.113.21"));
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("www-authenticate"), null);
  });
});

describe("MCP discovery copy", () => {
  const root = process.cwd();

  it("documents the public URL, transport, tools, and open read-only auth", () => {
    const agent = readFileSync(join(root, "docs", "AGENT_API.md"), "utf8");
    const llms = readFileSync(join(root, "public", "llms.txt"), "utf8");
    const openapi = readFileSync(join(root, "src/app/api/v1/openapi/route.ts"), "utf8");
    for (const text of [agent, llms, openapi]) {
      assert.ok(text.includes(MCP_PUBLIC_URL), MCP_PUBLIC_URL);
      assert.match(text, /Streamable HTTP/);
      assert.match(text, /clarke_list_slots/);
      assert.match(text, /clarke_get_terminal/);
      assert.match(text, /clarke_list_deltas/);
      assert.equal(text.includes("\u2014"), false);
      assert.equal(text.includes("\u2013"), false);
      assert.doesNotMatch(text, /Bloomberg|CoStar|\bCME\b/);
    }
    assert.match(agent, /read-only and unauthenticated/);
    assert.match(agent, /405/);
    assert.match(llms, /No API key/);
    assert.match(openapi, /No API key/);
    assert.equal(MCP_PUBLIC_PATH, "/api/v1/mcp");
    assert.doesNotMatch(llms, /has no public URL/);
  });
});
