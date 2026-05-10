import { NextResponse } from "next/server";
import { fetchAllQuotes } from "@/lib/fetchStocks";
import { stocks } from "@/data/stocks";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET() {
  const tickers = stocks.map((s) => s.ticker);
  const quotes = await fetchAllQuotes(tickers);
  return NextResponse.json(quotes, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
  });
}
