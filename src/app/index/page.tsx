import Link from "next/link";
import { buildMeta } from "@/lib/metadata";
import { buildGeoSlotIndex, type GeoSlotIndexDossier, type OccupancyMove } from "@/lib/geo-slot-index";
import { formatLonFixed } from "@/lib/geo-angle";
import { TableOfContents } from "@/components/TableOfContents";

export const metadata = buildMeta({
  title: "GEO Slot Index #1",
  description: "Method note: occupancy enter/leave, UCS–TLE dispute flips, and FCC license deltas. Not a price index.",
  tag: "Index",
  path: "/index",
});

const toc = [
  { id: "method", label: "Method" },
  { id: "what-this-is-not", label: "What this is not" },
  { id: "d-101w", label: "101°W" },
  { id: "d-19-2e", label: "19.2°E" },
  { id: "d-13e", label: "13°E" },
  { id: "d-72e", label: "72°E" },
  { id: "d-163w", label: "163°W" },
  { id: "caveats", label: "Caveats" },
];

function lon(v: number | null): string {
  return v == null ? "—" : formatLonFixed(v, 1);
}

function MoveList({ items, empty }: { items: OccupancyMove[]; empty: string }) {
  if (items.length === 0) return <p className="text-faint text-[15px]">{empty}</p>;
  return (
    <ul className="space-y-3">
      {items.map((m) => (
        <li key={`${m.kind}-${m.name}`} className="text-[16px] text-ink leading-relaxed">
          <span className="font-medium">{m.name}</span>
          <span className="text-faint text-[13px] font-mono"> · UCS {lon(m.ucsLon)} · TLE {lon(m.tleLon)}</span>
          <div className="text-muted text-[15px] mt-0.5">{m.detail}</div>
        </li>
      ))}
    </ul>
  );
}

function Dossier({ d, headingId }: { d: GeoSlotIndexDossier; headingId: string }) {
  return (
    <section id={headingId} className="mb-20 scroll-mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <h2 className="text-ink font-semibold text-3xl font-mono tracking-tight">{d.label}</h2>
        <Link href={`/orbital/${d.slug}`} className="text-[14px] text-muted hover:text-ink">
          Open Slot Terminal
        </Link>
      </div>
      <p className="text-muted text-[16px] mb-10 leading-relaxed">
        Registry operator {d.operator || "—"}. Occupancy ±0.4° TLE-primary: {d.satCount} sat{d.satCount === 1 ? "" : "s"}
        {d.paperFiling ? " · paper FCC filing (no occupancy longitude in window)" : ""}. Congestion {d.congestionScore} ({d.congestionLabel}). BIU hint: {d.biuHint.replace(/_/g, " ")}.
      </p>

      <h3 className="text-verified text-[15px] font-medium mb-2">Occupancy entered</h3>
      <p className="text-faint text-[13px] mb-3">TLE in this window, UCS catalog longitude not in this window.</p>
      <div className="mb-10">
        <MoveList items={d.entered} empty="No TLE arrivals vs UCS catalog this edition." />
      </div>

      <h3 className="text-stale text-[15px] font-medium mb-2">Occupancy left</h3>
      <p className="text-faint text-[13px] mb-3">UCS still lists the bird here; TLE occupancy is elsewhere (ghosts).</p>
      <div className="mb-10">
        <MoveList items={d.left} empty="No UCS ghosts this edition." />
      </div>

      <h3 className="text-stale text-[15px] font-medium mb-3">Dispute flips (|UCS−TLE| &gt; 2°)</h3>
      <div className="mb-10">
        {d.disputeFlips.length === 0 ? (
          <p className="text-faint text-[15px]">No in-window satellite is flagged positionDisputed.</p>
        ) : (
          <ul className="space-y-2">
            {d.disputeFlips.map((f) => (
              <li key={f.name} className="text-[15px] text-ink">
                {f.name}
                <span className="font-mono text-faint text-[13px]">
                  {" "}· Δ {f.deltaDeg?.toFixed(1) ?? "—"}° · UCS {lon(f.ucsLon)} · TLE {lon(f.tleLon)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <h3 className="text-ink text-[15px] font-medium mb-3">
        FCC deltas (license longitude vs occupancy)
      </h3>
      {d.fccRows.length === 0 ? (
        <p className="text-muted text-[15px]">No FCC SSAL row at this longitude (expected for many non-US administrations).</p>
      ) : (
        <>
          <table className="w-full text-[15px] mb-4">
            <thead>
              <tr className="text-faint text-left">
                <th className="py-2 font-medium">Call sign</th>
                <th className="py-2 font-medium hidden sm:table-cell">Satellite</th>
                <th className="py-2 font-medium">Licensee</th>
              </tr>
            </thead>
            <tbody>
              {d.fccRows.map((r) => (
                <tr key={r.callSign ?? r.satelliteName ?? ""} className="border-t border-line">
                  <td className="py-2.5 text-ink">{r.callSign ?? "—"}</td>
                  <td className="py-2.5 text-muted hidden sm:table-cell">{r.satelliteName ?? "—"}</td>
                  <td className="py-2.5 text-ink">{r.licensee ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {d.fccNotInOccupancy.length > 0 && (
            <p className="text-muted text-[15px] leading-relaxed mb-2">
              FCC names not in TLE-primary occupancy: {d.fccNotInOccupancy.join("; ")}. License longitude is not TLE station.
            </p>
          )}
          {d.occupancyNotInFcc.length > 0 && (
            <p className="text-muted text-[15px] leading-relaxed">
              Occupancy names without a matching FCC row: {d.occupancyNotInFcc.join("; ")}.
            </p>
          )}
        </>
      )}
      <p className="text-xs font-mono text-faint mt-5">
        FCC as-of {d.fccAsOf ?? "—"} · TLE epoch {d.tleEpochMin && d.tleEpochMax ? (d.tleEpochMin === d.tleEpochMax ? d.tleEpochMax : `${d.tleEpochMin}–${d.tleEpochMax}`) : "n/a"} · UCS vintage {d.ucsFileVintage ?? "—"}
      </p>
    </section>
  );
}

export default function GeoSlotIndexPage() {
  const edition = buildGeoSlotIndex();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
      <div className="lg:grid lg:grid-cols-[minmax(0,40rem)_11rem] lg:gap-20">
        <div className="min-w-0">
          <p className="text-muted text-[14px] mb-3">GEO Slot Index · Edition 1</p>
          <h1 className="text-4xl sm:text-5xl font-semibold text-ink tracking-tight mb-6 leading-[1.12]">GEO Slot Index #1</h1>
          <p className="text-muted text-xl leading-relaxed mb-14">
            A method-note snapshot of five GEO longitudes from Clarke&apos;s public feeds. This edition counts occupancy enter/leave (TLE vs UCS), dispute flips, and FCC license-table mismatches. It does not say prices rose, and it is not a market.
          </p>

          <section id="method" className="mb-16 scroll-mt-10">
            <h2 className="text-ink font-semibold text-2xl tracking-tight mb-5">Method</h2>
            <ul className="text-muted text-[16px] leading-relaxed space-y-3 list-disc pl-5">
              <li>
                <strong className="text-ink">Occupancy window</strong> is ±0.4° on the TLE-primary longitude (Space-Track TLE when quality gates pass; UCS catalog otherwise). TLE longitude is a tracked-object location, never an FCC assignment or ITU filing.
              </li>
              <li>
                <strong className="text-ink">Entered</strong> = in the TLE window, UCS catalog longitude outside it. <strong className="text-ink">Left</strong> = UCS still lists the bird at this slot, TLE occupancy is elsewhere (ghosts). This is a catalog-vs-ephemeris cut, not a dated tape of station-keeping burns.
              </li>
              <li>
                <strong className="text-ink">Dispute flip</strong> = in-window satellite with circular |UCS−TLE| &gt; 2° (<span className="font-mono text-[13px]">positionDisputed</span>).
              </li>
              <li>
                <strong className="text-ink">FCC deltas</strong> = SSAL rows at the license longitude vs occupancy names. A DIRECTV call sign at 101°W is a license record; it is not proof the satellite is still on station.
              </li>
            </ul>
            <p className="text-muted text-[15px] mt-6 leading-relaxed">
              Feeds this edition: UCS file vintage {edition.vintage.ucsFileVintage ?? "—"} · FCC SSAL as-of {edition.vintage.fccAsOf ?? "—"} · TLE epoch through {edition.vintage.tleEpochMax ?? "—"}. See{" "}
              <Link href="/docs" className="text-ink underline hover:text-muted">Docs</Link>
              {" · "}
              <Link href="/docs/data-trust" className="text-ink underline hover:text-muted">data trust</Link>
              {" · "}
              <Link href="/docs/valuation" className="text-ink underline hover:text-muted">valuation v0</Link>
              {" · "}
              <Link href="/docs/fcc-refresh" className="text-ink underline hover:text-muted">FCC refresh</Link>.
            </p>
          </section>

          <section id="what-this-is-not" className="mb-16 scroll-mt-10">
            <h2 className="text-ink font-semibold text-2xl tracking-tight mb-5">What this is not</h2>
            <p className="text-muted text-[16px] leading-relaxed">
              Not a price index, bid/ask, last trade, or appraisal. Implied fair value v0 lives on Slot Terminal as a labeled model. Curated dollar overlays are hand estimates. This page does not reprint them. ITU SNS is not ingested; BIU here is a Clarke hint.
            </p>
          </section>

          {edition.dossiers.map((d) => (
            <Dossier key={d.slug} d={d} headingId={`d-${d.slug}`} />
          ))}

          <section id="caveats" className="mb-8 scroll-mt-10">
            <h2 className="text-ink font-semibold text-2xl tracking-tight mb-5">Caveats</h2>
            <ul className="text-muted text-[16px] leading-relaxed space-y-3 list-disc pl-5">
              <li>UCS snapshot vintage is years behind TLE. Ghosts are expected; they are the point of TLE-primary occupancy.</li>
              <li>One-shot Space-Track ingest produced thousands of relocation events vs the previous UCS clustering. Those events are not a weekly enter/leave time series and are not used as such here.</li>
              <li>FCC workbook as-of can be stale (banner on Terminal when &gt; 14 days). Name matching between SSAL and UCS is imperfect (AT&T T16 vs DIRECTV D16).</li>
              <li>Paper filings (163°W) can mean no UCS/TLE occupancy, a UCS lag, or a satellite that never showed in this snapshot.</li>
            </ul>
          </section>
        </div>
        <aside className="hidden lg:block">
          <div className="sticky top-10">
            <TableOfContents items={toc} />
          </div>
        </aside>
      </div>
    </div>
  );
}
