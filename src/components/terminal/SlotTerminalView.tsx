import Link from "next/link";
import { statusLabels } from "@/data/orbital-slots";
import type { SlotTerminalModel } from "@/lib/slot-terminal";
import type { Entitlements } from "@/lib/auth";
import { formatAsOfDate } from "@/lib/provenance";
import { parseUcsLaunchYear } from "@/lib/occupancy-quality";
import { formatOperatorMix } from "@/lib/operator-mix";
import { formatLonFixed } from "@/lib/geo-angle";
import { recordedRightsLayers, stubRightsLayers } from "@/lib/terminal-default";
import { ProGate } from "./ProGate";
import { ValuationChart } from "./ValuationChart";
import { BidAskStrip } from "./BidAskStrip";
import { RightsChain } from "./RightsChain";
import { AddToCompare } from "./AddToCompare";
import { CompareTray } from "./CompareTray";
import { ExperimentalDisclosure } from "./ExperimentalDisclosure";
import { TrustMark } from "./TrustMark";
import { TrustBar } from "./TrustBar";

function identityCopy(model: SlotTerminalModel): string {
  const operator = model.operator
    ? `${model.operator} is the registry operator`
    : "The registry operator is unknown";
  const sats = `${model.satCount} satellite${model.satCount === 1 ? "" : "s"} on station`;
  const fcc = model.fccAuthorizations.length > 0
    ? `an FCC license (${model.fccAuthorizations.length} ${model.fccAuthorizations.length === 1 ? "row" : "rows"})`
    : "no FCC row";
  const extra = [model.purpose, model.country].filter(Boolean).join(", ");
  const tail = extra ? `, ${extra}` : "";
  return `${operator}, with ${sats} and ${fcc}${tail}.`;
}

function biuCopy(hint: string): string {
  return hint.replace(/_/g, " ");
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
    <div className="max-w-[920px] mx-auto px-4 sm:px-6 py-14">
      <div className="flex items-center justify-between gap-3 mb-12 flex-wrap">
        <div className="flex items-center gap-2 text-[14px]">
          <Link href="/orbital" className="text-muted hover:text-ink">Registry</Link>
          <span className="text-faint">/</span>
          <span className="font-mono text-ink">{model.label}</span>
        </div>
        <div className="flex items-center gap-4">
          <AddToCompare slug={model.slug} />
          <Link href={`/orbital/compare?s=${model.slug}`} className="text-[14px] text-muted hover:text-ink">
            Compare view
          </Link>
        </div>
      </div>

      <div data-terminal-primary>
      <header className="mb-6" data-terminal-header>
        <p className="text-muted text-[14px] mb-3">
          {model.region}
          {model.longitude >= 0 ? " · East" : " · West"}
        </p>
        <h1 className="text-5xl sm:text-6xl font-semibold text-ink font-mono tracking-tight">{model.label}</h1>
        <p className="text-ink text-xl mt-6 leading-relaxed max-w-2xl">
          {identityCopy(model)}
        </p>
        {model.operatorMix.length > 1 && (
          <p className="text-muted text-[15px] mt-3 leading-relaxed max-w-2xl">
            Occupancy ±0.4°: {formatOperatorMix(model.operatorMix, model.satCount)}
            {model.occupancyMajority && model.occupancyMajority !== model.operator
              ? `. Window majority is not the registry operator.`
              : "."}
          </p>
        )}
      </header>

      <TrustBar vintage={model.sourceVintage} positionTrust={model.positionTrust} />

      <section className="mt-16 pt-10 border-t border-line">
        <h2 className="text-2xl font-semibold text-ink tracking-tight mb-8">Occupancy</h2>
        <div data-kpi="occupancy" className="mb-8">
          <div className="text-[13px] text-faint mb-1">On station</div>
          <div className="text-2xl font-medium text-ink tracking-tight tabular-nums">
            {model.satCount} satellite{model.satCount === 1 ? "" : "s"}
          </div>
          <p className="text-[15px] text-muted mt-2 leading-relaxed max-w-xl">
            {model.operatorMix.length > 1
              ? `±0.4° TLE-primary. Majority ${model.occupancyMajority || "unknown"} (${model.operatorMix[0]?.count ?? 0}/${model.satCount}).`
              : `${statusLabels[model.status]}. ${model.operator || "Unknown operator"}.`}
          </p>
          <div className="text-xs font-mono text-faint mt-3">
            {model.provenance.occupancy.source} · {formatAsOfDate(model.provenance.occupancy.asOf)}
          </div>
        </div>

        <dl className="grid sm:grid-cols-2 gap-x-10 gap-y-4 text-[15px] max-w-2xl">
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

        <h3 className="text-lg font-medium text-ink mt-12 mb-4">
          Co-located satellites ({model.satellites.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left py-3 pr-4 text-faint text-[13px] font-medium">Satellite</th>
                <th className="text-left py-3 pr-4 text-faint text-[13px] font-medium hidden sm:table-cell">Operator</th>
                <th className="text-left py-3 pr-4 text-faint text-[13px] font-medium hidden md:table-cell">Purpose</th>
                <th className="text-right py-3 pl-4 text-faint text-[13px] font-medium hidden lg:table-cell">UCS lon</th>
                <th className="text-right py-3 pl-4 text-faint text-[13px] font-medium hidden lg:table-cell">TLE lon</th>
                <th className="text-right py-3 pl-4 text-faint text-[13px] font-medium hidden md:table-cell">Δ</th>
                <th className="text-right py-3 pl-4 text-faint text-[13px] font-medium hidden xl:table-cell">TLE epoch</th>
                <th className="text-right py-3 pl-4 text-faint text-[13px] font-medium">Launched</th>
              </tr>
            </thead>
            <tbody>
              {model.satellites.length === 0 ? (
                <tr><td colSpan={8} className="py-6 text-muted text-[15px]">No satellite with a usable occupancy longitude in this ±0.4° window.</td></tr>
              ) : model.satellites.map((sat) => (
                <tr key={sat.id} className="border-b border-line last:border-0">
                  <td className="py-3.5 pr-4">
                    <div className="text-ink text-[15px]">
                      {sat.name}
                      {sat.positionDisputed && (
                        <span className="ml-2 text-[12px] text-stale">Dispute</span>
                      )}
                    </div>
                    <div className="text-[12px] text-faint mt-0.5">
                      {sat.positionSource === "tle" ? "TLE occupancy" : sat.positionSource === "ucs" ? "UCS fallback" : "no position"}
                    </div>
                  </td>
                  <td className="py-3.5 pr-4 hidden sm:table-cell text-muted text-[14px]">{sat.operator ?? "—"}</td>
                  <td className="py-3.5 pr-4 hidden md:table-cell text-muted text-[14px]">{sat.detailedPurpose ?? sat.purpose ?? "—"}</td>
                  <td className="py-3.5 pl-4 hidden lg:table-cell text-right text-muted text-[14px] font-mono">
                    {sat.longitudeUcs != null ? formatLonFixed(sat.longitudeUcs, 1) : "—"}
                  </td>
                  <td className="py-3.5 pl-4 hidden lg:table-cell text-right text-ink text-[14px] font-mono">
                    {sat.longitudeTle != null ? formatLonFixed(sat.longitudeTle, 1) : "—"}
                  </td>
                  <td className="py-3.5 pl-4 hidden md:table-cell text-right text-[14px] tabular-nums">
                    {sat.positionDeltaDeg == null ? (
                      <span className="text-faint">—</span>
                    ) : (
                      <span className={sat.positionDisputed ? "text-stale" : "text-muted"}>
                        {sat.positionDeltaDeg.toFixed(1)}°
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 pl-4 hidden xl:table-cell text-right text-muted text-[14px] font-mono">
                    {sat.tleEpoch ?? "—"}
                    {sat.tleAgeDays != null ? ` (${sat.tleAgeDays}d)` : ""}
                  </td>
                  <td className="py-3.5 pl-4 text-right text-muted text-[14px] tabular-nums">{parseUcsLaunchYear(sat.launchDate) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-16 pt-10 border-t border-line">
        <h2 className="text-2xl font-semibold text-ink tracking-tight mb-8">Rights</h2>
        <div data-kpi="rights" className="mb-8">
          <div className="text-[13px] text-faint mb-1">License / FCC</div>
          <div className={`text-2xl font-medium tracking-tight ${v.license.biuHint === "paper_filing" ? "text-stale" : v.license.biuHint === "brought_into_use" ? "text-verified" : "text-ink"}`}>
            {biuCopy(v.license.biuHint)}
          </div>
          <p className="text-[15px] text-muted mt-2">
            {model.fccAuthorizations.length ? `${model.fccAuthorizations.length} FCC rows` : "No FCC row"}
          </p>
          <div className="text-xs font-mono text-faint mt-3">
            {model.provenance.license.source} · {formatAsOfDate(model.provenance.license.asOf)}
          </div>
        </div>

        <div className="mb-10">
          <h3 className="text-lg font-medium text-ink mb-4">Recorded rights (FCC)</h3>
          <RightsChain links={recordedRights} variant="recorded" />
        </div>

        {model.fccAuthorizations.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-ink mb-4">
              FCC / license signals ({model.fccAuthorizations.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-line">
                    <th className="text-left py-3 pr-4 text-faint text-[13px] font-medium">Satellite</th>
                    <th className="text-left py-3 pr-4 text-faint text-[13px] font-medium hidden sm:table-cell">Licensee</th>
                    <th className="text-left py-3 pr-4 text-faint text-[13px] font-medium hidden md:table-cell">Service</th>
                    <th className="text-right py-3 pl-4 text-faint text-[13px] font-medium">Call sign</th>
                  </tr>
                </thead>
                <tbody>
                  {model.fccAuthorizations.map((auth) => (
                    <tr key={auth.id} className="border-b border-line last:border-0">
                      <td className="py-3.5 pr-4 text-ink text-[15px]">{auth.satelliteName ?? "—"}</td>
                      <td className="py-3.5 pr-4 hidden sm:table-cell text-muted text-[14px]">{auth.licensee ?? "—"}</td>
                      <td className="py-3.5 pr-4 hidden md:table-cell text-muted text-[14px]">{auth.service ?? "—"}</td>
                      <td className="py-3.5 pl-4 text-right text-ink text-[14px]">{auth.callSign ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs font-mono text-faint mt-3">
              {model.provenance.fcc.source} · {formatAsOfDate(model.provenance.fcc.asOf)} · class V
            </p>
          </div>
        )}
      </section>

      <section className="mt-16 pt-10 border-t border-line">
        <h2 className="text-2xl font-semibold text-ink tracking-tight mb-8">Freshness</h2>
        <div data-kpi="freshness">
          <div className="text-[13px] text-faint mb-1">TLE epoch</div>
          <div className={`font-mono text-2xl font-medium tracking-tight ${model.sourceVintage.fccStale ? "text-ink" : "text-ink"}`}>
            {model.sourceVintage.tleEpochMax ?? "—"}
          </div>
          <p className="text-[15px] text-muted mt-2 leading-relaxed max-w-xl">
            {model.sourceVintage.fccStale
              ? `FCC SSAL ${model.sourceVintage.fccAsOf ?? "—"} is stale. UCS vintage ${model.sourceVintage.ucsFileVintage ?? "—"}.`
              : `FCC ${model.sourceVintage.fccAsOf ?? "—"} · UCS ${model.sourceVintage.ucsFileVintage ?? "—"}.`}
          </p>
          <div className="text-xs font-mono text-faint mt-3">
            {model.provenance.fcc.source} · {formatAsOfDate(model.provenance.fcc.asOf)}
          </div>
        </div>
      </section>

      <div data-kpi="congestion" className="mt-10 text-[15px] text-muted leading-relaxed">
        Congestion {model.congestion.score}
        {" · "}
        {model.congestion.label}
        {" · "}
        {model.congestion.factors.coLocated} co-located
        <div className="text-xs font-mono text-faint mt-2">
          {model.provenance.congestion.source} · {formatAsOfDate(model.provenance.congestion.asOf)}
        </div>
      </div>

      <section className="mt-20 pt-10 border-t border-line opacity-90" data-fair-value-panel>
        <p className="text-[13px] text-faint mb-2">Labeled model. Not a live market price.</p>
        <h2 className="text-lg font-medium text-muted mb-6">Implied fair value</h2>
        <div data-kpi="fair-value">
          <div className="text-[13px] text-faint mb-1">Fair value (v0)</div>
          <div className={`text-xl font-medium tabular-nums tracking-tight ${v.nonCommercial ? "text-stale" : "text-muted"}`}>
            {v.nonCommercial ? "n/c" : v.formatted.point}
          </div>
          <p className="text-[14px] text-faint mt-2">
            {v.nonCommercial ? "Not commercially valued" : `${v.confidence} · ${v.formatted.range} CI · labeled model`}
          </p>
          <div className="text-xs font-mono text-faint mt-2">
            {model.provenance.fairValue.source} · {formatAsOfDate(model.provenance.fairValue.asOf)}
          </div>
        </div>
        <div className="mt-6">
          {v.nonCommercial ? (
            <p className="text-stale text-[14px] mb-3">{v.nonCommercialReason}. Raw model range {v.formatted.range} is shown for inspection only.</p>
          ) : null}
          {v.curatedEstimate && (
            <p className="text-[14px] text-muted mb-3 leading-relaxed" data-curated-overlay="hand-estimate">
              <TrustMark cls="M" className="mr-1 align-middle" />
              Hand estimate / curated opinion: {v.curatedEstimate}. Secondary to the model range.
              Not a competing headline, not a trade, not the fair-value figure.
            </p>
          )}
          <p className="text-[14px] text-faint leading-relaxed">
            No trade tape. Seeded model-path sparklines are Experimental, not default Terminal.
          </p>
        </div>
        <div className="mt-6">
          <ProGate entitled={entitlements.features.valuationBreakdown} title="Driver breakdown is Pro">
            <table className="w-full">
              <tbody>
                {v.factors.map((f) => (
                  <tr key={f.label} className="border-t border-line">
                    <td className="py-2.5 pr-4 text-ink text-[14px] font-medium w-40">{f.label}</td>
                    <td className="py-2.5 text-muted text-[14px]">{f.detail}</td>
                    <td className="py-2.5 pl-4 text-right">
                      <span className={`text-[14px] tabular-nums ${f.multiplier > 1 ? "text-verified" : f.multiplier < 1 ? "text-stale" : "text-faint"}`}>
                        ×{f.multiplier.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ProGate>
        </div>
        <p className="mt-6 text-[14px] text-faint leading-relaxed">
          {v.disclaimer}{" "}
          <Link href="/docs" className="text-ink hover:text-muted underline">Methodology</Link>
          {" · "}
          <Link href="/docs/valuation" className="text-ink hover:text-muted underline">Valuation v0</Link>
          {" · "}
          <Link href="/docs/data-trust" className="text-ink hover:text-muted underline">Data trust</Link>
        </p>
      </section>

      {model.comps.length > 0 && (
        <section className="mt-16 pt-10 border-t border-line">
          <h2 className="text-lg font-medium text-muted mb-2">Nearest comps</h2>
          <p className="text-[14px] text-faint mb-5">Positions outside this slot&apos;s ±0.4° occupancy window. Not transaction comps.</p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-line">
                  <th className="text-left py-2.5 pr-4 text-[13px] text-faint font-medium">Slot</th>
                  <th className="text-left py-2.5 pr-4 text-[13px] text-faint font-medium hidden sm:table-cell">Operator</th>
                  <th className="text-right py-2.5 pl-4 text-[13px] text-faint font-medium">Δ</th>
                  <th className="text-right py-2.5 pl-4 text-[13px] text-faint font-medium">Sats</th>
                  <th className="text-right py-2.5 pl-4 text-[13px] text-faint font-medium">Cong.</th>
                  <th className="text-right py-2.5 pl-4 text-[13px] text-faint font-medium">Fair value</th>
                </tr>
              </thead>
              <tbody>
                {model.comps.map((c) => (
                  <tr key={c.slug} className="border-b border-line last:border-0">
                    <td className="py-2.5 pr-4">
                      <Link href={`/orbital/${c.slug}`} className="text-ink text-[14px] font-mono hover:text-muted">{c.label}</Link>
                    </td>
                    <td className="py-2.5 pr-4 text-muted text-[14px] hidden sm:table-cell">{c.operator || "—"}</td>
                    <td className="py-2.5 pl-4 text-muted text-[14px] tabular-nums text-right">{c.deltaDeg.toFixed(1)}°</td>
                    <td className="py-2.5 pl-4 text-muted text-[14px] tabular-nums text-right">{c.satCount}</td>
                    <td className="py-2.5 pl-4 text-muted text-[14px] tabular-nums text-right">{c.congestionScore}</td>
                    <td className="py-2.5 pl-4 text-faint text-[14px] tabular-nums text-right">
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

      <div className="space-y-3 mt-16 mb-10">
        <ExperimentalDisclosure id="model-backfill" title="Seeded v0 model path (not trades)">
          <p className="text-xs text-stale mb-2">
            Model backfill. Not observed trades, not a price index.
          </p>
          <ValuationChart series={entitlements.features.history ? model.history : model.history.slice(-7)} source={model.historySource} />
          {!entitlements.features.history && (
            <p className="text-[14px] text-faint mt-2">
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

      <footer className="border-t border-line pt-6 text-[13px] text-faint leading-relaxed space-y-1">
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
    <div className="flex flex-col gap-0.5">
      <dt className="text-faint text-[13px]">{k}</dt>
      <dd className="text-ink">{val}</dd>
    </div>
  );
}
