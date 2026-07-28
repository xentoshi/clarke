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

export default function FacetPanel({
  facets, onChange, operatorOptions,
}: {
  facets: Facets;
  onChange: (next: Facets) => void;
  operatorOptions: { name: string; count: number }[];
}) {
  const set = (patch: Partial<Facets>) => onChange({ ...facets, ...patch });
  const n = activeCount(facets);

  const Check = ({ on }: { on: boolean }) => (
    <span className={`w-3 h-3 rounded-[3px] border shrink-0 ${on ? "bg-emerald-500 border-emerald-500" : "border-zinc-700"}`} />
  );

  return (
    <div className="text-xs">
      <div className="flex items-center justify-between mb-4">
        <span className="text-zinc-400 font-medium">Filters{n > 0 ? ` (${n})` : ""}</span>
        {n > 0 && (
          <button
            onClick={() => onChange({ ...facets, regions: [], operators: [], bands: [], statuses: [], congestionMin: 0, congestionMax: 100, fccOnly: false })}
            className="text-zinc-600 hover:text-zinc-300 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Region */}
      <div className="mb-5">
        <div className="text-zinc-500 text-[10px] uppercase tracking-wider font-medium mb-2">Region</div>
        {REGIONS.map((r) => (
          <button key={r} onClick={() => set({ regions: toggle(facets.regions, r) })}
            className="flex items-center gap-2 w-full text-left py-0.5 text-zinc-400 hover:text-zinc-200 transition-colors">
            <Check on={facets.regions.includes(r)} /> {r}
          </button>
        ))}
      </div>

      {/* Operator */}
      <div className="mb-5">
        <div className="text-zinc-500 text-[10px] uppercase tracking-wider font-medium mb-2">Operator</div>
        {operatorOptions.map((o) => (
          <button key={o.name} onClick={() => set({ operators: toggle(facets.operators, o.name) })}
            className="flex items-center gap-2 w-full text-left py-0.5 text-zinc-400 hover:text-zinc-200 transition-colors">
            <Check on={facets.operators.includes(o.name)} />
            <span className="truncate flex-1">{o.name}</span>
            <span className="text-zinc-700 font-mono">{o.count}</span>
          </button>
        ))}
      </div>

      {/* Bands */}
      <div className="mb-5">
        <div className="text-zinc-500 text-[10px] uppercase tracking-wider font-medium mb-2">Bands</div>
        <div className="flex flex-wrap gap-1.5">
          {ALL_BANDS.map((b) => (
            <button key={b} onClick={() => set({ bands: toggle(facets.bands, b) })}
              className={`px-2 py-0.5 rounded border font-mono transition-colors ${
                facets.bands.includes(b) ? "bg-zinc-700 border-zinc-600 text-white" : "border-zinc-800 text-zinc-500 hover:border-zinc-600"
              }`}>
              {b}
            </button>
          ))}
        </div>
        <p className="text-zinc-700 text-[10px] mt-1.5 leading-snug">Band data exists for curated slots only.</p>
      </div>

      {/* Status */}
      <div className="mb-5">
        <div className="text-zinc-500 text-[10px] uppercase tracking-wider font-medium mb-2">Status</div>
        {ALL_STATUSES.map((s) => (
          <button key={s} onClick={() => set({ statuses: toggle(facets.statuses, s) })}
            className="flex items-center gap-2 w-full text-left py-0.5 text-zinc-400 hover:text-zinc-200 transition-colors capitalize">
            <Check on={facets.statuses.includes(s)} /> {s}
          </button>
        ))}
      </div>

      {/* Congestion */}
      <div className="mb-5">
        <div className="text-zinc-500 text-[10px] uppercase tracking-wider font-medium mb-2">
          Congestion <span className="text-zinc-600 font-mono normal-case">{facets.congestionMin}–{facets.congestionMax}</span>
        </div>
        <input type="range" min={0} max={100} value={facets.congestionMin}
          onChange={(e) => set({ congestionMin: Math.min(Number(e.target.value), facets.congestionMax) })}
          className="w-full accent-zinc-400" />
        <input type="range" min={0} max={100} value={facets.congestionMax}
          onChange={(e) => set({ congestionMax: Math.max(Number(e.target.value), facets.congestionMin) })}
          className="w-full accent-zinc-400" />
      </div>

      {/* Toggles */}
      <div className="space-y-1.5">
        <button onClick={() => set({ fccOnly: !facets.fccOnly })}
          className="flex items-center gap-2 w-full text-left text-zinc-400 hover:text-zinc-200 transition-colors">
          <Check on={facets.fccOnly} /> FCC licensed only
        </button>
      </div>
    </div>
  );
}
