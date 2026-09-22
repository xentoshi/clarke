"use client";

import { useMemo, useState } from "react";
import { GeoBeltMap } from "./GeoBeltMap";
import type { GeoBeltModel } from "@/lib/geo-belt";

export function GeoBeltView({
  model,
  initialDisputes = false,
  initialOperator = null,
  initialWindow = null,
  initialMarkId = null,
}: {
  model: GeoBeltModel;
  initialDisputes?: boolean;
  initialOperator?: string | null;
  initialWindow?: { min: number; max: number } | null;
  initialMarkId?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [operator, setOperator] = useState<string | null>(initialOperator);
  const [disputes, setDisputes] = useState(initialDisputes);

  const operatorOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const mark of model.marks) {
      if (!mark.operator) continue;
      counts.set(mark.operator, (counts.get(mark.operator) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 10);
  }, [model.marks]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return model.marks.filter((mark) => {
      if (disputes && mark.dispute !== "disputed") return false;
      if (operator && mark.operator !== operator) return false;
      if (!q) return true;
      const hay = `${mark.name} ${mark.operator ?? ""} ${mark.slotLabel}`.toLowerCase();
      return hay.includes(q);
    });
  }, [model.marks, disputes, operator, query]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search satellite or catalog operator"
          className="min-w-0 flex-1 border-0 border-b border-line bg-transparent px-0 py-2 text-[15px] text-ink placeholder:text-faint focus:border-ink focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setDisputes((on) => !on)}
          aria-pressed={disputes}
          className={`shrink-0 border rounded-full px-2.5 py-1 text-[13px] transition-colors ${
            disputes ? "border-ink/40 bg-ink text-canvas" : "border-line text-muted hover:border-line-strong hover:text-ink"
          }`}
        >
          UCS disagrees &gt;2°
        </button>
      </div>

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        <OperatorChip name="All" count={model.marks.length} on={operator === null} onClick={() => setOperator(null)} />
        {operatorOptions.map((option) => (
          <OperatorChip
            key={option.name}
            name={option.name}
            count={option.count}
            on={operator === option.name}
            onClick={() => setOperator((current) => (current === option.name ? null : option.name))}
          />
        ))}
      </div>

      <GeoBeltMap
        marks={visible}
        variant="full"
        epochFallback={model.epochLabel}
        initialWindow={initialWindow}
        initialMarkId={initialMarkId}
      />

      <p className="mt-3 text-[14px] leading-relaxed text-muted">
        {model.omittedUcs.toLocaleString()} UCS catalog positions have no usable TLE and are left off. Not interpolated.
        TLE longitude is not an FCC assignment.
      </p>
    </div>
  );
}

function OperatorChip({
  name, count, on, onClick,
}: {
  name: string;
  count: number;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={name}
      className={`shrink-0 border rounded-full px-2.5 py-1 text-[13px] transition-colors ${
        on ? "border-ink/40 bg-ink text-canvas" : "border-line text-muted hover:border-line-strong hover:text-ink"
      }`}
    >
      <span className="inline-block max-w-[9.5rem] truncate align-bottom">{name}</span>
      <span className={`ml-1.5 tabular-nums ${on ? "text-canvas/70" : "text-faint"}`}>{count}</span>
    </button>
  );
}
