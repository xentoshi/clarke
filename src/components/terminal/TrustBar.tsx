"use client";

import { useState } from "react";
import Link from "next/link";
import type { SlotSourceVintage } from "@/lib/source-vintage";
import type { SlotPositionTrust } from "@/lib/position-authority";
import { TrustMark } from "./TrustMark";

export function TrustBar({
  vintage,
  positionTrust,
}: {
  vintage: SlotSourceVintage;
  positionTrust: SlotPositionTrust;
}) {
  const [open, setOpen] = useState(false);
  const fccStale = vintage.fccStale;
  const disagreement = positionTrust.disputedCount > 0 || positionTrust.ucsGhosts.length > 0;
  const warnings = [
    fccStale ? "FCC SSAL stale" : null,
    disagreement ? "Position disagreement" : null,
  ].filter((w): w is string => Boolean(w));

  return (
    <section className="mb-5 border border-white/[0.08] bg-[#060608]" data-trust-bar data-freshness-strip>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 px-3 py-2 text-[11px] font-mono">
        <span className="text-zinc-500">TLE {vintage.tleEpochMax ?? "—"}</span>
        <TrustMark cls="V" />
        <span className="text-white/15">·</span>
        <span className={fccStale ? "text-amber-300/90" : "text-zinc-500"}>
          FCC {vintage.fccAsOf ?? "—"}
        </span>
        <TrustMark cls="V" />
        <span className="text-white/15">·</span>
        <span className="text-zinc-500">UCS {vintage.ucsFileVintage ?? "—"}</span>
        <TrustMark cls="V" />
        {warnings.length > 0 && (
          <>
            <span className="text-white/15 hidden sm:inline">·</span>
            <span className="text-amber-300/90">{warnings.join(" · ")}</span>
          </>
        )}
        <span className="text-zinc-700 hidden md:inline ml-1">V/M/S</span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="ml-auto text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white"
          aria-expanded={open}
        >
          {open ? "Hide" : "Details"}
        </button>
      </div>

      {open && (
        <div className="px-3 py-3 border-t border-white/[0.06] space-y-3">
          <div className="grid sm:grid-cols-3 gap-2 text-xs font-mono">
            <div>
              <span className="text-zinc-600">TLE epoch</span>
              <div className="text-zinc-300">{vintage.tleEpochMax ?? "—"}</div>
              <div className="text-[10px] text-zinc-600">
                {vintage.tleEpochMin && vintage.tleEpochMin !== vintage.tleEpochMax
                  ? `window ${vintage.tleEpochMin}–${vintage.tleEpochMax}`
                  : "in-window sats"}
                {vintage.tleIngestAt ? ` · ingest ${vintage.tleIngestAt.slice(0, 10)}` : ""}
              </div>
            </div>
            <div>
              <span className="text-zinc-600">FCC SSAL as-of</span>
              <div className={fccStale ? "text-amber-300" : "text-zinc-300"}>
                {vintage.fccAsOf ?? "—"}
              </div>
              <div className="text-[10px] text-zinc-600">
                workbook vintage{vintage.fccIngestAt ? ` · parsed ${vintage.fccIngestAt.slice(0, 10)}` : ""}
              </div>
            </div>
            <div>
              <span className="text-zinc-600">UCS file vintage</span>
              <div className="text-zinc-300">{vintage.ucsFileVintage ?? "—"}</div>
              <div className="text-[10px] text-zinc-600">
                latest GEO launch in snapshot{vintage.ucsIngestAt ? ` · ingest ${vintage.ucsIngestAt.slice(0, 10)}` : ""}
              </div>
            </div>
          </div>
          <p className="text-[10px] text-zinc-600 leading-relaxed">
            Ingest last_run is when Clarke parsed the file. UCS last_run today does not mean 2026 ephemerides.
            <span className="text-zinc-500"> · </span>
            <TrustMark cls="V" className="align-middle mr-0.5" /> verified
            <span className="text-zinc-500"> · </span>
            <TrustMark cls="M" className="align-middle mr-0.5" /> modeled
            <span className="text-zinc-500"> · </span>
            <TrustMark cls="S" className="align-middle mr-0.5" /> stub
          </p>

          {fccStale && (
            <div data-fcc-stale-banner>
              <p className="text-[10px] font-mono text-amber-400/90 uppercase tracking-widest mb-1">FCC SSAL stale</p>
              <p className="text-zinc-400 text-xs leading-relaxed">
                FCC workbook as-of is {vintage.fccAsOf ?? "unknown"}, older than {vintage.fccStaleAfterDays} days.
                Occupancy is TLE-primary and still updates; license rows may lag. Refresh path:{" "}
                <Link href="/docs/fcc-refresh" className="underline text-zinc-300 hover:text-white">FCC refresh runbook</Link>.
              </p>
            </div>
          )}

          {disagreement && (
            <div data-position-disagreement>
              <p className="text-[10px] font-mono text-amber-400/80 uppercase tracking-widest mb-1">Position disagreement</p>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Occupancy clusters on Space-Track TLE longitude when the TLE passes quality gates, not on the UCS catalog longitude and not on any FCC/ITU assignment.
                {positionTrust.disputedCount > 0
                  ? ` ${positionTrust.disputedCount} satellite${positionTrust.disputedCount === 1 ? "" : "s"} in this ±0.4° window have |UCS−TLE| > ${positionTrust.disputeThresholdDeg}°.`
                  : ""}
                {positionTrust.ucsGhosts.length > 0
                  ? ` UCS still lists ${positionTrust.ucsGhosts.length} satellite${positionTrust.ucsGhosts.length === 1 ? "" : "s"} here that TLE occupancy places elsewhere (${positionTrust.ucsGhosts.slice(0, 3).map((g) => g.name).join(", ")}${positionTrust.ucsGhosts.length > 3 ? "…" : ""}).`
                  : ""}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
