"use client";

import { useState } from "react";
import Link from "next/link";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, TransactionInstruction } from "@solana/web3.js";

const DEVNET_TREASURY = new PublicKey("EzE2zGnbJvE2ABcMPCiJuBoeyZhXMcf7BCQF4oQPY8eo");
const MEMO_PROGRAM = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

type Step = "form" | "success";

function isValidLongitude(val: string): boolean {
  const n = parseFloat(val);
  return !isNaN(n) && n >= -180 && n <= 180;
}

export default function ListSlotClient() {
  const [step, setStep] = useState<Step>("form");
  const [txSig, setTxSig] = useState("");
  const [txStatus, setTxStatus] = useState<"idle" | "sending" | "error">("idle");
  const [lonError, setLonError] = useState("");

  const [form, setForm] = useState({
    longitude: "",
    operator: "",
    country: "",
    ituRef: "",
    satellite: "",
    raiseTarget: "",
    leaseRevenue: "",
    contact: "",
  });

  const { connection } = useConnection();
  const { connected, publicKey, sendTransaction } = useWallet();
  const { setVisible } = useWalletModal();

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (field === "longitude") setLonError("");
  }

  function validateLongitude(): boolean {
    if (!form.longitude) { setLonError("Required"); return false; }
    if (!isValidLongitude(form.longitude)) {
      setLonError("Must be a number between -180 and 180");
      return false;
    }
    return true;
  }

  const isFormValid =
    form.longitude && form.operator && form.ituRef && form.contact &&
    isValidLongitude(form.longitude);

  async function handleSubmit() {
    if (!validateLongitude()) return;
    if (!connected || !publicKey) { setVisible(true); return; }
    setTxStatus("sending");
    try {
      const memo = JSON.stringify({
        type: "clarke_slot_listing",
        longitude: parseFloat(form.longitude),
        operator: form.operator,
        ituRef: form.ituRef,
        ts: Date.now(),
      });
      const tx = new Transaction();
      tx.add(SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: DEVNET_TREASURY,
        lamports: Math.round(0.001 * LAMPORTS_PER_SOL),
      }));
      tx.add(new TransactionInstruction({
        keys: [{ pubkey: publicKey, isSigner: true, isWritable: false }],
        programId: MEMO_PROGRAM,
        data: Buffer.from(new TextEncoder().encode(memo)),
      }));
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");
      setTxSig(sig);
      setStep("success");
    } catch {
      setTxStatus("error");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <Link href="/orbital" className="text-zinc-600 text-xs hover:text-zinc-400 transition-colors mb-4 block">← Orbital Slots</Link>
        <p className="text-zinc-600 text-xs font-mono mb-3">// OPERATOR_LISTING</p>
        <h1 className="text-2xl font-bold text-white mb-3">List a Slot</h1>
        <p className="text-zinc-500 text-sm leading-relaxed max-w-lg">
          Clarke tokenizes orbital slot usage rights so operators can raise capital from a global investor base.
          Submit your ITU filing details to begin the listing process.
        </p>
      </div>

      {step === "success" ? (
        <div className="border border-emerald-800 rounded-2xl p-8 bg-emerald-950/20 text-center">
          <div className="text-emerald-400 text-2xl mb-4">✓</div>
          <h2 className="text-white font-bold text-lg mb-2">Listing request submitted</h2>
          <p className="text-zinc-400 text-sm mb-6">
            Your request has been recorded on Solana devnet. The Clarke team will review your ITU filing
            reference and reach out to {form.contact} within 48 hours.
          </p>
          <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
            target="_blank" rel="noopener noreferrer"
            className="text-zinc-400 text-xs hover:text-white transition-colors underline underline-offset-2 block mb-6">
            View on Solana Explorer →
          </a>
          <div className="text-zinc-600 text-xs font-mono bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-left">
            <div>longitude: {form.longitude}</div>
            <div>operator: {form.operator}</div>
            <div>itu_ref: {form.ituRef}</div>
            <div>tx: {txSig.slice(0, 20)}…</div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* How it works */}
          <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/10">
            <div className="text-zinc-600 text-xs font-mono mb-3">// HOW IT WORKS</div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { n: "1", title: "Submit filing", desc: "Provide your ITU filing reference and slot details." },
                { n: "2", title: "SPV structure", desc: "Clarke establishes the legal SPV to hold your slot rights." },
                { n: "3", title: "Raise capital", desc: "Investors buy fractional tokens on Solana. You receive upfront capital." },
              ].map((s) => (
                <div key={s.n}>
                  <div className="text-white/20 text-xs font-mono mb-1">{s.n}</div>
                  <div className="text-white text-xs font-medium mb-1">{s.title}</div>
                  <p className="text-zinc-600 text-xs leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/10 space-y-5">
            <div className="text-zinc-600 text-xs font-mono">// SLOT DETAILS</div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-zinc-500 text-xs block mb-1.5">Orbital Position * <span className="text-zinc-700">(e.g. 19.2 or -101)</span></label>
                <input
                  placeholder="e.g. 19.2 or -101"
                  value={form.longitude}
                  onChange={(e) => update("longitude", e.target.value)}
                  onBlur={validateLongitude}
                  className={`w-full bg-zinc-900 border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none placeholder-zinc-700 ${
                    lonError ? "border-red-700 focus:border-red-600" : "border-zinc-800 focus:border-zinc-600"
                  }`}
                />
                {lonError && <p className="text-red-400 text-xs mt-1">{lonError}</p>}
              </div>
              <div>
                <label className="text-zinc-500 text-xs block mb-1.5">ITU Filing Reference *</label>
                <input
                  placeholder="e.g. 2019/SOF/19.2E"
                  value={form.ituRef}
                  onChange={(e) => update("ituRef", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-zinc-600 placeholder-zinc-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-zinc-500 text-xs block mb-1.5">Operator Name *</label>
                <input
                  placeholder="e.g. SES S.A."
                  value={form.operator}
                  onChange={(e) => update("operator", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-zinc-600 placeholder-zinc-700"
                />
              </div>
              <div>
                <label className="text-zinc-500 text-xs block mb-1.5">Country of License</label>
                <input
                  placeholder="e.g. Luxembourg"
                  value={form.country}
                  onChange={(e) => update("country", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-zinc-600 placeholder-zinc-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-zinc-500 text-xs block mb-1.5">Satellite Name</label>
                <input
                  placeholder="e.g. Astra 1N"
                  value={form.satellite}
                  onChange={(e) => update("satellite", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-zinc-600 placeholder-zinc-700"
                />
              </div>
              <div>
                <label className="text-zinc-500 text-xs block mb-1.5">Annual Lease Revenue</label>
                <input
                  placeholder="e.g. $25M"
                  value={form.leaseRevenue}
                  onChange={(e) => update("leaseRevenue", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-zinc-600 placeholder-zinc-700"
                />
              </div>
            </div>

            <div>
              <label className="text-zinc-500 text-xs block mb-1.5">Target Raise</label>
              <input
                placeholder="e.g. $10M"
                value={form.raiseTarget}
                onChange={(e) => update("raiseTarget", e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-zinc-600 placeholder-zinc-700"
              />
            </div>

            <div className="pt-2 border-t border-zinc-800">
              <div className="text-zinc-600 text-xs font-mono mb-3">// CONTACT</div>
              <div>
                <label className="text-zinc-500 text-xs block mb-1.5">Contact Email *</label>
                <input
                  type="email"
                  placeholder="operator@company.com"
                  value={form.contact}
                  onChange={(e) => update("contact", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-zinc-600 placeholder-zinc-700"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="space-y-3">
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || txStatus === "sending"}
              className="w-full py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {txStatus === "sending"
                ? "Recording on Solana…"
                : connected
                  ? "Submit listing request →"
                  : "Connect wallet to submit →"}
            </button>
            {txStatus === "error" && (
              <p className="text-red-400 text-xs text-center">Transaction failed. Make sure your wallet is on devnet with sufficient SOL.</p>
            )}
            <p className="text-zinc-700 text-xs text-center leading-relaxed">
              Listing requests are recorded on Solana devnet as verifiable on-chain events.
              0.001 SOL fee covers transaction costs.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
