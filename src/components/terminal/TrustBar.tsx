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

  return (
    <section className="mb-4" data-trust-bar data-freshness-strip>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[15px] text-muted">
        <p className="min-w-0 leading-relaxed">
          TLE as of <span className="font-mono text-ink">{vintage.tleEpochMax ?? "—"}</span>
          {". "}
          {fccStale ? (
            <>
              FCC SSAL stale
              {vintage.fccAsOf ? (
                <>
                  {" "}
                  (<span className="font-mono text-stale">{vintage.fccAsOf}</span>)
                </>
              ) : null}
            </>
          ) : (
            <>
              FCC <span className="font-mono text-ink">{vintage.fccAsOf ?? "—"}</span>
            </>
          )}
          {". UCS "}
          <span className="font-mono text-ink">{vintage.ucsFileVintage ?? "—"}</span>
          {". "}
          {disagreement ? <span className="text-stale">Position disagreement.</span> : null}
        </p>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="ml-auto text-[14px] text-muted hover:text-ink shrink-0"
          aria-expanded={open}
        >
          {open ? "Hide" : "Details"}
        </button>
      </div>

      {open && (
        <div className="mt-5 space-y-4">
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-faint">TLE epoch</span>
              <div className="text-ink font-mono">{vintage.tleEpochMax ?? "—"}</div>
              <div className="text-xs text-faint">
                {vintage.tleEpochMin && vintage.tleEpochMin !== vintage.tleEpochMax
                  ? `window ${vintage.tleEpochMin}–${vintage.tleEpochMax}`
                  : "in-window sats"}
                {vintage.tleIngestAt ? ` · ingest ${vintage.tleIngestAt.slice(0, 10)}` : ""}
              </div>
            </div>
            <div>
              <span className="text-faint">FCC SSAL as-of</span>
              <div className={`font-mono ${fccStale ? "text-stale" : "text-ink"}`}>
                {vintage.fccAsOf ?? "—"}
              </div>
              <div className="text-xs text-faint">
                workbook vintage{vintage.fccIngestAt ? ` · parsed ${vintage.fccIngestAt.slice(0, 10)}` : ""}
              </div>
            </div>
            <div>
              <span className="text-faint">UCS file vintage</span>
              <div className="text-ink font-mono">{vintage.ucsFileVintage ?? "—"}</div>
              <div className="text-xs text-faint">
                latest GEO launch in snapshot{vintage.ucsIngestAt ? ` · ingest ${vintage.ucsIngestAt.slice(0, 10)}` : ""}
              </div>
            </div>
          </div>
          <p className="text-xs text-faint leading-relaxed">
            Ingest last_run is when Clarke parsed the file. UCS last_run today does not mean 2026 ephemerides.
            <span className="text-muted"> · </span>
            <TrustMark cls="V" className="align-middle mr-0.5" /> verified
            <span className="text-muted"> · </span>
            <TrustMark cls="M" className="align-middle mr-0.5" /> modeled
            <span className="text-muted"> · </span>
            <TrustMark cls="S" className="align-middle mr-0.5" /> stub
          </p>

          {fccStale && (
            <div data-fcc-stale-banner>
              <p className="text-sm text-stale mb-1">FCC SSAL stale</p>
              <p className="text-muted text-sm leading-relaxed">
                FCC workbook as-of is {vintage.fccAsOf ?? "unknown"}, older than {vintage.fccStaleAfterDays} days.
                Occupancy is TLE-primary and still updates; license rows may lag. Refresh path:{" "}
                <Link href="/docs/fcc-refresh" className="underline text-ink hover:text-muted">FCC refresh runbook</Link>.
              </p>
            </div>
          )}

          {disagreement && (
            <div data-position-disagreement>
              <p className="text-sm text-stale mb-1">Position disagreement</p>
              <p className="text-muted text-sm leading-relaxed">
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
