"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { statusLabels } from "@/data/orbital-slots";
import type { OrbitalSlot, SlotStatus } from "@/data/orbital-slots";
import { lonToSlug } from "@/lib/slot-utils";
import type { CongestionTier } from "@/lib/satellites";
import EmailCapture from "@/components/EmailCapture";
import DevnetStatus from "@/components/DevnetStatus";
import OrbitalGlobe from "@/components/OrbitalGlobe";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL, Transaction, TransactionInstruction, SystemProgram } from "@solana/web3.js";
import { offeringPda, positionPda, fetchOffering, PROGRAM_ID } from "@/lib/program";

const statusDot: Record<SlotStatus, string> = {
  active: "#34d399",
  filed: "#60a5fa",
  squatted: "#fbbf24",
  inactive: "#52525b",
};

const GLOSSARY: { term: string; def: string }[] = [
  { term: "Active", def: "Satellite confirmed operational with live transponder revenue." },
  { term: "Squatted", def: "ITU filing on record, no operational satellite. Filed to block competitors or speculate on future value." },
  { term: "Filed", def: "ITU filing submitted, no confirmed satellite yet. May be in planning." },
  { term: "Ku-band", def: "11.7–12.7 GHz. Direct-to-home TV broadcast. Small dishes, widely deployed." },
  { term: "Ka-band", def: "26.5–40 GHz. High-throughput broadband. Faster but susceptible to rain fade." },
  { term: "C-band", def: "3.7–4.2 GHz. Legacy cable TV distribution. Large dishes, extremely reliable." },
];

const congestionColors: Record<CongestionTier, string> = {
  sparse: "bg-zinc-700",
  low: "bg-blue-700",
  moderate: "bg-amber-600",
  high: "bg-orange-500",
  critical: "bg-red-500",
};

// Mirrors tierForScore() in src/lib/satellites.ts — keep thresholds in sync.
function scoreToTier(score: number): CongestionTier {
  if (score < 15) return "sparse";
  if (score < 35) return "low";
  if (score < 55) return "moderate";
  if (score < 75) return "high";
  return "critical";
}

export default function OrbitalClient({ slots, congestionScores, valuationRanges }: {
  slots: OrbitalSlot[];
  congestionScores: Record<string, number>;
  valuationRanges: Record<string, string>;
}) {
  const [selectedRaw, setSelectedRaw] = useState<OrbitalSlot | null>(null);
  const [filter, setFilter] = useState<SlotStatus | "all">("all");
  const [openGlossary, setOpenGlossary] = useState(false);

  const [investAmount, setInvestAmount] = useState("0.1");
  const [txStatus, setTxStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [txSig, setTxSig] = useState("");
  const [txError, setTxError] = useState("");
  const [txTokens, setTxTokens] = useState(0);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [liveSold, setLiveSold] = useState<Record<string, number>>({});

  const { connection } = useConnection();
  const { connected, publicKey, signTransaction } = useWallet();
  const { setVisible } = useWalletModal();

  const setSelected = (slot: OrbitalSlot | null) => {
    setSelectedRaw(slot);
    setTxStatus("idle");
    setTxSig("");
    setTxError("");
    setTxTokens(0);
  };

  const selected = selectedRaw;

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

  const filtered = filter === "all" ? slots : slots.filter((s) => s.status === filter);


  return (
    <>
      <div className="mb-4"><DevnetStatus /></div>

      {/* Globe hero with drawer overlay */}
      <div className="relative mb-8 rounded-2xl overflow-hidden border border-zinc-800">
        <OrbitalGlobe
          slots={slots}
          height={720}
          selectedSlotId={selected?.id ?? null}
          onSlotSelect={setSelected}
        />

        {/* Right-rail drawer */}
        <div
          className={`absolute top-0 right-0 bottom-0 w-full sm:w-[420px] bg-zinc-950/95 backdrop-blur-md border-l border-zinc-800 overflow-y-auto transition-transform duration-300 ease-out z-20 ${
            selected ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {selected && (
            <div className="p-6">
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
                {selected.tokenization?.status === "listed" ? (
                  <>
                    {/* Token metrics */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[
                        { label: "Token price", value: selected.tokenization.tokenPrice },
                        { label: "Yield", value: selected.tokenization.leaseYield },
                        { label: "Ticker", value: selected.tokenization.ticker },
                      ].map((m) => (
                        <div key={m.label} className="border border-zinc-800 rounded-lg p-2 text-center">
                          <div className="text-white text-sm font-bold font-mono">{m.value}</div>
                          <div className="text-zinc-700 text-xs mt-0.5">{m.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Progress bar */}
                    {(() => {
                      const sold = liveSold[selected.id] ?? selected.tokenization.soldTokens;
                      const total = selected.tokenization.totalTokens;
                      const pct = (sold / total) * 100;
                      return (
                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-zinc-600 mb-1.5">
                            <span>{pct < 0.1 ? pct.toFixed(2) : pct.toFixed(1)}% sold</span>
                            <span>{(total - sold).toLocaleString()} tokens left</span>
                          </div>
                          <div className="w-full bg-zinc-800 rounded-full h-1.5">
                            <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, minWidth: sold > 0 ? "3px" : "0" }} />
                          </div>
                        </div>
                      );
                    })()}

                    {txStatus === "success" ? (
                      <div className="border border-emerald-800 rounded-lg p-4 bg-emerald-950/20">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span className="text-emerald-400 text-xs font-medium">Transaction confirmed · Solana devnet</span>
                        </div>
                        <div className="space-y-1.5 mb-3">
                          {[
                            { label: "Token", value: selected.tokenization.ticker },
                            { label: "Amount", value: `${txTokens.toLocaleString()} tokens` },
                            { label: "Yield rate", value: selected.tokenization.leaseYield },
                          ].map((r) => (
                            <div key={r.label} className="flex justify-between text-xs">
                              <span className="text-zinc-500">{r.label}</span>
                              <span className="text-white font-mono">{r.value}</span>
                            </div>
                          ))}
                        </div>
                        <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-zinc-500 text-xs hover:text-white transition-colors">
                          Solana Explorer →
                        </a>
                      </div>
                    ) : (
                      <>
                        {connected && (() => {
                          const FEE_BUFFER = 0.005;
                          const maxInvest = solBalance !== null ? Math.max(0, solBalance - FEE_BUFFER) : null;
                          const solAmt = Number(investAmount);
                          const tooLow = solBalance !== null && solAmt > (solBalance - FEE_BUFFER);
                          const tokenEst = Math.max(1, Math.floor(solAmt / parseFloat(selected.tokenization!.tokenPrice.replace(/[^0-9.]/g, "") || "1")));
                          return (
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-zinc-500 text-xs">Amount (SOL)</span>
                                <div className="flex items-center gap-2">
                                  {solBalance !== null && (
                                    <span className="text-zinc-600 text-xs font-mono">
                                      Balance: <span className="text-zinc-400">{solBalance.toFixed(3)}</span>
                                    </span>
                                  )}
                                  {maxInvest !== null && maxInvest > 0 && (
                                    <button onClick={() => setInvestAmount(maxInvest.toFixed(3))}
                                      className="text-zinc-600 text-xs font-mono hover:text-zinc-300 transition-colors border border-zinc-800 px-1.5 py-0.5 rounded">
                                      Max
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <input type="number" min={0.001} step={0.001} value={investAmount}
                                  onChange={(e) => setInvestAmount(e.target.value)}
                                  className={`flex-1 bg-zinc-900 border rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none transition-colors ${tooLow ? "border-red-700 focus:border-red-500" : "border-zinc-700 focus:border-zinc-500"}`} />
                                <span className="text-zinc-600 text-xs shrink-0 font-mono">{tokenEst} {selected.tokenization!.ticker}</span>
                              </div>
                              {tooLow && (
                                <p className="text-red-400 text-xs mt-1.5 font-mono">
                                  Insufficient. Max: {maxInvest?.toFixed(3)} SOL
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
                    <EmailCapture label="Get early access →" />
                    <p className="text-zinc-700 text-xs font-mono mt-2">
                      Clarke is on devnet. We&apos;ll reach out when mainnet opens.
                    </p>
                  </>
                )}
              </div>

              {/* Glossary */}
              <div className="mt-4 pt-3 border-t border-zinc-800/60">
                <button
                  onClick={() => setOpenGlossary(!openGlossary)}
                  className="text-zinc-700 text-xs hover:text-zinc-500 transition-colors"
                >
                  {openGlossary ? "Hide glossary" : "Glossary: Active · Squatted · Ku-band · Ka-band"}
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
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-x-8 gap-y-2 mb-6 px-1">
        {[
          { label: "GEO satellites tracked", value: slots.length.toLocaleString() },
          { label: "Active", value: slots.filter((s) => s.status === "active").length.toLocaleString() },
          { label: "Curated", value: slots.filter((s) => s.source === "curated").length.toLocaleString() },
          { label: "On-chain (devnet)", value: slots.filter((s) => s.tokenization?.status === "listed").length.toLocaleString() },
        ].map((s) => (
          <div key={s.label} className="flex items-baseline gap-2">
            <span className="text-white font-mono font-bold text-sm">{s.value}</span>
            <span className="text-zinc-600 text-xs">{s.label}</span>
          </div>
        ))}
      </div>

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
        <div className="border border-zinc-800 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-zinc-800 bg-zinc-950">
                <th className="text-left px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium">Slot</th>
                <th className="text-left px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium hidden sm:table-cell">Operator</th>
                <th className="text-right px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium hidden md:table-cell">Congestion</th>
                <th className="text-right px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium hidden sm:table-cell">Value</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((slot) => (
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
                  <td className="px-4 py-2.5 text-right hidden md:table-cell">
                    {(() => {
                      const slug = lonToSlug(slot.longitude);
                      const score = congestionScores[slug] ?? 0;
                      const tier = scoreToTier(score);
                      return (
                        <div className="flex items-center justify-end gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${congestionColors[tier]}`} />
                          <span className="text-zinc-600 text-xs">{score}</span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-2.5 text-right hidden sm:table-cell">
                    {slot.valueEstimate ? (
                      <span className="text-zinc-600 text-xs font-mono">{slot.valueEstimate}</span>
                    ) : (
                      <span className="text-zinc-700 text-xs font-mono">{valuationRanges[lonToSlug(slot.longitude)] ?? "—"}</span>
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <Link href={`/orbital/${lonToSlug(slot.longitude)}`}
                      className="text-zinc-700 hover:text-zinc-300 text-xs transition-colors px-1">
                      →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-end">
          <Link
            href="/orbital/faq"
            className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
          >
            Questions about the data? Read the FAQ →
          </Link>
        </div>
      </div>
    </>
  );
}
