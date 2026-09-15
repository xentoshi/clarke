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
      <p className="text-zinc-600 text-xs font-mono mb-3">{"// SEATS"}</p>
      <h1 className="text-2xl font-bold text-white mb-2">Sign in</h1>
      <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
        Passwordless stub for the MVP. Any email issues a session cookie. Use Demo Pro to review the paid Terminal without Stripe.
      </p>
      <label className="block text-xs text-zinc-500 mb-1">Email</label>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white mb-4 focus:outline-none focus:border-zinc-600"
      />
      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
      <div className="flex flex-col gap-2">
        <button disabled={pending} onClick={() => submit("free")}
          className="bg-white text-black rounded-lg px-4 py-2.5 text-sm font-bold hover:bg-zinc-200 disabled:opacity-50">
          Continue free
        </button>
        <button disabled={pending} onClick={() => submit("pro")}
          className="border border-zinc-700 text-zinc-200 rounded-lg px-4 py-2.5 text-sm font-medium hover:border-zinc-500 disabled:opacity-50">
          Enter Demo Pro seat
        </button>
      </div>
      <p className="text-zinc-600 text-xs mt-6">
        Paid Checkout lives on <Link href="/pricing" className="text-zinc-400 hover:text-white underline">Pricing</Link> when Stripe keys are set.
      </p>
    </div>
  );
}
