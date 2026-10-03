import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  extractToc,
  markdownToHtml,
  renderInline,
  rewriteDocHref,
  stripFirstH1,
} from "./markdown";
import { loadDoc } from "./docs";

describe("markdown GFM subset", () => {
  it("renders GFM tables as HTML tables, including escaped pipes", () => {
    const html = markdownToHtml(`
| Field | Class | Notes |
|---|---|---|
| Occupancy | **V** | TLE-primary \\| UCS fallback |
| Book | **S** | Experimental only |
`);
    assert.match(html, /<table>/);
    assert.match(html, /<th>Field<\/th>/);
    assert.match(html, /docs-mark-v/);
    assert.match(html, /docs-mark-s/);
    assert.match(html, /TLE-primary \| UCS fallback/);
    assert.doesNotMatch(html, /\| Field \|/);
  });

  it("nests lists and keeps inline code", () => {
    const html = markdownToHtml(`
1. Prefer TLE when gates hold:
   - Object is a satcat **PAYLOAD**
   - Eccentricity ≤ 0.01
2. Else fall back to UCS unless \`0°\`
`);
    assert.match(html, /<ol>/);
    assert.match(html, /<ul>/);
    assert.match(html, /<code>0°<\/code>/);
    assert.match(html, /<strong>PAYLOAD<\/strong>/);
  });

  it("rewrites repo markdown links to public docs routes", () => {
    assert.equal(rewriteDocHref("./FCC_REFRESH.md"), "/docs/fcc-refresh");
    assert.equal(rewriteDocHref("docs/VALUATION.md"), "/docs/valuation");
    assert.equal(rewriteDocHref("./AGENT_API.md"), "/docs/agent-api");
    const html = markdownToHtml("See [FCC refresh](./FCC_REFRESH.md).");
    assert.match(html, /href="\/docs\/fcc-refresh"/);
    assert.doesNotMatch(html, /FCC_REFRESH\.md/);
  });

  it("adds heading ids for TOC", () => {
    const md = "## Field trust matrix (Slot Terminal)\n\n### Before / after\n";
    const toc = extractToc(md);
    assert.equal(toc[0]?.id, "field-trust-matrix-slot-terminal");
    assert.equal(toc[1]?.sub, true);
    const html = markdownToHtml(md);
    assert.match(html, /id="field-trust-matrix-slot-terminal"/);
  });

  it("escapes raw HTML and renders fences", () => {
    const html = markdownToHtml("Use `<script>`.\n\n```\nnpm run ingest:fcc\n```\n");
    assert.match(html, /&lt;script&gt;/);
    assert.match(html, /<pre><code>npm run ingest:fcc/);
    assert.equal(renderInline("a **b** c"), "a <strong>b</strong> c");
  });
});

describe("public docs load the repo markdown", () => {
  it("data-trust includes the field trust matrix, TLE-primary rules, and V/M/S legend", () => {
    const doc = loadDoc("data-trust");
    assert.match(doc.html, /<table>/);
    assert.match(doc.html, /Field trust matrix/i);
    assert.match(doc.html, /TLE-primary/);
    assert.match(doc.html, /docs-mark-v/);
    assert.match(doc.html, /positionDisputed/);
    assert.match(doc.html, /not_in_product/);
    assert.match(doc.html, /Unrecorded in Clarke/);
    assert.match(doc.html, /not a network name/);
    assert.match(doc.html, /one row per slug/);
    assert.match(doc.html, /labeled model/i);
    assert.doesNotMatch(doc.html, /docs\/DATA_TRUST\.md/);
    assert.doesNotMatch(doc.html, /default spine/);
    assert.doesNotMatch(doc.html, /absorbed longitudes are not separate pages/);
    assert.doesNotMatch(doc.html, /522 GEO/);
    assert.doesNotMatch(doc.html, /UCS-primary/);
    assert.ok(doc.toc.some((t) => /field trust matrix/i.test(t.label)));
  });

  it("valuation includes the formula, drivers table, and confidence bands", () => {
    const doc = loadDoc("valuation");
    assert.match(doc.html, /\$30M baseline/);
    assert.match(doc.html, /<table>/);
    assert.match(doc.html, /±22%/);
    assert.match(doc.html, /Arc desirability/);
    assert.match(doc.html, /Labeled model/);
    assert.match(doc.html, /TLE-primary/);
    assert.doesNotMatch(doc.html, /Experimental disclosure/);
    assert.doesNotMatch(doc.html, /docs\/VALUATION\.md/);
  });

  it("agent-api documents the live slot record and keeps valuation out", () => {
    const raw = readFileSync(join(process.cwd(), "docs", "AGENT_API.md"), "utf8");
    assert.equal(raw.includes("\u2014"), false);
    assert.equal(raw.includes("\u2013"), false);
    const doc = loadDoc("agent-api");
    assert.match(doc.html, /GET \/api\/v1\/agents\/slots/);
    assert.match(doc.html, /GET \/api\/v1\/agents\/deltas/);
    assert.match(doc.html, /clarke_list_deltas/);
    assert.match(doc.html, /<code>coverage<\/code> is <code>bootstrap<\/code>/);
    assert.match(doc.html, /satellite_relocated/);
    assert.match(doc.html, /https:\/\/www\.clarkebelt\.finance\/api\/v1\/mcp/);
    assert.match(doc.html, /id="remote-streamable-http"/);
    assert.match(doc.html, /id="local-stdio"/);
    assert.doesNotMatch(doc.html, /####/);
    assert.match(doc.html, /Streamable HTTP/);
    assert.match(doc.html, /Reads are open/);
    assert.doesNotMatch(doc.html, /No API key/i);
    assert.match(doc.html, /405/);
    assert.match(doc.html, /clarke_list_slots/);
    assert.match(doc.html, /clarke_get_slot/);
    assert.match(doc.html, /clarke_get_terminal/);
    assert.match(doc.html, /same JSON as/);
    assert.match(doc.html, /operatorIdentity/);
    assert.match(doc.html, /operatorMix/);
    assert.match(doc.html, /not_in_product/);
    assert.match(doc.html, /fccStale/);
    assert.match(doc.html, /fccStaleAfterDays/);
    assert.match(doc.html, /tle-primary/);
    assert.match(doc.html, /ucs_ghost/);
    assert.match(doc.html, /not in the public agent or MCP payload/i);
    assert.match(doc.html, /human Slot Terminal/);
    assert.match(doc.html, /must not treat them as facts/);
    assert.match(doc.html, /not a single headline operator/);
    assert.match(doc.html, /docs-mark-v/);
    assert.match(doc.html, /docs-mark-s/);
    assert.match(doc.html, /href="\/docs\/data-trust"/);
    assert.match(doc.html, /href="\/docs\/fcc-refresh"/);
    assert.match(doc.html, /href="\/docs\/valuation"/);
    assert.match(doc.html, /ITU SNS is not ingested/);
    assert.match(doc.html, /Do not claim ITU filings are in the product/);
    assert.match(doc.html, /href="https:\/\/www\.clarkebelt\.finance\/llms\.txt"/);
    assert.doesNotMatch(doc.html, /Bloomberg|CoStar|\bCME\b/);
    assert.ok(doc.toc.some((t) => /operator identity/i.test(t.label)));
    assert.ok(doc.toc.some((t) => /fcc freshness/i.test(t.label)));
    assert.ok(doc.toc.some((t) => /delta feed/i.test(t.label)));
  });

  it("fcc-refresh includes the runbook commands and workbook vintage", () => {
    const doc = loadDoc("fcc-refresh");
    assert.match(doc.html, /npm run ingest:fcc/);
    assert.match(doc.html, /data\/ssal\.xlsx/);
    assert.match(doc.html, /14 days/);
    assert.match(doc.html, /fcc\.gov\/approved-space-station-list/);
    assert.match(doc.html, /<table>/);
  });

  it("stripFirstH1 leaves the rest of DATA_TRUST.md intact", () => {
    const raw = readFileSync(join(process.cwd(), "docs", "DATA_TRUST.md"), "utf8");
    const body = stripFirstH1(raw);
    assert.doesNotMatch(body, /^# /);
    assert.match(body, /## Default Terminal quarantine/);
  });
});
