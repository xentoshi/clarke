"use client";

import type { ExplorerRow } from "./types";

export default function ExplorerStats({ rows, updated }: { rows: ExplorerRow[]; updated: string | null }) {
  const active = rows.filter((r) => r.status === "active").length;
  const listed = rows.filter((r) => r.listed).length;
  const densest = rows.reduce<ExplorerRow | null>(
    (max, r) => (!max || r.congestionScore > max.congestionScore ? r : max),
    null,
  );

  const stats = [
    { label: "positions", value: rows.length.toLocaleString() },
    { label: "active", value: active.toLocaleString() },
    { label: "densest", value: densest ? densest.label : "—" },
    { label: "listed", value: listed.toLocaleString() },
  ];

  return (
    <div className="flex flex-wrap items-baseline gap-x-7 gap-y-2">
      {stats.map((s) => (
        <div key={s.label} className="flex items-baseline gap-2">
          <span className="text-white font-mono font-bold text-sm">{s.value}</span>
          <span className="text-zinc-600 text-xs">{s.label}</span>
        </div>
      ))}
      {updated && (
        <span className="text-zinc-700 text-xs font-mono w-full sm:w-auto sm:ml-auto">Data updated {updated}</span>
      )}
    </div>
  );
}
