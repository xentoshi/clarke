"use client";

import { useCompare } from "./useCompare";

export function AddToCompare({ slug, className = "" }: { slug: string; className?: string }) {
  const { slugs, toggle, max } = useCompare();
  const on = slugs.includes(slug);
  const full = !on && slugs.length >= max;
  return (
    <button
      type="button"
      disabled={full}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(slug); }}
      className={`text-xs font-mono px-2 py-1 rounded border transition-colors ${
        on
          ? "border-emerald-700 text-emerald-400 bg-emerald-950/40"
          : full
            ? "border-zinc-800 text-zinc-700 cursor-not-allowed"
            : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
      } ${className}`}
    >
      {on ? "In compare" : full ? "Compare full" : "Compare"}
    </button>
  );
}
