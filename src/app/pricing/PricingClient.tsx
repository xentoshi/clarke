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
    <div className="max-w-3xl mx-auto px-4 py-20">
      <p className="text-muted text-[14px] mb-3">Seats</p>
      <h1 className="text-4xl sm:text-5xl font-semibold text-ink tracking-tight mb-4">Slot Terminal seats</h1>
      <p className="text-muted text-base mb-10 leading-relaxed max-w-2xl">
        The public registry stays free. Deep valuation, compare, export+, and the Terminal API sit behind a Pro seat.
        {email && <span className="block mt-2 text-ink font-mono text-sm">{email} · {pro ? "Pro" : "Free"}</span>}
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="border border-line bg-surface p-6">
          <div className="text-faint text-sm mb-2">Free</div>
          <div className="text-ink text-2xl font-semibold mb-4">$0</div>
          <ul className="text-muted text-sm space-y-2 mb-6">
            <li>Public GEO registry</li>
            <li>Limited Slot Terminal (occupancy, FCC, freshness, labeled model)</li>
            <li>CSV without driver columns</li>
            <li>Public agents API (rate-limited)</li>
          </ul>
          <Link href="/orbital" className="text-sm text-ink hover:text-muted">Open registry →</Link>
        </div>
        <div className="border border-ink/20 bg-surface p-6">
          <div className="text-verified text-sm mb-2">Pro</div>
          <div className="text-ink text-2xl font-semibold mb-1">Seat</div>
          <div className="text-faint text-sm mb-4">Stripe when configured · demo seat otherwise</div>
          <ul className="text-ink text-sm space-y-2 mb-6">
            <li>Full valuation v0 driver breakdown</li>
            <li>30-day model-path backfill (Experimental. Not trades.)</li>
            <li>Compare up to 4 slots</li>
            <li>Export+ (drivers, BIU, remaining life)</li>
            <li>Terminal API + key (300 req/min)</li>
          </ul>
          {pro ? (
            <Link href="/account" className="inline-block bg-ink text-canvas rounded-sm px-4 py-2 text-sm font-semibold">Manage seat</Link>
          ) : (
            <button disabled={pending} onClick={checkout}
              className="bg-ink text-canvas rounded-sm px-4 py-2 text-sm font-semibold hover:bg-ink/85 disabled:opacity-50">
              {loggedIn ? "Upgrade to Pro" : "Sign in to upgrade"}
            </button>
          )}
        </div>
      </div>
      {msg && <p className="text-stale text-sm mb-4">{msg}</p>}
      <p className="text-faint text-sm leading-relaxed">
        TODO: wire STRIPE_SECRET_KEY, STRIPE_PRICE_ID, and STRIPE_WEBHOOK_SECRET for live billing.
        Without them, Upgrade issues a clearly labeled demo Pro cookie so reviewers can exercise the gate.
      </p>
    </div>
  );
}
