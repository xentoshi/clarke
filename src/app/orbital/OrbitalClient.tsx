"use client";

import { useState } from "react";
import { slots, statusLabels } from "@/data/orbital-slots";
import type { OrbitalSlot, SlotStatus } from "@/data/orbital-slots";
import EmailCapture from "@/components/EmailCapture";

const CX = 260;
const CY = 260;
const R_ORBIT = 200;
const R_EARTH = 52;

const r4 = (n: number) => Math.round(n * 10000) / 10000;

function lonToAngle(lon: number) {
  return ((lon - 90) * Math.PI) / 180;
}
function slotPos(lon: number) {
  const a = lonToAngle(lon);
  return { x: r4(CX + R_ORBIT * Math.cos(a)), y: r4(CY + R_ORBIT * Math.sin(a)) };
}

const statusDot: Record<SlotStatus, string> = {
  active: "#34d399",
  filed: "#60a5fa",
  squatted: "#fbbf24",
  inactive: "#52525b",
};

const GLOSSARY: { term: string; def: string }[] = [
  { term: "Active", def: "Satellite confirmed operational with live transponder revenue." },
  { term: "Squatted", def: "ITU filing on record, no operational satellite — filed to block competitors or speculate." },
  { term: "Filed", def: "ITU filing submitted, no confirmed satellite yet. May be in planning." },
  { term: "Ku-band", def: "11.7–12.7 GHz. Direct-to-home TV broadcast. Small dishes, widely deployed." },
  { term: "Ka-band", def: "26.5–40 GHz. High-throughput broadband. Faster but susceptible to rain fade." },
  { term: "C-band", def: "3.7–4.2 GHz. Legacy cable TV distribution. Large dishes, extremely reliable." },
];

const faq = [
  {
    q: "How is yield calculated?",
    a: "Satellite operators charge annual lease fees to use an orbital position. That revenue is distributed pro-rata to token holders each quarter based on the yield share percentage set when the offering is created.",
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
  const [openGlossary, setOpenGlossary] = useState(false);

  const filtered = filter === "all" ? slots : slots.filter((s) => s.status === filter);

  return (
    <>
      {/* Stats row */}
      <div className="flex flex-wrap gap-x-8 gap-y-2 mb-8 px-1">
        {[
          { label: "GEO slots tracked", value: "~1,800" },
          { label: "Active", value: "541" },
          { label: "Squatted or filed", value: "45%" },
          { label: "On-chain today", value: "$0" },
        ].map((s) => (
          <div key={s.label} className="flex items-baseline gap-2">
            <span className="text-white font-mono font-bold text-sm">{s.value}</span>
            <span className="text-zinc-600 text-xs">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Ring */}
        <div className="border border-zinc-800 rounded-xl p-6">
          <div className="text-zinc-600 text-xs font-mono mb-4 uppercase tracking-widest">
            Clarke Belt · GEO Ring · 35,786 km
          </div>
          <svg viewBox={`0 0 ${CX * 2} ${CY * 2}`} className="w-full" style={{ maxHeight: 480 }}>
            <defs>
              <radialGradient id="gLit" cx="236" cy="238" r="55" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#1a3a5c" />
                <stop offset="45%" stopColor="#0a1e38" />
                <stop offset="100%" stopColor="#03080f" />
              </radialGradient>
              <radialGradient id="gSpec" cx="241" cy="240" r="26" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="rgba(200,230,255,0.28)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <radialGradient id="gDark" cx="284" cy="280" r="62" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="rgba(0,0,4,0.88)" />
                <stop offset="55%" stopColor="rgba(0,0,4,0.45)" />
                <stop offset="85%" stopColor="rgba(0,0,4,0.06)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <radialGradient id="gHalo" cx="260" cy="260" r="62" gradientUnits="userSpaceOnUse">
                <stop offset="80%" stopColor="transparent" />
                <stop offset="90%" stopColor="rgba(80,170,255,0.22)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <clipPath id="earthClip">
                <circle cx={CX} cy={CY} r={R_EARTH} />
              </clipPath>
            </defs>

            {[0.5, 0.75, 1.0, 1.25].map((s) => (
              <circle key={s} cx={CX} cy={CY} r={R_ORBIT * s} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={1} />
            ))}
            {Array.from({ length: 12 }, (_, i) => i * 30).map((lon) => {
              const a = lonToAngle(lon);
              return (
                <line key={lon}
                  x1={r4(CX + (R_EARTH + 8) * Math.cos(a))} y1={r4(CY + (R_EARTH + 8) * Math.sin(a))}
                  x2={r4(CX + (R_ORBIT + 20) * Math.cos(a))} y2={r4(CY + (R_ORBIT + 20) * Math.sin(a))}
                  stroke="rgba(255,255,255,0.04)" strokeWidth={1} strokeDasharray="2,4" />
              );
            })}
            <circle cx={CX} cy={CY} r={R_ORBIT} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1.5} />
            <circle cx={CX} cy={CY} r={R_EARTH + 8} fill="url(#gHalo)" />
            <circle cx={CX} cy={CY} r={R_EARTH} fill="url(#gLit)" />
            <circle cx={CX} cy={CY} r={R_EARTH} fill="url(#gDark)" clipPath="url(#earthClip)" />
            <circle cx={CX} cy={CY} r={R_EARTH} fill="url(#gSpec)" />
            <circle cx={CX} cy={CY} r={R_EARTH} fill="none" stroke="rgba(100,190,255,0.35)" strokeWidth={1.5} />

            {[-90, 0, 90, 180].map((lon) => {
              const a = lonToAngle(lon);
              return (
                <text key={lon}
                  x={r4(CX + (R_ORBIT + 32) * Math.cos(a))}
                  y={r4(CY + (R_ORBIT + 32) * Math.sin(a) + 3)}
                  textAnchor="middle" fill="rgba(255,255,255,0.18)" fontSize={8} fontFamily="monospace">
                  {lon === 0 ? "0°" : lon > 0 ? `${lon}°E` : `${Math.abs(lon)}°W`}
                </text>
              );
            })}

            {filtered.map((slot) => {
              const { x, y } = slotPos(slot.longitude);
              const isHot = selected?.id === slot.id;
              const color = statusDot[slot.status];
              return (
                <g key={slot.id} style={{ cursor: "pointer" }}
                  onClick={() => setSelected(selected?.id === slot.id ? null : slot)}>
                  {isHot && <circle cx={x} cy={y} r={10} fill={color} opacity={0.15} />}
                  <circle cx={x} cy={y} r={isHot ? 5 : 4} fill={color} opacity={isHot ? 1 : 0.7}
                    stroke={isHot ? "white" : "transparent"} strokeWidth={1} />
                </g>
              );
            })}

            {selected && (() => {
              const { x, y } = slotPos(selected.longitude);
              const color = statusDot[selected.status];
              return (
                <g pointerEvents="none">
                  <line x1={x} y1={y} x2={CX} y2={CY} stroke={color} strokeWidth={0.5} opacity={0.2} strokeDasharray="3,3" />
                  <text x={x + (x > CX ? 8 : -8)} y={y + 4} textAnchor={x > CX ? "start" : "end"}
                    fill="white" fontSize={8} fontFamily="monospace" fontWeight="bold">
                    {selected.label}
                  </text>
                </g>
              );
            })()}
          </svg>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4">
            {(["active", "filed", "squatted", "inactive"] as SlotStatus[]).map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: statusDot[s] }} />
                <span className="text-zinc-600 text-xs">{statusLabels[s]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-3">
          {/* Detail card */}
          {selected ? (
            <div className="border border-zinc-700 rounded-xl p-6 bg-zinc-900/10">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <div className="text-zinc-500 text-xs font-mono mb-1">{selected.label}</div>
                  <h2 className="text-white font-bold text-lg leading-tight">{selected.operator}</h2>
                  <div className="text-zinc-500 text-xs mt-0.5">{selected.country}</div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-right">
                    <div className="text-white font-bold font-mono text-lg">{selected.valueEstimate}</div>
                    <div className="text-zinc-600 text-xs">est. value</div>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-zinc-600 hover:text-zinc-300 transition-colors text-lg leading-none mt-0.5"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
              </div>

              <p className="text-zinc-400 text-sm leading-relaxed mb-5">{selected.description}</p>

              {/* Key facts — clean table layout */}
              <div className="space-y-1.5 mb-5">
                {selected.satellite && (
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-600 text-xs w-16 shrink-0">Satellite</span>
                    <span className="text-zinc-300 text-xs font-mono">
                      {selected.satellite}{selected.launched ? ` · Est. ${selected.launched}` : ""}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-zinc-600 text-xs w-16 shrink-0">Status</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusDot[selected.status] }} />
                    <span className="text-zinc-300 text-xs">{statusLabels[selected.status]}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-600 text-xs w-16 shrink-0">Bands</span>
                  <span className="text-zinc-300 text-xs">{selected.bands.map(b => `${b}-band`).join(", ")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-600 text-xs w-16 shrink-0">Coverage</span>
                  <span className="text-zinc-300 text-xs">{selected.coverage.join(", ")}</span>
                </div>
                {selected.tokenization?.status === "listed" && (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-600 text-xs w-16 shrink-0">Yield</span>
                      <span className="text-emerald-400 text-xs font-mono">{selected.tokenization.leaseYield}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-600 text-xs w-16 shrink-0">Token</span>
                      <span className="text-zinc-300 text-xs font-mono">{selected.tokenization.ticker} · {selected.tokenization.tokenPrice}</span>
                    </div>
                  </>
                )}
              </div>

              {/* CTA */}
              <div className="pt-4 border-t border-zinc-800">
                <EmailCapture label="Get early access →" />
                <p className="text-zinc-700 text-xs font-mono mt-2">
                  Clarke is on devnet. We&apos;ll reach out when mainnet opens.
                </p>
              </div>

              {/* Glossary */}
              <div className="mt-4 pt-3 border-t border-zinc-800/60">
                <button
                  onClick={() => setOpenGlossary(!openGlossary)}
                  className="text-zinc-700 text-xs hover:text-zinc-500 transition-colors"
                >
                  {openGlossary ? "Hide glossary" : "Glossary — Active · Squatted · Ku-band · Ka-band"}
                </button>
                {openGlossary && (
                  <div className="mt-3 space-y-2">
                    {GLOSSARY.map((g) => (
                      <div key={g.term} className="flex gap-3">
                        <span className="text-zinc-500 text-xs font-mono w-20 shrink-0">{g.term}</span>
                        <span className="text-zinc-600 text-xs leading-relaxed">{g.def}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/10 flex items-center justify-center min-h-48">
              <p className="text-zinc-600 text-sm text-center">
                Click a slot on the ring to view details
              </p>
            </div>
          )}

          {/* Filter + table */}
          <div>
            <div className="flex gap-2 mb-3 flex-wrap">
              {(["all", "active", "filed", "squatted", "inactive"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`text-xs px-3 py-1.5 rounded border font-medium transition-colors capitalize ${
                    filter === f
                      ? "text-white bg-zinc-700 border-zinc-600"
                      : "text-zinc-500 bg-transparent border-zinc-800 hover:border-zinc-600 hover:text-zinc-300"
                  }`}>
                  {f}
                </button>
              ))}
            </div>
            <div className="border border-zinc-800 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-zinc-800 bg-zinc-950">
                    <th className="text-left px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium">Slot</th>
                    <th className="text-left px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium hidden sm:table-cell">Operator</th>
                    <th className="text-right px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((slot, i) => (
                    <tr key={slot.id}
                      onClick={() => setSelected(selected?.id === slot.id ? null : slot)}
                      className={`border-b border-zinc-800/50 cursor-pointer transition-colors last:border-b-0 ${
                        selected?.id === slot.id
                          ? "bg-zinc-800/40"
                          : "hover:bg-zinc-900/40"
                      }`}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: statusDot[slot.status] }} />
                          <span className="text-white text-xs font-mono font-bold">{slot.label}</span>
                          {slot.tokenization?.status === "listed" && (
                            <span className="text-emerald-400 text-[10px] border border-emerald-900/60 bg-emerald-950/40 px-1 py-px rounded font-mono leading-none">
                              listed
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 hidden sm:table-cell">
                        <span className="text-zinc-500 text-xs">{slot.operator}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="text-zinc-600 text-xs font-mono">{slot.valueEstimate}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-16">
        <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-6 font-medium">FAQ</h2>
        <div className="space-y-2 max-w-3xl">
          {faq.map((item, i) => (
            <div key={i} className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/10">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left">
                <span className="text-white text-sm font-medium">{item.q}</span>
                <span className="text-zinc-500 text-lg leading-none shrink-0 ml-4">{openFaq === i ? "−" : "+"}</span>
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
