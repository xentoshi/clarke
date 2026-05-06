"use client";

import { useState } from "react";
import Link from "next/link";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { slots, statusColors, statusLabels, bandColors } from "@/data/orbital-slots";
import type { OrbitalSlot, SlotStatus } from "@/data/orbital-slots";
import DevnetStatus from "@/components/DevnetStatus";

const CX = 260;
const CY = 260;
const R_ORBIT = 200;
const R_EARTH = 52;

const DEVNET_TREASURY = new PublicKey("EzE2zGnbJvE2ABcMPCiJuBoeyZhXMcf7BCQF4oQPY8eo");

function lonToAngle(lon: number) {
  return ((lon - 90) * Math.PI) / 180;
}
function slotPos(lon: number) {
  const a = lonToAngle(lon);
  return { x: CX + R_ORBIT * Math.cos(a), y: CY + R_ORBIT * Math.sin(a) };
}

const statusDot: Record<SlotStatus, string> = {
  active: "#34d399",
  filed: "#60a5fa",
  squatted: "#fbbf24",
  inactive: "#52525b",
};

const faq = [
  {
    q: "How is yield calculated?",
    a: "Satellite operators pay an annual lease fee to use an orbital position typically 5–9% of the slot's market value. That revenue is distributed pro-rata to token holders each quarter. At a $400M slot value with 6.2% yield, every $1,000 invested returns ~$62/year.",
  },
  {
    q: "What is Ku-band vs Ka-band?",
    a: "Ku-band (11.7–12.7 GHz) is the primary direct-to-home broadcasting band Sky, DirecTV. Smaller dishes, widely deployed. Ka-band (26.5–40 GHz) delivers gigabit-class throughput for broadband internet but is more susceptible to rain fade. C-band (3.7–4.2 GHz) is legacy cable TV distribution large dishes, extremely rain-resistant.",
  },
  {
    q: "Who can tokenize a slot?",
    a: "Only the ITU filing holder the entity with the coordination agreement and national license for that orbital position. Operators (SES, Intelsat, Eutelsat, etc.) list their slots. Investors buy fractional tokens representing lease yield rights.",
  },
  {
    q: "What does 'squatted' mean?",
    a: "A squatted slot has an ITU filing on record but no operational satellite. The ITU found 45% of investigated networks showed no proof of use. Nations and companies file preemptively to block competitors or speculate on future value a practice called 'paper satellites.'",
  },
  {
    q: "Is this live on mainnet?",
    a: "Clarke's orbital slot tokenization is currently a proof of concept running on Solana devnet. Transactions are real and verifiable on Solana Explorer. Mainnet deployment requires working with satellite operators to establish the legal SPV structure.",
  },
];

export default function OrbitalClient() {
  const [hovered, setHovered] = useState<OrbitalSlot | null>(null);
  const [selected, setSelected] = useState<OrbitalSlot | null>(null);
  const [filter, setFilter] = useState<SlotStatus | "all">("all");
  const [investAmount, setInvestAmount] = useState("50");
  const [txStatus, setTxStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [txSig, setTxSig] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifySlot, setNotifySlot] = useState<string | null>(null);
  const [notifyDone, setNotifyDone] = useState<Record<string, boolean>>({});

  async function handleNotify(slotId: string) {
    if (!notifyEmail) return;
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: notifyEmail, slotId }),
    });
    setNotifyDone((d) => ({ ...d, [slotId]: true }));
    setNotifySlot(null);
    setNotifyEmail("");
  }

  const { connection } = useConnection();
  const { connected, publicKey, sendTransaction } = useWallet();
  const { setVisible } = useWalletModal();

  const active = selected ?? hovered;
  const filtered = filter === "all" ? slots : slots.filter((s) => s.status === filter);

  async function handleBuy() {
    if (!connected || !publicKey) { setVisible(true); return; }
    setTxStatus("sending");
    try {
      const lamports = Math.round(0.001 * LAMPORTS_PER_SOL);
      const tx = new Transaction().add(
        SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: DEVNET_TREASURY, lamports })
      );
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");
      setTxSig(sig);
      setTxStatus("success");
    } catch {
      setTxStatus("error");
    }
  }

  return (
    <>
      <div className="mb-4"><DevnetStatus /></div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {[
          { label: "GEO Slots Available", value: "~1,800" },
          { label: "Currently Active", value: "541" },
          { label: "Squatted / Filed", value: "45%" },
          { label: "Est. Market Value", value: "$4.2B+" },
        ].map((s) => (
          <div key={s.label} className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/10">
            <div className="text-2xl font-bold font-mono text-white mb-1">{s.value}</div>
            <div className="text-zinc-600 text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Ring */}
        <div className="border border-zinc-800 rounded-xl p-6">
          <div className="text-zinc-600 text-xs font-mono mb-4 uppercase tracking-widest">Clarke Belt · GEO Ring · 35,786 km</div>
          <svg viewBox={`0 0 ${CX * 2} ${CY * 2}`} className="w-full" style={{ maxHeight: 480 }}>
            {[0.5, 0.75, 1.0, 1.25].map((s) => (
              <circle key={s} cx={CX} cy={CY} r={R_ORBIT * s} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={1} />
            ))}
            {Array.from({ length: 12 }, (_, i) => i * 30).map((lon) => {
              const a = lonToAngle(lon);
              return (
                <line key={lon}
                  x1={CX + (R_EARTH + 8) * Math.cos(a)} y1={CY + (R_EARTH + 8) * Math.sin(a)}
                  x2={CX + (R_ORBIT + 20) * Math.cos(a)} y2={CY + (R_ORBIT + 20) * Math.sin(a)}
                  stroke="rgba(255,255,255,0.04)" strokeWidth={1} strokeDasharray="2,4" />
              );
            })}
            <circle cx={CX} cy={CY} r={R_ORBIT} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1.5} />
            <circle cx={CX} cy={CY} r={R_EARTH} fill="rgba(14,165,233,0.08)" stroke="rgba(14,165,233,0.25)" strokeWidth={1} />
            <circle cx={CX} cy={CY} r={R_EARTH - 10} fill="rgba(14,165,233,0.04)" stroke="none" />
            <text x={CX} y={CY + 4} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize={9} fontFamily="monospace">EARTH</text>
            {[-90, 0, 90, 180].map((lon) => {
              const a = lonToAngle(lon);
              return (
                <text key={lon} x={CX + (R_ORBIT + 32) * Math.cos(a)} y={CY + (R_ORBIT + 32) * Math.sin(a) + 3}
                  textAnchor="middle" fill="rgba(255,255,255,0.18)" fontSize={8} fontFamily="monospace">
                  {lon === 0 ? "0°" : lon > 0 ? `${lon}°E` : `${Math.abs(lon)}°W`}
                </text>
              );
            })}
            {filtered.map((slot) => {
              const { x, y } = slotPos(slot.longitude);
              const isHot = active?.id === slot.id;
              const color = statusDot[slot.status];
              return (
                <g key={slot.id} style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHovered(slot)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setSelected(selected?.id === slot.id ? null : slot)}>
                  {isHot && <circle cx={x} cy={y} r={10} fill={color} opacity={0.15} />}
                  <circle cx={x} cy={y} r={isHot ? 5 : 4} fill={color} opacity={isHot ? 1 : 0.7}
                    stroke={isHot ? "white" : "transparent"} strokeWidth={1} />
                  {isHot && (
                    <>
                      <line x1={x} y1={y} x2={CX} y2={CY} stroke={color} strokeWidth={0.5} opacity={0.2} strokeDasharray="3,3" />
                      <text x={x + (x > CX ? 8 : -8)} y={y + 4} textAnchor={x > CX ? "start" : "end"}
                        fill="white" fontSize={8} fontFamily="monospace" fontWeight="bold">{slot.label}</text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>
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
        <div className="space-y-4">
          {/* Detail card */}
          {active ? (
            <div className="border border-zinc-700 rounded-xl p-6 bg-zinc-900/10">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="text-zinc-500 text-xs font-mono mb-1">{active.label}</div>
                  <h2 className="text-white font-bold text-lg">{active.operator}</h2>
                  <div className="text-zinc-500 text-xs mt-0.5">{active.country}</div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold font-mono text-lg">{active.valueEstimate}</div>
                  <div className="text-zinc-600 text-xs">est. value</div>
                </div>
              </div>

              <p className="text-zinc-400 text-sm leading-relaxed mb-4">{active.description}</p>

              {active.satellite && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-zinc-600 text-xs">Satellite:</span>
                  <span className="text-zinc-300 text-xs font-mono">{active.satellite}</span>
                  {active.launched && <span className="text-zinc-600 text-xs">· Est. {active.launched}</span>}
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 mb-4">
                <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${statusColors[active.status]}`}>
                  {statusLabels[active.status]}
                </span>
                {active.bands.map((b) => (
                  <span key={b} className={`text-xs px-1.5 py-0.5 rounded border font-medium ${bandColors[b]}`}>{b}-band</span>
                ))}
              </div>

              <div className="flex flex-wrap gap-1 mb-6">
                {active.coverage.map((c) => (
                  <span key={c} className="text-xs text-zinc-600 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">{c}</span>
                ))}
              </div>

              {/* Investment section */}
              <div className="pt-4 border-t border-zinc-800">
                {active.tokenization?.status === "listed" ? (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-emerald-400 text-xs font-medium">Listed · Solana devnet</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[
                        { label: "Token price", value: active.tokenization.tokenPrice },
                        { label: "Min. invest", value: active.tokenization.minInvestment },
                        { label: "Yield", value: active.tokenization.leaseYield },
                      ].map((m) => (
                        <div key={m.label} className="border border-zinc-800 rounded-lg p-2 text-center">
                          <div className="text-white text-sm font-bold font-mono">{m.value}</div>
                          <div className="text-zinc-700 text-xs mt-0.5">{m.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-zinc-600 mb-1.5">
                        <span>{((active.tokenization.soldTokens / active.tokenization.totalTokens) * 100).toFixed(0)}% sold</span>
                        <span>{active.tokenization.availableTokens.toLocaleString()} tokens left</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-1.5">
                        <div className="bg-emerald-500 h-1.5 rounded-full"
                          style={{ width: `${(active.tokenization.soldTokens / active.tokenization.totalTokens) * 100}%` }} />
                      </div>
                    </div>
                    {txStatus === "success" ? (
                      <div className="border border-emerald-800 rounded-lg p-4 bg-emerald-950/30 text-center">
                        <div className="text-emerald-400 text-sm font-bold mb-1">Transaction confirmed on devnet</div>
                        <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-zinc-400 text-xs hover:text-white transition-colors underline underline-offset-2">
                          View on Solana Explorer →
                        </a>
                      </div>
                    ) : (
                      <>
                        {connected && (
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-zinc-500 text-xs shrink-0">$</span>
                            <input type="number" min={50} value={investAmount}
                              onChange={(e) => setInvestAmount(e.target.value)}
                              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-zinc-500" />
                            <span className="text-zinc-600 text-xs shrink-0">
                              {Math.floor(Number(investAmount) / parseFloat(active.tokenization.tokenPrice.replace(/[^0-9.]/g, "")))} tokens
                            </span>
                          </div>
                        )}
                        <button onClick={connected ? handleBuy : () => setVisible(true)}
                          disabled={txStatus === "sending"}
                          className="w-full py-2.5 bg-white text-black rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50">
                          {txStatus === "sending" ? "Sending…" : connected ? "Confirm on devnet →" : "Connect wallet to invest →"}
                        </button>
                        {connected && (
                          <p className="text-zinc-700 text-xs text-center mt-2 font-mono">
                            {publicKey?.toBase58().slice(0, 8)}…{publicKey?.toBase58().slice(-6)} · devnet · 0.001 SOL fee
                          </p>
                        )}
                        {txStatus === "error" && (
                          <p className="text-red-400 text-xs text-center mt-2">Transaction failed. Check your devnet SOL balance.</p>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <div className="text-zinc-600 text-xs mb-3">Not yet listed for investment</div>
                    <p className="text-zinc-600 text-xs leading-relaxed mb-3">
                      Only the ITU filing holder can list this slot. Operators receive upfront capital;
                      investors receive fractional lease yield on Solana.
                    </p>
                    {notifyDone[active.id] ? (
                      <p className="text-emerald-400 text-xs text-center py-2">✓ We'll notify you when {active.label} is listed</p>
                    ) : notifySlot === active.id ? (
                      <div className="flex gap-2">
                        <input
                          type="email" placeholder="your@email.com" value={notifyEmail}
                          onChange={(e) => setNotifyEmail(e.target.value)}
                          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-zinc-500"
                        />
                        <button onClick={() => handleNotify(active.id)}
                          className="px-3 py-2 bg-white text-black rounded-lg text-xs font-bold hover:bg-zinc-200 transition-colors">
                          Notify me
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setNotifySlot(active.id)}
                          className="py-2 border border-zinc-800 rounded-lg text-xs text-zinc-400 hover:border-zinc-600 hover:text-white transition-colors">
                          Notify me when listed
                        </button>
                        <Link href="/orbital/list"
                          className="py-2 border border-zinc-700 rounded-lg text-xs text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors text-center">
                          I'm the operator →
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/10 flex items-center justify-center min-h-48">
              <p className="text-zinc-600 text-sm text-center">
                Click or hover a slot on the ring<br />to view details
              </p>
            </div>
          )}

          {/* Filter + list */}
          <div>
            <div className="flex gap-2 mb-3 flex-wrap">
              {(["all", "active", "filed", "squatted", "inactive"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`text-xs px-3 py-1.5 rounded border font-medium transition-colors capitalize ${
                    filter === f ? "text-white bg-zinc-700 border-zinc-600" : "text-zinc-500 bg-transparent border-zinc-800 hover:border-zinc-600 hover:text-zinc-300"
                  }`}>
                  {f}
                </button>
              ))}
            </div>
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {filtered.map((slot) => (
                <button key={slot.id}
                  onClick={() => setSelected(selected?.id === slot.id ? null : slot)}
                  onMouseEnter={() => setHovered(slot)}
                  onMouseLeave={() => setHovered(null)}
                  className={`w-full text-left border rounded-lg px-3 py-2.5 transition-colors group ${
                    selected?.id === slot.id
                      ? "border-zinc-600 bg-zinc-900/30"
                      : "border-zinc-800 bg-transparent hover:border-zinc-700 hover:bg-zinc-900/10"
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: statusDot[slot.status] }} />
                      <span className="text-white text-xs font-mono font-bold">{slot.label}</span>
                      <span className="text-zinc-500 text-xs">{slot.operator}</span>
                      {slot.tokenization?.status === "listed" && (
                        <span className="text-emerald-400 text-[10px] border border-emerald-900/60 bg-emerald-950/40 px-1 py-px rounded font-mono leading-none">listed</span>
                      )}
                    </div>
                    <span className="text-zinc-600 text-xs font-mono">{slot.valueEstimate}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Context cards */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title: "No price discovery", body: "GEO slot deals happen in private negotiations. No one outside the room knows what anything is worth." },
          { title: "No liquidity", body: "Transferring a slot requires months of legal work, ITU coordination, and regulatory approvals across jurisdictions." },
          { title: "No access", body: "Only nation-states and billion-dollar satellite companies participate. The market is completely closed." },
        ].map((c) => (
          <div key={c.title} className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/10">
            <div className="text-white text-sm font-semibold mb-2">{c.title}</div>
            <p className="text-zinc-500 text-xs leading-relaxed">{c.body}</p>
          </div>
        ))}
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
