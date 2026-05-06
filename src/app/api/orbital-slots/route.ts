import { NextRequest, NextResponse } from "next/server";
import { slots } from "@/data/orbital-slots";

export const revalidate = 3600;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const listed = searchParams.get("listed");

  let results = slots;
  if (status) results = results.filter((s) => s.status === status);
  if (listed === "true") results = results.filter((s) => s.tokenization?.status === "listed");

  const payload = {
    _note: "Clarke GEO orbital slot registry. Data sourced from ITU IFIC, UCS Satellite Database, and operator public filings. See /docs for methodology.",
    generated: new Date().toISOString(),
    version: "1",
    count: results.length,
    filters: { status: status ?? null, listed: listed ?? null },
    slots: results.map((s) => ({
      id: s.id,
      longitude: s.longitude,
      label: s.label,
      operator: s.operator,
      country: s.country,
      bands: s.bands,
      status: s.status,
      satellite: s.satellite ?? null,
      coverage: s.coverage,
      value_estimate: s.valueEstimate,
      launched: s.launched ?? null,
      tokenization: s.tokenization
        ? {
            status: s.tokenization.status,
            token_price: s.tokenization.tokenPrice,
            min_investment: s.tokenization.minInvestment,
            lease_yield: s.tokenization.leaseYield,
            total_tokens: s.tokenization.totalTokens,
            available_tokens: s.tokenization.availableTokens,
            sold_tokens: s.tokenization.soldTokens,
          }
        : null,
    })),
  };

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
