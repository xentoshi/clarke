"use client";

import type { ExplorerRow } from "./types";
import { densestBySatelliteCount } from "@/lib/densest";

export default function ExplorerStats({ rows, dataAsOf }: { rows: ExplorerRow[]; dataAsOf: string | null }) {
  const onStation = rows.filter((r) => r.satCount > 0).length;
  const fccLicensed = rows.filter((r) => r.fccLicensed).length;
  const densest = densestBySatelliteCount(rows);

  const stats = [
    { label: "positions", value: rows.length.toLocaleString("en-US"), mono: false },
    { label: "on station", value: onStation.toLocaleString("en-US"), mono: false },
    { label: "densest", value: densest ? densest.label : "n/a", mono: true },
    { label: "FCC licensed positions", value: fccLicensed.toLocaleString("en-US"), mono: false },
  ];

  return (
    <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
      {stats.map((s) => (
        <div key={s.label} className="flex items-baseline gap-2">
          <span className={`text-ink font-medium text-[15px] ${s.mono ? "font-mono" : "tabular-nums"}`}>{s.value}</span>
          <span className="text-faint text-[13px]">{s.label}</span>
        </div>
      ))}
      {dataAsOf && (
        <span className="text-faint text-[13px] w-full sm:w-auto sm:ml-auto">
          <span className="font-mono">{dataAsOf}</span>
        </span>
      )}
    </div>
  );
}
