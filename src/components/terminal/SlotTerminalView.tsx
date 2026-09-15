import Link from "next/link";
import { statusColors, statusLabels, bandColors } from "@/data/orbital-slots";
import type { SlotTerminalModel } from "@/lib/slot-terminal";
import type { Entitlements } from "@/lib/auth";
import { formatAsOf, formatAsOfDate } from "@/lib/provenance";
import { parseUcsLaunchYear } from "@/lib/occupancy-quality";
import { formatOperatorMix } from "@/lib/operator-mix";
import { Metric } from "./Metric";
import { ProGate } from "./ProGate";
import { ValuationChart } from "./ValuationChart";
import { BidAskStrip } from "./BidAskStrip";
import { RightsChain } from "./RightsChain";
import { AddToCompare } from "./AddToCompare";
import { CompareTray } from "./CompareTray";

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
  const confidenceTone =
    v.confidence === "high" ? "emerald" : v.confidence === "medium" ? "amber" : "white";

  return (
    <div className="max-w-[1440px] mx-auto px-3 sm:px-5 py-6">
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-3 text-xs font-mono">
          <Link href="/orbital" className="text-white/30 hover:text-white/70">Registry</Link>
          <span className="text-white/15">/</span>
          <span className="text-white/50">Slot Terminal</span>
        </div>
        <div className="flex items-center gap-2">
          <AddToCompare slug={model.slug} />
          <Link href={`/orbital/compare?s=${model.slug}`} className="text-xs text-zinc-500 hover:text-white">
            Compare view
          </Link>
          {!entitlements.pro && (
            <Link href="/pricing" className="text-xs bg-white text-black rounded px-2.5 py-1 font-bold hover:bg-zinc-200">
              Unlock Pro
            </Link>
          )}
        </div>
      </div>

      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
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
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">As of</div>
          <div className="text-zinc-300 font-mono text-sm">{formatAsOf(model.asOf)}</div>
          <div className="text-[10px] text-zinc-600 mt-1">model {v.modelVersion} · {v.basis}</div>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-px bg-white/[0.05] rounded-xl overflow-hidden mb-6 border border-white/[0.05]">
        <Metric
          label="Fair value (v0)"
          value={v.nonCommercial ? "n/c" : v.formatted.point}
          sub={v.nonCommercial ? "Not commercially valued" : `${v.formatted.range} CI`}
          provenance={model.provenance.fairValue}
          tone={v.nonCommercial ? "amber" : "white"}
        />
        <Metric
          label="Confidence"
          value={v.confidence}
          sub={`${Math.round(((v.high - v.low) / Math.max(v.point, 1)) * 50)}% half-spread`}
          provenance={model.provenance.fairValue}
          tone={confidenceTone}
        />
        <Metric
          label="Occupancy"
          value={`${model.satCount} sat${model.satCount === 1 ? "" : "s"}`}
          sub={
            model.operatorMix.length > 1
              ? `±0.4° window · majority ${model.occupancyMajority || "—"} (${model.operatorMix[0]?.count ?? 0}/${model.satCount})`
              : `${statusLabels[model.status]} · ${model.operator || "—"}`
          }
          provenance={model.provenance.occupancy}
        />
        <Metric
          label="Congestion"
          value={`${model.congestion.score}`}
          sub={`${model.congestion.label} · ${model.congestion.factors.coLocated} co-located`}
          provenance={model.provenance.congestion}
          tone={congTone(model.congestion.tier)}
        />
        <Metric
          label="License / BIU"
          value={v.license.biuHint.replace(/_/g, " ")}
          sub={model.fccAuthorizations.length ? `${model.fccAuthorizations.length} FCC rows` : "No FCC row"}
          provenance={model.provenance.license}
          tone={v.license.biuHint === "paper_filing" ? "amber" : v.license.biuHint === "brought_into_use" ? "emerald" : "white"}
        />
      </div>

      <div className="grid lg:grid-cols-12 gap-5 mb-6">
        <div className="lg:col-span-7 space-y-5">
          <section className="border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Implied fair value</h2>
              <span className="text-[10px] font-mono text-zinc-600">not a live market price</span>
            </div>
            <div className="px-4 py-4">
              {v.nonCommercial ? (
                <p className="text-amber-300/90 text-sm mb-3">{v.nonCommercialReason}. Raw model range {v.formatted.range} is shown for inspection only.</p>
              ) : (
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="text-3xl font-mono font-bold text-white">{v.formatted.point}</span>
                  <span className="text-zinc-500 font-mono text-sm">{v.formatted.range}</span>
                  {v.curatedEstimate && <span className="text-zinc-600 text-xs">curated {v.curatedEstimate}</span>}
                </div>
              )}
              <ValuationChart series={entitlements.features.history ? model.history : model.history.slice(-7)} source={model.historySource} />
              <p className="text-[11px] text-amber-200/60 mt-2">
                Chart is a seeded v0 model path, not observed trades or a market tape.
              </p>
              {!entitlements.features.history && (
                <p className="text-[11px] text-zinc-600 mt-2">Free seats see a 7-day sparkline. <Link href="/pricing" className="text-zinc-400 hover:text-white underline">Pro unlocks 30-day persisted history.</Link></p>
              )}
            </div>
            <ProGate entitled={entitlements.features.valuationBreakdown} title="Driver breakdown is Pro">
              <table className="w-full">
                <tbody>
                  {v.factors.map((f) => (
                    <tr key={f.label} className="border-t border-zinc-800/50">
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
            <p className="px-4 py-3 text-[11px] text-zinc-600 leading-relaxed border-t border-zinc-800">
              {v.disclaimer}{" "}
              <Link href="/about#registry-methodology" className="text-zinc-400 hover:text-white underline">Methodology</Link>
              {" · "}
              <Link href="/docs/valuation" className="text-zinc-400 hover:text-white underline">Valuation v0</Link>
            </p>
          </section>
        </div>

        <div className="lg:col-span-5 space-y-5">
          <section className="border border-zinc-800 rounded-xl p-4">
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
              <Row k="Remaining life" val={v.occupancyQuality.detail} />
              <Row k="Coverage proxy" val={v.coverage.detail} />
            </dl>
            <div className="text-[10px] font-mono text-zinc-700 mt-3">
              {model.provenance.occupancy.source} · {formatAsOfDate(model.provenance.occupancy.asOf)}
            </div>
          </section>

          <section className="border border-zinc-800 rounded-xl p-4">
            <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-3">Rights chain</h2>
            <RightsChain links={model.rightsChain} />
          </section>
        </div>
      </div>

      <div className="mb-6">
        <BidAskStrip book={model.bidAsk} />
      </div>

      {model.comps.length > 0 && (
        <section className="mb-6">
          <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-3">Nearest comps</h2>
          <p className="text-[11px] text-zinc-600 mb-2">Positions outside this slot&apos;s ±0.4° occupancy window. Not transaction comps.</p>
          <div className="border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950">
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
                  <tr key={c.slug} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/40">
                    <td className="px-4 py-2">
                      <Link href={`/orbital/${c.slug}`} className="text-white text-xs font-mono hover:text-zinc-300">{c.label}</Link>
                    </td>
                    <td className="px-4 py-2 text-zinc-400 text-xs hidden sm:table-cell">{c.operator || "—"}</td>
                    <td className="px-4 py-2 text-zinc-500 text-xs font-mono text-right">{c.deltaDeg.toFixed(1)}°</td>
                    <td className="px-4 py-2 text-zinc-500 text-xs font-mono text-right">{c.satCount}</td>
                    <td className="px-4 py-2 text-zinc-500 text-xs font-mono text-right">{c.congestionScore}</td>
                    <td className="px-4 py-2 text-zinc-300 text-xs font-mono text-right">
                      {c.valuation.nonCommercial ? "n/c" : c.valuation.formatted.point}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="mb-6">
        <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-3">
          Co-located satellites ({model.satellites.length})
        </h2>
        <div className="border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950">
                <th className="text-left px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium">Satellite</th>
                <th className="text-left px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium hidden sm:table-cell">Operator</th>
                <th className="text-left px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium hidden md:table-cell">Purpose</th>
                <th className="text-right px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium">Launched</th>
              </tr>
            </thead>
            <tbody>
              {model.satellites.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-zinc-600 text-xs">No UCS satellite in orbit at this longitude.</td></tr>
              ) : model.satellites.map((sat) => (
                <tr key={sat.id} className="border-b border-zinc-800/50 last:border-0">
                  <td className="px-4 py-3">
                    <div className="text-white text-xs font-mono font-medium">{sat.name}</div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-zinc-400 text-xs">{sat.operator ?? "—"}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-zinc-500 text-xs">{sat.detailedPurpose ?? sat.purpose ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-zinc-500 text-xs font-mono">{parseUcsLaunchYear(sat.launchDate) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {model.fccAuthorizations.length > 0 && (
        <section className="mb-6">
          <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-3">
            FCC / license signals ({model.fccAuthorizations.length})
          </h2>
          <div className="border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950">
                  <th className="text-left px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium">Satellite</th>
                  <th className="text-left px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium hidden sm:table-cell">Licensee</th>
                  <th className="text-left px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium hidden md:table-cell">Service</th>
                  <th className="text-right px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium">Call sign</th>
                </tr>
              </thead>
              <tbody>
                {model.fccAuthorizations.map((auth) => (
                  <tr key={auth.id} className="border-b border-zinc-800/50 last:border-0">
                    <td className="px-4 py-3 text-white text-xs font-mono">{auth.satelliteName ?? "—"}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-zinc-400 text-xs">{auth.licensee ?? "—"}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-zinc-500 text-xs">{auth.service ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-sky-400 text-xs font-mono">{auth.callSign ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <footer className="border-t border-zinc-800/50 pt-5 text-[11px] font-mono text-zinc-600 leading-relaxed space-y-1">
        <p>
          Provenance · UCS satellites {formatAsOfDate(model.provenance.occupancy.asOf)} · FCC SSAL {formatAsOfDate(model.provenance.fcc.asOf)} ·
          valuation {v.modelVersion} {formatAsOfDate(v.asOf)}
          {model.modelRunAsOf ? ` · snapshots seeded ${model.modelRunAsOf} (model path, not trades)` : " · history synthesized (run npm run seed:valuations to persist)"}
        </p>
        <p>Simulated bid/ask is labeled and is not a trade tape. ITU rights are a stub until SNS ingest. Not financial advice.</p>
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
