import { NextResponse } from "next/server";
import { stocks } from "@/data/stocks";
import { fetchAllQuotes } from "@/lib/fetchStocks";

export const revalidate = 300;

export async function GET() {
  const tickers = stocks.map((s) => s.ticker);
  const quotes = await fetchAllQuotes(tickers);
  return NextResponse.json(quotes);
}
