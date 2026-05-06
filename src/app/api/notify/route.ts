import { NextRequest, NextResponse } from "next/server";

// In-memory cache for the current process lifetime — used only for deduplication
// within a single server instance. Not durable across deploys or serverless cold starts.
// For production, replace with a persistent store (DB, KV, etc.) and remove this.
const seen = new Set<string>();

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { email, slotId } = body ?? {};

  const validEmail = typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validSlot = typeof slotId === "string" && slotId.length > 0 && slotId.length <= 64;
  if (!validEmail || !validSlot) {
    return NextResponse.json({ error: "Invalid fields" }, { status: 400 });
  }

  const key = `${email}::${slotId}`;
  const alreadyRegistered = seen.has(key);
  if (!alreadyRegistered) seen.add(key);

  // Forward to a contact email via a transactional service if configured.
  // Set NOTIFY_WEBHOOK_URL to a Zapier / Make / Resend webhook to persist signups.
  const webhookUrl = process.env.NOTIFY_WEBHOOK_URL;
  if (webhookUrl && !alreadyRegistered) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, slotId, ts: new Date().toISOString() }),
      });
    } catch {
      // Non-fatal — log and continue so the user still sees success
      console.error("[notify] webhook delivery failed for", email, slotId);
    }
  }

  if (!alreadyRegistered) {
    console.log(`[notify] signup: ${email} → slot ${slotId}`);
  }

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const slotId = req.nextUrl.searchParams.get("slotId");
  const count = slotId
    ? [...seen].filter((k) => k.endsWith(`::${slotId}`)).length
    : seen.size;
  return NextResponse.json({ count });
}
