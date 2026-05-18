import { NextRequest, NextResponse } from "next/server";

// Simple in-memory store — resets on cold start, good enough for monitoring
// Keyed by path, value is hit count
const counts = new Map<string, number>();
const recent: { path: string; ts: number; ref: string }[] = [];
const MAX_RECENT = 500;

// Simple IP-based rate limit to avoid self-spam
const ipLog = new Map<string, number>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const last = ipLog.get(ip) ?? 0;
  if (now - last < 2000) return true; // 2s cooldown per IP per path
  ipLog.set(ip, now);
  return false;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) return NextResponse.json({ ok: true });

  let path = "/";
  let ref = "";
  try {
    const body = await req.json();
    path = (typeof body.path === "string" ? body.path : "/").slice(0, 200);
    ref = (typeof body.ref === "string" ? body.ref : "").slice(0, 200);
  } catch {
    // ignore
  }

  counts.set(path, (counts.get(path) ?? 0) + 1);
  recent.push({ path, ts: Date.now(), ref });
  if (recent.length > MAX_RECENT) recent.shift();

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const secret = process.env.PV_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const last50 = recent.slice(-50).reverse();
  return NextResponse.json({ counts: Object.fromEntries(sorted), recent: last50, total: [...counts.values()].reduce((a, b) => a + b, 0) });
}
