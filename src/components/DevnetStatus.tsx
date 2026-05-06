"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";

export default function DevnetStatus() {
  const { connected, publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [airdropping, setAirdropping] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!connected || !publicKey) { setBalance(null); return; }
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    connection.getBalance(publicKey).then((b) => setBalance(b / LAMPORTS_PER_SOL));
  }, [connected, publicKey]);

  async function airdrop() {
    if (!publicKey) return;
    setAirdropping(true);
    try {
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
      const sig = await connection.requestAirdrop(publicKey, 1 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig, "confirmed");
      const b = await connection.getBalance(publicKey);
      setBalance(b / LAMPORTS_PER_SOL);
      setDone(true);
    } finally {
      setAirdropping(false);
    }
  }

  if (!connected) return null;

  return (
    <div className="flex items-center gap-3 text-xs">
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
        <span className="text-zinc-500 font-mono">devnet</span>
      </div>
      {balance !== null && (
        <span className="text-zinc-500 font-mono">{balance.toFixed(3)} SOL</span>
      )}
      {balance !== null && balance < 0.5 && !done && (
        <button onClick={airdrop} disabled={airdropping}
          className="text-violet-400 border border-violet-900 bg-violet-950/40 px-2 py-0.5 rounded hover:border-violet-700 transition-colors disabled:opacity-50">
          {airdropping ? "Airdropping…" : "Get devnet SOL"}
        </button>
      )}
      {done && <span className="text-emerald-400">+1 SOL airdropped ✓</span>}
    </div>
  );
}
