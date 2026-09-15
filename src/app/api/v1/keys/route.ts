import { NextResponse } from "next/server";
import { getSession, mintApiKey } from "@/lib/auth";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  if (session.plan !== "pro") {
    return NextResponse.json({ error: "Pro seat required to mint an API key", upgrade: "/pricing" }, { status: 403 });
  }
  const key = mintApiKey(session);
  return NextResponse.json({
    key,
    prefix: key.slice(0, 12),
    note: "Store this now. v0 keys are signed tokens (not hashed server-side). Send as Authorization: Bearer <key> or X-Clarke-Key. TODO: persist hashed keys before production metering.",
  });
}
