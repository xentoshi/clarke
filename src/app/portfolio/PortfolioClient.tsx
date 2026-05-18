"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Connection, LAMPORTS_PER_SOL, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { offeringPda, fetchAllPositions, PROGRAM_ID } from "@/lib/program";
import type { OnChainPosition } from "@/lib/program";
import type { OrbitalSlot } from "@/data/orbital-slots";

function lamportsToSol(bn: BN): string {
  return (bn.toNumber() / LAMPORTS_PER_SOL).toFixed(4);
}

function slotMeta(offeringKey: string, slots: OrbitalSlot[]): { label: string; apy: string | null } {
  for (const slot of slots) {
    try {
      const pda = offeringPda(slot.id);
      if (pda.toBase58() === offeringKey)
        return { label: slot.label, apy: slot.tokenization?.leaseYield ?? null };
    } catch { /* continue */ }
  }
  return { label: offeringKey.slice(0, 8) + "…", apy: null };
}

async function fetchCreatedAt(connection: Connection, positionPubkey: PublicKey): Promise<number | null> {
  try {
    // getSignaturesForAddress returns newest-first; fetch enough to find the oldest (creation)
    const sigs = await connection.getSignaturesForAddress(positionPubkey, { limit: 20 });
    if (!sigs.length) return null;
    const oldest = sigs[sigs.length - 1];
    return oldest.blockTime ?? null;
  } catch {
    return null;
  }
}

function formatTs(unix: number): string {
  return new Date(unix * 1000).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function PortfolioClient({ slots }: { slots: OrbitalSlot[] }) {
  const { connection } = useConnection();
  const { connected, publicKey, signTransaction } = useWallet();
  const { setVisible } = useWalletModal();

  const [positions, setPositions] = useState<OnChainPosition[]>([]);
  const [timestamps, setTimestamps] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(false);
  const [claimStatus, setClaimStatus] = useState<Record<string, "idle" | "claiming" | "done" | "error">>({});

  useEffect(() => {
    if (!connected || !publicKey) return;
    setLoading(true);
    fetchAllPositions(connection, publicKey)
      .then(async (pos) => {
        setPositions(pos);
        const entries = await Promise.all(
          pos.map(async (p) => {
            const ts = await fetchCreatedAt(connection, p.publicKey);
            return [p.publicKey.toBase58(), ts] as [string, number | null];
          })
        );
        setTimestamps(Object.fromEntries(entries));
      })
      .finally(() => setLoading(false));
  }, [connected, publicKey, connection]);

  async function handleClaim(pos: OnChainPosition) {
    if (!publicKey || !signTransaction) return;
    const key = pos.publicKey.toBase58();
    setClaimStatus((s) => ({ ...s, [key]: "claiming" }));
    try {
      // Build claimYield instruction manually — discriminator = SHA-256("global:claim_yield")[0..8]
      const discHash = await crypto.subtle.digest("SHA-256", Buffer.from("global:claim_yield"));
      const discriminator = new Uint8Array(discHash).slice(0, 8);

      const ix = new TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: pos.offering, isSigner: false, isWritable: true },
          { pubkey: pos.publicKey, isSigner: false, isWritable: true },
        ],
        data: Buffer.from(discriminator),
      });

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
      const tx = new Transaction({ feePayer: publicKey, recentBlockhash: blockhash }).add(ix);
      const signed = await signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false, preflightCommitment: "confirmed" });
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
      setClaimStatus((s) => ({ ...s, [key]: "done" }));
      const updated = await fetchAllPositions(connection, publicKey);
      setPositions(updated);
    } catch (e) {
      console.error(e);
      setClaimStatus((s) => ({ ...s, [key]: "error" }));
    }
  }

  if (!connected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Portfolio</h1>
        <p className="text-zinc-400 mb-8">Connect your wallet to view your orbital positions.</p>
        <button
          onClick={() => setVisible(true)}
          className="px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors"
        >
          Connect wallet
        </button>
      </div>
    );
  }

  const totalInvested = positions.reduce((acc, p) => acc + p.investedLamports.toNumber(), 0);
  const totalClaimable = positions.reduce((acc, p) => acc + p.yieldClaimable.toNumber(), 0);
  const totalClaimed = positions.reduce((acc, p) => acc + p.yieldClaimed.toNumber(), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-white mb-1">Portfolio</h1>
        <p className="text-zinc-500 text-sm font-mono">{publicKey?.toBase58()}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/[0.06] mb-10">
        {[
          { label: "Invested", value: (totalInvested / LAMPORTS_PER_SOL).toFixed(3) + " SOL" },
          { label: "Claimable yield", value: (totalClaimable / LAMPORTS_PER_SOL).toFixed(6) + " SOL" },
          { label: "Lifetime yield", value: (totalClaimed / LAMPORTS_PER_SOL).toFixed(6) + " SOL" },
        ].map((s) => (
          <div key={s.label} className="bg-zinc-950 px-6 py-5">
            <div className="text-xl font-bold font-mono text-white">{s.value}</div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest font-mono mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Positions */}
      {loading ? (
        <p className="text-zinc-500 text-sm">Loading positions…</p>
      ) : positions.length === 0 ? (
        <div className="border border-zinc-800 rounded-xl p-10 text-center">
          <p className="text-zinc-400 mb-4">No positions yet.</p>
          <Link href="/orbital" className="text-white text-sm font-medium hover:text-zinc-300 transition-colors">
            Browse orbital slots →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {positions.map((pos) => {
            const key = pos.publicKey.toBase58();
            const status = claimStatus[key] ?? "idle";
            const claimable = pos.yieldClaimable.toNumber();
            const { label, apy } = slotMeta(pos.offering.toBase58(), slots);
            const ts = timestamps[key];
            return (
              <div key={key} className="border border-zinc-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-white font-bold font-mono text-sm">{label}</span>
                    <span className="text-zinc-500 text-xs font-mono">
                      {pos.tokens.toNumber().toLocaleString()} tokens
                    </span>
                    {apy && (
                      <span className="text-emerald-400/70 text-xs font-mono">{apy}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-zinc-500 font-mono">
                    <span>Invested: {lamportsToSol(pos.investedLamports)} SOL</span>
                    <span>Earned: {lamportsToSol(pos.yieldClaimed)} SOL</span>
                    {ts != null && (
                      <span className="text-zinc-600">Since {formatTs(ts)}</span>
                    )}
                  </div>
                  <div className="flex gap-4 mt-2">
                    <a
                      href={`https://explorer.solana.com/address/${key}?cluster=devnet`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-zinc-700 text-xs hover:text-zinc-400 transition-colors font-mono"
                    >
                      Position ↗
                    </a>
                    <a
                      href={`https://explorer.solana.com/address/${pos.offering.toBase58()}?cluster=devnet`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-zinc-700 text-xs hover:text-zinc-400 transition-colors font-mono"
                    >
                      Offering ↗
                    </a>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
                  {claimable > 0 && (
                    <span className="text-emerald-400 text-xs font-mono">
                      +{(claimable / LAMPORTS_PER_SOL).toFixed(6)} SOL
                    </span>
                  )}
                  <button
                    onClick={() => handleClaim(pos)}
                    disabled={claimable === 0 || status === "claiming"}
                    className="px-4 py-2 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-400
                               border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors
                               disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {status === "claiming" ? "Claiming…" : status === "done" ? "Claimed ✓" : "Claim yield"}
                  </button>
                  <button
                    disabled
                    title="Secondary market coming. Positions are not yet transferable."
                    className="px-4 py-2 text-xs font-medium rounded-lg bg-zinc-900 text-zinc-600
                               border border-zinc-800 cursor-not-allowed"
                  >
                    Sell
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
