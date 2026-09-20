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
      <p className="text-muted text-sm mb-2">Account</p>
      <h1 className="text-2xl font-semibold text-ink tracking-tight mb-2">Seat</h1>
      <div className="border border-line bg-surface p-5 mb-6 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-muted">Email</span><span className="text-ink font-mono">{email}</span></div>
        <div className="flex justify-between"><span className="text-muted">Plan</span><span className="text-ink font-mono">{plan}{demo ? " (demo)" : ""}</span></div>
      </div>
      {plan === "pro" && (
        <div className="mb-6">
          <button onClick={mint} className="border border-line text-ink rounded-sm px-4 py-2 text-sm hover:border-line-strong">
            Mint API key
          </button>
          {key && (
            <pre className="mt-3 text-[11px] font-mono text-ink bg-canvas border border-line rounded-sm p-3 overflow-x-auto whitespace-pre-wrap">{key}</pre>
          )}
          {note && <p className="text-muted text-sm mt-2 leading-relaxed">{note}</p>}
          <p className="text-faint text-sm mt-2">OpenAPI: <Link href="/api/v1/openapi" className="text-ink underline">/api/v1/openapi</Link></p>
        </div>
      )}
      <button onClick={logout} className="text-muted hover:text-ink text-sm">Sign out</button>
    </div>
  );
}
