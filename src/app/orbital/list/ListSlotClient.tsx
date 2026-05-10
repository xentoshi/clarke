"use client";

import Link from "next/link";

export default function ListSlotClient() {
  const dmText = encodeURIComponent(
    "Hi, I operate a satellite and want to list my orbital slot on Clarke. Slot: [longitude/name]. ITU ref: [ref]. Annual transponder revenue: [approx]. Happy to share more details."
  );

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-16">
      <Link href="/orbital" className="text-zinc-600 text-xs hover:text-zinc-400 transition-colors mb-8 block">← Orbital Slots</Link>

      <p className="text-zinc-600 text-xs font-mono mb-3">// OPERATORS</p>
      <h1 className="text-2xl font-bold text-white mb-4">List your slot</h1>
      <p className="text-zinc-400 text-sm leading-relaxed mb-10">
        Clarke is working directly with satellite operators to structure the first on-chain orbital slot offerings.
        No filing transfer. No operational changes. Your slot, your satellite, your license.
      </p>

      <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/20 mb-6">
        <div className="text-zinc-500 text-xs font-mono mb-4 uppercase tracking-widest">What to include in your DM</div>
        <ul className="space-y-2 text-zinc-400 text-sm">
          {[
            "Your orbital longitude and ITU network reference",
            "Operating satellite name",
            "Approximate annual transponder revenue",
            "Target raise amount (if known)",
            "Best contact for follow-up",
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-zinc-700 shrink-0">—</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <a
        href={`https://x.com/messages/compose?recipient_id=xentoshi&text=${dmText}`}
        target="_blank"
        rel="noreferrer"
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors"
      >
        DM @xentoshi on X →
      </a>

      <p className="text-zinc-600 text-xs text-center mt-4">
        We respond within 24 hours.
      </p>
    </div>
  );
}
