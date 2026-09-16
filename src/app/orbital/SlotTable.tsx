"use client";

import Link from "next/link";
import type { ExplorerRow, SortKey, SortDir } from "./types";
import type { CongestionTier } from "@/lib/satellites";
import { statusLabels, type SlotStatus } from "@/data/orbital-slots";
import { AddToCompare } from "@/components/terminal/AddToCompare";

const statusDot: Record<SlotStatus, string> = {
  active: "#34d399", filed: "#60a5fa", squatted: "#fbbf24", inactive: "#52525b",
};

const congestionDot: Record<CongestionTier, string> = {
  sparse: "#3f3f46", low: "#3b82f6", moderate: "#f59e0b", high: "#f97316", critical: "#ef4444",
};

const BASE_COLUMNS: { key: SortKey | null; label: string; align: "left" | "right"; cls?: string }[] = [
  { key: null, label: "", align: "left" },
  { key: "longitude", label: "Slot", align: "left" },
  { key: "operator", label: "Operator", align: "left", cls: "hidden sm:table-cell" },
  { key: "status", label: "Status", align: "left" },
  { key: "satCount", label: "Occ.", align: "right" },
  { key: "congestionScore", label: "Cong.", align: "right" },
  { key: null, label: "FCC", align: "right" },
];

export default function SlotTable({
  rows, sortKey, sortDir, onSort, onSelect, selectedSlug, showFairValue = false,
}: {
  rows: ExplorerRow[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  onSelect: (row: ExplorerRow) => void;
  selectedSlug: string | null;
  showFairValue?: boolean;
}) {
  const columns = showFairValue
    ? [...BASE_COLUMNS, { key: "value" as const, label: "Fair value", align: "right" as const, cls: "text-zinc-600" }]
    : BASE_COLUMNS;

  const arrow = (key: SortKey | null) =>
    key && key === sortKey ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  return (
    <div className="border border-white/[0.08] overflow-hidden bg-[#060608]">
      <div className="overflow-y-auto max-h-[70vh]">
        <table className="w-full">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#060608] border-b border-white/[0.08]">
              {columns.map((c, i) => (
                <th key={i}
                  onClick={c.key ? () => onSort(c.key!) : undefined}
                  className={`px-3 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium ${c.align === "right" ? "text-right" : "text-left"} ${c.cls ?? ""} ${c.key ? "cursor-pointer hover:text-zinc-400 select-none" : ""}`}>
                  {c.label}{arrow(c.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-zinc-600 text-sm">No positions match these filters.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id}
                onClick={() => onSelect(r)}
                className={`border-b border-white/[0.04] cursor-pointer transition-colors last:border-b-0 ${
                  selectedSlug === r.slug ? "bg-white/[0.04]" : "hover:bg-white/[0.03]"
                }`}>
                <td className="px-2 py-2 w-10" onClick={(e) => e.stopPropagation()}>
                  <AddToCompare slug={r.slug} className="px-1.5 py-0.5 text-[10px]" />
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Link href={`/orbital/${r.slug}`} onClick={(e) => e.stopPropagation()}
                      className="text-white text-xs font-mono font-bold hover:text-zinc-300">
                      {r.label}
                    </Link>
                    {r.positionDisputedCount > 0 && (
                      <span className="text-amber-400/80 text-[9px] border border-amber-900/60 px-1 rounded font-mono leading-none">Δ</span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5 hidden sm:table-cell"><span className="text-zinc-400 text-xs">{r.operator || "—"}</span></td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: statusDot[r.status] }} />
                    <span className="text-zinc-400 text-xs capitalize">{statusLabels[r.status]}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right"><span className="text-zinc-300 text-xs font-mono">{r.satCount}</span></td>
                <td className="px-3 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: congestionDot[r.congestionTier] }} />
                    <span className="text-zinc-500 text-xs font-mono">{r.congestionScore}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right">
                  {r.fccLicensed
                    ? <span className="text-sky-400/80 text-[10px] font-mono">FCC</span>
                    : <span className="text-zinc-700 text-xs">—</span>}
                </td>
                {showFairValue && (
                  <td className="px-3 py-2.5 text-right">
                    <span className="text-zinc-500 text-xs font-mono">
                      {r.valuation.nonCommercial ? "n/c" : r.valuation.formatted.point}
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
