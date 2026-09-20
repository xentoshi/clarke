"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { ExplorerRow } from "./types";
import { statusLabels } from "@/data/orbital-slots";
import { parseUcsLaunchYear } from "@/lib/occupancy-quality";

interface DossierSat { id: number; name: string; operator: string | null; launchDate: string | null }
interface DossierFcc { id: number; satelliteName: string | null; licensee: string | null; service: string | null; callSign: string | null }
interface Dossier {
  satellites: DossierSat[];
  fccAuthorizations: DossierFcc[];
  congestion: { score: number; factors: { coLocated: number; neighborhood: number; distinctOperators: number; dominantOperator: string | null; dominantShare: number } };
}

function launchYear(date: string | null): string {
  const y = parseUcsLaunchYear(date);
  return y ? String(y) : "—";
}

export default function SlotDrawer({ row, onClose }: { row: ExplorerRow | null; onClose: () => void }) {
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState(false);

  // Slide in on mount (the drawer is only mounted while open).
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Clear the stale dossier the instant the selected slot changes, adjusted
  // during render rather than in an effect, so switching slots fast never
  // shows the previous slot's dossier while the new fetch is in flight.
  const [prevSlug, setPrevSlug] = useState<string | null>(row?.slug ?? null);
  if ((row?.slug ?? null) !== prevSlug) {
    setPrevSlug(row?.slug ?? null);
    setDossier(null);
    setLoading(row !== null);
  }

  // Fetch the dossier whenever the selected slot changes.
  useEffect(() => {
    if (!row) return;
    let cancelled = false;
    fetch(`/api/v1/agents/slots/${row.slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => { if (!cancelled && json?.data) setDossier(json.data as Dossier); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [row]);

  const v = row?.valuation;

  return (
    <>
      <div className={`fixed inset-0 bg-ink/20 z-30 transition-opacity duration-300 ${shown ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div className={`fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-surface border-l border-line overflow-y-auto z-40 transition-transform duration-300 ease-out ${shown ? "translate-x-0" : "translate-x-full"}`}>
        {row && v && (
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="text-muted text-sm mb-1">
                  <span className="font-mono">{row.label}</span>
                  {" · "}
                  {row.region}
                </div>
                <h2 className="text-ink font-semibold text-xl leading-tight">
                  {row.operator || "Unknown operator"}
                </h2>
                <div className="text-muted text-sm mt-0.5">
                  {row.country || "—"}{row.satellite ? ` · ${row.satellite}` : ""}
                </div>
              </div>
              <button onClick={onClose} className="text-faint hover:text-ink transition-colors text-xl leading-none" aria-label="Close">×</button>
            </div>

            {row.description && <p className="text-muted text-sm leading-relaxed mb-5">{row.description}</p>}

            <div className="text-faint text-xs mb-2">Occupancy</div>
            <div className="space-y-0.5 mb-1">
              <FactorLine label="Status" value={statusLabels[row.status]} />
              <FactorLine label="Satellites" value={String(row.satCount)} />
              <FactorLine label="FCC" value={row.fccLicensed ? "Yes" : "No"} />
            </div>

            {(row.positionDisputedCount > 0 || row.ucsGhostCount > 0) && (
              <div className="text-stale text-sm border border-stale/30 px-2.5 py-2 mt-3 mb-1">
                TLE occupancy disagrees with UCS catalog
                {row.positionDisputedCount > 0 ? ` · ${row.positionDisputedCount} disputed in-window` : ""}
                {row.ucsGhostCount > 0 ? ` · ${row.ucsGhostCount} UCS-listed elsewhere by TLE` : ""}
                . TLE longitude is not an FCC/ITU assignment.
              </div>
            )}

            <div className="text-faint text-xs mt-5 mb-2">Congestion · {row.congestionScore} / 100</div>
            {dossier ? (
              <div className="space-y-0.5">
                <FactorLine label="Co-located (±0.4°)" value={String(dossier.congestion.factors.coLocated)} />
                <FactorLine label="Neighborhood (±2°)" value={String(dossier.congestion.factors.neighborhood)} />
                <FactorLine label="Operators / dominant" value={`${dossier.congestion.factors.distinctOperators}${dossier.congestion.factors.dominantOperator ? ` · ${dossier.congestion.factors.dominantOperator} ${Math.round(dossier.congestion.factors.dominantShare * 100)}%` : ""}`} />
              </div>
            ) : loading ? <div className="text-faint text-sm">Loading…</div> : null}

            {(row.bands.length > 0 || row.coverage.length > 0) && (
              <>
                <div className="text-faint text-xs mt-5 mb-2">Spectrum and coverage</div>
                <div className="flex flex-wrap gap-1.5">
                  {row.bands.map((b) => <span key={b} className="text-xs px-1.5 py-0.5 rounded-sm border border-line text-muted">{b}-band</span>)}
                  {row.coverage.map((c) => <span key={c} className="text-xs px-1.5 py-0.5 rounded-sm border border-line text-muted">{c}</span>)}
                </div>
              </>
            )}

            {dossier && dossier.satellites.length > 0 && (
              <>
                <div className="text-faint text-xs mt-5 mb-2">Co-located satellites ({dossier.satellites.length})</div>
                <div className="space-y-0.5">
                  {dossier.satellites.slice(0, 8).map((s) => <FactorLine key={s.id} label={s.name} value={launchYear(s.launchDate)} />)}
                </div>
              </>
            )}

            {dossier && (
              <>
                <div className="text-faint text-xs mt-5 mb-2">FCC authorizations ({dossier.fccAuthorizations.length})</div>
                {dossier.fccAuthorizations.length === 0 ? (
                  <div className="text-faint text-sm">No US authorization on record</div>
                ) : (
                  <div className="space-y-0.5">
                    {dossier.fccAuthorizations.slice(0, 6).map((a) => <FactorLine key={a.id} label={a.satelliteName ?? a.licensee ?? "—"} value={a.callSign ?? a.service ?? ""} />)}
                  </div>
                )}
              </>
            )}

            <div className="text-faint text-xs mt-5 mb-2">Fair value (v0)</div>
            {v.nonCommercial ? (
              <div className="text-stale text-sm border border-line px-2.5 py-2">
                Not commercially valued. {v.nonCommercialReason?.replace("UCS classifies this satellite's users as ", "users: ")}
              </div>
            ) : (
              <div className="space-y-0.5">
                <FactorLine label="Modeled range" value={v.formatted.range} />
                {v.curatedEstimate && (
                  <FactorLine label="Hand estimate" value={v.curatedEstimate} />
                )}
                <FactorLine label="Confidence" value={v.confidence} />
              </div>
            )}

            <div className="mt-6 pt-5 border-t border-line text-center space-y-2">
              <Link href={`/orbital/${row.slug}`} className="inline-block text-ink text-sm font-medium hover:text-muted">
                Open Slot Terminal →
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function FactorLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm py-0.5">
      <span className="text-faint truncate">{label}</span>
      <span className="font-mono shrink-0 text-ink">{value}</span>
    </div>
  );
}
