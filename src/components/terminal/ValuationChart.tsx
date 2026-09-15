"use client";

import { useMemo, useState } from "react";
import type { ValuationSnapshot } from "@/lib/valuation-history";
import { formatMoney } from "@/lib/money";

export function ValuationChart({
  series,
  source,
}: {
  series: ValuationSnapshot[];
  source: "persisted" | "backfill";
}) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 640;
  const height = 140;
  const pad = { l: 8, r: 8, t: 12, b: 18 };

  const pts = useMemo(() => {
    if (series.length === 0) return [];
    const ys = series.map((s) => s.point);
    const min = Math.min(...ys);
    const max = Math.max(...ys);
    const span = Math.max(max - min, 1);
    return series.map((s, i) => {
      const x = pad.l + (i / Math.max(series.length - 1, 1)) * (width - pad.l - pad.r);
      const y = pad.t + (1 - (s.point - min) / span) * (height - pad.t - pad.b);
      return { x, y, s };
    });
  }, [series, pad.l, pad.r, pad.t, pad.b]);

  if (pts.length === 0) {
    return <div className="text-zinc-600 text-xs">No model-path backfill yet. Run <span className="font-mono">npm run seed:valuations</span>. Not a trade tape.</div>;
  }

  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const active = pts[hover ?? pts.length - 1];

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <div className="text-white font-mono text-sm tabular-nums">{formatMoney(active.s.point)}</div>
        <div className="text-[10px] font-mono text-amber-400/80 uppercase tracking-widest">
          {active.s.asOf} · {source === "persisted" ? "seeded SQLite path" : "synthesized"} · MODEL BACKFILL — not trades
        </div>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-28 text-emerald-400"
        onMouseLeave={() => setHover(null)}
      >
        <path d={line} fill="none" stroke="currentColor" strokeWidth="1.5" />
        {pts.map((p, i) => (
          <rect
            key={p.s.asOf}
            x={p.x - (width / pts.length) / 2}
            y={0}
            width={width / pts.length}
            height={height}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}
        <circle cx={active.x} cy={active.y} r="3" fill="currentColor" />
      </svg>
    </div>
  );
}
