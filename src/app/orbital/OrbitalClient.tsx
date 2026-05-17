"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { slots, statusColors, statusLabels, bandColors } from "@/data/orbital-slots";
import type { OrbitalSlot, SlotStatus } from "@/data/orbital-slots";
import DevnetStatus from "@/components/DevnetStatus";
import InfoTooltip from "@/components/InfoTooltip";
import EmailCapture from "@/components/EmailCapture";

// OrbitalGlobe uses Three.js — must be loaded client-side only
const OrbitalGlobe = dynamic(() => import("@/components/OrbitalGlobe"), {
  ssr: false,
  loading: () => (
    <div className="w-full flex items-center justify-center bg-zinc-950 rounded-xl" style={{ height: 560 }}>
      <span className="text-zinc-700 text-xs font-mono">Loading globe…</span>
    </div>
  ),
});

const STATUS_TIPS: Record<SlotStatus, string> = {
  active: "Satellite confirmed operational at this position with active transponder revenue.",
  filed: "ITU filing submitted but no confirmed operational satellite. May be in planning or construction.",
  squatted: "ITU filing on record with no proof of use. Often filed speculatively to block competitors or hold future value — a practice called 'paper satellites.'",
  inactive: "Previously active position now offline. Slot rights may still be held by the original filer.",
};

const BAND_TIPS: Record<string, string> = {
  Ku: "Ku-band (11.7–12.7 GHz). Primary direct-to-home TV broadcast band. Smaller dishes, widely deployed.",
  Ka: "Ka-band (26.5–40 GHz). High-throughput broadband. Faster speeds but more susceptible to rain fade.",
  C: "C-band (3.7–4.2 GHz). Legacy cable TV distribution. Large dishes, extremely rain-resistant.",
  X: "X-band (8–12 GHz). Primarily military and government communications. Not used for commercial broadcasting.",
  L: "L-band (1–2 GHz). Mobile satellite services, maritime, and aviation. Very long range.",
  S: "S-band (2–4 GHz). Weather satellites and some mobile services.",
};

const YIELD_TIP =
  "Annual percentage yield from transponder lease revenue. Distributed quarterly to token holders pro-rata based on tokens held.";

const statusDot: Record<SlotStatus, string> = {
  active: "#34d399",
  filed: "#60a5fa",
  squatted: "#fbbf24",
  inactive: "#52525b",
};

const faq = [
  {
    q: "How is yield calculated?",
    a: "Satellite operators charge annual lease fees to use an orbital position. That revenue is distributed pro-rata to token holders each quarter based on the yield share percentage set when the offering is created. The displayed APY for each listing reflects the terms agreed with the operator.",
  },
  {
    q: "What is Ku-band vs Ka-band?",
    a: "Ku-band (11.7–12.7 GHz) is the primary direct-to-home broadcasting band — Sky, DirecTV. Smaller dishes, widely deployed. Ka-band (26.5–40 GHz) delivers gigabit-class throughput for broadband internet but is more susceptible to rain fade. C-band (3.7–4.2 GHz) is legacy cable TV distribution — large dishes, extremely rain-resistant.",
  },
  {
    q: "Who can tokenize a slot?",
    a: "Only the ITU filing holder — the entity with the coordination agreement and national license for that orbital position. Operators (SES, Intelsat, Eutelsat, etc.) list their slots. Investors buy fractional tokens representing lease yield rights.",
  },
  {
    q: "What does 'squatted' mean?",
    a: "A squatted slot has an ITU filing on record but no operational satellite. The ITU found 45% of investigated networks showed no proof of use. Nations and companies file preemptively to block competitors or speculate on future value — a practice called 'paper satellites.'",
  },
  {
    q: "Is this live on mainnet?",
    a: "Clarke is a proof of concept on Solana devnet. Transactions are real on-chain interactions, verifiable on Solana Explorer. Mainnet deployment requires working with satellite operators to establish the legal SPV structure. No real money is involved.",
  },
];

export default function OrbitalClient() {
  const [selected, setSelected] = useState<OrbitalSlot | null>(null);
  const [filter, setFilter] = useState<SlotStatus | "all">("all");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const filtered = filter === "all" ? slots : slots.filter((s) => s.status === filter);

  return (
    <>
      <div className="mb-4">
        <DevnetStatus />
      </div>

      {/* Globe hero */}
      <div className="border border-zinc-800 rounded-xl overflow-hidden mb-6">
        <div className="text-zinc-600 text-xs font-mono px-5 pt-4 pb-1 uppercase tracking-widest">
          Clarke Belt · GEO Ring · 35,786 km
        </div>
        <OrbitalGlobe
          slots={slots}
          selectedId={selected?.id ?? null}
          onSelect={setSelected}
          height={560}
        />
        {/* Legend */}
        <div className="flex flex-wrap gap-4 px-5 py-4 border-t border-zinc-800/60">
          {(["active", "filed", "squatted", "inactive"] as SlotStatus[]).map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: statusDot[s] }}
              />
              <span className="text-zinc-600 text-xs">{statusLabels[s]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 mb-8 px-1">
        {[
          { label: "GEO Slots Available", value: "~1,800" },
          { label: "Currently Active", value: "541" },
          { label: "Squatted / Filed", value: "45%" },
          { label: "On-Chain Today", value: "$0" },
        ].map((s) => (
          <div key={s.label} className="flex items-baseline gap-2">
            <span className="text-white font-mono font-bold text-sm">{s.value}</span>
            <span className="text-zinc-600 text-xs">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Detail panel — full-width, animates in/out */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out mb-6 ${
          selected ? "max-h-[700px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {selected && (
          <div className="border border-zinc-700 rounded-xl p-6 bg-zinc-900/10">
            {/* Header row */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="text-zinc-500 text-xs font-mono mb-1">{selected.label}</div>
                <h2 className="text-white font-bold text-lg">{selected.operator}</h2>
                <div className="text-zinc-500 text-xs mt-0.5">{selected.country}</div>
              </div>
              <div className="flex items-start gap-4">
                <div className="text-right">
                  <div className="text-white font-bold font-mono text-lg">{selected.valueEstimate}</div>
                  <div className="text-zinc-600 text-xs">est. value</div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-zinc-600 hover:text-zinc-300 transition-colors text-xl leading-none mt-0.5"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            <p className="text-zinc-400 text-sm leading-relaxed mb-4">{selected.description}</p>

            {selected.satellite && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-zinc-600 text-xs">Satellite:</span>
                <span className="text-zinc-300 text-xs font-mono">{selected.satellite}</span>
                {selected.launched && (
                  <span className="text-zinc-600 text-xs">· Est. {selected.launched}</span>
                )}
              </div>
            )}

            {/* Status + bands with [i] tooltips */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${statusColors[selected.status]}`}>
                {statusLabels[selected.status]}
              </span>
              <InfoTooltip text={STATUS_TIPS[selected.status]} />
              {selected.bands.map((b) => (
                <span key={b} className={`text-xs px-1.5 py-0.5 rounded border font-medium ${bandColors[b]}`}>
                  {b}-band
                  <InfoTooltip text={BAND_TIPS[b] ?? b} />
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-1 mb-6">
              {selected.coverage.map((c) => (
                <span key={c} className="text-xs text-zinc-600 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
                  {c}
                </span>
              ))}
            </div>

            {/* Get early access */}
            <div className="pt-4 border-t border-zinc-800">
              {selected.tokenization?.status === "listed" && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: "Token price", value: selected.tokenization.tokenPrice },
                    {
                      label: "Yield",
                      value: selected.tokenization.leaseYield,
                      tip: YIELD_TIP,
                    },
                    { label: "Ticker", value: selected.tokenization.ticker },
                  ].map((m) => (
                    <div key={m.label} className="border border-zinc-800 rounded-lg p-2 text-center">
                      <div className="text-white text-sm font-bold font-mono flex items-center justify-center gap-0.5">
                        {m.value}
                        {m.tip && <InfoTooltip text={m.tip} />}
                      </div>
                      <div className="text-zinc-700 text-xs mt-0.5">{m.label}</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mb-2">
                <EmailCapture label="Get early access →" />
              </div>
              <p className="text-zinc-700 text-xs font-mono">
                Clarke is on devnet. We&apos;ll reach out when mainnet opens.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Registry */}
      <div className="mb-12">
        <p className="text-zinc-600 text-xs font-mono mb-4 uppercase tracking-widest">// REGISTRY</p>

        {/* Filters */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(["all", "active", "filed", "squatted", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded border font-medium transition-colors capitalize ${
                filter === f
                  ? "text-white bg-zinc-700 border-zinc-600"
                  : "text-zinc-500 bg-transparent border-zinc-800 hover:border-zinc-600 hover:text-zinc-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {filtered.map((slot) => (
            <button
              key={slot.id}
              onClick={() => setSelected(selected?.id === slot.id ? null : slot)}
              className={`text-left border rounded-xl px-4 py-3 transition-colors ${
                selected?.id === slot.id
                  ? "border-zinc-600 bg-zinc-900/30"
                  : "border-zinc-800 bg-transparent hover:border-zinc-700 hover:bg-zinc-900/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: statusDot[slot.status] }}
                  />
                  <span className="text-white text-xs font-mono font-bold shrink-0">{slot.label}</span>
                  <span className="text-zinc-500 text-xs truncate">{slot.operator}</span>
                  {slot.tokenization?.status === "listed" && (
                    <span className="text-emerald-400 text-[10px] border border-emerald-900/60 bg-emerald-950/40 px-1 py-px rounded font-mono leading-none shrink-0">
                      listed
                    </span>
                  )}
                </div>
                <span className="text-zinc-600 text-xs font-mono shrink-0 ml-2">{slot.valueEstimate}</span>
              </div>
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {slot.bands.map((b) => (
                  <span key={b} className={`text-[10px] px-1 py-px rounded border ${bandColors[b]}`}>
                    {b}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Context cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
        {[
          {
            title: "No price discovery",
            body: "GEO slot deals happen in private negotiations. No one outside the room knows what anything is worth.",
          },
          {
            title: "No liquidity",
            body: "Transferring a slot requires months of legal work, ITU coordination, and regulatory approvals across jurisdictions.",
          },
          {
            title: "No access",
            body: "Only nation-states and billion-dollar satellite companies participate. The market is completely closed.",
          },
        ].map((c) => (
          <div key={c.title} className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/10">
            <div className="text-white text-sm font-semibold mb-2">{c.title}</div>
            <p className="text-zinc-500 text-xs leading-relaxed">{c.body}</p>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-6 font-medium">FAQ</h2>
        <div className="space-y-2 max-w-3xl">
          {faq.map((item, i) => (
            <div key={i} className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/10">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-white text-sm font-medium">{item.q}</span>
                <span className="text-zinc-500 text-lg leading-none shrink-0 ml-4">
                  {openFaq === i ? "−" : "+"}
                </span>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4">
                  <p className="text-zinc-500 text-sm leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
