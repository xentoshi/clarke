"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { ExplorerRow } from "./types";
import { statusLabels } from "@/data/orbital-slots";
import EmailCapture from "@/components/EmailCapture";

interface DossierSat { id: number; name: string; operator: string | null; launchDate: string | null }
interface DossierFcc { id: number; satelliteName: string | null; licensee: string | null; service: string | null; callSign: string | null }
interface Dossier {
  satellites: DossierSat[];
  fccAuthorizations: DossierFcc[];
  congestion: { score: number; factors: { coLocated: number; neighborhood: number; distinctOperators: number; dominantOperator: string | null; dominantShare: number } };
}

function launchYear(date: string | null): string {
  if (!date) return "—";
  const y = date.split("/").pop();
  return y && /^\d{4}$/.test(y) ? y : "—";
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

  // Fetch the dossier whenever the selected slot changes.
  useEffect(() => {
    setDossier(null);
    if (!row) return;
    let cancelled = false;
    setLoading(true);
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
      <div className={`fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 ${shown ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div className={`fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-zinc-950 border-l border-zinc-800 overflow-y-auto z-40 transition-transform duration-300 ease-out ${shown ? "translate-x-0" : "translate-x-full"}`}>
        {row && v && (
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="text-zinc-500 text-xs font-mono mb-1">{row.label} · {row.region}</div>
                <h2 className="text-white font-bold text-lg leading-tight">
                  {row.operator || "Unknown operator"}
                </h2>
                <div className="text-zinc-500 text-xs mt-0.5">
                  {row.country || "—"}{row.satellite ? ` · ${row.satellite}` : ""}
                </div>
              </div>
              <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 transition-colors text-xl leading-none" aria-label="Close">×</button>
            </div>

            {row.description && <p className="text-zinc-400 text-sm leading-relaxed mb-5">{row.description}</p>}

            {/* Value */}
            <div className="space-y-1 mb-1">
              {v.basis === "curated" && v.curatedEstimate && (
                <div className="flex justify-between text-xs py-1 border-b border-zinc-900"><span className="text-zinc-600">Curated value</span><span className="text-white font-mono">{v.curatedEstimate}</span></div>
              )}
              <div className="flex justify-between text-xs py-1 border-b border-zinc-900"><span className="text-zinc-600">Modeled range</span><span className="text-zinc-300 font-mono">{v.formatted.range}</span></div>
              <div className="flex justify-between text-xs py-1 border-b border-zinc-900"><span className="text-zinc-600">Confidence</span><span className={`font-mono ${v.confidence === "high" ? "text-emerald-400" : v.confidence === "medium" ? "text-amber-400" : "text-zinc-400"}`}>{v.confidence}</span></div>
            </div>

            {/* Congestion */}
            <div className="text-zinc-500 text-[10px] uppercase tracking-wider font-medium mt-5 mb-2">Congestion · {row.congestionScore} / 100</div>
            {dossier ? (
              <div className="space-y-0.5">
                <FactorLine label="Co-located (±0.4°)" value={String(dossier.congestion.factors.coLocated)} />
                <FactorLine label="Neighborhood (±2°)" value={String(dossier.congestion.factors.neighborhood)} />
                <FactorLine label="Operators / dominant" value={`${dossier.congestion.factors.distinctOperators}${dossier.congestion.factors.dominantOperator ? ` · ${dossier.congestion.factors.dominantOperator} ${Math.round(dossier.congestion.factors.dominantShare * 100)}%` : ""}`} />
              </div>
            ) : loading ? <div className="text-zinc-700 text-xs">Loading…</div> : null}

            {/* Valuation factors */}
            <div className="text-zinc-500 text-[10px] uppercase tracking-wider font-medium mt-5 mb-2">Valuation factors</div>
            <div className="space-y-0.5">
              {v.factors.map((f) => (
                <FactorLine key={f.label} label={f.label} value={`×${f.multiplier.toFixed(2)}`} accent />
              ))}
            </div>

            {/* Bands + coverage */}
            {(row.bands.length > 0 || row.coverage.length > 0) && (
              <>
                <div className="text-zinc-500 text-[10px] uppercase tracking-wider font-medium mt-5 mb-2">Spectrum & coverage</div>
                <div className="flex flex-wrap gap-1.5">
                  {row.bands.map((b) => <span key={b} className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-700 text-zinc-400 font-mono">{b}-band</span>)}
                  {row.coverage.map((c) => <span key={c} className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-500">{c}</span>)}
                </div>
              </>
            )}

            {/* Co-located satellites */}
            {dossier && dossier.satellites.length > 0 && (
              <>
                <div className="text-zinc-500 text-[10px] uppercase tracking-wider font-medium mt-5 mb-2">Co-located satellites ({dossier.satellites.length})</div>
                <div className="space-y-0.5">
                  {dossier.satellites.slice(0, 8).map((s) => <FactorLine key={s.id} label={s.name} value={launchYear(s.launchDate)} />)}
                </div>
              </>
            )}

            {/* FCC */}
            {dossier && (
              <>
                <div className="text-zinc-500 text-[10px] uppercase tracking-wider font-medium mt-5 mb-2">FCC authorizations ({dossier.fccAuthorizations.length})</div>
                {dossier.fccAuthorizations.length === 0 ? (
                  <div className="text-zinc-700 text-xs">No US authorization on record</div>
                ) : (
                  <div className="space-y-0.5">
                    {dossier.fccAuthorizations.slice(0, 6).map((a) => <FactorLine key={a.id} label={a.satelliteName ?? a.licensee ?? "—"} value={a.callSign ?? a.service ?? ""} />)}
                  </div>
                )}
              </>
            )}

            {/* Status */}
            <div className="text-zinc-500 text-[10px] uppercase tracking-wider font-medium mt-5 mb-2">Status</div>
            <div className="text-zinc-300 text-xs">{statusLabels[row.status]}</div>

            {/* CTA */}
            <div className="mt-6 pt-5 border-t border-zinc-800">
              <EmailCapture label="Get notified of registry updates →" />
            </div>

            <div className="mt-4 text-center">
              <Link href={`/orbital/${row.slug}`} className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors">Open full page →</Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function FactorLine({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-3 text-xs py-0.5">
      <span className="text-zinc-600 truncate">{label}</span>
      <span className={`font-mono shrink-0 ${accent ? "text-emerald-400" : "text-zinc-300"}`}>{value}</span>
    </div>
  );
}

