import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { GET as getSlots } from "../app/api/v1/agents/slots/route";
import { POST, GET as getMcp } from "../app/api/v1/mcp/route";
import { listDeltas } from "./agents/operations";
import { buildDeltaFeedFromDb } from "./registry-snapshot";
import { MAX_MCP_REQUEST_BYTES } from "./mcp-http";
import { processCacheStats } from "./process-cache";

function slotsRequest(ip: string, headers: Record<string, string> = {}) {
  return new NextRequest("https://www.clarkebelt.finance/api/v1/agents/slots", {
    headers: { "x-forwarded-for": ip, ...headers },
  });
}

describe("public read cache and delta page", () => {
  it("reuses the process cache and honors If-None-Match on the slot list", async () => {
    const before = processCacheStats();
    const first = await getSlots(slotsRequest("203.0.113.80"));
    const mid = processCacheStats();
    assert.equal(first.status, 200);
    assert.match(first.headers.get("cache-control") ?? "", /public, max-age=60, s-maxage=3600/);
    const etag = first.headers.get("etag");
    assert.ok(etag);
    const body = await first.json() as { data: unknown[]; meta: { count: number } };
    assert.ok(body.data.length > 1);
    assert.equal(body.meta.count, body.data.length);
    assert.ok(mid.misses > before.misses);

    const second = await getSlots(slotsRequest("203.0.113.81", { "if-none-match": etag }));
    const after = processCacheStats();
    assert.equal(second.status, 304);
    assert.equal(second.headers.get("etag"), etag);
    assert.equal(after.misses, mid.misses);
  });

  it("pages delta changes on detectedAt boundaries", () => {
    const full = buildDeltaFeedFromDb();
    const first = listDeltas();
    assert.equal(first.truncated, true);
    assert.ok(first.nextSince);
    const stamp = first.nextSince;
    assert.equal(
      first.changes.filter((row) => row.detectedAt === stamp).length,
      full.changes.filter((row) => row.detectedAt === stamp).length,
    );
    const second = listDeltas({ since: stamp });
    assert.ok(second.changes.length > 0);
    assert.equal(second.changes.some((row) => row.detectedAt === stamp), false);
    const seen = new Set(first.changes.map((row) => row.id));
    assert.equal(second.changes.some((row) => seen.has(row.id)), false);
  });

  it("caches MCP GET and refuses an oversized POST body", async () => {
    const probe = await getMcp(new NextRequest("https://www.clarkebelt.finance/api/v1/mcp", {
      method: "GET",
      headers: {
        accept: "application/json, text/event-stream",
        "mcp-protocol-version": "2025-11-25",
        "x-forwarded-for": "203.0.113.82",
      },
    }));
    assert.equal(probe.status, 405);
    assert.match(probe.headers.get("cache-control") ?? "", /public, max-age=3600/);

    const pad = "a".repeat(MAX_MCP_REQUEST_BYTES);
    const res = await POST(new NextRequest("https://www.clarkebelt.finance/api/v1/mcp", {
      method: "POST",
      headers: {
        accept: "application/json, text/event-stream",
        "content-type": "application/json",
        "mcp-protocol-version": "2025-11-25",
        "x-forwarded-for": "203.0.113.83",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { pad } }),
    }));
    assert.equal(res.status, 413);
    assert.equal(res.headers.get("cache-control"), "no-store");
  });
});
