import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { gunzipSync } from "node:zlib";
import { NextRequest } from "next/server";
import { GET as getSlots } from "../app/api/v1/agents/slots/route";
import { POST, GET as getMcp } from "../app/api/v1/mcp/route";
import { listDeltas } from "./agents/operations";
import { DELTA_PAGE_BYTE_BUDGET, DELTA_PAGE_MAX_CHANGES } from "./delta-feed";
import { MAX_MCP_REQUEST_BYTES } from "./mcp-http";
import { getDb } from "./db";
import { processCacheStats, registryGeneratedAt } from "./process-cache";

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
    assert.match(first.headers.get("cache-control") ?? "", /public, max-age=60, s-maxage=86400, stale-while-revalidate=604800/);
    const etag = first.headers.get("etag");
    assert.ok(etag);
    const body = await first.json() as {
      data: Array<{ slug?: string; occupancy?: unknown; valuation?: unknown; congestion?: unknown }>;
      meta: { count: number; view?: string; total?: number };
    };
    assert.equal(body.meta.view, "compact");
    assert.ok(body.data.length > 1);
    assert.ok(body.data.length <= 50);
    assert.equal(body.meta.count, body.data.length);
    assert.ok((body.meta.total ?? 0) >= body.data.length);
    assert.equal(body.data[0]?.occupancy, undefined);
    assert.equal(body.data[0]?.valuation, undefined);
    assert.equal(body.data[0]?.congestion, undefined);
    assert.ok(body.data[0]?.slug);
    assert.ok(JSON.stringify(body).length < 32_000);
    assert.doesNotMatch(first.headers.get("vary") ?? "", /cookie/i);
    assert.match(first.headers.get("vary") ?? "", /Accept-Encoding/);
    assert.equal(first.headers.get("vercel-cdn-cache-control")?.includes("s-maxage=86400"), true);
    assert.ok(mid.misses > before.misses);

    const second = await getSlots(slotsRequest("203.0.113.81", { "if-none-match": etag }));
    const after = processCacheStats();
    assert.equal(second.status, 304);
    assert.equal(second.headers.get("etag"), etag);
    assert.equal(after.misses, mid.misses);
  });

  it("pages delta changes under the byte budget and resumes with after", () => {
    const first = listDeltas();
    assert.equal(first.truncated, true);
    assert.ok(first.nextAfter);
    assert.ok(first.changes.length <= DELTA_PAGE_MAX_CHANGES);
    assert.ok(JSON.stringify(first.changes).length <= DELTA_PAGE_BYTE_BUDGET);
    const second = listDeltas({ after: first.nextAfter ?? undefined });
    assert.ok(second.changes.length > 0);
    const seen = new Set(first.changes.map((row) => row.id));
    assert.equal(second.changes.some((row) => seen.has(row.id)), false);
  });

  it("gzip compresses the compact slot list and keeps the ETag on the uncompressed body", async () => {
    const plain = await getSlots(slotsRequest("203.0.113.84"));
    const etag = plain.headers.get("etag");
    const gzipped = await getSlots(slotsRequest("203.0.113.85", { "accept-encoding": "gzip" }));
    assert.equal(gzipped.status, 200);
    assert.equal(gzipped.headers.get("content-encoding"), "gzip");
    assert.equal(gzipped.headers.get("etag"), etag);
    const json = JSON.parse(gunzipSync(Buffer.from(await gzipped.arrayBuffer())).toString("utf8")) as { meta: { view?: string } };
    assert.equal(json.meta.view, "compact");
  });

  it("serves the full slot record only when view=full is explicit", async () => {
    const res = await getSlots(new NextRequest("https://www.clarkebelt.finance/api/v1/agents/slots?view=full&limit=2", {
      headers: { "x-forwarded-for": "203.0.113.86" },
    }));
    assert.equal(res.status, 200);
    const body = await res.json() as { data: Array<{ occupancy?: unknown; valuation?: unknown }>; meta: { view?: string; count: number } };
    assert.equal(body.meta.view, "full");
    assert.equal(body.meta.count, 2);
    assert.ok(Array.isArray(body.data[0]?.occupancy));
    assert.equal(body.data[0]?.valuation, undefined);
  });

  it("stamps meta.generated_at from the newest ingest, not the file mtime", async () => {
    const res = await getSlots(slotsRequest("203.0.113.87"));
    assert.equal(res.status, 200);
    const body = await res.json() as { meta: { generated_at: string } };
    const db = getDb();
    assert.ok(db);
    const row = db.prepare("SELECT MAX(last_run) AS lastRun FROM ingest_meta").get() as { lastRun: string };
    const expected = new Date(`${row.lastRun.trim().replace(" ", "T")}Z`).toISOString();
    assert.equal(body.meta.generated_at, expected);
    assert.equal(body.meta.generated_at, registryGeneratedAt());
    assert.notEqual(body.meta.generated_at, "2018-10-20T01:46:40.000Z");
    assert.doesNotMatch(body.meta.generated_at, /^2018-10-20/);
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
    assert.match(probe.headers.get("cache-control") ?? "", /public, max-age=86400/);

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
