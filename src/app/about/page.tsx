import { buildMeta } from "@/lib/metadata";
import Link from "next/link";
import { getSatelliteStats, getFccCount, getGeoPositionCount } from "@/lib/satellites";
import { getDataFreshness } from "@/lib/freshness";

export const metadata = buildMeta({
  title: "About",
  description: "What Clarke is, why GEO orbital slots matter now, the public data sources it normalizes, registry methodology, data quality notes, and the agents API.",
  tag: "About",
  path: "/about",
});

const sections = [
  { id: "why-now",              label: "Why Now?" },
  { id: "agents",               label: "Agents API" },
  { id: "orbital-slots",        label: "Orbital Slots" },
  { id: "data-sources",         label: "Data Sources" },
  { id: "data-quality",         label: "Data Quality" },
  { id: "registry-methodology", label: "Registry Methodology" },
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-16 scroll-mt-20">
      <h2 className="text-white font-bold text-lg mb-6 pb-3 border-b border-zinc-800">{title}</h2>
      {children}
    </section>
  );
}

const sources: { name: string; abbr: string; url: string; cadence: string; what: string; why: string; status: "live" | "planned" }[] = [
  {
    name: "UCS Satellite Database",
    abbr: "Union of Concerned Scientists",
    url: "https://www.ucsusa.org/resources/satellite-database",
    cadence: "Bi-annual",
    status: "live",
    what: "A normalized database of all active satellites with operator, country, purpose, orbital regime, launch date, and expected lifetime. Clarke currently ingests 590 GEO satellites from the May 2023 snapshot, covering 407 distinct orbital positions (the Orbital Registry lists more rows than that — co-located satellites outside Clarke's curated position set are currently listed individually rather than grouped by position, which is on the list to fix).",
    why: "The most accessible normalized dataset of active satellites available publicly. Powers Clarke's orbital registry, operator attribution, and congestion scoring. Satellite names and orbital positions are reliable; individual satellite identifiers (NORAD/COSPAR) have known accuracy issues in the UCS source and are not displayed.",
  },
  {
    name: "FCC Approved Space Station List",
    abbr: "FCC International Bureau",
    url: "https://www.fcc.gov/approved-space-station-list",
    cadence: "Updated as granted",
    status: "live",
    what: "The official FCC list of all space stations authorized to operate in or serve the United States. Clarke ingests 174 GEO authorizations covering US-licensed operators and foreign operators with US market access grants. Fields include call sign, licensee, authorized frequency bands (C/Ku/Ka/L), service type, administration, and in-orbit date.",
    why: "The only government-issued, per-satellite licensing record Clarke currently has. Directly expresses the spectrum coordination pillar: which frequencies are authorized at which position, under which jurisdiction. A position absent from this list has no FCC authorization, which is itself a meaningful signal for US market access.",
  },
  {
    name: "ITU Space Network System",
    abbr: "ITU SNS",
    url: "https://www.itu.int/itu-r/space/apps/public/spaceexplorer/networks-explorer",
    cadence: "Continuous",
    status: "planned",
    what: "Every filed and coordinated orbital slot and frequency assignment across all regimes. The canonical international registry for satellite positions. A filed ITU slot is the closest thing to a deed that orbital real estate currently has. Publicly accessible via web, paywalled for bulk data.",
    why: "The foundational dataset Clarke does not yet have. ITU data would cover all operators regardless of US jurisdiction, add coordination dispute history, and make congestion scores authoritative rather than approximate. Bulk access requires an ITU BR IFIC subscription.",
  },
  {
    name: "SEC EDGAR",
    abbr: "US Securities and Exchange Commission",
    url: "https://www.sec.gov/search-filings",
    cadence: "Quarterly / Annual",
    status: "planned",
    what: "Financial filings from publicly traded satellite operators including SES, Viasat, Eutelsat, Intelsat, and Telesat. 10-K and 20-F annual reports disclose slot utilization, contract lengths, revenue by region, and fleet composition.",
    why: "The only public source of economic data tied to specific orbital assets. Extracting transponder revenue by position from SEC filings is the path to Clarke's implied asset valuation layer.",
  },
  {
    name: "Space-Track",
    abbr: "18th SDS / US Space Force",
    url: "https://www.space-track.org",
    cadence: "Daily",
    status: "live",
    what: "Two-line element sets (TLEs) for all ~27,000 tracked orbital objects. The authoritative source for the position and trajectory of every catalogued object in Earth orbit, maintained by the US Space Force.",
    why: "Adding TLE cross-reference would let Clarke validate and correct UCS orbital positions, identify decommissioned satellites still listed as active, and map physical proximity risk between assets. Free with registration.",
  },
  {
    name: "Celestrak",
    abbr: "Dr. T.S. Kelso",
    url: "https://celestrak.org",
    cadence: "Daily",
    status: "planned",
    what: "Curated TLE datasets organized by category: active satellites, debris, rocket bodies, country of origin. A more accessible interface to Space-Track data with historical archives going back decades.",
    why: "Planned as the cross-reference layer for validating UCS satellite identifiers. A spot-check against Celestrak surfaced significant NORAD ID errors in the current UCS import, which is why those identifiers are currently omitted from Clarke.",
  },
  {
    name: "Gunter's Space Page",
    abbr: "Gunter Krebs",
    url: "https://space.skyrocket.de",
    cadence: "Ongoing",
    status: "planned",
    what: "A comprehensive reference database of spacecraft and launch vehicles. Covers thousands of satellites with mission descriptions, launch records, operator details, and orbital parameters.",
    why: "Particularly useful for tracking older GEO assets and alternative names. Many satellites in the UCS database carry multiple aliases that complicate operator matching across sources.",
  },
  {
    name: "Jonathan's Space Report",
    abbr: "Jonathan McDowell",
    url: "https://planet4589.org/space/jsr/jsr.html",
    cadence: "Ongoing",
    status: "planned",
    what: "Detailed launch and satellite records maintained by a Harvard astrophysicist. Includes subsatellite catalogs, orbital history, and launch manifests going back to the beginning of the space age.",
    why: "The most meticulous public record of orbital launches and satellite histories. Useful for building historical transaction context that neither ITU filings nor FCC records fully describe.",
  },
];

function formatDate(lastRun: string): string {
  const d = new Date(lastRun.replace(" ", "T") + "Z");
  if (isNaN(d.getTime())) return lastRun;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

function ageLabel(ageDays: number): string {
  if (ageDays < 0) return "";
  if (ageDays === 0) return "today";
  if (ageDays === 1) return "1 day ago";
  return `${ageDays} days ago`;
}

export default function AboutPage() {
  const dbStats = getSatelliteStats();
  const geoCount = dbStats.geoCount > 0 ? dbStats.geoCount : 590;
  const totalSats = dbStats.total > 0 ? dbStats.total : 7560;
  const fccCount = getFccCount() || 174;
  const positionCount = getGeoPositionCount() || 407;
  const freshness = getDataFreshness();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">

      {/* What Clarke is */}
      <div className="max-w-3xl mb-10">
        <p className="text-zinc-300 text-lg leading-relaxed mb-5">
          Clarke is the data infrastructure for orbital real estate. Positions in geostationary orbit
          are licensed by the ITU, sublicensed to operators, and increasingly fought over as the belt
          fills up, but the market trading on them still runs on PDFs, phone calls, and internal
          spreadsheets. Clarke turns the public record, satellite databases, FCC licensing filings, and
          orbital tracking data, into a structured registry: what&apos;s at a position, who holds it, how
          contested it is, and what it&apos;s worth.
        </p>
        <p className="text-zinc-500 text-base leading-relaxed">
          Orbital infrastructure changes hands for hundreds of billions of dollars through satellite
          acquisitions, spectrum leasing, fleet consolidations, and regulatory transfers, yet there is no
          unified data layer, no public pricing index, and no canonical registry of ownership, congestion,
          or implied value. Every other mature asset class, real estate, terrestrial spectrum, equities,
          converged on public registries once enough capital moved through it. Orbital real estate is
          already trading at that scale. It&apos;s just missing the reference layer.
        </p>
      </div>

      {/* Three pillars */}
      <div className="grid sm:grid-cols-3 gap-4 mb-10 max-w-3xl">
        {[
          { title: "Registry", body: "What's at a position and who holds it, from satellite and FCC licensing data." },
          { title: "Congestion", body: "How contested an arc is, scored 0-100 from live density and operator overlap." },
          { title: "Valuation", body: "What a position implies in dollar terms, modeled from disclosed M&A and analyst comps." },
        ].map((p) => (
          <div key={p.title} className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/10">
            <div className="text-white text-sm font-semibold mb-2">{p.title}</div>
            <p className="text-zinc-500 text-xs leading-relaxed">{p.body}</p>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-px bg-white/[0.04] rounded-xl overflow-hidden mb-10 max-w-3xl">
        {[
          { value: `${geoCount}`, label: "GEO satellites tracked (registry)" },
          { value: `${positionCount}`, label: "Positions tracked" },
          { value: `${fccCount}`, label: "FCC authorizations" },
        ].map((s) => (
          <div key={s.label} className="bg-zinc-950 px-5 py-5 text-center">
            <div className="text-white font-bold font-mono text-xl mb-1">{s.value}</div>
            <div className="text-white/25 text-[10px] font-mono tracking-widest uppercase leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-6 max-w-3xl">
        <Link href="/orbital"
          className="inline-flex items-center gap-2 bg-white text-black rounded-lg px-5 py-2.5 text-sm font-bold hover:bg-zinc-200 transition-colors">
          Explore the registry →
        </Link>
      </div>

      <p className="text-zinc-600 text-sm leading-relaxed mb-16 max-w-3xl">
        Named after Arthur C. Clarke, who first described geostationary orbit in 1945. The Clarke Belt,
        the ring of satellites 35,786 km above the equator, is named in his honor.
      </p>

      {/* Mobile nav — horizontal scroll */}
      <div className="lg:hidden flex gap-2 overflow-x-auto pb-3 mb-6 border-b border-zinc-800 scrollbar-none">
        {sections.map((s) => (
          <a key={s.id} href={`#${s.id}`}
            className="shrink-0 text-zinc-500 text-xs hover:text-white transition-colors px-3 py-1.5 border border-zinc-800 rounded-full whitespace-nowrap">
            {s.label}
          </a>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        <aside className="hidden lg:block lg:w-48 shrink-0">
          <div className="sticky top-20 space-y-1">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`}
                className="block text-zinc-500 text-xs hover:text-white transition-colors py-1.5 border-l border-zinc-800 pl-3 hover:border-zinc-500">
                {s.label}
              </a>
            ))}
          </div>
        </aside>

        <div className="flex-1 min-w-0">

          <Section id="why-now" title="Why Now?">
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              The geostationary belt is a fixed resource, and the market built on top of it is entering
              a period of forced clarity. Consolidation, spectrum pressure from low-orbit constellations,
              and rising scrutiny of unused filings are pushing an opaque asset class toward the kind of
              public data infrastructure every other tradable resource already has.
            </p>
            <div className="space-y-4">
              {[
                { title: "A fixed resource, not a growing one", body: "The ITU allocates roughly 1,800 geostationary positions globally, a number set by physics, not policy. As of 2022 only 541 were occupied by active satellites, and demand for the remaining capacity keeps rising as broadband, IoT, and direct-to-device services compete for the same orbital arc and frequency bands. Unlike compute or bandwidth, GEO slots cannot be manufactured to meet demand." },
                { title: "Consolidation is already underway", body: "SES's $3.1B acquisition of Intelsat was substantially driven by Intelsat's orbital slot portfolio, not its terrestrial business. As low-orbit constellations pull broadband subscribers away from legacy GEO operators, more fleet operators face the same choice: consolidate, or monetize the spectrum and slot rights they hold. Either path turns orbital positions into a more actively traded asset." },
                { title: "Filed is not occupied", body: "The ITU found that 45% of investigated satellite networks showed no proof of being brought into use, a practice known as slot squatting. As pressure builds to reclaim underused positions for real deployment, the gap between what is filed on paper and what is actually operating in orbit becomes the question regulators, operators, and acquirers all need answered." },
                { title: "No public data layer exists yet", body: "Hundreds of billions of dollars in orbital infrastructure change hands through acquisitions, spectrum leases, and fleet consolidations, with no unified registry, no public pricing index, and no canonical record of who holds what. Real estate, terrestrial spectrum, and even domain names each converged on public registries once enough value moved through them. Orbital slots are already trading at that scale; they are just missing the reference layer." },
              ].map((item) => (
                <div key={item.title} className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/10">
                  <div className="text-white text-sm font-semibold mb-2">{item.title}</div>
                  <p className="text-zinc-500 text-xs leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="agents" title="Agents API">
            <p className="text-zinc-500 text-sm leading-relaxed mb-6">
              Clarke exposes a read-only HTTP API and a Model Context Protocol server so autonomous agents and LLM-based assistants can query the registry without scraping HTML. The same operations layer backs both transports, so HTTP responses and MCP tool results stay in sync. No authentication is required; reads are public, rate-limited, and cached.
            </p>

            <h3 className="text-white text-sm font-semibold mb-3">HTTP endpoints</h3>
            <div className="space-y-2 mb-6">
              {[
                { path: "GET /api/v1/agents/slots", desc: "All orbital slots (curated + UCS-derived), merged and sorted by longitude, each with a congestion score and heuristic valuation." },
                { path: "GET /api/v1/agents/slots/{slug}", desc: "Full dossier for one slot: record, satellites at that longitude, FCC authorizations, congestion breakdown, and heuristic valuation." },
                { path: "GET /api/v1/agents/satellites", desc: "GEO satellites from the UCS database. Optional filters: operator, ownerCountry, limit (max 1000)." },
              ].map((e) => (
                <div key={e.path} className="border border-zinc-800 rounded-lg px-4 py-3 bg-zinc-900/5">
                  <div className="text-white font-mono text-xs mb-1">{e.path}</div>
                  <div className="text-zinc-500 text-xs leading-relaxed">{e.desc}</div>
                </div>
              ))}
            </div>

            <h3 className="text-white text-sm font-semibold mb-3">Response shape</h3>
            <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/10 mb-6">
              <p className="text-zinc-500 text-xs leading-relaxed mb-3">
                Every successful response is a JSON envelope with a versioned <span className="font-mono text-zinc-300">data</span> field and a <span className="font-mono text-zinc-300">meta</span> object containing the API version, generation timestamp, and (for list endpoints) the row count. Responses carry <span className="font-mono text-zinc-300">ETag</span> and <span className="font-mono text-zinc-300">Cache-Control: public, s-maxage=300, stale-while-revalidate=60</span> headers; agents are expected to send <span className="font-mono text-zinc-300">If-None-Match</span> for conditional requests.
              </p>
              <pre className="text-zinc-400 text-xs font-mono bg-black/40 border border-zinc-800/60 rounded p-3 overflow-x-auto">{`{
  "data": { ... },
  "meta": {
    "version": "1.0",
    "generated_at": "2026-05-23T14:22:40Z",
    "count": 590
  }
}`}</pre>
            </div>

            <h3 className="text-white text-sm font-semibold mb-3">Rate limits and validation</h3>
            <div className="space-y-3 mb-6">
              {[
                { label: "RATE LIMIT", body: "60 requests per minute per IP, enforced in-memory per serverless instance. A 429 response includes a Retry-After header in seconds. No authentication is required." },
                { label: "INPUT VALIDATION", body: "All path slugs are validated against /^[a-z0-9-]+$/ and query parameters against per-field regex caps. Path traversal attempts and injection patterns return 400. Tickers are restricted to /^[A-Z0-9.-]{1,10}$/." },
                { label: "CORS", body: "All routes allow cross-origin reads (Access-Control-Allow-Origin: *) with GET and OPTIONS only. Preflight responses cache for 24 hours." },
              ].map((s) => (
                <div key={s.label} className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/10">
                  <div className="text-xs font-mono text-zinc-600 mb-3">{`// ${s.label}`}</div>
                  <p className="text-zinc-500 text-xs leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>

            <h3 className="text-white text-sm font-semibold mb-3">Model Context Protocol (MCP) server</h3>
            <p className="text-zinc-500 text-sm leading-relaxed mb-4">
              The same operations are exposed as MCP tools so Claude Code, Cursor, and any other MCP-compatible client can query Clarke in plain English. The server runs locally over stdio and reads directly from the SQLite database; no network round-trip to Clarke is involved beyond what the host process does on its own.
            </p>
            <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/10 mb-6">
              <div className="text-xs font-mono text-zinc-600 mb-3">{"// MCP CONFIG"}</div>
              <pre className="text-zinc-400 text-xs font-mono bg-black/40 border border-zinc-800/60 rounded p-3 overflow-x-auto">{`{
  "mcpServers": {
    "clarke": {
      "command": "npm",
      "args": ["run", "mcp", "--silent"],
      "cwd": "/absolute/path/to/clarke"
    }
  }
}`}</pre>
              <p className="text-zinc-500 text-xs leading-relaxed mt-3">
                Available tools: <span className="font-mono">clarke_list_slots</span>, <span className="font-mono">clarke_get_slot</span>, <span className="font-mono">clarke_list_satellites</span>.
              </p>
            </div>

            <h3 className="text-white text-sm font-semibold mb-3">Scope and roadmap</h3>
            <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/10">
              <p className="text-zinc-500 text-xs leading-relaxed">
                The current surface is read-only. Event streams and metered access for high-volume agent consumers are on the roadmap but not implemented.
              </p>
            </div>
          </Section>

          <Section id="orbital-slots" title="Orbital Slots">
            <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/10 mb-6">
              <p className="text-zinc-400 text-sm leading-relaxed mb-3">
                Geostationary orbit sits exactly 35,786 km above the equator, the altitude at which a satellite&apos;s orbital period matches Earth&apos;s rotation. From the ground it appears stationary. The International Telecommunication Union manages this ring globally, allocating roughly 1,800 positions to member states who sublicense to private operators. See <a href="#why-now" className="text-zinc-300 hover:text-white underline">Why Now?</a> for how scarce that ring actually is in practice.
              </p>
              <p className="text-zinc-500 text-xs leading-relaxed">Source: Aerospace Corporation, &quot;Orbital Slots for Everyone?&quot; (2018).</p>
            </div>

            <h3 className="text-white text-sm font-semibold mb-3">Status definitions</h3>
            <div className="space-y-2 mb-6">
              {[
                { status: "Active",   color: "text-emerald-400 border-emerald-800 bg-emerald-950", desc: "Satellite confirmed operational. Verified against UCS database and operator disclosures." },
                { status: "Filed",    color: "text-blue-400 border-blue-800 bg-blue-950",          desc: "ITU filing submitted and accepted but satellite not yet launched or operational." },
                { status: "Squatted", color: "text-amber-400 border-amber-800 bg-amber-950",       desc: "Filing exists but slot appears underutilized or not actively serving its licensed coverage area." },
                { status: "Inactive", color: "text-zinc-500 border-zinc-700 bg-zinc-900",          desc: "Satellite decommissioned. Slot rights may still be held by the operator." },
              ].map((s) => (
                <div key={s.status} className="flex items-start gap-3">
                  <span className={`text-xs px-1.5 py-0.5 rounded border font-medium shrink-0 ${s.color}`}>{s.status}</span>
                  <p className="text-zinc-500 text-xs leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>

            <h3 className="text-white text-sm font-semibold mb-3">Frequency bands</h3>
            <div className="space-y-1.5">
              {[
                { band: "C",  range: "3.7–4.2 GHz",  desc: "Legacy cable TV distribution. Large dishes, rain-resistant. Widely used in Africa, Asia, and Latin America." },
                { band: "Ku", range: "11.7–12.7 GHz", desc: "Primary direct-to-home broadcasting band. Smaller consumer dishes. Sky, DirecTV, and Canal+ all operate in Ku." },
                { band: "Ka", range: "26.5–40 GHz",   desc: "High-throughput broadband. Gigabit-class capacity per satellite but susceptible to rain fade." },
                { band: "X",  range: "8–12 GHz",      desc: "Military and government communications. Restricted to state and defense use in most jurisdictions." },
              ].map((b) => (
                <div key={b.band} className="border border-zinc-800 rounded-lg px-4 py-2.5 flex items-start gap-4 bg-zinc-900/5">
                  <span className="text-white font-bold font-mono text-sm w-6 shrink-0">{b.band}</span>
                  <span className="text-zinc-500 text-xs font-mono w-36 shrink-0">{b.range}</span>
                  <span className="text-zinc-500 text-xs leading-relaxed">{b.desc}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section id="data-sources" title="Data Sources">
            <p className="text-zinc-400 text-sm leading-relaxed mb-8">
              The orbital asset market is opaque, fragmented, and priced through information asymmetry.
              The data to change that is almost entirely public. It is just scattered across a dozen
              institutions, each with a different format, cadence, and level of accessibility.
              Clarke normalizes these sources into a single legible view. Sources marked Live are
              currently ingested; sources marked Planned are on the roadmap but not yet integrated.
            </p>

            {freshness.length > 0 && (
              <div className="mb-10">
                <div className="text-white/30 text-[11px] font-mono tracking-[0.3em] uppercase mb-4">Live data freshness</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/[0.04] border border-white/[0.04]">
                  {freshness.map((f) => (
                    <div key={f.source} className="bg-zinc-950 p-4">
                      <div className="flex items-baseline justify-between gap-3 mb-1">
                        <span className="text-white text-sm font-bold">{f.source}</span>
                        <span className="text-emerald-400/90 font-mono text-xs tabular-nums">{f.rowCount.toLocaleString()} rows</span>
                      </div>
                      <div className="text-white/30 text-xs font-mono">
                        Updated {formatDate(f.lastRun)}
                        {ageLabel(f.ageDays) && <span className="text-white/20"> · {ageLabel(f.ageDays)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-px bg-white/[0.04]">
              {sources.map((s) => (
                <div key={s.abbr} className="bg-zinc-950 p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2.5 mb-1">
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white font-bold text-base hover:text-white/70 transition-colors"
                        >
                          {s.name} ↗
                        </a>
                        {s.status === "live" ? (
                          <span className="text-[10px] font-mono text-emerald-400 border border-emerald-800/60 bg-emerald-950/40 px-1.5 py-0.5 rounded leading-none">Live</span>
                        ) : (
                          <span className="text-[10px] font-mono text-zinc-600 border border-zinc-800 px-1.5 py-0.5 rounded leading-none">Planned</span>
                        )}
                      </div>
                      <div className="text-white/30 text-xs font-mono">{s.abbr}</div>
                    </div>
                    <div className="text-[10px] font-mono text-white/20 tracking-widest uppercase shrink-0 pt-1">
                      {s.cadence}
                    </div>
                  </div>
                  <p className="text-zinc-500 text-sm leading-relaxed mb-3">{s.what}</p>
                  <p className="text-zinc-400 text-sm leading-relaxed border-l border-white/[0.08] pl-4">
                    {s.why}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="data-quality" title="Data Quality">
            <div className="space-y-4">
              {[
                { title: "UCS data vintage", body: "The satellite data ingested into Clarke comes from the UCS Satellite Database snapshot dated May 2023. Satellites launched, decommissioned, or repositioned after that date are not reflected. For operational GEO satellites that have occupied their positions for years, the data is reliable. For recently repositioned satellites or newly launched hardware, the position data may be stale by up to two years depending on when the next ingestion occurs." },
                { title: "Satellite identifiers", body: "The UCS database includes NORAD catalog numbers and COSPAR international designators for each satellite. These identifiers are stored in Clarke's database but are not displayed to users. A spot-check of nine satellites against independent Celestrak records found that five had incorrect NORAD IDs, with some pointing to entirely different satellites at different orbital positions and one pointing to decayed re-entry debris. The satellite names, operator names, and orbital positions were generally accurate in the same check. Identifiers will be surfaced once they have been validated against an authoritative source." },
                { title: "FCC coverage scope", body: `The ${fccCount} FCC authorizations in Clarke cover US-licensed operators and foreign operators with FCC-granted US market access. Satellites licensed entirely under non-US administrations, including most European, Russian, Chinese, and Asian operators, do not appear in FCC records and will show no authorization data on their position pages. This is a reflection of jurisdiction, not a gap in data collection.` },
                { title: "Status labels", body: "Position status labels in the registry (Active, Filed, Squatted, Inactive) are derived from the UCS classification, which marks satellites as active based on reported operational status at the time of the snapshot. The UCS does not independently verify operational status in real time, and updates follow its twice-yearly cadence, so decommissions and new launches typically take up to six months to show up after they are publicly announced." },
              ].map((item) => (
                <div key={item.title} className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/10">
                  <div className="text-white text-sm font-semibold mb-2">{item.title}</div>
                  <p className="text-zinc-500 text-xs leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="registry-methodology" title="Registry Methodology">
            <div className="space-y-4">
              {[
                { title: "Satellite and ownership layer", body: `The registry's satellite layer comes from the UCS Satellite Database (see Data Sources above). Clarke ingests all ${totalSats.toLocaleString()} satellites from the current snapshot across GEO, LEO, and MEO (${geoCount} are GEO), each queryable by operator and purpose. The GEO subset anchors the priced registry and congestion model; LEO and MEO appear as descriptive constellation presence on operator pages, not as priced positions.` },
                { title: "Authorization layer", body: `FCC authorization records from the Approved Space Station List are ingested as a second layer on top of the UCS satellite data. For each GEO position, Clarke queries the FCC table for any authorization within 0.6 degrees of the nominal longitude. Where a match exists, the detail page for that position shows the FCC call sign, licensee name, authorized frequency bands, administration, and in-orbit date. Where no match exists, the position has no US FCC authorization, which is expected for satellites licensed under non-US administrations.` },
                { title: "Co-location grouping", body: "Multiple satellites operating at the same nominal longitude are grouped together using a tolerance of 0.4 degrees. This matches the standard ITU coordination practice where satellites in the same coordination filing cluster within fractions of a degree. The grouping ensures that the four SES Astra satellites at 19.2°E, for example, all appear together on a single position page rather than as four separate entries." },
                { title: "Congestion scoring", body: "The congestion score is a normalized 0 to 100 index blending three signals at a position: arc density (active GEO satellites within 2 degrees on either side), direct co-location (satellites within 0.4 degrees), and contention (the number of distinct operators sharing the arc). Density contributes up to 50 points, co-location up to 30, and operator contention up to 20. A position packed by a single operator scores lower on contention than an equally dense arc contested by many operators, because multi-operator arcs carry a heavier interference-coordination burden. The tiers are Sparse for 0 to 14, Low for 15 to 34, Moderate for 35 to 54, High for 55 to 74, and Critical for 75 to 100. Scores reflect active operational satellites from the UCS database rather than filed ITU positions, so they understate coordination pressure in arcs with heavy filing or squatting activity." },
                { title: "Valuation model", body: "Each position carries a heuristic implied valuation, expressed as a range rather than a point figure because it is derived from public data, not transaction records. A baseline value, calibrated against disclosed transaction prices in public M&A filings, bankruptcy proceedings (Intelsat, 2020), and analyst reports from Northern Sky Research and Euroconsult, is multiplied by five observable factors: arc desirability (where the longitude sits relative to high-value markets such as the European Ku corridor, North America, and Asia), occupancy (the number of co-located active satellites), operator tier (whether a tier-1 operator holds the position), spectrum (the authorized frequency bands, where known), and scarcity (the congestion score). Every factor and its multiplier is shown on the position page so the estimate can be inspected. Confidence is high for curated positions, medium for active positions with a known operator, and low for sparsely-attributed UCS-derived entries; the range widens as confidence falls. This is an analytical model, not an appraisal, a quote, or investment advice." },
              ].map((item) => (
                <div key={item.title} className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/10">
                  <div className="text-white text-sm font-semibold mb-2">{item.title}</div>
                  <p className="text-zinc-500 text-xs leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}
