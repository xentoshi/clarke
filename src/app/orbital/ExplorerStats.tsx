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
    { label: "positions", value: rows.length.toLocaleString() },
    { label: "active", value: active.toLocaleString() },
    { label: "densest", value: densest ? densest.label : "—" },
    { label: "FCC licensed", value: fccLicensed.toLocaleString() },
  ];

  return (
    <div className="flex flex-wrap items-baseline gap-x-7 gap-y-2">
      {stats.map((s) => (
        <div key={s.label} className="flex items-baseline gap-2">
          <span className={`text-ink font-semibold text-sm ${s.label === "densest" ? "font-mono" : "tabular-nums"}`}>{s.value}</span>
          <span className="text-faint text-sm">{s.label}</span>
        </div>
      ))}
      {updated && (
        <span className="text-faint text-sm w-full sm:w-auto sm:ml-auto">Data updated <span className="font-mono">{updated}</span></span>
      )}
    </div>
  );
}
