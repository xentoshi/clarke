"use client";

import { useState } from "react";

interface Item {
  q: string;
  a: string;
}

export default function FaqList({ items }: { items: Item[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-2 max-w-3xl">
      {items.map((item, i) => (
        <div key={i} className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/10">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-5 py-4 text-left"
          >
            <span className="text-white text-sm font-medium">{item.q}</span>
            <span className="text-zinc-500 text-lg leading-none shrink-0 ml-4">
              {open === i ? "−" : "+"}
            </span>
          </button>
          {open === i && (
            <div className="px-5 pb-4">
              <p className="text-zinc-500 text-sm leading-relaxed">{item.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
