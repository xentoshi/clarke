import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { SESSION_COOKIE, cookieOptions, encodeSession } from "@/lib/auth";

// TODO: verify Stripe-Signature with STRIPE_WEBHOOK_SECRET and map
// checkout.session.completed / customer.subscription.deleted to a real user store.
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const raw = await req.text();

  if (!secret) {
    return NextResponse.json({
      received: true,
      mode: "stub",
      todo: "Set STRIPE_WEBHOOK_SECRET and persist subscription state. This stub acknowledges the event only.",
    });
  }

  const sig = req.headers.get("stripe-signature") ?? "";
  // Minimal timestamp,v1 parse — not a full Stripe SDK constructEvent.
  const parts = Object.fromEntries(sig.split(",").map((p) => p.split("=") as [string, string]));
  const signed = `${parts.t}.${raw}`;
  const expected = crypto.createHmac("sha256", secret).update(signed).digest("hex");
  if (!parts.v1 || parts.v1 !== expected) {
    return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 400 });
  }

  let event: { type?: string; data?: { object?: { customer_email?: string; metadata?: { product?: string } } } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const email = event.data?.object?.customer_email;
    if (email) {
      const token = encodeSession({ email, plan: "pro", demo: false });
      const res = NextResponse.json({ received: true, upgraded: email });
      res.cookies.set(SESSION_COOKIE, token, cookieOptions());
      return res;
    }
  }

  return NextResponse.json({ received: true });
}
