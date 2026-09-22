"use client";

import Link from "next/link";
import type { ExplorerRow, SortKey, SortDir } from "./types";
import { statusLabels, type SlotStatus } from "@/data/orbital-slots";
import { AddToCompare } from "@/components/terminal/AddToCompare";

const statusTone: Record<SlotStatus, string> = {
  active: "text-verified",
  filed: "text-muted",
  squatted: "text-stale",
  inactive: "text-faint",
};

const BASE_COLUMNS: { key: SortKey | null; label: string; align: "left" | "right"; cls?: string }[] = [
  { key: null, label: "", align: "left" },
  { key: "longitude", label: "Slot", align: "left" },
  { key: "status", label: "Status", align: "left" },
  { key: "satCount", label: "Occ.", align: "right" },
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
    ? [...BASE_COLUMNS, { key: "value" as const, label: "Fair value", align: "right" as const, cls: "text-faint" }]
    : BASE_COLUMNS;

  const arrow = (key: SortKey | null) =>
    key && key === sortKey ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  return (
    <div className="overflow-hidden">
      <div className="overflow-y-auto max-h-[70vh]">
        <table className="w-full">
          <thead className="sticky top-0 z-10">
            <tr className="bg-canvas border-b border-line">
              {columns.map((c, i) => (
                <th key={i}
                  onClick={c.key ? () => onSort(c.key!) : undefined}
                  className={`px-3 py-3 text-faint text-[13px] font-medium ${c.align === "right" ? "text-right" : "text-left"} ${c.cls ?? ""} ${c.key ? "cursor-pointer hover:text-ink select-none" : ""}`}>
                  {c.label}{arrow(c.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-14 text-center text-muted text-[15px]">No positions match these filters.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id}
                onClick={() => onSelect(r)}
                className={`border-b border-line/80 cursor-pointer transition-colors last:border-b-0 ${
                  selectedSlug === r.slug ? "bg-surface" : "hover:bg-surface/60"
                }`}>
                <td className="px-2 py-3.5 w-10" onClick={(e) => e.stopPropagation()}>
                  <AddToCompare slug={r.slug} className="px-1.5 py-0.5 text-[11px]" />
                </td>
                <td className="px-3 py-3.5">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link href={`/orbital/${r.slug}`} onClick={(e) => e.stopPropagation()}
                          className="text-ink text-[15px] font-mono font-medium tracking-tight hover:text-muted">
                          {r.label}
                        </Link>
                        {r.positionDisputedCount > 0 && (
                          <span className="text-stale text-[12px]" title="TLE occupancy disagrees with UCS catalog">Dispute</span>
                        )}
                      </div>
                      <div
                        className="text-muted text-[13px] mt-0.5 truncate"
                        title={r.operatorRaw && r.operatorRaw !== r.operator ? `Source: ${r.operatorRaw}` : undefined}
                      >
                        {r.operator || "Unknown operator"}
                        {r.country ? ` · ${r.country}` : ""}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3.5">
                  <span className={`text-[14px] ${statusTone[r.status]}`}>{statusLabels[r.status]}</span>
                </td>
                <td className="px-3 py-3.5 text-right">
                  <span className="text-ink text-[15px] tabular-nums">{r.satCount}</span>
                </td>
                <td className="px-3 py-3.5 text-right">
                  {r.fccLicensed
                    ? <span className="text-verified text-[14px]">Licensed</span>
                    : <span className="text-faint text-[14px]">None</span>}
                </td>
                {showFairValue && (
                  <td className="px-3 py-3.5 text-right">
                    <span className="text-faint text-[14px] tabular-nums">
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
