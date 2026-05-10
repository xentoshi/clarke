"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL, PublicKey, Transaction, TransactionInstruction, SystemProgram } from "@solana/web3.js";
import { slots, statusColors, statusLabels, bandColors } from "@/data/orbital-slots";
import type { OrbitalSlot, SlotStatus } from "@/data/orbital-slots";
import DevnetStatus from "@/components/DevnetStatus";
import { offeringPda, positionPda, fetchOffering, PROGRAM_ID } from "@/lib/program";

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
    a: "Clarke is a proof of concept on Solana devnet. Transactions are real on-chain interactions, verifiable on Solana Explorer. Mainnet deployment requires working with satellite operators to establish the legal SPV structure. No real money is involved.",
  },
];

export default function OrbitalClient() {
  const [selected, setSelected] = useState<OrbitalSlot | null>(null);
  const [filter, setFilter] = useState<SlotStatus | "all">("all");
  const [investAmount, setInvestAmount] = useState("0.1");
  const [txStatus, setTxStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [txSig, setTxSig] = useState("");
  const [txError, setTxError] = useState("");
  const [txTokens, setTxTokens] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifySlot, setNotifySlot] = useState<string | null>(null);
  const [notifyDone, setNotifyDone] = useState<Record<string, boolean>>({});
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [liveSold, setLiveSold] = useState<Record<string, number>>({});

  const { connection } = useConnection();
  const { connected, publicKey, signTransaction } = useWallet();
  const { setVisible } = useWalletModal();

  useEffect(() => {
    if (!connected || !publicKey) { setSolBalance(null); return; }
    const refresh = () => connection.getBalance(publicKey).then((b) => setSolBalance(b / LAMPORTS_PER_SOL));
    refresh();
    const id = setInterval(refresh, 10_000);
    return () => clearInterval(id);
  }, [connected, publicKey, connection]);

  useEffect(() => {
    if (!selected?.tokenization) return;
    fetchOffering(connection, selected.id).then((o) => {
      if (o) setLiveSold((prev) => ({ ...prev, [selected.id]: o.soldTokens.toNumber() }));
    });
  }, [selected, connection]);

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

  const active = selected;
  const filtered = filter === "all" ? slots : slots.filter((s) => s.status === filter);

  async function handleBuy() {
    if (!connected || !publicKey || !signTransaction) { setVisible(true); return; }
    const slot = selected;
    if (!slot?.tokenization) return;

    const solAmount = parseFloat(investAmount);
    if (!isFinite(solAmount) || solAmount <= 0) {
      setTxError("Enter a valid amount.");
      setTxStatus("error");
      return;
    }

    setTxStatus("sending");
    try {
      const offeringKey = offeringPda(slot.id);
      const onChain = await fetchOffering(connection, slot.id);
      if (!onChain) {
        setTxError("This offering hasn't been seeded on-chain yet.");
        setTxStatus("error");
        return;
      }
      const posKey = positionPda(publicKey, offeringKey);
      const tokenPriceLamports = onChain.tokenPriceLamports.toNumber();
      const tokenAmount = Math.max(1, Math.floor((solAmount * LAMPORTS_PER_SOL) / tokenPriceLamports));

      // Build invest instruction manually — avoids Anchor 0.29/0.32 IDL compat issues.
      // Discriminator = first 8 bytes of SHA-256("global:invest")
      const discHash = await crypto.subtle.digest("SHA-256", Buffer.from("global:invest"));
      const discriminator = new Uint8Array(discHash).slice(0, 8);
      const amountBuf = new ArrayBuffer(8);
      new DataView(amountBuf).setBigUint64(0, BigInt(tokenAmount), true);
      const data = Buffer.from([...discriminator, ...new Uint8Array(amountBuf)]);

      const ix = new TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: offeringKey, isSigner: false, isWritable: true },
          { pubkey: onChain.treasury, isSigner: false, isWritable: true },
          { pubkey: posKey, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      });

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
      const tx = new Transaction({ feePayer: publicKey, recentBlockhash: blockhash }).add(ix);
      const signed = await signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false, preflightCommitment: "confirmed" });
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
      setTxSig(sig);
      setTxTokens(tokenAmount);
      setTxStatus("success");
      // Refresh balance and live sold count
      connection.getBalance(publicKey).then((b) => setSolBalance(b / LAMPORTS_PER_SOL));
      fetchOffering(connection, slot.id).then((o) => {
        if (o) setLiveSold((prev) => ({ ...prev, [slot.id]: o.soldTokens.toNumber() }));
      });
    } catch (e) {
      console.error(e);
      setTxError("Transaction failed. Check the browser console for details.");
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
          <div key={s.label} className="border border-zinc-800 rounded-xl p-3 sm:p-4 bg-zinc-900/10">
            <div className="text-xl sm:text-2xl font-bold font-mono text-white mb-1">{s.value}</div>
            <div className="text-zinc-600 text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Ring */}
        <div className="border border-zinc-800 rounded-xl p-6">
          <div className="text-zinc-600 text-xs font-mono mb-4 uppercase tracking-widest">Clarke Belt · GEO Ring · 35,786 km</div>
          <svg viewBox={`0 0 ${CX * 2} ${CY * 2}`} className="w-full" style={{ maxHeight: 480 }}>
            <defs>
              {/* Lit side: bright upper-left */}
              <radialGradient id="gLit" cx="236" cy="238" r="55" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="#1a3a5c"/>
                <stop offset="45%"  stopColor="#0a1e38"/>
                <stop offset="100%" stopColor="#03080f"/>
              </radialGradient>
              {/* Specular glint */}
              <radialGradient id="gSpec" cx="241" cy="240" r="26" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="rgba(200,230,255,0.28)"/>
                <stop offset="100%" stopColor="transparent"/>
              </radialGradient>
              {/* Night-side terminator: darkens lower-right */}
              <radialGradient id="gDark" cx="284" cy="280" r="62" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="rgba(0,0,4,0.88)"/>
                <stop offset="55%"  stopColor="rgba(0,0,4,0.45)"/>
                <stop offset="85%"  stopColor="rgba(0,0,4,0.06)"/>
                <stop offset="100%" stopColor="transparent"/>
              </radialGradient>
              {/* Atmosphere halo just outside the sphere */}
              <radialGradient id="gHalo" cx="260" cy="260" r="62" gradientUnits="userSpaceOnUse">
                <stop offset="80%"  stopColor="transparent"/>
                <stop offset="90%"  stopColor="rgba(80,170,255,0.22)"/>
                <stop offset="100%" stopColor="transparent"/>
              </radialGradient>
              <clipPath id="earthClip">
                <circle cx={CX} cy={CY} r={R_EARTH}/>
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

            {/* Atmosphere halo (outside sphere) */}
            <circle cx={CX} cy={CY} r={R_EARTH + 8} fill="url(#gHalo)"/>

            {/* Sphere base */}
            <circle cx={CX} cy={CY} r={R_EARTH} fill="url(#gLit)"/>

            {/* Night-side terminator */}
            <circle cx={CX} cy={CY} r={R_EARTH} fill="url(#gDark)" clipPath="url(#earthClip)"/>

            {/* Specular glint on lit side */}
            <circle cx={CX} cy={CY} r={R_EARTH} fill="url(#gSpec)"/>

            {/* Thin atmosphere rim */}
            <circle cx={CX} cy={CY} r={R_EARTH} fill="none" stroke="rgba(100,190,255,0.35)" strokeWidth={1.5}/>
            {[-90, 0, 90, 180].map((lon) => {
              const a = lonToAngle(lon);
              return (
                <text key={lon} x={r4(CX + (R_ORBIT + 32) * Math.cos(a))} y={r4(CY + (R_ORBIT + 32) * Math.sin(a) + 3)}
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
                  onClick={() => setSelected(selected?.id === slot.id ? null : slot)}>
                  {isHot && <circle cx={x} cy={y} r={10} fill={color} opacity={0.15} />}
                  <circle cx={x} cy={y} r={isHot ? 5 : 4} fill={color} opacity={isHot ? 1 : 0.7}
                    stroke={isHot ? "white" : "transparent"} strokeWidth={1} />
                </g>
              );
            })}
            {/* Overlay: line + label rendered above all dots, no pointer events so they don't steal hover */}
            {active && (() => {
              const { x, y } = slotPos(active.longitude);
              const color = statusDot[active.status];
              return (
                <g pointerEvents="none">
                  <line x1={x} y1={y} x2={CX} y2={CY} stroke={color} strokeWidth={0.5} opacity={0.2} strokeDasharray="3,3" />
                  <text x={x + (x > CX ? 8 : -8)} y={y + 4} textAnchor={x > CX ? "start" : "end"}
                    fill="white" fontSize={8} fontFamily="monospace" fontWeight="bold">{active.label}</text>
                </g>
              );
            })()}
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
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="text-emerald-400 text-xs font-medium">Devnet · proof of concept</span>
                      </div>
                      <span className="text-white font-mono font-bold text-sm">{active.tokenization.ticker}</span>
                    </div>
                    {active.tokenization.what && (
                      <p className="text-zinc-600 text-xs leading-relaxed mb-4 border-l border-zinc-800 pl-3">
                        {active.tokenization.what}
                      </p>
                    )}
                    <div className="grid grid-cols-1 xs:grid-cols-3 sm:grid-cols-3 gap-2 mb-4">
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
                      {(() => {
                        const sold = liveSold[active.id] ?? active.tokenization.soldTokens;
                        const total = active.tokenization.totalTokens;
                        const pct = (sold / total) * 100;
                        return (
                          <>
                            <div className="flex justify-between text-xs text-zinc-600 mb-1.5">
                              <span>{pct < 0.1 ? pct.toFixed(2) : pct < 1 ? pct.toFixed(1) : pct.toFixed(0)}% sold</span>
                              <span>{(total - sold).toLocaleString()} tokens left</span>
                            </div>
                            <div className="w-full bg-zinc-800 rounded-full h-1.5">
                              <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, minWidth: sold > 0 ? "3px" : "0" }} />
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    {txStatus === "success" ? (
                      <div className="border border-emerald-800 rounded-lg p-4 bg-emerald-950/20">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span className="text-emerald-400 text-xs font-medium">Transaction confirmed · Solana devnet</span>
                        </div>
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-500">Token</span>
                            <span className="text-white font-mono font-bold">{active.tokenization?.ticker}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-500">Amount</span>
                            <span className="text-white font-mono">{txTokens.toLocaleString()} tokens</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-500">Slot</span>
                            <span className="text-white font-mono">{active.label} · {active.operator}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-500">Yield rate</span>
                            <span className="text-emerald-400 font-mono">{active.tokenization?.leaseYield}</span>
                          </div>
                        </div>
                        <p className="text-zinc-600 text-xs leading-relaxed mb-3">
                          {active.tokenization?.what}
                        </p>
                        <div className="flex gap-3">
                          <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-zinc-500 text-xs hover:text-white transition-colors">
                            Solana Explorer →
                          </a>
                          <Link href="/portfolio" className="text-emerald-400 text-xs hover:text-emerald-300 transition-colors">
                            View in portfolio →
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <>
                        {connected && (() => {
                          const FEE_BUFFER = 0.005; // reserve for tx fee + position rent
                          const maxInvest = solBalance !== null ? Math.max(0, solBalance - FEE_BUFFER) : null;
                          const solAmt = Number(investAmount);
                          const tooLow = solBalance !== null && solAmt > (solBalance - FEE_BUFFER);
                          const tokenEst = Math.max(1, Math.floor(solAmt / parseFloat(active.tokenization.tokenPrice.replace(/[^0-9.]/g, "") || "1")));
                          return (
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-zinc-500 text-xs">Amount</span>
                                <div className="flex items-center gap-2">
                                  {solBalance !== null && (
                                    <span className="text-zinc-600 text-xs font-mono">
                                      Balance: <span className="text-zinc-400">{solBalance.toFixed(3)} SOL</span>
                                    </span>
                                  )}
                                  {maxInvest !== null && maxInvest > 0 && (
                                    <button
                                      onClick={() => setInvestAmount(maxInvest.toFixed(3))}
                                      className="text-zinc-600 text-xs font-mono hover:text-zinc-300 transition-colors border border-zinc-800 px-1.5 py-0.5 rounded"
                                    >
                                      Max
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-zinc-500 text-xs shrink-0">SOL</span>
                                <input type="number" min={0.001} step={0.001} value={investAmount}
                                  onChange={(e) => setInvestAmount(e.target.value)}
                                  className={`flex-1 bg-zinc-900 border rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none transition-colors ${tooLow ? "border-red-700 focus:border-red-500" : "border-zinc-700 focus:border-zinc-500"}`} />
                                <span className="text-zinc-600 text-xs shrink-0 font-mono">
                                  {tokenEst} {active.tokenization.ticker}
                                </span>
                              </div>
                              {tooLow && (
                                <p className="text-red-400 text-xs mt-1.5 font-mono">
                                  Insufficient balance. Max: {maxInvest?.toFixed(3)} SOL (keeping {FEE_BUFFER} for fees)
                                </p>
                              )}
                            </div>
                          );
                        })()}
                        <button onClick={connected ? handleBuy : () => setVisible(true)}
                          disabled={txStatus === "sending" || (connected && solBalance !== null && Number(investAmount) > solBalance - 0.005)}
                          className="w-full py-2.5 bg-white text-black rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50">
                          {txStatus === "sending" ? "Sending…" : connected ? "Confirm on devnet →" : "Connect wallet to invest →"}
                        </button>
                        {connected && (
                          <p className="text-zinc-700 text-xs text-center mt-2 font-mono">
                            {publicKey?.toBase58().slice(0, 8)}…{publicKey?.toBase58().slice(-6)} · devnet
                          </p>
                        )}
                        {txStatus === "error" && (
                          <p className="text-red-400 text-xs text-center mt-2">{txError}</p>
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
                Click a slot on the ring or list<br />to view details
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
