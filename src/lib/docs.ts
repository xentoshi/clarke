import { readFileSync } from "node:fs";
import { join } from "node:path";
import { extractToc, markdownToHtml, stripFirstH1, type TocItem } from "./markdown";

export type DocSlug = "data-trust" | "valuation" | "fcc-refresh";

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
    summary: "Field trust matrix, TLE-primary occupancy, V/M/S legend, and what Clarke will not claim.",
    tldr: "Occupancy clusters on Space-Track TLE longitude when quality gates pass, otherwise the UCS catalog. Operator display is a curated alias map over UCS/FCC strings; raw source strings stay inspectable. FCC rows come from the committed SSAL workbook. Implied value is a labeled v0 model behind one disclosure. ITU SNS is not ingested (Unrecorded in Clarke). The simulated capacity book is not on Slot Terminal.",
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
    tldr: "point = $30M × documented drivers. The confidence band widens as confidence falls (±22% / ±35% / ±50%). Curated $NNN M+ overlays are class M opinions, secondary to the model range. Valuation basis is always model.",
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
    tldr: "Clarke does not scrape fcc.gov. Product as-of is the workbook sheet date (for example Updated 30 April 2026), not the ingest clock. Replace data/ssal.xlsx, run npm run ingest:fcc, commit the workbook and data/clarke.db.",
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
