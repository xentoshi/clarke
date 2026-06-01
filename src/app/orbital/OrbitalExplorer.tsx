"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import DevnetStatus from "@/components/DevnetStatus";
import ExplorerStats from "./ExplorerStats";
import FacetPanel from "./FacetPanel";
import SlotTable from "./SlotTable";
import SlotDrawer from "./SlotDrawer";
import CsvExportDialog from "./CsvExportDialog";
import { EMPTY_FACETS, type ExplorerRow, type Facets, type SortKey, type SortDir } from "./types";

export default function OrbitalExplorer({ rows, updated }: { rows: ExplorerRow[]; updated: string | null }) {
  const [facets, setFacets] = useState<Facets>(EMPTY_FACETS);
  const [sortKey, setSortKey] = useState<SortKey>("longitude");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selected, setSelected] = useState<ExplorerRow | null>(null);
  const [csvOpen, setCsvOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filterCount =
    facets.regions.length + facets.operators.length + facets.bands.length + facets.statuses.length +
    (facets.fccOnly ? 1 : 0) + (facets.listedOnly ? 1 : 0) +
    (facets.congestionMin > 0 || facets.congestionMax < 100 ? 1 : 0);

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
        const hay = `${r.label} ${r.operator} ${r.country} ${r.satelliteNames.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (facets.regions.length && !facets.regions.includes(r.region)) return false;
      if (facets.operators.length && !facets.operators.includes(r.operator)) return false;
      if (facets.bands.length && !facets.bands.some((b) => r.bands.includes(b))) return false;
      if (facets.statuses.length && !facets.statuses.includes(r.status)) return false;
      if (r.congestionScore < facets.congestionMin || r.congestionScore > facets.congestionMax) return false;
      if (facets.fccOnly && !r.fccLicensed) return false;
      if (facets.listedOnly && !r.listed) return false;
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    out.sort((a, b) => {
      switch (sortKey) {
        case "operator": return a.operator.localeCompare(b.operator) * dir;
        case "satCount": return (a.satCount - b.satCount) * dir;
        case "congestionScore": return (a.congestionScore - b.congestionScore) * dir;
        case "value": return (a.valuation.point - b.valuation.point) * dir;
        default: return (a.longitude - b.longitude) * dir;
      }
    });
    return out;
  }, [rows, facets, sortKey, sortDir]);

  const onSort = (key: SortKey) => {
    if (key === sortKey) { setSortDir((d) => (d === "asc" ? "desc" : "asc")); return; }
    setSortKey(key);
    setSortDir(key === "longitude" || key === "operator" ? "asc" : "desc");
  };

  return (
    <>
      <div className="mb-4"><DevnetStatus /></div>

      <div className="mb-4"><ExplorerStats rows={rows} updated={updated} /></div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          value={facets.search}
          onChange={(e) => setFacets({ ...facets, search: e.target.value })}
          placeholder="Search slot, operator, country, satellite…"
          className="flex-1 min-w-0 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
        />
        <button onClick={() => setFiltersOpen((o) => !o)}
          className="lg:hidden shrink-0 border border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white rounded-lg px-3 py-2 text-xs font-medium transition-colors">
          Filters{filterCount > 0 ? ` (${filterCount})` : ""}
        </button>
        <button onClick={() => setCsvOpen(true)}
          className="shrink-0 border border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white rounded-lg px-3 py-2 text-xs font-medium transition-colors">
          Download CSV
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className={`lg:w-52 shrink-0 ${filtersOpen ? "block bg-zinc-950 border border-zinc-800 rounded-xl p-4" : "hidden"} lg:block lg:bg-transparent lg:border-0 lg:rounded-none lg:p-0`}>
          <FacetPanel facets={facets} onChange={setFacets} operatorOptions={operatorOptions} />
        </aside>
        <div className="flex-1 min-w-0">
          <div className="text-zinc-600 text-xs mb-2 font-mono">{filtered.length.toLocaleString()} of {rows.length.toLocaleString()} positions</div>
          <SlotTable rows={filtered} sortKey={sortKey} sortDir={sortDir} onSort={onSort}
            onSelect={(r) => setSelected((cur) => (cur?.slug === r.slug ? null : r))} selectedSlug={selected?.slug ?? null} />
          <div className="mt-4 flex items-center justify-end">
            <Link href="/orbital/faq" className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors">Questions about the data? Read the FAQ →</Link>
          </div>
        </div>
      </div>

      {selected && <SlotDrawer row={selected} onClose={() => setSelected(null)} />}
      {csvOpen && <CsvExportDialog rows={filtered} onClose={() => setCsvOpen(false)} />}
    </>
  );
}
