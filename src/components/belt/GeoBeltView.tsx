"use client";

import { useMemo, useState } from "react";
import { GeoBeltMap } from "./GeoBeltMap";
import type { GeoBeltModel } from "@/lib/geo-belt";
import { operatorDisplay } from "@/lib/operator-identity";

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
      const name = operatorDisplay(mark.operator);
      if (!name) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [model.marks]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return model.marks.filter((mark) => {
      if (disputes && mark.dispute !== "disputed") return false;
      if (operator && operatorDisplay(mark.operator) !== operator) return false;
      if (!q) return true;
      const hay = `${mark.name} ${mark.operator ?? ""} ${operatorDisplay(mark.operator)} ${mark.slotLabel}`.toLowerCase();
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

      <OperatorFilter
        options={operatorOptions}
        total={model.marks.length}
        operator={operator}
        onChange={setOperator}
      />

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

const TOP_OPERATORS = 6;

function OperatorFilter({
  options,
  total,
  operator,
  onChange,
}: {
  options: { name: string; count: number }[];
  total: number;
  operator: string | null;
  onChange: (next: string | null) => void;
}) {
  const [more, setMore] = useState(false);
  const [find, setFind] = useState("");
  const top = options.slice(0, TOP_OPERATORS);
  const rest = options.slice(TOP_OPERATORS);
  const selectedHidden = operator && !top.some((option) => option.name === operator)
    ? options.find((option) => option.name === operator) ?? null
    : null;
  const q = find.trim().toLowerCase();
  const matches = rest.filter((option) => !q || option.name.toLowerCase().includes(q));

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <OperatorChip name="All" count={total} on={operator === null} onClick={() => onChange(null)} />
        {top.map((option) => (
          <OperatorChip
            key={option.name}
            name={option.name}
            count={option.count}
            on={operator === option.name}
            onClick={() => onChange(operator === option.name ? null : option.name)}
          />
        ))}
        {selectedHidden && (
          <OperatorChip
            name={selectedHidden.name}
            count={selectedHidden.count}
            on
            onClick={() => onChange(null)}
          />
        )}
        {rest.length > 0 && (
          <button
            type="button"
            onClick={() => setMore((open) => !open)}
            aria-expanded={more}
            className="rounded-full border border-line px-2.5 py-1 text-[13px] text-muted transition-colors hover:border-line-strong hover:text-ink"
          >
            {more ? "Fewer" : "More"}
          </button>
        )}
      </div>
      {more && (
        <div className="mt-2 max-w-sm">
          <input
            value={find}
            onChange={(event) => setFind(event.target.value)}
            placeholder="Find operator"
            className="w-full border-0 border-b border-line bg-transparent px-0 py-1.5 text-[14px] text-ink placeholder:text-faint focus:border-ink focus:outline-none"
          />
          <ul className="mt-1 max-h-40 overflow-y-auto">
            {matches.map((option) => (
              <li key={option.name}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(operator === option.name ? null : option.name);
                    setMore(false);
                    setFind("");
                  }}
                  className="flex w-full items-baseline justify-between gap-3 py-1 text-left text-[13px] text-muted hover:text-ink"
                >
                  <span>{option.name}</span>
                  <span className="tabular-nums text-faint">{option.count}</span>
                </button>
              </li>
            ))}
            {matches.length === 0 && <li className="py-1 text-[13px] text-faint">No operator matches.</li>}
          </ul>
        </div>
      )}
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
      className={`rounded-full border px-2.5 py-1 text-[13px] transition-colors ${
        on ? "border-ink/40 bg-ink text-canvas" : "border-line text-muted hover:border-line-strong hover:text-ink"
      }`}
    >
      {name}
      <span className={`ml-1.5 tabular-nums ${on ? "text-canvas/70" : "text-faint"}`}>{count}</span>
    </button>
  );
}
