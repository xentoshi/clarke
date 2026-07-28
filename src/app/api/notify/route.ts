import { NextRequest, NextResponse } from "next/server";

const ALLOWED_TYPES = new Set(["waitlist"]);
const MAX_STRING = 500;

function sanitize(val: unknown): string {
  return typeof val === "string" ? val.slice(0, MAX_STRING) : "";
}

// Simple in-memory rate limit: max 5 requests per IP per minute
const ipLog = new Map<string, { count: number; reset: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipLog.get(ip);
  if (!entry || now > entry.reset) {
    ipLog.set(ip, { count: 1, reset: now + 60_000 });
    return false;
  }
  if (entry.count >= 5) return true;
  entry.count++;
  return false;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Reject oversized bodies before parsing
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > 4096) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const body = raw as Record<string, unknown>;
  const type = sanitize(body.type) || "waitlist";

  if (!ALLOWED_TYPES.has(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  // Sanitize all string fields — drop anything non-string
  const safe: Record<string, string> = { type };
  for (const [k, v] of Object.entries(body)) {
    if (typeof v === "string") safe[k] = v.slice(0, MAX_STRING);
  }

  // Validate email if present
  if (safe.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safe.email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const webhook = process.env.NOTIFY_WEBHOOK_URL;
  if (webhook) {
    const lines = [`**🛰 Early access signup**`];
    if (safe.email) lines.push(`Email: \`${safe.email}\``);
    const isDiscord = webhook.includes("discord.com");
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isDiscord ? { content: lines.join("\n") } : safe),
      });
    } catch (e) {
      console.error("[notify] webhook failed:", e);
    }
  } else {
    console.log("[notify] submission:", JSON.stringify(safe));
  }

  return NextResponse.json({ ok: true });
}
