import { notFound } from "next/navigation";
import Link from "next/link";
import { buildMeta } from "@/lib/metadata";
import {
  getSatellitesBySlug,
  getAllRegistrySlugs,
  getNearbySlots,
  getCongestion,
  getFccAuthorizationsByLongitude,
} from "@/lib/satellites";
import { slugToLon, lonToSlug } from "@/lib/slot-utils";
import { slots as curatedSlots, statusColors, statusLabels, bandColors, type OrbitalSlot } from "@/data/orbital-slots";
import { valuateSlot } from "@/lib/valuation";
import type { GeoSatellite } from "@/lib/satellites";

type Params = { slot: string };

function formatLon(lon: number) {
  return lon >= 0 ? `${lon}°E` : `${Math.abs(lon)}°W`;
}

function primaryOperator(sats: GeoSatellite[]): string {
  const counts: Record<string, number> = {};
  for (const s of sats) if (s.operator) counts[s.operator] = (counts[s.operator] ?? 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

// UCS "users" classification tied to the same primary operator picked above,
// so the valuation's ownership flag stays consistent with the operator shown.
function primaryUsers(sats: GeoSatellite[], operator: string): string | undefined {
  return sats.find((s) => s.operator === operator && s.users)?.users ?? undefined;
}

function parseYear(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const parts = dateStr.split("/");
  const year = parseInt(parts[parts.length - 1]);
  return isNaN(year) ? null : year;
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slot } = await params;
  const lon = slugToLon(slot);
  if (lon === null) return {};
  const sats = getSatellitesBySlug(slot);
  const fccAuths = getFccAuthorizationsByLongitude(lon);
  if (sats.length === 0 && fccAuths.length === 0) return {};
  const label = formatLon(lon);
  const operator = primaryOperator(sats) || fccAuths[0]?.licensee || "";
  const description = sats.length > 0
    ? `${sats.length} satellite${sats.length !== 1 ? "s" : ""} at ${label}. Primary operator: ${operator}. GEO orbital slot registry.`
    : `FCC-authorized position at ${label} with no satellite in orbit yet. Licensee: ${operator}. GEO orbital slot registry.`;
  return buildMeta({
    title: `${label} · Orbital Position`,
    description,
    tag: "Registry",
  });
}

export async function generateStaticParams() {
  return getAllRegistrySlugs(curatedSlots).map((slot) => ({ slot }));
}

export default async function SlotPage({ params }: { params: Promise<Params> }) {
  const { slot } = await params;
  const lon = slugToLon(slot);
  if (lon === null) notFound();

  const sats = getSatellitesBySlug(slot);
  const fccAuths = getFccAuthorizationsByLongitude(lon);
  const curated = curatedSlots.find(
    (s) => Math.abs(s.longitude - lon) <= 0.4 && lonToSlug(s.longitude) === slot
  ) ?? curatedSlots.find((s) => Math.abs(s.longitude - lon) <= 0.4);

  // A position can be real with zero UCS satellites — an FCC filing with no
  // satellite in orbit yet. Only 404 if none of the three sources have
  // anything at this longitude.
  if (sats.length === 0 && fccAuths.length === 0 && !curated) notFound();

  const label = formatLon(lon);
  const operator = primaryOperator(sats) || fccAuths[0]?.licensee || "";
  const nearby = getNearbySlots(lon, 4);

  const congestion = getCongestion(lon);

  // Build a slot record for valuation: prefer the curated record, otherwise
  // synthesize one from the live UCS/FCC data at this longitude.
  const valuationSlot: OrbitalSlot = curated ?? {
    id: slot,
    longitude: lon,
    label,
    operator,
    country: sats[0]?.ownerCountry ?? fccAuths[0]?.administration ?? "",
    bands: [],
    status: sats.length > 0 ? "active" : "filed",
    coverage: [],
    valueEstimate: "",
    description: "",
    source: sats.length > 0 ? "ucs" : "fcc",
    users: primaryUsers(sats, operator),
  };
  const valuation = valuateSlot(valuationSlot, congestion);
  const confidenceColor =
    valuation.confidence === "high" ? "text-emerald-400 border-emerald-800/60 bg-emerald-950/30" :
    valuation.confidence === "medium" ? "text-amber-400 border-amber-800/60 bg-amber-950/30" :
    "text-zinc-400 border-zinc-700 bg-zinc-900/40";

  const launchYears = sats
    .map((s) => parseYear(s.launchDate))
    .filter((y): y is number => y !== null)
    .sort((a, b) => a - b);
  const firstLaunch = launchYears[0] ?? null;
  const lastLaunch = launchYears[launchYears.length - 1] ?? null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">

      {/* Breadcrumb */}
      <div className="mb-10">
        <Link href="/orbital" className="text-white/30 text-xs font-mono hover:text-white/60 transition-colors">
          ← Orbital Registry
        </Link>
      </div>

      {/* Header */}
      <div className="mb-10">
        <p className="text-zinc-600 text-xs font-mono mb-3">{`// GEO · ${lon >= 0 ? "EAST" : "WEST"}`}</p>
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white font-mono mb-2">{label}</h1>
            <p className="text-zinc-400 text-sm">{operator}</p>
          </div>
          {curated?.valueEstimate ? (
            <div className="text-right">
              <div className="text-white font-bold font-mono text-2xl">{curated.valueEstimate}</div>
              <div className="text-zinc-600 text-xs mt-0.5">curated estimate</div>
            </div>
          ) : valuation.nonCommercial ? (
            <div className="text-right max-w-[220px]">
              <div className="text-amber-300/90 font-bold text-sm">Not commercially valued</div>
              <div className="text-zinc-600 text-[10px] mt-0.5">government / military asset</div>
            </div>
          ) : (
            <div className="text-right">
              <div className="text-white font-bold font-mono text-2xl">{valuation.formatted.range}</div>
              <div className="text-zinc-600 text-xs mt-0.5">modeled value range</div>
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.04] rounded-xl overflow-hidden mb-10">
        <div className="bg-zinc-950 px-5 py-5">
          <div className="text-white font-bold font-mono text-lg mb-1">{sats.length}</div>
          <div className="text-white/25 text-[10px] font-mono tracking-widest uppercase">Satellites</div>
        </div>
        <div className="bg-zinc-950 px-5 py-5">
          <div className="text-white font-bold font-mono text-lg mb-1">{firstLaunch ?? "—"}</div>
          <div className="text-white/25 text-[10px] font-mono tracking-widest uppercase">First launch</div>
        </div>
        <div className="bg-zinc-950 px-5 py-5">
          <div className="text-white font-bold font-mono text-lg mb-1">{lastLaunch ?? "—"}</div>
          <div className="text-white/25 text-[10px] font-mono tracking-widest uppercase">Latest launch</div>
        </div>
        <div className="bg-zinc-950 px-5 py-5">
          <div className={`font-bold font-mono text-lg mb-1 ${
            congestion.tier === "critical" ? "text-red-400" :
            congestion.tier === "high" ? "text-orange-400" :
            congestion.tier === "moderate" ? "text-amber-400" :
            congestion.tier === "low" ? "text-blue-400" : "text-zinc-500"
          }`}>{congestion.label} <span className="text-white/30 text-sm">{congestion.score}</span></div>
          <div className="text-white/25 text-[10px] font-mono tracking-widest uppercase">Congestion</div>
        </div>
      </div>

      {/* Implied valuation */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Implied valuation</h2>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${confidenceColor}`}>
            {valuation.confidence} confidence
          </span>
        </div>
        <div className="border border-zinc-800 rounded-xl overflow-hidden">
          {valuation.nonCommercial ? (
            <div className="bg-amber-950/20 px-5 py-4 border-b border-amber-900/40">
              <div className="text-amber-300/90 text-sm font-semibold mb-1">Not commercially valued</div>
              <div className="text-amber-200/60 text-xs leading-relaxed">
                {valuation.nonCommercialReason} — this is not a leasable commercial position. The modeled range
                below (<span className="font-mono">{valuation.formatted.range}</span>) is the pricing model&apos;s raw
                output for reference only; it is not a meaningful market estimate for this satellite.
              </div>
            </div>
          ) : (
            <div className="bg-zinc-950 px-5 py-5 flex items-baseline justify-between gap-4 border-b border-zinc-800/60">
              <div>
                <div className="text-white font-bold font-mono text-2xl">{valuation.formatted.range}</div>
                <div className="text-zinc-600 text-xs mt-0.5">
                  modeled range · midpoint {valuation.formatted.point}
                  {valuation.basis === "curated" && <span className="text-zinc-500"> · curated estimate {valuation.curatedEstimate}</span>}
                </div>
              </div>
            </div>
          )}
          <table className="w-full">
            <tbody>
              {valuation.factors.map((f) => (
                <tr key={f.label} className="border-b border-zinc-800/40 last:border-b-0">
                  <td className="px-5 py-2.5 text-zinc-300 text-xs font-medium w-36">{f.label}</td>
                  <td className="px-2 py-2.5 text-zinc-500 text-xs">{f.detail}</td>
                  <td className="px-5 py-2.5 text-right">
                    <span className={`text-xs font-mono ${f.multiplier > 1 ? "text-emerald-400" : f.multiplier < 1 ? "text-orange-400" : "text-zinc-500"}`}>
                      ×{f.multiplier.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-zinc-700 text-[11px] font-mono mt-2 leading-relaxed">
          Heuristic estimate from public data, not a market quote. A baseline is multiplied by arc desirability, occupancy, operator tier, spectrum, and arc scarcity. See the methodology in <Link href="/about#registry-methodology" className="text-zinc-500 hover:text-zinc-400 underline">docs</Link>.
        </p>
      </div>

      {/* Curated enrichment */}
      {curated && (
        <div className="mb-10 space-y-4">
          {curated.description && (
            <p className="text-zinc-300 text-sm leading-relaxed">{curated.description}</p>
          )}
          <div className="flex flex-wrap gap-3">
            {curated.status && (
              <span className={`text-xs px-2.5 py-1 rounded border font-mono ${statusColors[curated.status]}`}>
                {statusLabels[curated.status]}
              </span>
            )}
            {curated.bands.map((b) => (
              <span key={b} className={`text-xs px-2.5 py-1 rounded border font-mono ${bandColors[b]}`}>
                {b}-band
              </span>
            ))}
            {curated.coverage.map((c) => (
              <span key={c} className="text-xs px-2.5 py-1 rounded border border-zinc-700 text-zinc-400">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Satellites table */}
      <div className="mb-12">
        <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">
          Co-located satellites ({sats.length})
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
              {sats.map((sat) => {
                const year = parseYear(sat.launchDate);
                return (
                  <tr key={sat.id} className="border-b border-zinc-800/50 last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="text-white text-xs font-mono font-medium leading-tight">{sat.name}</div>
                      {sat.officialName && sat.officialName !== sat.name && (
                        <div className="text-zinc-600 text-[10px] mt-0.5 truncate max-w-[180px]">{sat.officialName}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-zinc-400 text-xs">{sat.operator ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-zinc-500 text-xs">{sat.detailedPurpose ?? sat.purpose ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-zinc-500 text-xs font-mono">{year ?? "—"}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FCC Authorizations */}
      {fccAuths.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">
            FCC Authorizations ({fccAuths.length})
          </h2>
          <div className="border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950">
                  <th className="text-left px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium">Satellite</th>
                  <th className="text-left px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium hidden sm:table-cell">Licensee</th>
                  <th className="text-left px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium hidden md:table-cell">Service</th>
                  <th className="text-left px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium hidden lg:table-cell">Administration</th>
                  <th className="text-right px-4 py-2.5 text-zinc-600 text-[10px] uppercase tracking-wider font-medium">Call Sign</th>
                </tr>
              </thead>
              <tbody>
                {fccAuths.map((auth) => (
                  <tr key={auth.id} className="border-b border-zinc-800/50 last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="text-white text-xs font-mono font-medium">{auth.satelliteName ?? "—"}</div>
                      {auth.frequencyRange && (
                        <div className="text-zinc-600 text-[10px] mt-0.5 font-mono leading-relaxed">
                          {auth.frequencyRange.split(/\r?\n/).slice(0, 3).join(" · ")}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-zinc-400 text-xs">{auth.licensee ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-zinc-500 text-xs">{auth.service ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-zinc-500 text-xs">{auth.administration ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sky-400 text-xs font-mono">{auth.callSign ?? "—"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {fccAuths.some(a => a.notes) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {fccAuths.filter(a => a.notes).map(a => (
                <span key={a.id} className="text-[10px] text-zinc-600 font-mono">{a.callSign}: {a.notes}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nearby positions */}
      {nearby.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">Nearby positions</h2>
          <div className="space-y-px bg-white/[0.03] rounded-xl overflow-hidden">
            {nearby.map((n) => (
              <Link key={n.slug} href={`/orbital/${n.slug}`}
                className="group flex items-center justify-between bg-zinc-950 px-5 py-3 hover:bg-zinc-900/60 transition-colors">
                <span className="text-white text-sm font-mono group-hover:text-white/70 transition-colors">{n.label}</span>
                <span className="text-white/20 text-xs font-mono">
                  {Math.abs(n.lon - lon).toFixed(1)}° away →
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Data source */}
      <div className="border-t border-zinc-800/50 pt-6">
        <p className="text-zinc-700 text-xs font-mono">
          Satellite names, operators, and positions from UCS Satellite Database (May 2023). FCC authorization data from the FCC Approved Space Station List. Satellite identifiers (NORAD/COSPAR) omitted; UCS identifier accuracy has not been independently verified. Curated descriptions and valuations from Clarke.
        </p>
      </div>

    </div>
  );
}
