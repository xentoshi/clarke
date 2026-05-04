import { NextResponse } from "next/server";
import { stocks } from "@/data/stocks";
import { fetchSparkline } from "@/lib/fetchSparkline";

export const revalidate = 3600;

export async function GET() {
  const results = await Promise.all(
    stocks.map(async (s) => ({
      ticker: s.ticker,
      values: await fetchSparkline(s.ticker),
    }))
  );
  const map: Record<string, number[]> = {};
  for (const r of results) map[r.ticker] = r.values;
  return NextResponse.json(map);
}
