import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

describe("llms.txt agent discovery", () => {
  const text = readFileSync(join(root, "public", "llms.txt"), "utf8");

  it("follows the llms.txt section order and stays free of vendor taglines", () => {
    assert.match(text, /^# Clarke\n\n> /);
    assert.equal(text.includes("\u2014"), false);
    assert.equal(text.includes("\u2013"), false);
    assert.doesNotMatch(text, /Bloomberg|CoStar|\bCME\b/);
    assert.equal(existsSync(join(root, "public", "llms-full.txt")), false);
  });

  it("points at the live agent routes with absolute www URLs", () => {
    const urls = [
      "https://www.clarkebelt.finance/api/v1/agents/slots",
      "https://www.clarkebelt.finance/api/v1/agents/slots/101w",
      "https://www.clarkebelt.finance/api/v1/agents/deltas",
      "https://www.clarkebelt.finance/api/v1/mcp",
      "https://www.clarkebelt.finance/api/v1/openapi",
      "https://www.clarkebelt.finance/docs/agent-api",
      "https://www.clarkebelt.finance/api/v1/agents/satellites",
    ];
    for (const url of urls) assert.ok(text.includes(url), url);
    assert.match(text, /clarke_list_slots/);
    assert.match(text, /clarke_get_slot/);
    assert.match(text, /clarke_get_terminal/);
    assert.match(text, /clarke_list_deltas/);
    assert.match(text, /same object as `clarke_get_slot`/);
    assert.match(text, /stateless Streamable HTTP/);
    assert.match(text, /Reads are open/);
    assert.match(text, /GET returns 405/);
    assert.doesNotMatch(text, /No API key/i);
    assert.doesNotMatch(text, /has no public URL/);
  });

  it("states the payload exclusions, ITU hole, FCC as-of, and bootstrap caveat", () => {
    assert.match(text, /Valuation and congestion are not in the public agent or MCP payload/);
    assert.match(text, /live only as labeled models on the human Slot Terminal/);
    assert.match(text, /must not treat them as facts/);
    assert.match(text, /ITU SNS is not ingested/);
    assert.match(text, /`ituRecorded` is `not_in_product`/);
    assert.match(text, /workbook as-of is 2026-09-27/);
    assert.match(text, /`sourceVintage\.tleStale` is true when a TLE that supplied occupancy is older than 14 days/);
    assert.match(text, /tleStaleAfterDays/);
    assert.match(text, /UCS fallback row does not use a catalog date as a TLE epoch/);
    assert.match(text, /`coverage` is `bootstrap` until a second registry snapshot is stored/);
    assert.match(text, /including `tle_epoch`/);
    assert.match(text, /empty occupancy list is not a claim that nothing moved/);
    assert.match(text, /uses `operatorIdentity` and `operatorMix`, not a single headline operator/);
  });

  it("is linked from the docs hub and the agent API page source", () => {
    const hub = readFileSync(join(root, "src/app/docs/page.tsx"), "utf8");
    assert.match(hub, /href="\/llms\.txt"/);
    const agent = readFileSync(join(root, "docs/AGENT_API.md"), "utf8");
    assert.match(agent, /https:\/\/www\.clarkebelt\.finance\/llms\.txt/);
  });
});
