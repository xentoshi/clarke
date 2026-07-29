import { buildMeta } from "@/lib/metadata";
import { getSatelliteStats, getFccCount } from "@/lib/satellites";

export const metadata = buildMeta({
  title: "Docs",
  description: "Technical documentation for Clarke: registry methodology, data sources, congestion scoring, and the agents API.",
  tag: "Docs",
  path: "/docs",
});

const sections = [
  { id: "overview",            label: "Overview" },
  { id: "orbital-slots",       label: "Orbital Slots" },
  { id: "data-sources",        label: "Data Sources" },
  { id: "registry-methodology",label: "Registry Methodology" },
  { id: "data-quality",        label: "Data Quality" },
  { id: "methodology",         label: "Methodology" },
  { id: "agents",              label: "Agents API" },
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-16 scroll-mt-20">
      <h2 className="text-white font-bold text-lg mb-6 pb-3 border-b border-zinc-800">{title}</h2>
      {children}
    </section>
  );
}

function DataSourceCard({ name, url, type, description, license }: {
  name: string; url: string; type: string; description: string; license: string;
}) {
  return (
    <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/10">
      <div className="mb-3">
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="text-white font-semibold text-sm hover:text-zinc-300 transition-colors">
          {name} ↗
        </a>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">{type}</span>
          <span className="text-xs text-emerald-400 bg-emerald-950 border border-emerald-800 px-1.5 py-0.5 rounded">{license}</span>
        </div>
      </div>
      <p className="text-zinc-500 text-xs leading-relaxed">{description}</p>
    </div>
  );
}

export default function DocsPage() {
  const dbStats = getSatelliteStats();
  const geoCount = dbStats.geoCount > 0 ? dbStats.geoCount : 590;
  const totalSats = dbStats.total > 0 ? dbStats.total : 7560;
  const fccCount = getFccCount();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <p className="text-zinc-600 text-xs font-mono mb-3">// DOCUMENTATION</p>
        <h1 className="text-2xl font-bold text-white mb-3">Docs</h1>
        <p className="text-zinc-500 text-sm max-w-2xl leading-relaxed">
          Technical reference for Clarke: where the orbital slot data comes from, how positions are scored and valued, and how to query the registry programmatically. This is the engineering and methodology behind the registry.
        </p>
      </div>

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

          <Section id="overview" title="Overview">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {[
                { value: geoCount,  label: "GEO satellites tracked (registry)" },
                { value: fccCount,  label: "FCC authorizations" },
                { value: "590+",    label: "GEO positions in registry" },
              ].map((s) => (
                <div key={s.label} className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/10 text-center">
                  <div className="text-2xl font-bold font-mono text-white">{s.value}</div>
                  <div className="text-zinc-600 text-xs mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">
              Clarke is a live registry of GEO orbital positions: congestion, operators, and FCC filing status, built from public data so a market that mostly runs on PDFs and phone calls has a queryable reference layer.
            </p>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Named after Arthur C. Clarke, who first described geostationary orbit in 1945. The Clarke Belt, the ring of satellites 35,786 km above the equator, is named in his honor.
            </p>
          </Section>

          <Section id="orbital-slots" title="Orbital Slots">
            <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/10 mb-6">
              <p className="text-zinc-400 text-sm leading-relaxed mb-3">
                Geostationary orbit sits exactly 35,786 km above the equator, the altitude at which a satellite's orbital period matches Earth's rotation. From the ground it appears stationary. The International Telecommunication Union manages this ring globally, allocating roughly 1,800 positions to member states who sublicense to private operators.
              </p>
              <p className="text-zinc-400 text-sm leading-relaxed mb-3">
                As of 2022, only 541 of those positions are occupied by active satellites. The ITU found that 45% of investigated satellite networks showed no proof of being brought into use, a practice known as slot squatting. The SES acquisition of Intelsat, valued at $3.1B, was substantially driven by Intelsat's orbital slot portfolio.
              </p>
              <p className="text-zinc-500 text-xs leading-relaxed">Source: Aerospace Corporation, "Orbital Slots for Everyone?" (2018).</p>
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
            <p className="text-zinc-500 text-sm leading-relaxed mb-6">
              All data in Clarke is derived from public sources. Sources marked Live are currently ingested; sources marked Planned are in the roadmap but not yet integrated.
            </p>
            <div className="space-y-3">
              <DataSourceCard name="UCS Satellite Database" url="https://www.ucsusa.org/resources/satellite-database" type="Satellites" license="Live" description={`Union of Concerned Scientists normalized catalog of active satellites, updated twice yearly. Clarke ingests the full dataset (${totalSats.toLocaleString()} satellites across GEO, LEO, and MEO; ${geoCount} are GEO), providing operator attribution, orbital positions, launch dates, and purpose classifications. The GEO subset anchors the priced registry; LEO and MEO surface as constellation presence on operator pages.`} />
              <DataSourceCard name="FCC Approved Space Station List" url="https://www.fcc.gov/approved-space-station-list" type="US Licenses" license="Live" description={`The FCC's official list of all space stations authorized to operate in or serve the United States. Clarke ingests ${fccCount} GEO authorizations covering call signs, licensed frequency bands, licensee names, administrations, and in-orbit dates from government records.`} />
              <DataSourceCard name="Space-Track.org" url="https://www.space-track.org" type="Orbital Mechanics" license="Live" description="US Space Force catalog of tracked orbital objects with TLE updates. Clarke ingests the SATCAT and live TLE tables (run via npm run ingest:spacetrack) to provide real-time satellite positions for the orbital globe and as a cross-reference for validating UCS identifiers." />
              <DataSourceCard name="Clarke Companies Registry" url="/companies" type="Companies" license="Live" description="A curated registry of space-industry companies maintained in src/data/companies.ts, spanning 30+ sectors including GEO Operators, Launch, Lunar, Earth Observation, Robotics, ISRU, Habitation, and Space Insurance. Each entry includes sector, headquarters, founding year, and a profile describing the company's role in the broader space economy. Cross-referenced with the slot and stock layers via the agents API." />
              <DataSourceCard name="ITU Space Network System" url="https://www.itu.int/itu-r/space/apps/public/spaceexplorer/networks-explorer" type="Orbital Filings" license="Planned" description="The canonical international registry for every coordinated orbital position and frequency assignment. Bulk data access requires an ITU BR IFIC subscription and arrives in Microsoft Access format. Integration will extend the registry from active satellites to the full universe of filed and coordinated positions." />
              <DataSourceCard name="SEC EDGAR" url="https://www.sec.gov/cgi-bin/browse-edgar" type="Financial Filings" license="Planned" description="Annual and quarterly filings from publicly traded satellite operators including SES, Viasat, Eutelsat, and Telesat. Integration will power the pricing layer by mapping disclosed transponder revenues and slot valuations to specific orbital positions." />
            </div>
          </Section>

          <Section id="registry-methodology" title="Registry Methodology">
            <div className="space-y-4">
              {[
                { title: "Satellite and ownership layer", body: `The registry is built from the UCS Satellite Database, which provides a normalized record of active satellites including operator, owner country, orbital position, launch date, and purpose. Clarke ingests all ${totalSats.toLocaleString()} satellites from the current snapshot across GEO, LEO, and MEO (${geoCount} are GEO), making each one queryable by operator and purpose. The GEO subset anchors the priced registry and congestion model; LEO and MEO appear as descriptive constellation presence on operator pages, not as priced positions. The UCS data is the satellite layer: it tells Clarke what is physically operating and who operates it.` },
                { title: "Authorization layer", body: `FCC authorization records from the Approved Space Station List are ingested as a second layer on top of the UCS satellite data. For each GEO position, Clarke queries the FCC table for any authorization within 0.6 degrees of the nominal longitude. Where a match exists, the detail page for that position shows the FCC call sign, licensee name, authorized frequency bands, administration, and in-orbit date. Where no match exists, the position has no US FCC authorization, which is expected for satellites licensed under non-US administrations.` },
                { title: "Co-location grouping", body: "Multiple satellites operating at the same nominal longitude are grouped together using a tolerance of 0.4 degrees. This matches the standard ITU coordination practice where satellites in the same coordination filing cluster within fractions of a degree. The grouping ensures that the four SES Astra satellites at 19.2°E, for example, all appear together on a single position page rather than as four separate entries." },
                { title: "Congestion scoring", body: "The congestion score is a normalized 0 to 100 index blending three signals at a position: arc density (active GEO satellites within 2 degrees on either side), direct co-location (satellites within 0.4 degrees), and contention (the number of distinct operators sharing the arc). Density contributes up to 50 points, co-location up to 30, and operator contention up to 20. A position packed by a single operator scores lower on contention than an equally dense arc contested by many operators, because multi-operator arcs carry a heavier interference-coordination burden. The tiers are Sparse for 0 to 14, Low for 15 to 34, Moderate for 35 to 54, High for 55 to 74, and Critical for 75 to 100. Scores reflect active operational satellites from the UCS database rather than filed ITU positions, so they understate coordination pressure in arcs with heavy filing or squatting activity." },
                { title: "Valuation model", body: "Each position carries a heuristic implied valuation, expressed as a range rather than a point figure because it is derived from public data, not transaction records. A baseline value is multiplied by five observable factors: arc desirability (where the longitude sits relative to high-value markets such as the European Ku corridor, North America, and Asia), occupancy (the number of co-located active satellites), operator tier (whether a tier-1 operator holds the position), spectrum (the authorized frequency bands, where known), and scarcity (the congestion score). Every factor and its multiplier is shown on the position page so the estimate can be inspected. Confidence is high for curated positions, medium for active positions with a known operator, and low for sparsely-attributed UCS-derived entries; the range widens as confidence falls. Curated positions also carry a hand-checked estimate that is shown as the authoritative figure. This is an analytical model, not a quote or an offer." },
              ].map((item) => (
                <div key={item.title} className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/10">
                  <div className="text-white text-sm font-semibold mb-2">{item.title}</div>
                  <p className="text-zinc-500 text-xs leading-relaxed">{item.body}</p>
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
                { title: "Status labels", body: "Position status labels in the registry (Active, Filed, Squatted, Inactive) are derived from the UCS classification, which marks satellites as active based on reported operational status at the time of the snapshot. The UCS does not independently verify operational status in real time, and the labels may not reflect satellites that have been recently decommissioned or quietly taken offline since May 2023." },
              ].map((item) => (
                <div key={item.title} className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/10">
                  <div className="text-white text-sm font-semibold mb-2">{item.title}</div>
                  <p className="text-zinc-500 text-xs leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="methodology" title="Methodology">
            <div className="space-y-4">
              {[
                { title: "Slot status verification", body: "Slot status is derived from UCS Satellite Database classifications, updated twice yearly. Satellite decommissions and new launches are reflected within the cadence of UCS updates, typically within six months of public announcement." },
                { title: "Value estimates", body: "Orbital slot value estimates are derived from disclosed transaction prices in public M&A filings, bankruptcy proceedings (Intelsat 2020), and analyst reports from Northern Sky Research and Euroconsult. Ranges reflect meaningful uncertainty. These are not appraisals." },
                { title: "Not investment advice", body: "Nothing on Clarke constitutes investment advice. Value estimates and slot data are informational, derived from public sources, and not a market quote or an offer." },
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
                { path: "GET /api/v1/agents/companies", desc: "Company registry. Optional sector filter. Pass view=sectors to enumerate sectors with counts." },
                { path: "GET /api/v1/agents/companies/{slug}", desc: "Company profile cross-referenced with its publicly traded stock (if any), its operated slots, and its satellites." },
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
                  <div className="text-xs font-mono text-zinc-600 mb-3">// {s.label}</div>
                  <p className="text-zinc-500 text-xs leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>

            <h3 className="text-white text-sm font-semibold mb-3">Model Context Protocol (MCP) server</h3>
            <p className="text-zinc-500 text-sm leading-relaxed mb-4">
              The same operations are exposed as MCP tools so Claude Code, Cursor, and any other MCP-compatible client can query Clarke in plain English. The server runs locally over stdio and reads directly from the SQLite database; no network round-trip to Clarke is involved beyond what the host process does on its own.
            </p>
            <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/10 mb-6">
              <div className="text-xs font-mono text-zinc-600 mb-3">// MCP CONFIG</div>
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
                Available tools: <span className="font-mono">clarke_list_slots</span>, <span className="font-mono">clarke_get_slot</span>, <span className="font-mono">clarke_list_satellites</span>, <span className="font-mono">clarke_list_companies</span>, <span className="font-mono">clarke_get_company</span>, <span className="font-mono">clarke_company_sectors</span>, <span className="font-mono">clarke_list_stocks</span>.
              </p>
            </div>

            <h3 className="text-white text-sm font-semibold mb-3">Scope and roadmap</h3>
            <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/10">
              <p className="text-zinc-500 text-xs leading-relaxed">
                The current surface is read-only. Event streams and metered access for high-volume agent consumers are on the roadmap but not implemented.
              </p>
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}
