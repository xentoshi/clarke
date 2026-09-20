import Link from "next/link";
import { statusLabels } from "@/data/orbital-slots";
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

function identityCopy(model: SlotTerminalModel): string {
  const operator = model.operator
    ? `${model.operator} is the registry operator.`
    : "Registry operator is unknown.";
  const sats = `${model.satCount} satellite${model.satCount === 1 ? "" : "s"} on station.`;
  const fcc = model.fccAuthorizations.length > 0
    ? `FCC licensed (${model.fccAuthorizations.length} ${model.fccAuthorizations.length === 1 ? "row" : "rows"}).`
    : "No FCC row.";
  const extra = [model.purpose, model.country].filter(Boolean).join(", ");
  return extra ? `${operator} ${sats} ${fcc} ${extra}.` : `${operator} ${sats} ${fcc}`;
}

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
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between gap-3 mb-8 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/orbital" className="text-muted hover:text-ink">Registry</Link>
          <span className="text-faint">/</span>
          <span className="font-mono text-ink">{model.label}</span>
        </div>
        <div className="flex items-center gap-3">
          <AddToCompare slug={model.slug} />
          <Link href={`/orbital/compare?s=${model.slug}`} className="text-sm text-muted hover:text-ink">
            Compare view
          </Link>
        </div>
      </div>

      <div data-terminal-primary>
      <header className="mb-3" data-terminal-header>
        <p className="text-muted text-sm mb-1">
          {model.region}
          {model.longitude >= 0 ? " · East" : " · West"}
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold text-ink font-mono tracking-tight">{model.label}</h1>
        <p className="text-ink text-lg mt-3 leading-relaxed max-w-3xl">
          {identityCopy(model)}
        </p>
        {model.operatorMix.length > 1 && (
          <p className="text-muted text-sm mt-2 leading-relaxed max-w-3xl">
            Occupancy ±0.4°: {formatOperatorMix(model.operatorMix, model.satCount)}
            {model.occupancyMajority && model.occupancyMajority !== model.operator
              ? `. Window majority is not the registry operator.`
              : "."}
          </p>
        )}
      </header>

      <TrustBar vintage={model.sourceVintage} positionTrust={model.positionTrust} />

      <div className="grid md:grid-cols-3 gap-3 mb-3">
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
      </div>

      <div className="max-w-md mb-8">
        <Metric
          kpi="congestion"
          label="Congestion"
          value={`${model.congestion.score}`}
          sub={`${model.congestion.label} · ${model.congestion.factors.coLocated} co-located`}
          provenance={model.provenance.congestion}
          trust="M"
          tone={congTone(model.congestion.tier)}
        />
      </div>

      <div className="grid lg:grid-cols-12 gap-6 mb-8">
        <div className="lg:col-span-7 space-y-5">
          <section className="border border-line bg-surface p-5">
            <h2 className="text-sm text-muted mb-4">Occupancy</h2>
            <dl className="space-y-2 text-sm">
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
              {model.bands.length > 0 && (
                <Row k="Bands" val={model.bands.join(", ")} />
              )}
            </dl>
            <div className="text-xs font-mono text-faint mt-4">
              {model.provenance.occupancy.source} · {formatAsOfDate(model.provenance.occupancy.asOf)}
            </div>
          </section>
        </div>

        <div className="lg:col-span-5 space-y-5">
          <section className="border border-line bg-surface p-5">
            <h2 className="text-sm text-muted mb-4">Recorded rights (FCC)</h2>
            <RightsChain links={recordedRights} variant="recorded" />
          </section>
        </div>
      </div>

      {model.fccAuthorizations.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm text-muted mb-3">
            FCC / license signals ({model.fccAuthorizations.length})
          </h2>
          <div className="border border-line bg-surface overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-line bg-canvas">
                  <th className="text-left px-4 py-2.5 text-faint text-xs font-medium">Satellite</th>
                  <th className="text-left px-4 py-2.5 text-faint text-xs font-medium hidden sm:table-cell">Licensee</th>
                  <th className="text-left px-4 py-2.5 text-faint text-xs font-medium hidden md:table-cell">Service</th>
                  <th className="text-right px-4 py-2.5 text-faint text-xs font-medium">Call sign</th>
                </tr>
              </thead>
              <tbody>
                {model.fccAuthorizations.map((auth) => (
                  <tr key={auth.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 text-ink text-sm">{auth.satelliteName ?? "—"}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted text-sm">{auth.licensee ?? "—"}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted text-sm">{auth.service ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-ink text-sm font-mono">{auth.callSign ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs font-mono text-faint mt-2">
            {model.provenance.fcc.source} · {formatAsOfDate(model.provenance.fcc.asOf)} · class V
          </p>
        </section>
      )}

      <section className="mb-8">
        <h2 className="text-sm text-muted mb-3">
          Co-located satellites ({model.satellites.length})
        </h2>
        <div className="border border-line bg-surface overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line bg-canvas">
                <th className="text-left px-4 py-2.5 text-faint text-xs font-medium">Satellite</th>
                <th className="text-left px-4 py-2.5 text-faint text-xs font-medium hidden sm:table-cell">Operator</th>
                <th className="text-left px-4 py-2.5 text-faint text-xs font-medium hidden md:table-cell">Purpose</th>
                <th className="text-right px-4 py-2.5 text-faint text-xs font-medium hidden lg:table-cell">UCS lon</th>
                <th className="text-right px-4 py-2.5 text-faint text-xs font-medium hidden lg:table-cell">TLE lon</th>
                <th className="text-right px-4 py-2.5 text-faint text-xs font-medium hidden md:table-cell">Δ</th>
                <th className="text-right px-4 py-2.5 text-faint text-xs font-medium hidden xl:table-cell">TLE epoch</th>
                <th className="text-right px-4 py-2.5 text-faint text-xs font-medium">Launched</th>
              </tr>
            </thead>
            <tbody>
              {model.satellites.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-6 text-muted text-sm">No satellite with a usable occupancy longitude in this ±0.4° window.</td></tr>
              ) : model.satellites.map((sat) => (
                <tr key={sat.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <div className="text-ink text-sm font-medium">
                      {sat.name}
                      {sat.positionDisputed && (
                        <span className="ml-2 text-xs text-stale border border-stale/35 px-1 py-0.5 rounded-sm">disputed</span>
                      )}
                    </div>
                    <div className="text-xs text-faint mt-0.5">
                      {sat.positionSource === "tle" ? "TLE occupancy" : sat.positionSource === "ucs" ? "UCS fallback" : "no position"}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-muted text-sm">{sat.operator ?? "—"}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted text-sm">{sat.detailedPurpose ?? sat.purpose ?? "—"}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-right text-muted text-sm font-mono">
                    {sat.longitudeUcs != null ? formatLonFixed(sat.longitudeUcs, 1) : "—"}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-right text-ink text-sm font-mono">
                    {sat.longitudeTle != null ? formatLonFixed(sat.longitudeTle, 1) : "—"}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-right text-sm font-mono">
                    {sat.positionDeltaDeg == null ? (
                      <span className="text-faint">—</span>
                    ) : (
                      <span className={sat.positionDisputed ? "text-stale" : "text-muted"}>
                        {sat.positionDeltaDeg.toFixed(1)}°
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell text-right text-muted text-sm font-mono">
                    {sat.tleEpoch ?? "—"}
                    {sat.tleAgeDays != null ? ` (${sat.tleAgeDays}d)` : ""}
                  </td>
                  <td className="px-4 py-3 text-right text-muted text-sm font-mono">{parseUcsLaunchYear(sat.launchDate) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8 border border-line bg-surface overflow-hidden" data-fair-value-panel>
        <div className="px-5 py-3 border-b border-line flex items-center justify-between">
          <h2 className="text-sm text-muted">Implied fair value</h2>
          <span className="text-xs text-faint">Labeled model. Not a live market price.</span>
        </div>
        <Metric
          kpi="fair-value"
          label="Fair value (v0)"
          value={v.nonCommercial ? "n/c" : v.formatted.point}
          sub={v.nonCommercial ? "Not commercially valued" : `${v.confidence} · ${v.formatted.range} CI · labeled model`}
          provenance={model.provenance.fairValue}
          trust="M"
          tone={v.nonCommercial ? "amber" : "white"}
        />
        <div className="px-5 py-4 border-t border-line">
          {v.nonCommercial ? (
            <p className="text-stale text-sm mb-3">{v.nonCommercialReason}. Raw model range {v.formatted.range} is shown for inspection only.</p>
          ) : null}
          {v.curatedEstimate && (
            <p className="text-sm text-muted mb-3 leading-relaxed" data-curated-overlay="hand-estimate">
              <TrustMark cls="M" className="mr-1 align-middle" />
              Hand estimate / curated opinion: {v.curatedEstimate}. Secondary to the model range.
              Not a competing headline, not a trade, not the fair-value figure.
            </p>
          )}
          <p className="text-sm text-faint leading-relaxed">
            No trade tape. Seeded model-path sparklines are Experimental, not default Terminal.
          </p>
        </div>
        <ProGate entitled={entitlements.features.valuationBreakdown} title="Driver breakdown is Pro">
          <table className="w-full">
            <tbody>
              {v.factors.map((f) => (
                <tr key={f.label} className="border-t border-line">
                  <td className="px-5 py-2 text-ink text-sm font-medium w-40">{f.label}</td>
                  <td className="px-2 py-2 text-muted text-sm">{f.detail}</td>
                  <td className="px-5 py-2 text-right">
                    <span className={`text-sm font-mono ${f.multiplier > 1 ? "text-verified" : f.multiplier < 1 ? "text-stale" : "text-faint"}`}>
                      ×{f.multiplier.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ProGate>
        <p className="px-5 py-3 text-sm text-faint leading-relaxed border-t border-line">
          {v.disclaimer}{" "}
          <Link href="/docs" className="text-ink hover:text-muted underline">Methodology</Link>
          {" · "}
          <Link href="/docs/valuation" className="text-ink hover:text-muted underline">Valuation v0</Link>
          {" · "}
          <Link href="/docs/data-trust" className="text-ink hover:text-muted underline">Data trust</Link>
        </p>
      </section>

      {model.comps.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm text-muted mb-2">Nearest comps</h2>
          <p className="text-sm text-faint mb-3">Positions outside this slot&apos;s ±0.4° occupancy window. Not transaction comps.</p>
          <div className="border border-line bg-surface overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-line bg-canvas">
                  <th className="text-left px-4 py-2 text-xs text-faint font-medium">Slot</th>
                  <th className="text-left px-4 py-2 text-xs text-faint font-medium hidden sm:table-cell">Operator</th>
                  <th className="text-right px-4 py-2 text-xs text-faint font-medium">Δ</th>
                  <th className="text-right px-4 py-2 text-xs text-faint font-medium">Sats</th>
                  <th className="text-right px-4 py-2 text-xs text-faint font-medium">Cong.</th>
                  <th className="text-right px-4 py-2 text-xs text-faint font-medium">Fair value</th>
                </tr>
              </thead>
              <tbody>
                {model.comps.map((c) => (
                  <tr key={c.slug} className="border-b border-line last:border-0 hover:bg-canvas">
                    <td className="px-4 py-2">
                      <Link href={`/orbital/${c.slug}`} className="text-ink text-sm font-mono hover:text-muted">{c.label}</Link>
                    </td>
                    <td className="px-4 py-2 text-muted text-sm hidden sm:table-cell">{c.operator || "—"}</td>
                    <td className="px-4 py-2 text-muted text-sm font-mono text-right">{c.deltaDeg.toFixed(1)}°</td>
                    <td className="px-4 py-2 text-muted text-sm font-mono text-right">{c.satCount}</td>
                    <td className="px-4 py-2 text-muted text-sm font-mono text-right">{c.congestionScore}</td>
                    <td className="px-4 py-2 text-faint text-sm font-mono text-right">
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

      <div className="space-y-3 mb-8">
        <ExperimentalDisclosure id="model-backfill" title="Seeded v0 model path (not trades)">
          <p className="text-xs text-stale mb-2">
            Model backfill. Not observed trades, not a price index.
          </p>
          <ValuationChart series={entitlements.features.history ? model.history : model.history.slice(-7)} source={model.historySource} />
          {!entitlements.features.history && (
            <p className="text-sm text-faint mt-2">
              Free seats see a 7-day backfill. <Link href="/pricing" className="text-ink hover:text-muted underline">Pro unlocks 30-day persisted model path.</Link>
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

      <footer className="border-t border-line pt-5 text-sm text-faint leading-relaxed space-y-1">
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
      <dt className="text-faint shrink-0">{k}</dt>
      <dd className="text-ink text-right">{val}</dd>
    </div>
  );
}
