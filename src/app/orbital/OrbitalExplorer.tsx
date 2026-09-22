"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ExplorerStats from "./ExplorerStats";
import FacetPanel from "./FacetPanel";
import SlotTable from "./SlotTable";
import SlotDrawer from "./SlotDrawer";
import CsvExportDialog from "./CsvExportDialog";
import { EMPTY_FACETS, type ExplorerRow, type Facets, type SortKey, type SortDir } from "./types";
import { CompareTray } from "@/components/terminal/CompareTray";
import { GeoBeltMap } from "@/components/belt/GeoBeltMap";
import type { BeltMark } from "@/lib/geo-belt";

export default function OrbitalExplorer({
  rows, updated, pro, beltMarks, beltEpoch,
}: {
  rows: ExplorerRow[];
  updated: string | null;
  pro: boolean;
  beltMarks: BeltMark[];
  beltEpoch: string;
}) {
  const [facets, setFacets] = useState<Facets>(EMPTY_FACETS);
  const [sortKey, setSortKey] = useState<SortKey>("longitude");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selected, setSelected] = useState<ExplorerRow | null>(null);
  const [csvOpen, setCsvOpen] = useState(false);
  const [showFairValue, setShowFairValue] = useState(false);

  const operatorOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of rows) if (r.operator) counts.set(r.operator, (counts.get(r.operator) ?? 0) + 1);
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  }, [rows]);

  const filtered = useMemo(() => {
    const q = facets.search.trim().toLowerCase();
    const out = rows.filter((r) => {
      if (q) {
        const hay = `${r.label} ${r.operator} ${r.operatorRaw} ${r.country} ${r.satelliteNames.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (facets.regions.length && !facets.regions.includes(r.region)) return false;
      if (facets.operators.length && !facets.operators.includes(r.operator)) return false;
      if (facets.bands.length && !facets.bands.some((b) => r.bands.includes(b))) return false;
      if (facets.statuses.length && !facets.statuses.includes(r.status)) return false;
      if (r.congestionScore < facets.congestionMin || r.congestionScore > facets.congestionMax) return false;
      if (facets.fccOnly && !r.fccLicensed) return false;
      if (facets.disputesOnly && r.positionDisputedCount <= 0) return false;
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    out.sort((a, b) => {
      switch (sortKey) {
        case "operator": return a.operator.localeCompare(b.operator) * dir;
        case "status": return a.status.localeCompare(b.status) * dir;
        case "satCount": return (a.satCount - b.satCount) * dir;
        case "congestionScore": return (a.congestionScore - b.congestionScore) * dir;
        case "value": return (a.valuation.point - b.valuation.point) * dir;
        default: return (a.longitude - b.longitude) * dir;
      }
    });
    return out;
  }, [rows, facets, sortKey, sortDir]);

  const visibleMarks = useMemo(() => {
    const slotIds = new Set(filtered.map((r) => r.id));
    return beltMarks.filter((mark) => slotIds.has(mark.slotId) && (!facets.disputesOnly || mark.dispute === "disputed"));
  }, [filtered, beltMarks, facets.disputesOnly]);

  const mapHref = facets.disputesOnly ? "/orbital/map?disputes=1" : "/orbital/map";

  const onSort = (key: SortKey) => {
    if (key === sortKey) { setSortDir((d) => (d === "asc" ? "desc" : "asc")); return; }
    setSortKey(key);
    setSortDir(key === "longitude" || key === "operator" || key === "status" ? "asc" : "desc");
  };

  const onToggleFairValue = () => {
    setShowFairValue((on) => {
      const next = !on;
      if (!next && sortKey === "value") {
        setSortKey("longitude");
        setSortDir("asc");
      }
      return next;
    });
  };

  return (
    <>
      <div className="mb-8"><ExplorerStats rows={rows} updated={updated} /></div>

      <div className="flex flex-wrap items-end gap-3 mb-6 pb-5 border-b border-line">
        <label className="flex-1 min-w-[16rem]">
          <span className="sr-only">Search registry</span>
          <input
            value={facets.search}
            onChange={(e) => setFacets({ ...facets, search: e.target.value })}
            placeholder="Filter by slot, operator, country, satellite"
            className="w-full bg-transparent border-0 border-b border-line px-0 py-2 text-[15px] text-ink placeholder:text-faint focus:outline-none focus:border-ink transition-colors"
          />
        </label>
        <button onClick={onToggleFairValue}
          className={`shrink-0 text-[13px] pb-2 transition-colors ${
            showFairValue ? "text-ink" : "text-muted hover:text-ink"
          }`}>
          {showFairValue ? "Hide fair value" : "Show fair value"}
        </button>
        <button onClick={() => setCsvOpen(true)}
          className="shrink-0 text-[13px] text-muted hover:text-ink pb-2 transition-colors">
          Download CSV
        </button>
      </div>

      <div className="mb-8">
        <GeoBeltMap marks={visibleMarks} variant="strip" epochFallback={beltEpoch} mapHref={mapHref} />
      </div>

      <FacetPanel facets={facets} onChange={setFacets} operatorOptions={operatorOptions} />

      <div className="text-faint text-[13px] mb-3 mt-2">
        {filtered.length.toLocaleString()} of {rows.length.toLocaleString()} positions
      </div>
      <SlotTable rows={filtered} sortKey={sortKey} sortDir={sortDir} onSort={onSort}
        onSelect={(r) => setSelected((cur) => (cur?.slug === r.slug ? null : r))} selectedSlug={selected?.slug ?? null}
        showFairValue={showFairValue} />
      <div className="mt-6 flex items-center justify-end">
        <Link href="/orbital/faq" className="text-muted hover:text-ink text-[14px] transition-colors">Questions about the data? Read the FAQ</Link>
      </div>

      {selected && <SlotDrawer row={selected} onClose={() => setSelected(null)} />}
      {csvOpen && <CsvExportDialog rows={filtered} onClose={() => setCsvOpen(false)} pro={pro} />}
      <CompareTray pro={pro} />
    </>
  );
}
