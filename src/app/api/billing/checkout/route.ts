import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, cookieOptions, encodeSession, getSession } from "@/lib/auth";

const STRIPE_API = "https://api.stripe.com/v1/checkout/sessions";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in first", login: "/login" }, { status: 401 });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  const price = process.env.STRIPE_PRICE_ID;
  const origin = req.nextUrl.origin;

  // TODO: replace demo upgrade with Stripe when STRIPE_SECRET_KEY + STRIPE_PRICE_ID are set.
  if (!secret || !price) {
    const token = encodeSession({ email: session.email, plan: "pro", demo: true });
    const res = NextResponse.json({
      mode: "demo",
      plan: "pro",
      message: "Stripe secrets are not configured. Issued a local demo Pro seat. Set STRIPE_SECRET_KEY and STRIPE_PRICE_ID to enable Checkout.",
    });
    res.cookies.set(SESSION_COOKIE, token, cookieOptions());
    return res;
  }

  const body = new URLSearchParams({
    mode: "subscription",
    success_url: `${origin}/account?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=cancel`,
    "line_items[0][price]": price,
    "line_items[0][quantity]": "1",
    customer_email: session.email,
    client_reference_id: session.email,
    "metadata[product]": "clarke_terminal_pro",
  });

  const stripeRes = await fetch(STRIPE_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const json = (await stripeRes.json()) as { id?: string; url?: string; error?: { message?: string } };
  if (!stripeRes.ok || !json.url) {
    return NextResponse.json(
      { error: json.error?.message ?? "Stripe Checkout failed", todo: "Check STRIPE_SECRET_KEY / STRIPE_PRICE_ID" },
      { status: 502 },
    );
  }
  return NextResponse.json({ mode: "stripe", url: json.url, id: json.id });
}
