"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AccountClient({
  email,
  plan,
  demo,
}: {
  email: string;
  plan: string;
  demo: boolean;
}) {
  const router = useRouter();
  const [key, setKey] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/orbital");
    router.refresh();
  }

  async function mint() {
    const res = await fetch("/api/v1/keys", { method: "POST" });
    const json = await res.json() as { key?: string; note?: string; error?: string };
    setKey(json.key ?? null);
    setNote(json.note ?? json.error ?? null);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <p className="text-zinc-600 text-xs font-mono mb-3">{"// ACCOUNT"}</p>
      <h1 className="text-2xl font-bold text-white mb-2">Seat</h1>
      <div className="border border-zinc-800 rounded-xl p-5 mb-6 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-zinc-500">Email</span><span className="text-white font-mono">{email}</span></div>
        <div className="flex justify-between"><span className="text-zinc-500">Plan</span><span className="text-white font-mono">{plan}{demo ? " (demo)" : ""}</span></div>
      </div>
      {plan === "pro" && (
        <div className="mb-6">
          <button onClick={mint} className="border border-zinc-700 text-zinc-200 rounded-lg px-4 py-2 text-xs hover:border-zinc-500">
            Mint API key
          </button>
          {key && (
            <pre className="mt-3 text-[11px] font-mono text-emerald-300/90 bg-black/40 border border-zinc-800 rounded p-3 overflow-x-auto whitespace-pre-wrap">{key}</pre>
          )}
          {note && <p className="text-zinc-500 text-xs mt-2 leading-relaxed">{note}</p>}
          <p className="text-zinc-600 text-xs mt-2">OpenAPI: <Link href="/api/v1/openapi" className="text-zinc-400 underline">/api/v1/openapi</Link></p>
        </div>
      )}
      <button onClick={logout} className="text-zinc-400 hover:text-white text-xs">Sign out</button>
    </div>
  );
}
