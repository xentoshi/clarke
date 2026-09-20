"use client";

import type { Facets } from "./types";
import type { Band, SlotStatus } from "@/data/orbital-slots";
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

function Check({ on }: { on: boolean }) {
  return <span className={`w-3 h-3 rounded-[3px] border shrink-0 ${on ? "bg-ink border-ink" : "border-line-strong"}`} />;
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

  return (
    <div className="text-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-ink font-medium">Filters{n > 0 ? ` (${n})` : ""}</span>
        {n > 0 && (
          <button
            onClick={() => onChange({ ...facets, regions: [], operators: [], bands: [], statuses: [], congestionMin: 0, congestionMax: 100, fccOnly: false })}
            className="text-faint hover:text-ink transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="mb-5">
        <div className="text-faint text-xs mb-2">Region</div>
        {REGIONS.map((r) => (
          <button key={r} onClick={() => set({ regions: toggle(facets.regions, r) })}
            className="flex items-center gap-2 w-full text-left py-0.5 text-muted hover:text-ink transition-colors">
            <Check on={facets.regions.includes(r)} /> {r}
          </button>
        ))}
      </div>

      <div className="mb-5">
        <div className="text-faint text-xs mb-2">Operator</div>
        {operatorOptions.map((o) => (
          <button key={o.name} onClick={() => set({ operators: toggle(facets.operators, o.name) })}
            className="flex items-center gap-2 w-full text-left py-0.5 text-muted hover:text-ink transition-colors">
            <Check on={facets.operators.includes(o.name)} />
            <span className="truncate flex-1">{o.name}</span>
            <span className="text-faint tabular-nums">{o.count}</span>
          </button>
        ))}
      </div>

      <div className="mb-5">
        <div className="text-faint text-xs mb-2">Bands</div>
        <div className="flex flex-wrap gap-1.5">
          {ALL_BANDS.map((b) => (
            <button key={b} onClick={() => set({ bands: toggle(facets.bands, b) })}
              className={`px-2 py-0.5 rounded-sm border transition-colors ${
                facets.bands.includes(b) ? "bg-ink border-ink text-canvas" : "border-line text-muted hover:border-line-strong"
              }`}>
              {b}
            </button>
          ))}
        </div>
        <p className="text-faint text-xs mt-1.5 leading-snug">Band data exists for curated slots only.</p>
      </div>

      <div className="mb-5">
        <div className="text-faint text-xs mb-2">Status</div>
        {ALL_STATUSES.map((s) => (
          <button key={s} onClick={() => set({ statuses: toggle(facets.statuses, s) })}
            className="flex items-center gap-2 w-full text-left py-0.5 text-muted hover:text-ink transition-colors capitalize">
            <Check on={facets.statuses.includes(s)} /> {s}
          </button>
        ))}
      </div>

      <div className="mb-5">
        <div className="text-faint text-xs mb-2">
          Congestion <span className="font-mono">{facets.congestionMin}–{facets.congestionMax}</span>
        </div>
        <input type="range" min={0} max={100} value={facets.congestionMin}
          onChange={(e) => set({ congestionMin: Math.min(Number(e.target.value), facets.congestionMax) })}
          className="w-full accent-ink" />
        <input type="range" min={0} max={100} value={facets.congestionMax}
          onChange={(e) => set({ congestionMax: Math.max(Number(e.target.value), facets.congestionMin) })}
          className="w-full accent-ink" />
      </div>

      <div className="space-y-1.5">
        <button onClick={() => set({ fccOnly: !facets.fccOnly })}
          className="flex items-center gap-2 w-full text-left text-muted hover:text-ink transition-colors">
          <Check on={facets.fccOnly} /> FCC licensed only
        </button>
      </div>
    </div>
  );
}
