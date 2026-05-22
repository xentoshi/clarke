import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const revalidate = 600;

export interface TleEntry {
  norad_id: string;
  name: string | null;
  tle1: string;
  tle2: string;
}

export async function GET() {
  const db = getDb();

  if (!db) {
    return NextResponse.json(
      { error: "Database not found. Run npm run ingest first." },
      { status: 503 }
    );
  }

  const tableExists = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='spacetrack_tles'")
    .get();

  if (!tableExists) {
    return NextResponse.json(
      { error: "No TLE data. Run: npm run ingest:spacetrack" },
      { status: 503 }
    );
  }

  const rows = db
    .prepare("SELECT norad_id, name, tle1, tle2 FROM spacetrack_tles ORDER BY norad_id")
    .all() as TleEntry[];

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No TLE data. Run: npm run ingest:spacetrack" },
      { status: 503 }
    );
  }

  return NextResponse.json(rows, {
    headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=120" },
  });
}
