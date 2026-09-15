import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  SESSION_COOKIE,
  cookieOptions,
  encodeSession,
  getSession,
  mintApiKey,
} from "@/lib/auth";

const LoginBody = z.object({
  email: z.string().email().max(120),
  plan: z.enum(["free", "pro"]).optional(),
  demo: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = LoginBody.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Valid email required" }, { status: 400 });

  const demo = parsed.data.demo === true || parsed.data.plan === "pro";
  const plan = parsed.data.plan === "pro" ? "pro" : "free";
  const token = encodeSession({ email: parsed.data.email.toLowerCase(), plan, demo });

  const res = NextResponse.json({
    email: parsed.data.email.toLowerCase(),
    plan,
    demo,
    message: plan === "pro"
      ? "Demo Pro seat issued. This is not a paid Stripe subscription unless you checked out separately."
      : "Signed in on the free registry. Upgrade at /pricing for Terminal Pro.",
  });
  res.cookies.set(SESSION_COOKIE, token, cookieOptions());
  return res;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ session: null });
  return NextResponse.json({
    session: { email: session.email, plan: session.plan, demo: session.demo, exp: session.exp },
    apiKeyHint: session.plan === "pro" ? mintApiKey(session).slice(0, 18) + "…" : null,
  });
}
