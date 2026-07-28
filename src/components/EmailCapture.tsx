"use client";

import { useState } from "react";

export default function EmailCapture({ label = "Get notified" }: { label?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setState("loading");
    try {
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "waitlist", email }),
      });
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className="text-emerald-400 text-sm font-mono">✓ You&apos;re on the list.</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
      />
      <button
        type="submit"
        disabled={state === "loading"}
        className="px-5 py-2.5 bg-white text-black rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50 shrink-0"
      >
        {state === "loading" ? "…" : label}
      </button>
      {state === "error" && <p className="text-red-400 text-xs mt-1 w-full">Something went wrong. Try again.</p>}
    </form>
  );
}
