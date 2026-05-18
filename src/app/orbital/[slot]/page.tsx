import { notFound } from "next/navigation";
import Link from "next/link";
import { buildMeta } from "@/lib/metadata";
import {
  getSatellitesBySlug,
  getAllGeoSlugs,
  getNearbySlots,
  getCongestion,
  getFccAuthorizationsByLongitude,
} from "@/lib/satellites";
import { slugToLon, lonToSlug } from "@/lib/slot-utils";
import { operatorToSlug } from "@/lib/operator-map";
import { slots as curatedSlots, statusColors, statusLabels, bandColors } from "@/data/orbital-slots";
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
  if (sats.length === 0) return {};
  const label = formatLon(lon);
  const operator = primaryOperator(sats);
  return buildMeta({
    title: `${label} · Orbital Position`,
    description: `${sats.length} satellite${sats.length !== 1 ? "s" : ""} at ${label}. Primary operator: ${operator}. GEO orbital slot registry.`,
    tag: "Registry",
  });
}

export async function generateStaticParams() {
  return getAllGeoSlugs().map((slot) => ({ slot }));
}

export default async function SlotPage({ params }: { params: Promise<Params> }) {
  const { slot } = await params;
  const lon = slugToLon(slot);
  if (lon === null) notFound();

  const sats = getSatellitesBySlug(slot);
  if (sats.length === 0) notFound();

  const label = formatLon(lon);
  const operator = primaryOperator(sats);
  const nearby = getNearbySlots(lon, 4);

  const curated = curatedSlots.find(
    (s) => Math.abs(s.longitude - lon) <= 0.4 && lonToSlug(s.longitude) === slot
  ) ?? curatedSlots.find((s) => Math.abs(s.longitude - lon) <= 0.4);

  const congestion = getCongestion(lon);
  const fccAuths = getFccAuthorizationsByLongitude(lon);

  const purposes = [...new Set(sats.map((s) => s.purpose).filter(Boolean))];
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
        <p className="text-zinc-600 text-xs font-mono mb-3">// GEO · {lon >= 0 ? "EAST" : "WEST"}</p>
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white font-mono mb-2">{label}</h1>
            <p className="text-zinc-400 text-sm">{operator}</p>
          </div>
          {curated?.valueEstimate && (
            <div className="text-right">
              <div className="text-white font-bold font-mono text-2xl">{curated.valueEstimate}</div>
              <div className="text-zinc-600 text-xs mt-0.5">estimated value</div>
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
          }`}>{congestion.label}</div>
          <div className="text-white/25 text-[10px] font-mono tracking-widest uppercase">Congestion</div>
        </div>
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
          {curated.tokenization?.status === "listed" && (
            <div className="border border-emerald-800/50 bg-emerald-950/20 rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-emerald-400 text-xs font-mono font-bold mb-0.5">{curated.tokenization.ticker}</div>
                <div className="text-zinc-400 text-xs">{curated.tokenization.leaseYield} · {curated.tokenization.tokenPrice}</div>
              </div>
              <Link href="/orbital" className="text-xs text-emerald-400 border border-emerald-800/60 px-3 py-1.5 rounded hover:bg-emerald-950/40 transition-colors">
                View offering →
              </Link>
            </div>
          )}
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
                      {(() => {
                        const companySlug = operatorToSlug(sat.operator);
                        return companySlug ? (
                          <Link href={`/companies/${companySlug}`} className="text-blue-400 hover:text-blue-300 text-xs transition-colors">
                            {sat.operator}
                          </Link>
                        ) : (
                          <span className="text-zinc-400 text-xs">{sat.operator ?? "—"}</span>
                        );
                      })()}
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
