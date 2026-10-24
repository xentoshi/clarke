import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextRequest } from "next/server";
import { GET as getSlot } from "../app/api/v1/agents/slots/[slug]/route";
import { GET as getSlots } from "../app/api/v1/agents/slots/route";
import { agentPayloadViolations } from "./agent-slot";
import { checkRateLimit } from "./agents/rate-limit";
import { handleMcpHttp, MCP_PUBLIC_URL } from "./mcp-http";
import {
  USAGE_EVENT,
  applyRpc,
  buildHttpUsage,
  buildMcpUsage,
  cleanUserAgent,
  dailyIpHash,
  emitUsage,
  withPublicUsage,
  type UsageLine,
} from "./agents/usage-log";

const ALLOWED_KEYS = new Set([
  "event",
  "ts",
  "transport",
  "route",
  "method",
  "status",
  "ipHash",
  "ua",
  "rpc",
  "tool",
  "slug",
  "limit",
  "since",
  "offset",
  "after",
  "view",
  "all",
]);

function assertLine(line: UsageLine, raw: string) {
  assert.equal(raw.includes("\n"), false);
  assert.equal(line.event, USAGE_EVENT);
  assert.match(line.ipHash, /^[0-9a-f]{16}$/);
  assert.match(line.ts, /^\d{4}-\d{2}-\d{2}T/);
  for (const key of Object.keys(line)) assert.ok(ALLOWED_KEYS.has(key), key);
}

async function capture(run: () => Promise<void>): Promise<UsageLine[]> {
  const found: UsageLine[] = [];
  const orig = console.log;
  console.log = (...args: unknown[]) => {
    const text = args.map((part) => String(part)).join(" ");
    try {
      const parsed = JSON.parse(text) as UsageLine;
      if (parsed && parsed.event === USAGE_EVENT) {
        assertLine(parsed, text);
        found.push(parsed);
        return;
      }
    } catch {
      // Keep non-usage output visible.
    }
    orig.apply(console, args as []);
  };
  try {
    await run();
  } finally {
    console.log = orig;
  }
  return found;
}

describe("daily IP hash", () => {
  const ip = "203.0.113.44";
  const salt = "test-salt";

  it("stays stable through one UTC day and changes the next day", () => {
    const morning = dailyIpHash(ip, new Date("2026-10-19T00:00:00.000Z"), salt);
    const evening = dailyIpHash(ip, new Date("2026-10-19T23:59:59.000Z"), salt);
    const next = dailyIpHash(ip, new Date("2026-10-20T00:00:00.000Z"), salt);
    const other = dailyIpHash("198.51.100.8", new Date("2026-10-19T12:00:00.000Z"), salt);
    const otherSalt = dailyIpHash(ip, new Date("2026-10-19T12:00:00.000Z"), "other-salt");
    assert.equal(morning, evening);
    assert.notEqual(morning, next);
    assert.notEqual(morning, other);
    assert.notEqual(morning, otherSalt);
    assert.equal(morning.includes(ip), false);
    assert.match(morning, /^[0-9a-f]{16}$/);
  });
});

describe("usage whitelist", () => {
  it("keeps slug, limit, and since and drops every other argument", () => {
    const now = new Date("2026-10-19T12:00:00.000Z");
    const req = new Request(
      "https://www.clarkebelt.finance/api/v1/agents/deltas?slug=101w&limit=25&since=2026-10-01T00:00:00.000Z&offset=50&view=full&all=1&after=fcc:slot_event:12&domain=fcc&operator=SES-SENTINEL&ownerCountry=ZZ-SENTINEL&authorization=Bearer%20ck_live_supersecretvalue",
      { headers: { "x-forwarded-for": "203.0.113.44", "user-agent": "clarke-test", authorization: "Bearer ck_live_supersecretvalue" } },
    );
    const line = buildHttpUsage(req, "/api/v1/agents/deltas", 200, now);
    const raw = JSON.stringify(line);
    assertLine(line, raw);
    assert.equal(line.transport, "http");
    assert.equal(line.route, "/api/v1/agents/deltas");
    assert.equal(line.slug, "101w");
    assert.equal(line.limit, 25);
    assert.equal(line.since, "2026-10-01T00:00:00.000Z");
    assert.equal(line.offset, 50);
    assert.equal(line.view, "full");
    assert.equal(line.all, true);
    assert.equal(line.after, "fcc:slot_event:12");
    assert.equal(line.ua, "clarke-test");
    assert.equal(cleanUserAgent("clarke-test\ninjected"), "clarke-test injected");
    assert.equal(cleanUserAgent("Bearer ck_live_supersecretvalue"), "[redacted]");
    assert.equal(raw.includes("203.0.113.44"), false);
    assert.equal(raw.includes("SES-SENTINEL"), false);
    assert.equal(raw.includes("ZZ-SENTINEL"), false);
    assert.equal(raw.includes("ck_live_supersecretvalue"), false);
    assert.equal("domain" in line, false);
    assert.equal("operator" in line, false);
  });

  it("reads a safe path slug and ignores a bad one", () => {
    const good = buildHttpUsage(
      new Request("https://www.clarkebelt.finance/api/v1/agents/slots/101w?operator=SES-SENTINEL"),
      "/api/v1/agents/slots/[slug]",
      200,
    );
    assert.equal(good.slug, "101w");
    assert.equal(JSON.stringify(good).includes("SES-SENTINEL"), false);

    const bad = buildHttpUsage(
      new Request("https://www.clarkebelt.finance/api/v1/agents/slots/not%20a%20slug"),
      "/api/v1/agents/slots/[slug]",
      400,
    );
    assert.equal(bad.slug, undefined);
    assert.equal(JSON.stringify(bad).includes("not a slug"), false);
  });

  it("drops an unsafe cursor, an out of range limit, and unknown MCP fields", () => {
    const base = buildMcpUsage(new Request("https://www.clarkebelt.finance/api/v1/mcp"), 200, null);
    const dirty = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "clarke_get_slot",
        arguments: {
          slug: "101w",
          limit: 5000,
          since: "not-a-date",
          offset: 12,
          view: "nope",
          all: true,
          after: "not a cursor",
          operator: "SES-SENTINEL",
          domain: "fcc",
          authorization: "Bearer ck_live_supersecretvalue",
          note: "full-body-sentinel",
        },
      },
    });
    const line = applyRpc(base, dirty);
    const raw = JSON.stringify(line);
    assert.equal(line.rpc, "tools/call");
    assert.equal(line.tool, "clarke_get_slot");
    assert.equal(line.slug, "101w");
    assert.equal(line.limit, undefined);
    assert.equal(line.since, undefined);
    assert.equal(line.offset, 12);
    assert.equal(line.view, undefined);
    assert.equal(line.all, true);
    assert.equal(line.after, undefined);
    assert.equal(raw.includes("SES-SENTINEL"), false);
    assert.equal(raw.includes("ck_live_supersecretvalue"), false);
    assert.equal(raw.includes("full-body-sentinel"), false);
    assert.equal(raw.includes("not-a-date"), false);

    const unknown = applyRpc(base, JSON.stringify({ method: "evil-method-sentinel", params: { password: "pw-sentinel" } }));
    const unknownRaw = JSON.stringify(unknown);
    assert.equal(unknown.rpc, undefined);
    assert.equal(unknownRaw.includes("evil-method-sentinel"), false);
    assert.equal(unknownRaw.includes("pw-sentinel"), false);

    const batch = applyRpc(base, JSON.stringify([{ method: "tools/call", params: { arguments: { slug: "101w", token: "batch-secret" } } }]));
    assert.equal(batch.rpc, "batch");
    assert.equal(batch.slug, undefined);
    assert.equal(JSON.stringify(batch).includes("batch-secret"), false);

    const oddTool = applyRpc(base, JSON.stringify({ method: "tools/call", params: { name: "Ignore Previous", arguments: { slug: "101w" } } }));
    assert.equal(oddTool.tool, undefined);
    assert.equal(oddTool.slug, "101w");
  });

  it("does not parse an MCP body above the cap", () => {
    const secret = "ck_live_fatbodysecret";
    const payload = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: "clarke_list_slots", arguments: { note: secret.padEnd(9000, "x") } },
    });
    assert.ok(payload.length > 8192);
    const line = buildMcpUsage(
      new Request("https://www.clarkebelt.finance/api/v1/mcp", { method: "POST" }),
      200,
      new TextEncoder().encode(payload).buffer,
    );
    assert.equal(line.rpc, undefined);
    assert.equal(line.tool, undefined);
    assert.equal(JSON.stringify(line).includes(secret), false);
  });
});

describe("public usage wrapper", () => {
  it("logs after the handler and does not consume the rate limit", async () => {
    const ip = "192.0.2.77";
    const handler = withPublicUsage("/api/v1/agents/slots", async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const lines = await capture(async () => {
      for (let i = 0; i < 60; i++) {
        const res = await handler(new NextRequest("https://www.clarkebelt.finance/api/v1/agents/slots", {
          headers: { "x-forwarded-for": ip, "user-agent": "wrapper-test" },
        }));
        assert.equal(res.status, 200);
        assert.equal(await res.text(), JSON.stringify({ ok: true }));
      }
    });
    assert.equal(lines.length, 60);
    assert.equal(lines[0].route, "/api/v1/agents/slots");
    assert.equal(lines[0].transport, "http");
    assert.equal(checkRateLimit(ip).allowed, true);
  });

  it("skips OPTIONS and still returns a thrown handler error", async () => {
    const handler = withPublicUsage("/api/v1/agents/slots", async (req: NextRequest) => {
      if (req.method === "OPTIONS") return new Response(null, { status: 204 });
      throw new Error("handler failed");
    });
    const quiet = await capture(async () => {
      const res = await handler(new NextRequest("https://www.clarkebelt.finance/api/v1/agents/slots", { method: "OPTIONS" }));
      assert.equal(res.status, 204);
    });
    assert.equal(quiet.length, 0);

    const lines = await capture(async () => {
      await assert.rejects(
        handler(new NextRequest("https://www.clarkebelt.finance/api/v1/agents/slots", {
          headers: { "x-forwarded-for": "192.0.2.78" },
        })),
        /handler failed/,
      );
    });
    assert.equal(lines.length, 1);
    assert.equal(lines[0].status, 500);
  });

  it("still returns the response when stdout throws", async () => {
    const orig = console.log;
    console.log = () => {
      throw new Error("stdout full");
    };
    try {
      const handler = withPublicUsage("/api/v1/agents/slots", async () => new Response("payload", { status: 201 }));
      const res = await handler(new NextRequest("https://www.clarkebelt.finance/api/v1/agents/slots"));
      assert.equal(res.status, 201);
      assert.equal(await res.text(), "payload");
      emitUsage({
        event: USAGE_EVENT,
        ts: "2026-10-19T00:00:00.000Z",
        transport: "http",
        route: "/api/v1/agents/slots",
        method: "GET",
        status: 200,
        ipHash: "0123456789abcdef",
      });
    } finally {
      console.log = orig;
    }
  });
});

describe("agent and MCP routes keep their responses", () => {
  it("logs a slot read without valuation or congestion and without the raw IP", async () => {
    const lines = await capture(async () => {
      const res = await getSlots(new NextRequest("https://www.clarkebelt.finance/api/v1/agents/slots", {
        headers: { "x-forwarded-for": "203.0.113.90", "user-agent": "slot-list" },
      }));
      assert.equal(res.status, 200);
      assert.match(res.headers.get("cache-control") ?? "", /public, max-age=60, s-maxage=2592000/);
      assert.equal(res.headers.get("set-cookie"), null);
      const body = await res.json() as { data: unknown; meta: { view?: string } };
      assert.equal(body.meta.view, "compact");
      assert.deepEqual(agentPayloadViolations(body.data), []);
    });
    assert.equal(lines.length, 1);
    assert.equal(lines[0].transport, "http");
    assert.equal(lines[0].route, "/api/v1/agents/slots");
    assert.equal(lines[0].status, 200);
    assert.equal(JSON.stringify(lines[0]).includes("203.0.113.90"), false);
  });

  it("logs a safe slug and omits an unsafe one", async () => {
    const good = await capture(async () => {
      const res = await getSlot(
        new NextRequest("https://www.clarkebelt.finance/api/v1/agents/slots/101w", {
          headers: { "x-forwarded-for": "203.0.113.91" },
        }),
        { params: Promise.resolve({ slug: "101w" }) },
      );
      assert.equal(res.status, 200);
      const body = await res.json() as { data: { slug?: string; valuation?: unknown; congestion?: unknown } };
      assert.equal(body.data.slug, "101w");
      assert.equal(body.data.valuation, undefined);
      assert.equal(body.data.congestion, undefined);
      assert.deepEqual(agentPayloadViolations(body.data), []);
    });
    assert.equal(good.length, 1);
    assert.equal(good[0].slug, "101w");
    assert.equal(good[0].route, "/api/v1/agents/slots/[slug]");

    const bad = await capture(async () => {
      const res = await getSlot(
        new NextRequest("https://www.clarkebelt.finance/api/v1/agents/slots/not%20a%20slug", {
          headers: { "x-forwarded-for": "203.0.113.92" },
        }),
        { params: Promise.resolve({ slug: "not a slug" }) },
      );
      assert.equal(res.status, 400);
      assert.deepEqual(await res.json(), { error: "Invalid slug" });
    });
    assert.equal(bad.length, 1);
    assert.equal(bad[0].slug, undefined);
    assert.equal(bad[0].status, 400);
    assert.equal(JSON.stringify(bad[0]).includes("not a slug"), false);
  });

  it("logs an open MCP tool call without changing the JSON-RPC body", async () => {
    const secret = "ck_live_supersecretvalue";
    const init = {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-11-25",
        capabilities: {},
        clientInfo: { name: secret, version: "0.0.0" },
      },
    };
    const call = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "clarke_get_slot",
        arguments: { slug: "101w", operator: "SES-SENTINEL", note: "full-body-sentinel" },
      },
    };
    const headers = {
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
      "mcp-protocol-version": "2025-11-25",
      "x-forwarded-for": "203.0.113.93",
      "user-agent": "mcp-client",
      authorization: `Bearer ${secret}`,
    };
    const lines = await capture(async () => {
      const opened = await handleMcpHttp(new Request(MCP_PUBLIC_URL, { method: "POST", headers, body: JSON.stringify(init) }));
      assert.equal(opened.status, 200);
      assert.match(opened.headers.get("content-type") ?? "", /application\/json/);
      assert.equal(opened.headers.get("set-cookie"), null);
      assert.equal(opened.headers.get("www-authenticate"), null);
      const openedBody = await opened.json() as { jsonrpc?: string; result?: { serverInfo?: { name?: string } } };
      assert.equal(openedBody.jsonrpc, "2.0");
      assert.equal(openedBody.result?.serverInfo?.name, "clarke");
      assert.equal(JSON.stringify(openedBody).includes(USAGE_EVENT), false);
      assert.equal(JSON.stringify(openedBody).includes(secret), false);

      const tool = await handleMcpHttp(new Request(MCP_PUBLIC_URL, { method: "POST", headers, body: JSON.stringify(call) }));
      assert.equal(tool.status, 200);
      const toolBody = await tool.json() as { result?: { content?: Array<{ text?: string }> } };
      const text = toolBody.result?.content?.find((block) => block.text)?.text ?? "";
      const slot = JSON.parse(text) as { slug?: string; valuation?: unknown; congestion?: unknown };
      assert.equal(slot.slug, "101w");
      assert.equal(slot.valuation, undefined);
      assert.equal(slot.congestion, undefined);
      assert.deepEqual(agentPayloadViolations(slot), []);
      assert.equal(text.includes(secret), false);
      assert.equal(text.includes("full-body-sentinel"), false);
    });
    assert.equal(lines.length, 2);
    assert.equal(lines[0].transport, "mcp");
    assert.equal(lines[0].route, "/api/v1/mcp");
    assert.equal(lines[0].rpc, "initialize");
    assert.equal(lines[0].tool, undefined);
    assert.equal(lines[1].rpc, "tools/call");
    assert.equal(lines[1].tool, "clarke_get_slot");
    assert.equal(lines[1].slug, "101w");
    const raw = JSON.stringify(lines);
    assert.equal(raw.includes(secret), false);
    assert.equal(raw.includes("SES-SENTINEL"), false);
    assert.equal(raw.includes("full-body-sentinel"), false);
    assert.equal(raw.includes("203.0.113.93"), false);
  });

  it("still answers MCP when the log write throws", async () => {
    const orig = console.log;
    console.log = () => {
      throw new Error("stdout full");
    };
    try {
      const res = await handleMcpHttp(new Request(MCP_PUBLIC_URL, {
        method: "POST",
        headers: {
          accept: "application/json, text/event-stream",
          "content-type": "application/json",
          "mcp-protocol-version": "2025-11-25",
          "x-forwarded-for": "203.0.113.94",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 3,
          method: "initialize",
          params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "clarke-test", version: "0" } },
        }),
      }));
      assert.equal(res.status, 200);
      const body = await res.json() as { result?: { serverInfo?: { name?: string } } };
      assert.equal(body.result?.serverInfo?.name, "clarke");
    } finally {
      console.log = orig;
    }
  });

  it("does not log CORS preflight", async () => {
    const lines = await capture(async () => {
      const res = await handleMcpHttp(new Request(MCP_PUBLIC_URL, { method: "OPTIONS", headers: { "x-forwarded-for": "203.0.113.95" } }));
      assert.equal(res.status, 204);
      assert.equal(res.headers.get("access-control-allow-origin"), "*");
    });
    assert.equal(lines.length, 0);
  });
});

describe("usage log stays cheap and open", () => {
  const root = process.cwd();

  it("does not add a second limiter, a database, or waitUntil", () => {
    const usage = readFileSync(join(root, "src/lib/agents/usage-log.ts"), "utf8");
    const mcp = readFileSync(join(root, "src/lib/mcp-http.ts"), "utf8");
    const rate = readFileSync(join(root, "src/lib/agents/rate-limit.ts"), "utf8");
    assert.match(rate, /const DEFAULT_MAX = 60/);
    assert.equal((mcp.match(/checkRateLimit\(/g) ?? []).length, 1);
    assert.doesNotMatch(usage, /checkRateLimit|waitUntil|better-sqlite3|fetch\(/);
    assert.doesNotMatch(mcp, /waitUntil/);
    assert.match(usage, /console\.log\(JSON\.stringify\(line\)\)/);
  });

  it("documents that MCP lines are filterable and that logging does not block bots", () => {
    const agent = readFileSync(join(root, "docs/AGENT_API.md"), "utf8");
    assert.equal(agent.includes("\u2014"), false);
    assert.equal(agent.includes("\u2013"), false);
    assert.match(agent, /clarke\.usage/);
    assert.match(agent, /"transport":"mcp"/);
    assert.match(agent, /do not challenge or block/);
    assert.match(agent, /Firewall bot protection/);
    assert.match(agent, /Reads stay open/);
    assert.doesNotMatch(agent, /No API key/i);
  });
});
