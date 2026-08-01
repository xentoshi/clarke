"use client";

import type { ExplorerRow, SortKey, SortDir } from "./types";
import type { CongestionTier } from "@/lib/satellites";
import type { SlotStatus } from "@/data/orbital-slots";

const statusDot: Record<SlotStatus, string> = {
  active: "#34d399", filed: "#60a5fa", squatted: "#fbbf24", inactive: "#52525b",
};

const congestionDot: Record<CongestionTier, string> = {
  sparse: "#3f3f46", low: "#3b82f6", moderate: "#f59e0b", high: "#f97316", critical: "#ef4444",
};

const COLUMNS: { key: SortKey | null; label: string; align: "left" | "right"; cls?: string }[] = [
  { key: "longitude", label: "Slot", align: "left" },
  { key: "operator", label: "Operator", align: "left", cls: "hidden sm:table-cell" },
  { key: null, label: "Country", align: "left", cls: "hidden lg:table-cell" },
  { key: null, label: "Purpose", align: "left", cls: "hidden md:table-cell" },
  { key: "satCount", label: "Sats", align: "right", cls: "hidden lg:table-cell" },
  { key: "congestionScore", label: "Cong.", align: "right" },
  { key: "value", label: "Value", align: "right", cls: "hidden sm:table-cell" },
];

export default function SlotTable({
  rows, sortKey, sortDir, onSort, onSelect, selectedSlug,
}: {
  rows: ExplorerRow[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  onSelect: (row: ExplorerRow) => void;
  selectedSlug: string | null;
}) {
  const arrow = (key: SortKey | null) =>
    key && key === sortKey ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950">
      <div className="overflow-y-auto max-h-[70vh]">
        <table className="w-full">
          <thead className="sticky top-0 z-10">
            <tr className="bg-zinc-950 border-b border-zinc-800">
              {COLUMNS.map((c, i) => (
                <th key={i}
                  onClick={c.key ? () => onSort(c.key!) : undefined}
                  className={`px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium ${c.align === "right" ? "text-right" : "text-left"} ${c.cls ?? ""} ${c.key ? "cursor-pointer hover:text-zinc-400 select-none" : ""}`}>
                  {c.label}{arrow(c.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-zinc-600 text-sm">No positions match these filters.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id}
                onClick={() => onSelect(r)}
                className={`border-b border-zinc-800/50 cursor-pointer transition-colors last:border-b-0 ${
                  selectedSlug === r.slug ? "bg-zinc-800/40" : "hover:bg-zinc-900/40"
                }`}>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: statusDot[r.status] }} />
                    <span className="text-white text-xs font-mono font-bold">{r.label}</span>
                    {r.fccLicensed && (
                      <span className="text-sky-400/80 text-[9px] border border-sky-900/60 px-1 rounded font-mono leading-none">FCC</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2.5 hidden sm:table-cell"><span className="text-zinc-400 text-xs">{r.operator || "—"}</span></td>
                <td className="px-4 py-2.5 hidden lg:table-cell"><span className="text-zinc-600 text-xs">{r.country || "—"}</span></td>
                <td className="px-4 py-2.5 hidden md:table-cell"><span className="text-zinc-500 text-xs">{r.purpose ?? "—"}</span></td>
                <td className="px-4 py-2.5 text-right hidden lg:table-cell"><span className="text-zinc-500 text-xs font-mono">{r.satCount}</span></td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: congestionDot[r.congestionTier] }} />
                    <span className="text-zinc-500 text-xs font-mono">{r.congestionScore}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right hidden sm:table-cell">
                  {r.valuation.nonCommercial ? (
                    <span className="text-amber-500/50 text-xs font-mono" title={`Not commercially valued: ${r.valuation.nonCommercialReason ?? "government/military asset"}`}>n/a</span>
                  ) : (
                    <span className="text-zinc-500 text-xs font-mono">{r.valueDisplay}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
