"use client";

import Link from "next/link";
import { useCompare } from "./useCompare";

export function CompareTray({ pro }: { pro: boolean }) {
  const { slugs, clear } = useCompare();
  if (slugs.length === 0) return null;

  const href = pro ? `/orbital/compare?s=${slugs.join(",")}` : "/pricing";

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[min(720px,calc(100%-1.5rem))]">
      <div className="bg-surface border border-line shadow-lg px-4 py-3 flex items-center gap-3">
        <div className="text-sm text-muted shrink-0">Compare</div>
        <div className="flex-1 min-w-0 flex flex-wrap gap-1.5">
          {slugs.map((s) => (
            <span key={s} className="text-xs font-mono text-ink bg-canvas border border-line px-1.5 py-0.5 rounded-sm">{s}</span>
          ))}
        </div>
        <button onClick={clear} className="text-muted hover:text-ink text-sm">Clear</button>
        <Link href={href} className="bg-ink text-canvas rounded-sm px-3 py-1.5 text-xs font-semibold hover:bg-ink/85 shrink-0">
          {pro ? `Open ${slugs.length}` : "Pro to compare"}
        </Link>
      </div>
    </div>
  );
}
