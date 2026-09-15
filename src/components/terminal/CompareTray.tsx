"use client";

import Link from "next/link";
import { useCompare } from "./useCompare";

export function CompareTray({ pro }: { pro: boolean }) {
  const { slugs, clear } = useCompare();
  if (slugs.length === 0) return null;

  const href = pro ? `/orbital/compare?s=${slugs.join(",")}` : "/pricing";

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[min(720px,calc(100%-1.5rem))]">
      <div className="bg-zinc-950/95 border border-zinc-700 rounded-xl shadow-2xl px-4 py-3 flex items-center gap-3 backdrop-blur">
        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest shrink-0">Compare</div>
        <div className="flex-1 min-w-0 flex flex-wrap gap-1.5">
          {slugs.map((s) => (
            <span key={s} className="text-xs font-mono text-white bg-zinc-800 px-1.5 py-0.5 rounded">{s}</span>
          ))}
        </div>
        <button onClick={clear} className="text-zinc-500 hover:text-white text-xs">Clear</button>
        <Link href={href} className="bg-white text-black rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-zinc-200 shrink-0">
          {pro ? `Open ${slugs.length}` : "Pro to compare"}
        </Link>
      </div>
    </div>
  );
}
