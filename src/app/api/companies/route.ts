import { NextRequest, NextResponse } from "next/server";
import { companies, verticalLabels, stageLabels } from "@/data/companies";

export const revalidate = 3600;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const vertical = searchParams.get("vertical");
  const stage = searchParams.get("stage");
  const ticker = searchParams.get("ticker");

  let results = companies;

  if (vertical) results = results.filter((c) => c.vertical === vertical);
  if (stage) results = results.filter((c) => c.stage === stage);
  if (ticker !== null) results = results.filter((c) => !!c.ticker);

  const payload = {
    _note: `Clarke space infrastructure dataset. ${results.length} companies across ${Object.keys(verticalLabels).length} verticals. See /api-docs for full documentation.`,
    generated: new Date().toISOString(),
    version: "1",
    count: results.length,
    filters: {
      vertical: vertical ?? null,
      stage: stage ?? null,
      public_only: ticker !== null,
    },
    companies: results.map((c) => ({
      slug: c.slug,
      name: c.name,
      description: c.description,
      vertical: c.vertical,
      vertical_label: verticalLabels[c.vertical],
      stage: c.stage,
      stage_label: stageLabels[c.stage],
      founded: c.founded,
      hq: c.hq,
      website: c.website,
      ticker: c.ticker ?? null,
      funding: c.funding ?? null,
      notable: c.notable ?? null,
    })),
  };

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
