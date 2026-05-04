"use client";

import { useEffect, useState } from "react";
import type { StockQuote } from "@/lib/fetchStocks";

export default function Ticker() {
  const [quotes, setQuotes] = useState<StockQuote[]>([]);

  useEffect(() => {
    const load = () =>
      fetch("/api/quotes")
        .then((r) => r.json())
        .then(setQuotes)
        .catch(() => {});

    load();
    const id = setInterval(load, 300_000);
    return () => clearInterval(id);
  }, []);

  if (quotes.length === 0) return null;

  const items = [...quotes, ...quotes];

  return (
    <div className="border-b border-zinc-800 bg-zinc-950 overflow-hidden h-8 flex items-center">
      <div className="flex animate-ticker whitespace-nowrap">
        {items.map((q, i) => {
          const up = q.changePercent >= 0;
          return (
            <span key={`${q.ticker}-${i}`} className="inline-flex items-center gap-2 px-6 text-xs font-mono">
              <span className="text-zinc-400">{q.ticker}</span>
              <span className="text-white">${q.price.toFixed(2)}</span>
              <span className={up ? "text-emerald-400" : "text-red-400"}>
                {up ? "+" : ""}{q.changePercent.toFixed(2)}%
              </span>
              <span className="text-zinc-800">|</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
