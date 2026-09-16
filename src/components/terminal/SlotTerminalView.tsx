import Link from "next/link";
import { statusColors, statusLabels, bandColors } from "@/data/orbital-slots";
import type { SlotTerminalModel } from "@/lib/slot-terminal";
import type { Entitlements } from "@/lib/auth";
import { formatAsOfDate } from "@/lib/provenance";
import { parseUcsLaunchYear } from "@/lib/occupancy-quality";
import { formatOperatorMix } from "@/lib/operator-mix";
import { formatLonFixed } from "@/lib/geo-angle";
import { recordedRightsLayers, stubRightsLayers } from "@/lib/terminal-default";
import { Metric } from "./Metric";
import { ProGate } from "./ProGate";
import { ValuationChart } from "./ValuationChart";
import { BidAskStrip } from "./BidAskStrip";
import { RightsChain } from "./RightsChain";
import { AddToCompare } from "./AddToCompare";
import { CompareTray } from "./CompareTray";
import { ExperimentalDisclosure } from "./ExperimentalDisclosure";
import { TrustMark } from "./TrustMark";
import { TrustBar } from "./TrustBar";

const congTone = (tier: string) =>
  tier === "critical" || tier === "high" ? "red" :
  tier === "moderate" ? "amber" :
  tier === "low" ? "sky" : "white" as const;

export function SlotTerminalView({
  model,
  entitlements,
}: {
  model: SlotTerminalModel;
  entitlements: Entitlements;
}) {
  const v = model.valuation;
  const recordedRights = recordedRightsLayers(model.rightsChain);
  const stubRights = stubRightsLayers(model.rightsChain);

  return (
    <div className="max-w-[1440px] mx-auto px-3 sm:px-5 py-6">
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-3 text-xs font-mono">
          <Link href="/orbital" className="text-white/30 hover:text-white/70">Registry</Link>
          <span className="text-white/15">/</span>
          <span className="text-white/50">{model.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <AddToCompare slug={model.slug} />
          <Link href={`/orbital/compare?s=${model.slug}`} className="text-xs text-zinc-500 hover:text-white">
            Compare view
          </Link>
        </div>
      </div>

      <div data-terminal-primary>
      <header className="mb-4" data-terminal-header>
        <p className="text-zinc-600 text-[10px] font-mono tracking-widest uppercase mb-1">
          GEO · {model.longitude >= 0 ? "EAST" : "WEST"} · {model.region} · {model.slug}
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white font-mono tracking-tight">{model.label}</h1>
        <p className="text-zinc-400 text-sm mt-1">
          {model.operator || "Unknown operator"}
          {model.country ? ` · ${model.country}` : ""}
          {model.purpose ? ` · ${model.purpose}` : ""}
        </p>
        {model.operatorMix.length > 1 && (
          <p className="text-zinc-500 text-xs mt-1.5">
            Occupancy ±0.4°: {formatOperatorMix(model.operatorMix, model.satCount)}
            {model.occupancyMajority && model.occupancyMajority !== model.operator
              ? ` · window majority is not the registry operator`
              : ""}
          </p>
        )}
        <div className="flex flex-wrap gap-1.5 mt-3">
          <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${statusColors[model.status]}`}>
            {statusLabels[model.status]}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded border border-zinc-700 text-zinc-400 font-mono">
            {v.license.biuLabel}
          </span>
          {model.fccAuthorizations.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded border border-sky-900/60 text-sky-400 font-mono">
              FCC ×{model.fccAuthorizations.length}
            </span>
          )}
          {model.bands.map((b) => (
            <span key={b} className={`text-[10px] px-2 py-0.5 rounded border font-mono ${bandColors[b]}`}>{b}</span>
          ))}
        </div>
      </header>

      <TrustBar vintage={model.sourceVintage} positionTrust={model.positionTrust} />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-px bg-white/[0.08] overflow-hidden mb-6 border border-white/[0.08]">
        <Metric
          kpi="occupancy"
          label="Occupancy"
          value={`${model.satCount} sat${model.satCount === 1 ? "" : "s"}`}
          sub={
            model.operatorMix.length > 1
              ? `±0.4° TLE-primary · majority ${model.occupancyMajority || "—"} (${model.operatorMix[0]?.count ?? 0}/${model.satCount})`
              : `${statusLabels[model.status]} · ${model.operator || "—"}`
          }
          provenance={model.provenance.occupancy}
          trust="V"
        />
        <Metric
          kpi="rights"
          label="License / FCC"
          value={v.license.biuHint.replace(/_/g, " ")}
          sub={model.fccAuthorizations.length ? `${model.fccAuthorizations.length} FCC rows` : "No FCC row"}
          provenance={model.provenance.license}
          trust={model.fccAuthorizations.length > 0 ? "V" : "M"}
          tone={v.license.biuHint === "paper_filing" ? "amber" : v.license.biuHint === "brought_into_use" ? "emerald" : "white"}
        />
        <Metric
          kpi="freshness"
          label="Freshness"
          value={model.sourceVintage.tleEpochMax ?? "—"}
          sub={
            model.sourceVintage.fccStale
              ? `FCC SSAL ${model.sourceVintage.fccAsOf ?? "—"} stale`
              : `FCC ${model.sourceVintage.fccAsOf ?? "—"} · UCS ${model.sourceVintage.ucsFileVintage ?? "—"}`
          }
          provenance={model.provenance.fcc}
          trust="V"
          tone={model.sourceVintage.fccStale ? "amber" : "white"}
        />
        <Metric
          kpi="congestion"
          label="Congestion"
          value={`${model.congestion.score}`}
          sub={`${model.congestion.label} · ${model.congestion.factors.coLocated} co-located`}
          provenance={model.provenance.congestion}
          trust="M"
          tone={congTone(model.congestion.tier)}
        />
        <Metric
          kpi="fair-value"
          label="Fair value (v0)"
          value={v.nonCommercial ? "n/c" : v.formatted.point}
          sub={v.nonCommercial ? "Not commercially valued" : `${v.confidence} · ${v.formatted.range} CI · labeled model`}
          provenance={model.provenance.fairValue}
          trust="M"
          tone={v.nonCommercial ? "amber" : "white"}
        />
      </div>

      <div className="grid lg:grid-cols-12 gap-5 mb-6">
        <div className="lg:col-span-7 space-y-5">
          <section className="border border-white/[0.08] p-4">
            <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-3">Occupancy</h2>
            <dl className="space-y-1.5 text-xs">
              <Row k="Registry operator" val={model.operator || "—"} />
              {model.operatorMix.length > 1 && (
                <Row k="Window majority" val={model.occupancyMajority || "—"} />
              )}
              {model.operatorMix.length > 1 && (
                <Row k="Operator mix" val={formatOperatorMix(model.operatorMix, model.satCount)} />
              )}
              <Row k="Country" val={model.country || "—"} />
              <Row k="Purpose" val={model.purpose || "—"} />
              <Row k="Status" val={statusLabels[model.status]} />
              <Row k="Satellites" val={String(model.satCount)} />
              <Row
                k="Position source"
                val={`${model.positionTrust.tlePrimaryCount} TLE / ${model.positionTrust.ucsFallbackCount} UCS fallback`}
              />
              <Row k="Remaining life" val={v.occupancyQuality.detail} />
              <Row k="Coverage proxy" val={v.coverage.detail} />
            </dl>
            <div className="text-[10px] font-mono text-zinc-700 mt-3">
              {model.provenance.occupancy.source} · {formatAsOfDate(model.provenance.occupancy.asOf)}
            </div>
          </section>
        </div>

        <div className="lg:col-span-5 space-y-5">
          <section className="border border-white/[0.08] p-4">
            <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-3">Recorded rights (FCC)</h2>
            <RightsChain links={recordedRights} variant="recorded" />
          </section>
        </div>
      </div>

      {model.fccAuthorizations.length > 0 && (
        <section className="mb-6">
          <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-3">
            FCC / license signals ({model.fccAuthorizations.length})
          </h2>
          <div className="border border-sky-900/40 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.08] bg-[#060608]">
                  <th className="text-left px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium">Satellite</th>
                  <th className="text-left px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium hidden sm:table-cell">Licensee</th>
                  <th className="text-left px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium hidden md:table-cell">Service</th>
                  <th className="text-right px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium">Call sign</th>
                </tr>
              </thead>
              <tbody>
                {model.fccAuthorizations.map((auth) => (
                  <tr key={auth.id} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-4 py-3 text-white text-xs font-mono">{auth.satelliteName ?? "—"}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-zinc-400 text-xs">{auth.licensee ?? "—"}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-zinc-500 text-xs">{auth.service ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-sky-400 text-xs font-mono">{auth.callSign ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] font-mono text-zinc-600 mt-2">
            {model.provenance.fcc.source} · {formatAsOfDate(model.provenance.fcc.asOf)} · class V
          </p>
        </section>
      )}

      <section className="mb-6">
        <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-3">
          Co-located satellites ({model.satellites.length})
        </h2>
        <div className="border border-white/[0.08] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#060608]">
                <th className="text-left px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium">Satellite</th>
                <th className="text-left px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium hidden sm:table-cell">Operator</th>
                <th className="text-left px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium hidden md:table-cell">Purpose</th>
                <th className="text-right px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium hidden lg:table-cell">UCS lon</th>
                <th className="text-right px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium hidden lg:table-cell">TLE lon</th>
                <th className="text-right px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium hidden md:table-cell">Δ</th>
                <th className="text-right px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium hidden xl:table-cell">TLE epoch</th>
                <th className="text-right px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium">Launched</th>
              </tr>
            </thead>
            <tbody>
              {model.satellites.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-6 text-zinc-600 text-xs">No satellite with a usable occupancy longitude in this ±0.4° window.</td></tr>
              ) : model.satellites.map((sat) => (
                <tr key={sat.id} className="border-b border-white/[0.04] last:border-0">
                  <td className="px-4 py-3">
                    <div className="text-white text-xs font-mono font-medium">
                      {sat.name}
                      {sat.positionDisputed && (
                        <span className="ml-2 text-[9px] uppercase tracking-wider text-amber-400 border border-amber-900/60 px-1 py-0.5 rounded">disputed</span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-600 mt-0.5">
                      {sat.positionSource === "tle" ? "TLE occupancy" : sat.positionSource === "ucs" ? "UCS fallback" : "no position"}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-zinc-400 text-xs">{sat.operator ?? "—"}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-zinc-500 text-xs">{sat.detailedPurpose ?? sat.purpose ?? "—"}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-right text-zinc-500 text-xs font-mono">
                    {sat.longitudeUcs != null ? formatLonFixed(sat.longitudeUcs, 1) : "—"}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-right text-zinc-300 text-xs font-mono">
                    {sat.longitudeTle != null ? formatLonFixed(sat.longitudeTle, 1) : "—"}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-right text-xs font-mono">
                    {sat.positionDeltaDeg == null ? (
                      <span className="text-zinc-600">—</span>
                    ) : (
                      <span className={sat.positionDisputed ? "text-amber-400" : "text-zinc-500"}>
                        {sat.positionDeltaDeg.toFixed(1)}°
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell text-right text-zinc-500 text-xs font-mono">
                    {sat.tleEpoch ?? "—"}
                    {sat.tleAgeDays != null ? ` (${sat.tleAgeDays}d)` : ""}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-500 text-xs font-mono">{parseUcsLaunchYear(sat.launchDate) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-6 border border-white/[0.08] overflow-hidden" data-fair-value-panel>
        <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between">
          <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Implied fair value</h2>
          <span className="text-[10px] font-mono text-zinc-600">labeled model · not a live market price</span>
        </div>
        <div className="px-4 py-4">
          {v.nonCommercial ? (
            <p className="text-amber-300/90 text-sm mb-3">{v.nonCommercialReason}. Raw model range {v.formatted.range} is shown for inspection only.</p>
          ) : (
            <p className="text-xs font-mono text-zinc-500 mb-3">
              v0 {v.formatted.point} · {v.formatted.range} CI · {v.confidence}
              <TrustMark cls="M" className="ml-1.5 align-middle" />
            </p>
          )}
          {v.curatedEstimate && (
            <p className="text-[11px] text-zinc-500 mb-3 leading-relaxed" data-curated-overlay="hand-estimate">
              <TrustMark cls="M" className="mr-1 align-middle" />
              Hand estimate / curated opinion: {v.curatedEstimate}. Secondary to the model range —
              not a competing headline, not a trade, not the fair-value figure.
            </p>
          )}
          <p className="text-[11px] text-zinc-600 leading-relaxed">
            No trade tape. Seeded model-path sparklines are Experimental, not default Terminal.
          </p>
        </div>
        <ProGate entitled={entitlements.features.valuationBreakdown} title="Driver breakdown is Pro">
          <table className="w-full">
            <tbody>
              {v.factors.map((f) => (
                <tr key={f.label} className="border-t border-white/[0.04]">
                  <td className="px-4 py-2 text-zinc-300 text-xs font-medium w-40">{f.label}</td>
                  <td className="px-2 py-2 text-zinc-500 text-xs">{f.detail}</td>
                  <td className="px-4 py-2 text-right">
                    <span className={`text-xs font-mono ${f.multiplier > 1 ? "text-emerald-400" : f.multiplier < 1 ? "text-orange-400" : "text-zinc-500"}`}>
                      ×{f.multiplier.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ProGate>
        <p className="px-4 py-3 text-[11px] text-zinc-600 leading-relaxed border-t border-white/[0.08]">
          {v.disclaimer}{" "}
          <Link href="/docs" className="text-zinc-400 hover:text-white underline">Methodology</Link>
          {" · "}
          <Link href="/docs/valuation" className="text-zinc-400 hover:text-white underline">Valuation v0</Link>
          {" · "}
          <Link href="/docs/data-trust" className="text-zinc-400 hover:text-white underline">Data trust</Link>
        </p>
      </section>

      {model.comps.length > 0 && (
        <section className="mb-6">
          <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-3">Nearest comps</h2>
          <p className="text-[11px] text-zinc-600 mb-2">Positions outside this slot&apos;s ±0.4° occupancy window. Not transaction comps.</p>
          <div className="border border-white/[0.08] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.08] bg-[#060608]">
                  <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wider text-zinc-600 font-medium">Slot</th>
                  <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wider text-zinc-600 font-medium hidden sm:table-cell">Operator</th>
                  <th className="text-right px-4 py-2 text-[10px] uppercase tracking-wider text-zinc-600 font-medium">Δ</th>
                  <th className="text-right px-4 py-2 text-[10px] uppercase tracking-wider text-zinc-600 font-medium">Sats</th>
                  <th className="text-right px-4 py-2 text-[10px] uppercase tracking-wider text-zinc-600 font-medium">Cong.</th>
                  <th className="text-right px-4 py-2 text-[10px] uppercase tracking-wider text-zinc-600 font-medium">Fair value</th>
                </tr>
              </thead>
              <tbody>
                {model.comps.map((c) => (
                  <tr key={c.slug} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03]">
                    <td className="px-4 py-2">
                      <Link href={`/orbital/${c.slug}`} className="text-white text-xs font-mono hover:text-zinc-300">{c.label}</Link>
                    </td>
                    <td className="px-4 py-2 text-zinc-400 text-xs hidden sm:table-cell">{c.operator || "—"}</td>
                    <td className="px-4 py-2 text-zinc-500 text-xs font-mono text-right">{c.deltaDeg.toFixed(1)}°</td>
                    <td className="px-4 py-2 text-zinc-500 text-xs font-mono text-right">{c.satCount}</td>
                    <td className="px-4 py-2 text-zinc-500 text-xs font-mono text-right">{c.congestionScore}</td>
                    <td className="px-4 py-2 text-zinc-500 text-xs font-mono text-right">
                      {c.valuation.nonCommercial ? "n/c" : c.valuation.formatted.point}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      </div>

      <div className="space-y-4 mb-6">
        <ExperimentalDisclosure id="model-backfill" title="Seeded v0 model path (not trades)">
          <p className="text-[11px] font-mono text-amber-300/80 uppercase tracking-widest mb-2">
            Model backfill — not observed trades, not a price index
          </p>
          <ValuationChart series={entitlements.features.history ? model.history : model.history.slice(-7)} source={model.historySource} />
          {!entitlements.features.history && (
            <p className="text-[11px] text-zinc-600 mt-2">
              Free seats see a 7-day backfill. <Link href="/pricing" className="text-zinc-400 hover:text-white underline">Pro unlocks 30-day persisted model path.</Link>
            </p>
          )}
        </ExperimentalDisclosure>

        <ExperimentalDisclosure id="rights-stubs" title="Unrecorded layers (ITU filing + sub-lease stubs)">
          <RightsChain links={stubRights} variant="stubs" />
        </ExperimentalDisclosure>

        <ExperimentalDisclosure id="sim-book" title="Simulated capacity book (not a market)">
          <BidAskStrip book={model.bidAsk} />
        </ExperimentalDisclosure>
      </div>

      <footer className="border-t border-white/[0.08] pt-5 text-[11px] font-mono text-zinc-600 leading-relaxed space-y-1">
        <p>
          Provenance · occupancy TLE-primary {formatAsOfDate(model.provenance.occupancy.asOf)} · UCS catalog {formatAsOfDate(model.provenance.ucsCatalog.asOf)} · FCC SSAL {formatAsOfDate(model.provenance.fcc.asOf)} ·
          valuation {v.modelVersion} {formatAsOfDate(v.asOf)}
          {model.modelRunAsOf ? ` · snapshots seeded ${model.modelRunAsOf} (model path, not trades)` : " · history synthesized (run npm run seed:valuations to persist)"}
        </p>
        <p>
          Default Terminal is occupancy + FCC + freshness + labeled model. Simulated book, ITU/sub-lease stubs, and seeded sparklines are Experimental. Not financial advice.
        </p>
      </footer>
      <CompareTray pro={entitlements.pro} />
    </div>
  );
}

function Row({ k, val }: { k: string; val: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-zinc-600 shrink-0">{k}</dt>
      <dd className="text-zinc-300 text-right">{val}</dd>
    </div>
  );
}
