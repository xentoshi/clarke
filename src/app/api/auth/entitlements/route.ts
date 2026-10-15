import { NextResponse } from "next/server";
import { entitlementsFor, getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  return NextResponse.json(entitlementsFor(session), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
