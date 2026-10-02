import { readFileSync } from "node:fs";
import { join } from "node:path";
import { extractToc, markdownToHtml, stripFirstH1, type TocItem } from "./markdown";

export type DocSlug = "data-trust" | "agent-api" | "valuation" | "fcc-refresh";

export type DocMeta = {
  slug: DocSlug;
  href: `/${string}`;
  file: string;
  kicker: string;
  title: string;
  description: string;
  summary: string;
  tldr: string;
};

export const DOC_PAGES: DocMeta[] = [
  {
    slug: "data-trust",
    href: "/docs/data-trust",
    file: "DATA_TRUST.md",
    kicker: "DATA_TRUST",
    title: "Data trust",
    description:
      "What a paying operator can trust on Slot Terminal: occupancy, FCC, freshness, and the labeled model.",
    summary: "Field trust matrix, TLE-primary occupancy, one registry row per slug, and what Clarke will not claim.",
    tldr: "Occupancy clusters on Space-Track TLE longitude when quality gates pass, otherwise the UCS catalog. The registry table is one row per slug. Operator display is a curated alias map over UCS/FCC strings; raw source strings stay inspectable. FCC rows come from the committed SSAL workbook. Congestion v0 and implied fair value are labeled models on the Slot Terminal, not recorded facts. Fair value stays behind one disclosure and off the registry until Show fair value. ITU SNS is not ingested. The flag is not_in_product (Unrecorded in Clarke): not a network name, not brought-into-use evidence, and not a filled filing row. The simulated capacity book is not on Slot Terminal.",
  },
  {
    slug: "agent-api",
    href: "/docs/agent-api",
    file: "AGENT_API.md",
    kicker: "AGENT_API",
    title: "Agent API",
    description:
      "Public HTTP routes and MCP tools for the Clarke slot record and the on-ingest delta feed. Valuation and congestion are not included.",
    summary:
      "HTTP and MCP slot record, plus GET /api/v1/agents/deltas. Valuation and congestion are not in the payload.",
    tldr: "Public agents read one registry record over HTTP and MCP: occupancy (TLE-primary, UCS fallback), operatorIdentity and operatorMix, FCC rows, disputes, source vintage, and provenance. ituRecorded is not_in_product on every slot. There is no headline operator. Valuation, congestion, bid/ask, comps, and dollar strings are not in this payload. Congestion v0 and implied fair value live only as labeled models on the human Slot Terminal and must not be treated as facts. GET /api/v1/agents/deltas is the on-ingest change feed. With one stored snapshot, coverage is bootstrap: FCC call-sign events already in slot_events are included, and occupancy or dispute changes are not invented.",
  },
  {
    slug: "valuation",
    href: "/docs/valuation",
    file: "VALUATION.md",
    kicker: "VALUATION_V0",
    title: "Valuation v0",
    description:
      "How Clarke’s Slot Terminal implied fair value is computed, what it is not, and how history is stored.",
    summary: "The $30M baseline formula, drivers, confidence bands, and quarantined model-backfill history.",
    tldr: "point = $30M × documented drivers, including congestion v0 as the scarcity driver. Both are labeled models on the Slot Terminal, not recorded facts. The confidence band widens as confidence falls (±22% / ±35% / ±50%). Curated $NNN M+ overlays are class M opinions, secondary to the model range. Valuation basis is always model.",
  },
  {
    slug: "fcc-refresh",
    href: "/docs/fcc-refresh",
    file: "FCC_REFRESH.md",
    kicker: "FCC_REFRESH",
    title: "FCC SSAL refresh",
    description:
      "Operator runbook: how Clarke refreshes FCC license rows from the committed SSAL workbook. Not a live fcc.gov scrape.",
    summary: "Workbook vintage, weekly re-parse, and the human replace-xlsx steps when the FCC publishes a new list.",
    tldr: "Clarke does not scrape fcc.gov. Product as-of is the workbook sheet date (for example Updated 27 September 2026), not the ingest clock. Replace data/ssal.xlsx, run npm run ingest:fcc, commit the workbook and data/clarke.db.",
  },
];

export type LoadedDoc = DocMeta & { html: string; toc: TocItem[] };

export function loadDoc(slug: DocSlug): LoadedDoc {
  const meta = DOC_PAGES.find((d) => d.slug === slug);
  if (!meta) throw new Error(`Unknown doc slug: ${slug}`);
  const raw = readFileSync(join(process.cwd(), "docs", meta.file), "utf8");
  const body = stripFirstH1(raw);
  return {
    ...meta,
    html: markdownToHtml(body),
    toc: extractToc(body),
  };
}
