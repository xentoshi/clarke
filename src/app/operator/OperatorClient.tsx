"use client";

import { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL, PublicKey, Transaction, TransactionInstruction, SystemProgram } from "@solana/web3.js";
import { offeringPda, fetchOffering, PROGRAM_ID } from "@/lib/program";
import type { OnChainOffering } from "@/lib/program";
import { slots } from "@/data/orbital-slots";

export default function OperatorClient() {
  const { connection } = useConnection();
  const { connected, publicKey, signTransaction } = useWallet();
  const { setVisible } = useWalletModal();

  const [selectedSlot, setSelectedSlot] = useState(slots.find(s => s.tokenization?.status === "listed")?.id ?? "");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [txSig, setTxSig] = useState("");
  const [offeringAdmin, setOfferingAdmin] = useState<string | null>(null);
  const [offering, setOffering] = useState<OnChainOffering | null>(null);

  useEffect(() => {
    if (!selectedSlot) return;
    setOffering(null);
    setOfferingAdmin(null);
    fetchOffering(connection, selectedSlot).then(setOffering);
    // Read admin from raw account bytes (offset 8, 32 bytes)
    connection.getAccountInfo(offeringPda(selectedSlot)).then(info => {
      if (!info) return;
      setOfferingAdmin(new PublicKey(info.data.slice(8, 40)).toBase58());
    });
  }, [selectedSlot, connection]);

  const isAdmin = connected && publicKey && offeringAdmin && publicKey.toBase58() === offeringAdmin;

  async function handleDistribute() {
    if (!connected || !publicKey || !signTransaction) { setVisible(true); return; }
    const sol = parseFloat(amount);
    if (!sol || sol <= 0) return;
    if (!isAdmin) return;
    setStatus("sending");
    try {
      const offeringKey = offeringPda(selectedSlot);
      const lamports = Math.round(sol * LAMPORTS_PER_SOL);

      const discHash = await crypto.subtle.digest("SHA-256", Buffer.from("global:distribute_yield"));
      const discriminator = new Uint8Array(discHash).slice(0, 8);
      const amountBuf = new ArrayBuffer(8);
      new DataView(amountBuf).setBigUint64(0, BigInt(lamports), true);
      const data = Buffer.from([...discriminator, ...new Uint8Array(amountBuf)]);

      const ix = new TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: publicKey,              isSigner: true,  isWritable: true  },
          { pubkey: offeringKey,            isSigner: false, isWritable: true  },
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
      setStatus("success");
      setAmount("");
      fetchOffering(connection, selectedSlot).then(setOffering);
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14">
      <div className="mb-10">
        <div className="text-white/30 text-xs font-mono tracking-widest mb-2">// OPERATOR PANEL</div>
        <h1 className="text-2xl font-bold text-white mb-3">Distribute yield</h1>
        <p className="text-zinc-500 text-sm leading-relaxed max-w-lg">
          When transponder lease revenue arrives, operators send it to the on-chain offering. The program distributes the investor share (80%) proportionally across all token holders. Holders can then claim their cut directly to their wallet.
        </p>
      </div>

      {/* Live offering stats */}
      {offering && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.05] rounded-xl overflow-hidden mb-6">
          {[
            { label: "Total supply", value: offering.totalTokens.toNumber().toLocaleString() },
            { label: "Sold", value: offering.soldTokens.toNumber().toLocaleString() },
            { label: "Yield distributed", value: (offering.totalYieldDistributed.toNumber() / LAMPORTS_PER_SOL).toFixed(4) + " SOL" },
            { label: "Yield share", value: (offering.yieldShareBps / 100).toFixed(0) + "%" },
          ].map((s) => (
            <div key={s.label} className="bg-zinc-950 px-4 py-4">
              <div className="text-white font-bold font-mono text-sm">{s.value}</div>
              <div className="text-zinc-600 text-[10px] uppercase tracking-widest mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="border border-zinc-800 rounded-xl p-6 space-y-5">
        <div>
          <label className="text-xs text-zinc-400 font-mono uppercase tracking-widest block mb-2">Slot</label>
          <select
            value={selectedSlot}
            onChange={(e) => setSelectedSlot(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-500"
          >
            {slots.filter((s) => s.tokenization?.status === "listed").map((s) => (
              <option key={s.id} value={s.id}>{s.label} · {s.operator}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-zinc-400 font-mono uppercase tracking-widest block mb-2">
            Revenue amount (SOL)
          </label>
          <input
            type="number"
            min="0"
            step="0.001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.000"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-zinc-500"
          />
          <p className="text-zinc-600 text-xs mt-1 font-mono">
            Holder share (80%): {amount ? (parseFloat(amount) * 0.8).toFixed(4) : "—"} SOL
          </p>
        </div>

        {connected && offeringAdmin && !isAdmin && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <p className="text-amber-400 text-xs font-mono">
              Wrong wallet. This offering was created by{" "}
              <span className="text-amber-300">{offeringAdmin.slice(0, 8)}…{offeringAdmin.slice(-6)}</span>.
              Connect that wallet to distribute yield.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
            <p className="text-emerald-400 text-sm font-mono">Yield distributed ✓</p>
            <a
              href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400/60 text-xs hover:text-emerald-400 transition-colors"
            >
              {txSig.slice(0, 20)}…
            </a>
          </div>
        )}

        {status === "error" && (
          <p className="text-red-400 text-sm">Transaction failed. Check wallet balance and offering status.</p>
        )}

        <button
          onClick={handleDistribute}
          disabled={status === "sending" || !amount || (connected && !isAdmin)}
          className="w-full py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200
                     transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {status === "sending" ? "Sending…" : !connected ? "Connect wallet →" : !isAdmin ? "Wrong wallet" : "Distribute yield →"}
        </button>
      </div>
    </div>
  );
}
