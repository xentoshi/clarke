"use client";

import type { ExplorerRow } from "./types";

export default function ExplorerStats({ rows, updated }: { rows: ExplorerRow[]; updated: string | null }) {
  const active = rows.filter((r) => r.status === "active").length;
  const fccLicensed = rows.filter((r) => r.fccLicensed).length;
  const densest = rows.reduce<ExplorerRow | null>(
    (max, r) => (!max || r.congestionScore > max.congestionScore ? r : max),
    null,
  );

  const stats = [
    { label: "positions", value: rows.length.toLocaleString(), mono: false },
    { label: "on station", value: active.toLocaleString(), mono: false },
    { label: "densest", value: densest ? densest.label : "—", mono: true },
    { label: "FCC licensed", value: fccLicensed.toLocaleString(), mono: false },
  ];

  return (
    <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
      {stats.map((s) => (
        <div key={s.label} className="flex items-baseline gap-2">
          <span className={`text-ink font-medium text-[15px] ${s.mono ? "font-mono" : "tabular-nums"}`}>{s.value}</span>
          <span className="text-faint text-[13px]">{s.label}</span>
        </div>
      ))}
      {updated && (
        <span className="text-faint text-[13px] w-full sm:w-auto sm:ml-auto">
          As of <span className="font-mono">{updated}</span>
        </span>
      )}
    </div>
  );
}
