import type { CapacityBook } from "@/lib/capacity-book";
import { formatMoney } from "@/lib/money";
import { formatAsOfDate } from "@/lib/provenance";

export function BidAskStrip({ book }: { book: CapacityBook }) {
  const maxSize = Math.max(1, ...book.bids.map((l) => l.sizeMhz), ...book.asks.map((l) => l.sizeMhz));

  return (
    <section className="border border-amber-900/40 rounded-xl overflow-hidden bg-amber-950/10">
      <div className="px-4 py-3 border-b border-amber-900/40 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-[10px] font-mono text-amber-400/90 uppercase tracking-widest">Simulated capacity book</h2>
          <p className="text-[11px] text-amber-200/70 mt-1 max-w-3xl leading-relaxed">{book.disclaimer}</p>
        </div>
        <div className="text-[10px] font-mono text-zinc-600">
          {book.unit} · spread {(book.spreadPct * 100).toFixed(1)}% · {formatAsOfDate(book.provenance.asOf)}
        </div>
      </div>
      {book.midUsd === 0 ? (
        <div className="px-4 py-6 text-zinc-500 text-xs">No simulated book for non-commercial positions.</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-px bg-white/[0.04]">
          <div className="bg-zinc-950 p-4">
            <div className="text-[10px] font-mono text-emerald-500/80 uppercase tracking-widest mb-2">Bids</div>
            <div className="space-y-1.5">
              {book.bids.map((l) => (
                <div key={l.label} className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-emerald-400 w-16 tabular-nums">{formatMoney(l.priceUsd)}</span>
                  <div className="flex-1 h-1.5 bg-zinc-900 rounded overflow-hidden">
                    <div className="h-full bg-emerald-700/80" style={{ width: `${(l.sizeMhz / maxSize) * 100}%` }} />
                  </div>
                  <span className="text-zinc-500 w-14 text-right">{l.sizeMhz} MHz</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-zinc-950 p-4">
            <div className="text-[10px] font-mono text-rose-400/80 uppercase tracking-widest mb-2">Asks</div>
            <div className="space-y-1.5">
              {book.asks.map((l) => (
                <div key={l.label} className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-rose-400 w-16 tabular-nums">{formatMoney(l.priceUsd)}</span>
                  <div className="flex-1 h-1.5 bg-zinc-900 rounded overflow-hidden">
                    <div className="h-full bg-rose-800/80" style={{ width: `${(l.sizeMhz / maxSize) * 100}%` }} />
                  </div>
                  <span className="text-zinc-500 w-14 text-right">{l.sizeMhz} MHz</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
