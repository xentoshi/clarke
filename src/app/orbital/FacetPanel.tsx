"use client";

import { useState } from "react";
import type { Facets } from "./types";
import type { Band, SlotStatus } from "@/data/orbital-slots";
import { statusLabels } from "@/data/orbital-slots";
import { REGIONS } from "@/lib/regions";

const ALL_BANDS: Band[] = ["C", "Ku", "Ka", "X", "L", "S"];
const ALL_STATUSES: SlotStatus[] = ["active", "filed", "squatted", "inactive"];

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function activeCount(f: Facets): number {
  return (
    f.regions.length + f.operators.length + f.bands.length + f.statuses.length +
    (f.fccOnly ? 1 : 0) +
    (f.congestionMin > 0 || f.congestionMax < 100 ? 1 : 0)
  );
}

function Chip({
  on, children, onClick,
}: {
  on: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 text-[13px] rounded-full border transition-colors ${
        on
          ? "border-ink/40 bg-ink text-canvas"
          : "border-line text-muted hover:text-ink hover:border-line-strong"
      }`}
    >
      {children}
    </button>
  );
}

export default function FacetPanel({
  facets, onChange, operatorOptions,
}: {
  facets: Facets;
  onChange: (next: Facets) => void;
  operatorOptions: { name: string; count: number }[];
}) {
  const set = (patch: Partial<Facets>) => onChange({ ...facets, ...patch });
  const n = activeCount(facets);
  const [more, setMore] = useState(false);

  return (
    <div className="text-[13px]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-4">
        <span className="text-faint shrink-0">Region</span>
        {REGIONS.map((r) => (
          <Chip key={r} on={facets.regions.includes(r)} onClick={() => set({ regions: toggle(facets.regions, r) })}>
            {r}
          </Chip>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-4">
        <span className="text-faint shrink-0">Status</span>
        {ALL_STATUSES.map((s) => (
          <Chip key={s} on={facets.statuses.includes(s)} onClick={() => set({ statuses: toggle(facets.statuses, s) })}>
            {statusLabels[s]}
          </Chip>
        ))}
        <span className="text-faint shrink-0 ml-2">Band</span>
        {ALL_BANDS.map((b) => (
          <Chip key={b} on={facets.bands.includes(b)} onClick={() => set({ bands: toggle(facets.bands, b) })}>
            {b}
          </Chip>
        ))}
        <Chip on={facets.fccOnly} onClick={() => set({ fccOnly: !facets.fccOnly })}>
          FCC licensed
        </Chip>
        <button
          type="button"
          onClick={() => setMore((o) => !o)}
          className="text-muted hover:text-ink transition-colors"
        >
          {more ? "Fewer filters" : "More"}
        </button>
        {n > 0 && (
          <button
            type="button"
            onClick={() => onChange({ ...facets, regions: [], operators: [], bands: [], statuses: [], congestionMin: 0, congestionMax: 100, fccOnly: false })}
            className="text-faint hover:text-ink transition-colors"
          >
            Clear ({n})
          </button>
        )}
      </div>

      {more && (
        <div className="pt-1 pb-3 space-y-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-faint shrink-0">Operator</span>
            {operatorOptions.map((o) => (
              <Chip key={o.name} on={facets.operators.includes(o.name)} onClick={() => set({ operators: toggle(facets.operators, o.name) })}>
                {o.name}
                <span className="text-faint tabular-nums ml-1">{o.count}</span>
              </Chip>
            ))}
          </div>
          <div className="max-w-sm">
            <div className="text-faint mb-1.5">
              Congestion {facets.congestionMin}–{facets.congestionMax}
            </div>
            <input type="range" min={0} max={100} value={facets.congestionMin}
              onChange={(e) => set({ congestionMin: Math.min(Number(e.target.value), facets.congestionMax) })}
              className="w-full accent-ink" />
            <input type="range" min={0} max={100} value={facets.congestionMax}
              onChange={(e) => set({ congestionMax: Math.max(Number(e.target.value), facets.congestionMin) })}
              className="w-full accent-ink" />
            <p className="text-faint text-xs mt-1.5 leading-snug">Band data exists for curated slots only.</p>
          </div>
        </div>
      )}
    </div>
  );
}
