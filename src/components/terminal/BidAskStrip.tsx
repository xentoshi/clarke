import type { CapacityBook } from "@/lib/capacity-book";
import { formatMoney } from "@/lib/money";
import { formatAsOfDate } from "@/lib/provenance";

export function BidAskStrip({ book }: { book: CapacityBook }) {
  const maxSize = Math.max(1, ...book.bids.map((l) => l.sizeMhz), ...book.asks.map((l) => l.sizeMhz));

  return (
    <section className="border border-stale/30 overflow-hidden bg-stale/5">
      <div className="px-4 py-3 border-b border-stale/25 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-sm text-stale">Simulated capacity book</h2>
          <p className="text-sm text-muted mt-1 max-w-3xl leading-relaxed">{book.disclaimer}</p>
        </div>
        <div className="text-xs font-mono text-faint">
          {book.unit} · spread {(book.spreadPct * 100).toFixed(1)}% · {formatAsOfDate(book.provenance.asOf)}
        </div>
      </div>
      {book.midUsd === 0 ? (
        <div className="px-4 py-6 text-muted text-sm">No simulated book for non-commercial positions.</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-px bg-line">
          <div className="bg-surface p-4">
            <div className="text-sm text-verified mb-2">Bids</div>
            <div className="space-y-1.5">
              {book.bids.map((l) => (
                <div key={l.label} className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-verified w-16 tabular-nums">{formatMoney(l.priceUsd)}</span>
                  <div className="flex-1 h-1.5 bg-canvas rounded overflow-hidden">
                    <div className="h-full bg-verified/70" style={{ width: `${(l.sizeMhz / maxSize) * 100}%` }} />
                  </div>
                  <span className="text-faint w-14 text-right">{l.sizeMhz} MHz</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-surface p-4">
            <div className="text-sm text-danger mb-2">Asks</div>
            <div className="space-y-1.5">
              {book.asks.map((l) => (
                <div key={l.label} className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-danger w-16 tabular-nums">{formatMoney(l.priceUsd)}</span>
                  <div className="flex-1 h-1.5 bg-canvas rounded overflow-hidden">
                    <div className="h-full bg-danger/70" style={{ width: `${(l.sizeMhz / maxSize) * 100}%` }} />
                  </div>
                  <span className="text-faint w-14 text-right">{l.sizeMhz} MHz</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
