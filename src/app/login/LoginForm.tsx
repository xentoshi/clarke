"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/orbital";
  const [email, setEmail] = useState("analyst@clarke.demo");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(plan: "free" | "pro") {
    setPending(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, plan, demo: plan === "pro" }),
    });
    const json = await res.json() as { error?: string };
    setPending(false);
    if (!res.ok) { setError(json.error ?? "Sign-in failed"); return; }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <p className="text-muted text-sm mb-2">Seats</p>
      <h1 className="text-3xl font-semibold text-ink tracking-tight mb-2">Sign in</h1>
      <p className="text-muted text-sm mb-6 leading-relaxed">
        Passwordless stub for the MVP. Any email issues a session cookie. Use Demo Pro to review the paid Terminal without Stripe.
      </p>
      <label className="block text-sm text-muted mb-1">Email</label>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        className="w-full bg-surface border border-line rounded-sm px-3 py-2 text-sm text-ink mb-4 focus:outline-none focus:border-line-strong"
      />
      {error && <p className="text-danger text-sm mb-3">{error}</p>}
      <div className="flex flex-col gap-2">
        <button disabled={pending} onClick={() => submit("free")}
          className="bg-ink text-canvas rounded-sm px-4 py-2.5 text-sm font-semibold hover:bg-ink/85 disabled:opacity-50">
          Continue free
        </button>
        <button disabled={pending} onClick={() => submit("pro")}
          className="border border-line text-ink rounded-sm px-4 py-2.5 text-sm hover:border-line-strong disabled:opacity-50">
          Enter Demo Pro seat
        </button>
      </div>
      <p className="text-faint text-sm mt-6">
        Paid Checkout lives on <Link href="/pricing" className="text-ink hover:text-muted underline">Pricing</Link> when Stripe keys are set.
      </p>
    </div>
  );
}
