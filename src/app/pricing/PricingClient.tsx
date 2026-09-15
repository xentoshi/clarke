"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PricingClient({
  loggedIn,
  pro,
  email,
}: {
  loggedIn: boolean;
  pro: boolean;
  email: string | null;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function checkout() {
    setPending(true);
    setMsg(null);
    if (!loggedIn) {
      router.push("/login?next=/pricing");
      return;
    }
    const res = await fetch("/api/billing/checkout", { method: "POST" });
    const json = await res.json() as { url?: string; mode?: string; message?: string; error?: string };
    setPending(false);
    if (json.url) {
      window.location.href = json.url;
      return;
    }
    if (json.mode === "demo") {
      setMsg(json.message ?? "Demo Pro seat issued.");
      router.refresh();
      return;
    }
    setMsg(json.error ?? "Checkout failed");
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <p className="text-zinc-600 text-xs font-mono mb-3">{"// TERMINAL_SEATS"}</p>
      <h1 className="text-3xl font-bold text-white mb-3">Slot Terminal seats</h1>
      <p className="text-zinc-500 text-sm mb-10 leading-relaxed max-w-2xl">
        The public registry stays free. Deep valuation, compare, export+, and the Terminal API sit behind a Pro seat.
        {email && <span className="block mt-2 text-zinc-400 font-mono text-xs">{email} · {pro ? "Pro" : "Free"}</span>}
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-950/40">
          <div className="text-zinc-500 text-xs font-mono uppercase tracking-widest mb-2">Free</div>
          <div className="text-white text-2xl font-bold mb-4">$0</div>
          <ul className="text-zinc-400 text-sm space-y-2 mb-6">
            <li>Public GEO registry</li>
            <li>Limited Slot Terminal (headline value, occupancy, congestion, FCC, comps)</li>
            <li>CSV without driver columns</li>
            <li>Public agents API (rate-limited)</li>
          </ul>
          <Link href="/orbital" className="text-xs text-zinc-400 hover:text-white">Open registry →</Link>
        </div>
        <div className="border border-white/20 rounded-xl p-6 bg-zinc-950">
          <div className="text-emerald-400 text-xs font-mono uppercase tracking-widest mb-2">Pro</div>
          <div className="text-white text-2xl font-bold mb-1">Seat</div>
          <div className="text-zinc-600 text-xs mb-4">Stripe when configured · demo seat otherwise</div>
          <ul className="text-zinc-300 text-sm space-y-2 mb-6">
            <li>Full valuation v0 driver breakdown</li>
            <li>30-day model history</li>
            <li>Compare up to 4 slots</li>
            <li>Export+ (drivers, BIU, remaining life)</li>
            <li>Terminal API + key (300 req/min)</li>
          </ul>
          {pro ? (
            <Link href="/account" className="inline-block bg-white text-black rounded-lg px-4 py-2 text-sm font-bold">Manage seat</Link>
          ) : (
            <button disabled={pending} onClick={checkout}
              className="bg-white text-black rounded-lg px-4 py-2 text-sm font-bold hover:bg-zinc-200 disabled:opacity-50">
              {loggedIn ? "Upgrade to Pro" : "Sign in to upgrade"}
            </button>
          )}
        </div>
      </div>
      {msg && <p className="text-amber-300/90 text-xs mb-4">{msg}</p>}
      <p className="text-zinc-600 text-xs leading-relaxed">
        TODO: wire STRIPE_SECRET_KEY, STRIPE_PRICE_ID, and STRIPE_WEBHOOK_SECRET for live billing.
        Without them, Upgrade issues a clearly labeled demo Pro cookie so reviewers can exercise the gate.
      </p>
    </div>
  );
}
