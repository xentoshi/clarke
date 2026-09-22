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
      className={`text-xs px-2 py-1 rounded-sm border transition-colors ${
        on
          ? "border-verified/40 text-verified bg-verified/8"
          : full
            ? "border-line text-faint cursor-not-allowed"
            : "border-line text-muted hover:border-line-strong hover:text-ink"
      } ${className}`}
    >
      {on ? "In compare" : full ? "Compare full" : "Compare"}
    </button>
  );
}
