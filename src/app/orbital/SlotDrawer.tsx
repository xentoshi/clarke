"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { ExplorerRow } from "./types";
import { statusLabels } from "@/data/orbital-slots";
import EmailCapture from "@/components/EmailCapture";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL, Transaction, TransactionInstruction, SystemProgram } from "@solana/web3.js";
import { offeringPda, positionPda, fetchOffering, PROGRAM_ID } from "@/lib/program";

interface DossierSat { id: number; name: string; operator: string | null; launchDate: string | null }
interface DossierFcc { id: number; satelliteName: string | null; licensee: string | null; service: string | null; callSign: string | null }
interface Dossier {
  satellites: DossierSat[];
  fccAuthorizations: DossierFcc[];
  congestion: { score: number; factors: { coLocated: number; neighborhood: number; distinctOperators: number; dominantOperator: string | null; dominantShare: number } };
}

function launchYear(date: string | null): string {
  if (!date) return "—";
  const y = date.split("/").pop();
  return y && /^\d{4}$/.test(y) ? y : "—";
}

export default function SlotDrawer({ row, onClose }: { row: ExplorerRow | null; onClose: () => void }) {
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState(false);

  // Slide in on mount (the drawer is only mounted while open).
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const [investAmount, setInvestAmount] = useState("0.1");
  const [txStatus, setTxStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [txSig, setTxSig] = useState("");
  const [txError, setTxError] = useState("");
  const [txTokens, setTxTokens] = useState(0);
  const [solBalance, setSolBalance] = useState<number | null>(null);

  const { connection } = useConnection();
  const { connected, publicKey, signTransaction } = useWallet();
  const { setVisible } = useWalletModal();

  // Reset transient state and fetch the dossier whenever the selected slot changes.
  useEffect(() => {
    setTxStatus("idle"); setTxSig(""); setTxError(""); setTxTokens(0);
    setDossier(null);
    if (!row) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/v1/agents/slots/${row.slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => { if (!cancelled && json?.data) setDossier(json.data as Dossier); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [row]);

  useEffect(() => {
    if (!connected || !publicKey) { setSolBalance(null); return; }
    const refresh = () => connection.getBalance(publicKey).then((b) => setSolBalance(b / LAMPORTS_PER_SOL));
    refresh();
    const id = setInterval(refresh, 10_000);
    return () => clearInterval(id);
  }, [connected, publicKey, connection]);

  async function handleBuy() {
    if (!connected || !publicKey || !signTransaction) { setVisible(true); return; }
    if (!row?.tokenization) return;
    const solAmount = parseFloat(investAmount);
    if (!isFinite(solAmount) || solAmount <= 0) { setTxError("Enter a valid amount."); setTxStatus("error"); return; }

    setTxStatus("sending");
    try {
      const offeringKey = offeringPda(row.id);
      const onChain = await fetchOffering(connection, row.id);
      if (!onChain) { setTxError("This offering hasn't been seeded on-chain yet."); setTxStatus("error"); return; }
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
      setTxSig(sig); setTxTokens(tokenAmount); setTxStatus("success");
      connection.getBalance(publicKey).then((b) => setSolBalance(b / LAMPORTS_PER_SOL));
    } catch (e) {
      console.error(e);
      setTxError("Transaction failed. Check the browser console for details.");
      setTxStatus("error");
    }
  }

  const v = row?.valuation;

  return (
    <>
      <div className={`fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 ${shown ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div className={`fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-zinc-950 border-l border-zinc-800 overflow-y-auto z-40 transition-transform duration-300 ease-out ${shown ? "translate-x-0" : "translate-x-full"}`}>
        {row && v && (
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="text-zinc-500 text-xs font-mono mb-1">{row.label} · {row.region}</div>
                <h2 className="text-white font-bold text-lg leading-tight flex items-center gap-2">
                  {row.operator || "Unknown operator"}
                  {row.listed && <span className="text-emerald-400 text-[10px] border border-emerald-900/60 bg-emerald-950/40 px-1 rounded font-mono">listed</span>}
                </h2>
                <div className="text-zinc-500 text-xs mt-0.5">
                  {row.country || "—"}{row.satellite ? ` · ${row.satellite}` : ""}
                </div>
              </div>
              <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 transition-colors text-xl leading-none" aria-label="Close">×</button>
            </div>

            {row.description && <p className="text-zinc-400 text-sm leading-relaxed mb-5">{row.description}</p>}

            {/* Value */}
            <div className="space-y-1 mb-1">
              {v.basis === "curated" && v.curatedEstimate && (
                <div className="flex justify-between text-xs py-1 border-b border-zinc-900"><span className="text-zinc-600">Curated value</span><span className="text-white font-mono">{v.curatedEstimate}</span></div>
              )}
              <div className="flex justify-between text-xs py-1 border-b border-zinc-900"><span className="text-zinc-600">Modeled range</span><span className="text-zinc-300 font-mono">{v.formatted.range}</span></div>
              <div className="flex justify-between text-xs py-1 border-b border-zinc-900"><span className="text-zinc-600">Confidence</span><span className={`font-mono ${v.confidence === "high" ? "text-emerald-400" : v.confidence === "medium" ? "text-amber-400" : "text-zinc-400"}`}>{v.confidence}</span></div>
            </div>

            {/* Congestion */}
            <div className="text-zinc-500 text-[10px] uppercase tracking-wider font-medium mt-5 mb-2">Congestion · {row.congestionScore} / 100</div>
            {dossier ? (
              <div className="space-y-0.5">
                <FactorLine label="Co-located (±0.4°)" value={String(dossier.congestion.factors.coLocated)} />
                <FactorLine label="Neighborhood (±2°)" value={String(dossier.congestion.factors.neighborhood)} />
                <FactorLine label="Operators / dominant" value={`${dossier.congestion.factors.distinctOperators}${dossier.congestion.factors.dominantOperator ? ` · ${dossier.congestion.factors.dominantOperator} ${Math.round(dossier.congestion.factors.dominantShare * 100)}%` : ""}`} />
              </div>
            ) : loading ? <div className="text-zinc-700 text-xs">Loading…</div> : null}

            {/* Valuation factors */}
            <div className="text-zinc-500 text-[10px] uppercase tracking-wider font-medium mt-5 mb-2">Valuation factors</div>
            <div className="space-y-0.5">
              {v.factors.map((f) => (
                <FactorLine key={f.label} label={f.label} value={`×${f.multiplier.toFixed(2)}`} accent />
              ))}
            </div>

            {/* Bands + coverage */}
            {(row.bands.length > 0 || row.coverage.length > 0) && (
              <>
                <div className="text-zinc-500 text-[10px] uppercase tracking-wider font-medium mt-5 mb-2">Spectrum & coverage</div>
                <div className="flex flex-wrap gap-1.5">
                  {row.bands.map((b) => <span key={b} className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-700 text-zinc-400 font-mono">{b}-band</span>)}
                  {row.coverage.map((c) => <span key={c} className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-500">{c}</span>)}
                </div>
              </>
            )}

            {/* Co-located satellites */}
            {dossier && dossier.satellites.length > 0 && (
              <>
                <div className="text-zinc-500 text-[10px] uppercase tracking-wider font-medium mt-5 mb-2">Co-located satellites ({dossier.satellites.length})</div>
                <div className="space-y-0.5">
                  {dossier.satellites.slice(0, 8).map((s) => <FactorLine key={s.id} label={s.name} value={launchYear(s.launchDate)} />)}
                </div>
              </>
            )}

            {/* FCC */}
            {dossier && (
              <>
                <div className="text-zinc-500 text-[10px] uppercase tracking-wider font-medium mt-5 mb-2">FCC authorizations ({dossier.fccAuthorizations.length})</div>
                {dossier.fccAuthorizations.length === 0 ? (
                  <div className="text-zinc-700 text-xs">No US authorization on record</div>
                ) : (
                  <div className="space-y-0.5">
                    {dossier.fccAuthorizations.slice(0, 6).map((a) => <FactorLine key={a.id} label={a.satelliteName ?? a.licensee ?? "—"} value={a.callSign ?? a.service ?? ""} />)}
                  </div>
                )}
              </>
            )}

            {/* Status */}
            <div className="text-zinc-500 text-[10px] uppercase tracking-wider font-medium mt-5 mb-2">Status</div>
            <div className="text-zinc-300 text-xs">{statusLabels[row.status]}</div>

            {/* CTA */}
            <div className="mt-6 pt-5 border-t border-zinc-800">
              {row.tokenization?.status === "listed" ? (
                <BuyFlow
                  row={row} connected={connected} publicKey={publicKey?.toBase58() ?? null}
                  investAmount={investAmount} setInvestAmount={setInvestAmount}
                  txStatus={txStatus} txSig={txSig} txError={txError} txTokens={txTokens}
                  solBalance={solBalance} onBuy={handleBuy} onConnect={() => setVisible(true)}
                />
              ) : (
                <>
                  <EmailCapture label="Get early access →" />
                  <p className="text-zinc-700 text-xs font-mono mt-2">Clarke is on devnet. We&apos;ll reach out when mainnet opens.</p>
                </>
              )}
            </div>

            <div className="mt-4 text-center">
              <Link href={`/orbital/${row.slug}`} className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors">Open full page →</Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function FactorLine({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-3 text-xs py-0.5">
      <span className="text-zinc-600 truncate">{label}</span>
      <span className={`font-mono shrink-0 ${accent ? "text-emerald-400" : "text-zinc-300"}`}>{value}</span>
    </div>
  );
}

function BuyFlow({
  row, connected, publicKey, investAmount, setInvestAmount, txStatus, txSig, txError, txTokens, solBalance, onBuy, onConnect,
}: {
  row: ExplorerRow; connected: boolean; publicKey: string | null;
  investAmount: string; setInvestAmount: (v: string) => void;
  txStatus: string; txSig: string; txError: string; txTokens: number;
  solBalance: number | null; onBuy: () => void; onConnect: () => void;
}) {
  const tok = row.tokenization!;
  if (txStatus === "success") {
    return (
      <div className="border border-emerald-800 rounded-lg p-4 bg-emerald-950/20">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-emerald-400 text-xs font-medium">Transaction confirmed · Solana devnet</span>
        </div>
        <div className="space-y-1.5 mb-3">
          {[{ label: "Token", value: tok.ticker }, { label: "Amount", value: `${txTokens.toLocaleString()} tokens` }, { label: "Yield rate", value: tok.leaseYield }].map((r) => (
            <div key={r.label} className="flex justify-between text-xs"><span className="text-zinc-500">{r.label}</span><span className="text-white font-mono">{r.value}</span></div>
          ))}
        </div>
        <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="text-zinc-500 text-xs hover:text-white transition-colors">Solana Explorer →</a>
      </div>
    );
  }

  const FEE_BUFFER = 0.005;
  const maxInvest = solBalance !== null ? Math.max(0, solBalance - FEE_BUFFER) : null;
  const solAmt = Number(investAmount);
  const tooLow = solBalance !== null && solAmt > (solBalance - FEE_BUFFER);
  const tokenEst = Math.max(1, Math.floor(solAmt / parseFloat(tok.tokenPrice.replace(/[^0-9.]/g, "") || "1")));

  return (
    <>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[{ label: "Token price", value: tok.tokenPrice }, { label: "Yield", value: tok.leaseYield }, { label: "Ticker", value: tok.ticker }].map((m) => (
          <div key={m.label} className="border border-zinc-800 rounded-lg p-2 text-center"><div className="text-white text-sm font-bold font-mono">{m.value}</div><div className="text-zinc-700 text-xs mt-0.5">{m.label}</div></div>
        ))}
      </div>
      {connected && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-zinc-500 text-xs">Amount (SOL)</span>
            <div className="flex items-center gap-2">
              {solBalance !== null && <span className="text-zinc-600 text-xs font-mono">Balance: <span className="text-zinc-400">{solBalance.toFixed(3)}</span></span>}
              {maxInvest !== null && maxInvest > 0 && (
                <button onClick={() => setInvestAmount(maxInvest.toFixed(3))} className="text-zinc-600 text-xs font-mono hover:text-zinc-300 transition-colors border border-zinc-800 px-1.5 py-0.5 rounded">Max</button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="number" min={0.001} step={0.001} value={investAmount} onChange={(e) => setInvestAmount(e.target.value)}
              className={`flex-1 bg-zinc-900 border rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none transition-colors ${tooLow ? "border-red-700 focus:border-red-500" : "border-zinc-700 focus:border-zinc-500"}`} />
            <span className="text-zinc-600 text-xs shrink-0 font-mono">{tokenEst} {tok.ticker}</span>
          </div>
          {tooLow && <p className="text-red-400 text-xs mt-1.5 font-mono">Insufficient. Max: {maxInvest?.toFixed(3)} SOL</p>}
        </div>
      )}
      <button onClick={connected ? onBuy : onConnect}
        disabled={txStatus === "sending" || (connected && solBalance !== null && Number(investAmount) > solBalance - 0.005)}
        className="w-full py-2.5 bg-white text-black rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50">
        {txStatus === "sending" ? "Sending…" : connected ? "Confirm on devnet →" : "Connect wallet to invest →"}
      </button>
      {connected && publicKey && <p className="text-zinc-700 text-xs text-center mt-2 font-mono">{publicKey.slice(0, 8)}…{publicKey.slice(-6)} · devnet</p>}
      {txStatus === "error" && <p className="text-red-400 text-xs text-center mt-2">{txError}</p>}
    </>
  );
}
