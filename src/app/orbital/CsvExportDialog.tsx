"use client";

import { useState } from "react";
import type { ExplorerRow } from "./types";

interface Column {
  id: string;
  header: string;
  get: (r: ExplorerRow) => string | number;
  default: boolean;
  plus?: boolean;
}

const COLUMNS: Column[] = [
  { id: "label", header: "Slot", get: (r) => r.label, default: true },
  { id: "longitude", header: "Longitude", get: (r) => r.longitude, default: true },
  { id: "operator", header: "Operator", get: (r) => r.operator, default: true },
  { id: "country", header: "Country", get: (r) => r.country, default: true },
  { id: "region", header: "Region", get: (r) => r.region, default: true },
  { id: "purpose", header: "Purpose", get: (r) => r.purpose ?? "", default: true },
  { id: "status", header: "Status", get: (r) => r.status, default: true },
  { id: "satCount", header: "Satellites", get: (r) => r.satCount, default: true },
  { id: "positionDisputed", header: "Position disputed", get: (r) => r.positionDisputedCount, default: false },
  { id: "ucsGhosts", header: "UCS ghosts", get: (r) => r.ucsGhostCount, default: false },
  { id: "congestionScore", header: "Congestion", get: (r) => r.congestionScore, default: true },
  { id: "bands", header: "Bands", get: (r) => r.bands.join(" "), default: false },
  { id: "fccLicensed", header: "FCC Licensed", get: (r) => (r.fccLicensed ? "yes" : "no"), default: true },
  { id: "value_low", header: "Value Low (USD)", get: (r) => r.valuation.low, default: false },
  { id: "value_point", header: "Value Mid (USD)", get: (r) => r.valuation.point, default: false },
  { id: "value_high", header: "Value High (USD)", get: (r) => r.valuation.high, default: false },
  { id: "confidence", header: "Confidence", get: (r) => r.valuation.confidence, default: false },
  { id: "model", header: "Model", get: (r) => r.valuation.modelVersion, default: true },
  { id: "biu", header: "BIU hint", get: (r) => r.biuHint, default: false, plus: true },
  { id: "life", header: "Years remaining", get: (r) => r.valuation.occupancyQuality.meanYearsRemaining ?? "", default: false, plus: true },
  { id: "gdp", header: "GDP index", get: (r) => r.valuation.coverage.gdpIndex, default: false, plus: true },
  { id: "pop", header: "Pop index", get: (r) => r.valuation.coverage.popIndex, default: false, plus: true },
  { id: "drivers", header: "Drivers", get: (r) => r.valuation.factors.map((f) => `${f.label}:${f.multiplier}`).join("|"), default: false, plus: true },
];

function escapeCsv(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function CsvExportDialog({ rows, onClose, pro }: { rows: ExplorerRow[]; onClose: () => void; pro: boolean }) {
  const visible = COLUMNS.filter((c) => pro || !c.plus);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(visible.filter((c) => c.default).map((c) => c.id)),
  );

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const download = () => {
    const cols = visible.filter((c) => selected.has(c.id));
    if (cols.length === 0) return;
    const header = cols.map((c) => escapeCsv(c.header)).join(",");
    const body = rows.map((r) => cols.map((c) => escapeCsv(c.get(r))).join(",")).join("\n");
    const csv = `${header}\n${body}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `clarke-orbital-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/55" />
      <div onClick={(e) => e.stopPropagation()}
        className="relative bg-surface border border-line p-6 w-full max-w-md shadow-lg">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-ink font-semibold text-sm">Download CSV</h3>
          <button onClick={onClose} className="text-faint hover:text-ink text-lg leading-none">×</button>
        </div>
        <p className="text-muted text-sm mb-4">
          {rows.length.toLocaleString()} position{rows.length === 1 ? "" : "s"} in the current view. Choose columns:
          {!pro && <span className="block mt-1 text-faint">Export+ driver columns require a <a href="/pricing" className="text-ink underline">Pro seat</a>.</span>}
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-5">
          {visible.map((c) => (
            <button key={c.id} onClick={() => toggle(c.id)}
              className="flex items-center gap-2 text-left text-sm text-muted hover:text-ink transition-colors">
              <span className={`w-3 h-3 rounded-[3px] border shrink-0 ${selected.has(c.id) ? "bg-ink border-ink" : "border-line-strong"}`} />
              {c.header}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-end gap-3">
          <button onClick={onClose} className="text-muted hover:text-ink text-sm transition-colors">Cancel</button>
          <button onClick={download} disabled={selected.size === 0}
            className="bg-ink text-canvas rounded-sm px-4 py-2 text-sm font-semibold hover:bg-ink/85 transition-colors disabled:opacity-40">
            Download {rows.length.toLocaleString()} rows →
          </button>
        </div>
      </div>
    </div>
  );
}
