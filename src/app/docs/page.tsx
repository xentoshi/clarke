import Link from "next/link";
import { buildMeta } from "@/lib/metadata";
import { companies, verticalLabels } from "@/data/companies";
import { slots } from "@/data/orbital-slots";
import { investors } from "@/data/investors";
import { narratives } from "@/data/narratives";

export const metadata = buildMeta({
  title: "Docs",
  description: "Data sources, methodology, and structure behind Clarke the space infrastructure directory.",
  tag: "Docs",
});

const sections = [
  { id: "overview", label: "Overview" },
  { id: "data-sources", label: "Data Sources" },
  { id: "orbital-slots", label: "Orbital Slots" },
  { id: "companies", label: "Companies" },
  { id: "investors", label: "Investors" },
  { id: "narratives", label: "Narratives" },
  { id: "api", label: "API" },
  { id: "methodology", label: "Methodology" },
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-16 scroll-mt-20">
      <h2 className="text-white font-bold text-lg mb-6 pb-3 border-b border-zinc-800">{title}</h2>
      {children}
    </section>
  );
}

function DataSourceCard({
  name, url, type, description, license,
}: {
  name: string; url: string; type: string; description: string; license: string;
}) {
  return (
    <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/10">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="text-white font-semibold text-sm hover:text-zinc-300 transition-colors">
            {name} ↗
          </a>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">{type}</span>
            <span className="text-xs text-emerald-400 bg-emerald-950 border border-emerald-800 px-1.5 py-0.5 rounded">{license}</span>
          </div>
        </div>
      </div>
      <p className="text-zinc-500 text-xs leading-relaxed">{description}</p>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <p className="text-zinc-600 text-xs font-mono mb-3">// DOCUMENTATION</p>
        <h1 className="text-2xl font-bold text-white mb-3">Docs</h1>
        <p className="text-zinc-500 text-sm max-w-2xl leading-relaxed">
          Data sources, methodology, and structure behind Clarke. Every dataset is traceable to a primary or open source.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar nav */}
        <aside className="lg:w-48 shrink-0">
          <div className="sticky top-20 space-y-1">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`}
                className="block text-zinc-500 text-xs hover:text-white transition-colors py-1.5 border-l border-zinc-800 pl-3 hover:border-zinc-500">
                {s.label}
              </a>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">

          <Section id="overview" title="Overview">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { value: companies.length, label: "Companies" },
                { value: Object.keys(verticalLabels).length, label: "Verticals" },
                { value: slots.length, label: "Orbital Slots" },
                { value: investors.length, label: "Investors" },
              ].map((s) => (
                <div key={s.label} className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/10 text-center">
                  <div className="text-2xl font-bold font-mono text-white">{s.value}</div>
                  <div className="text-zinc-600 text-xs mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">
              Clarke is a directory of every company, investor, and orbital asset building the infrastructure for humanity beyond Earth.
              It covers 13 verticals across the space industry from launch vehicles to life support alongside a live registry
              of geostationary orbital slots and their tokenization potential on Solana.
            </p>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Named after Arthur C. Clarke, who first described geostationary orbit in 1945. The Clarke Belt -
              the ring of satellites 35,786 km above the equator is named in his honor.
            </p>
          </Section>

          <Section id="data-sources" title="Data Sources">
            <p className="text-zinc-500 text-sm leading-relaxed mb-6">
              All data is derived from open, public, or primary sources. No paywalled databases.
              Each dataset below is the authoritative source for its category.
            </p>
            <div className="space-y-3">
              <DataSourceCard
                name="ITU IFIC International Frequency Information Circular"
                url="https://www.itu.int/pub/R-IFIC"
                type="Orbital Slots"
                license="Public"
                description="The authoritative global registry for satellite orbital slots and frequency assignments, published weekly by the International Telecommunication Union. Every GEO slot filing, coordination agreement, and satellite network registration originates here."
              />
              <DataSourceCard
                name="ITU Space Network Systems (SNS)"
                url="https://www.itu.int/online/sns/index.html"
                type="Orbital Slots"
                license="Public"
                description="Searchable database of all ITU satellite network filings. Covers filing status, coordination progress, orbital parameters, and frequency bands for every registered satellite network globally."
              />
              <DataSourceCard
                name="UCS Satellite Database"
                url="https://www.ucsusa.org/resources/satellite-database"
                type="Satellites"
                license="Open Source"
                description="Union of Concerned Scientists maintains a comprehensive open-source database of operational satellites updated quarterly. Includes owner, operator, orbital parameters, launch date, and purpose for ~6,500 satellites."
              />
              <DataSourceCard
                name="Space-Track.org"
                url="https://www.space-track.org"
                type="Orbital Data"
                license="Public (free account)"
                description="Official US Space Force catalog of all tracked space objects. Contains Two-Line Element sets (TLEs) for every tracked satellite and debris object. The authoritative source for orbital mechanics data."
              />
              <DataSourceCard
                name="FCC International Bureau Filings"
                url="https://www.fcc.gov/international"
                type="US Licenses"
                license="Public"
                description="US frequency and satellite licensing database. Contains all FCC authorizations for US-licensed satellite operators including orbital slots, power limits, and service areas."
              />
              <DataSourceCard
                name="Company Primary Sources"
                url="https://sec.gov"
                type="Companies"
                license="Public"
                description="Company data is sourced from SEC filings (10-K, S-1), company press releases, NASA/ESA/DoD contract announcements, and investor presentations. All funding figures are from primary announcements."
              />
              <DataSourceCard
                name="Crunchbase / PitchBook Public Filings"
                url="https://www.crunchbase.com"
                type="Investors"
                license="Public"
                description="Investor profiles and portfolio data verified against primary press releases, LP disclosures, and company announcements. AUM figures are self-reported by funds."
              />
            </div>
          </Section>

          <Section id="orbital-slots" title="Orbital Slots">
            <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/10 mb-6">
              <div className="text-xs font-mono text-zinc-600 mb-3">// WHAT IS A GEO SLOT</div>
              <p className="text-zinc-400 text-sm leading-relaxed mb-3">
                Geostationary orbit (GEO) sits exactly 35,786 km above the equator the altitude at which a satellite's
                orbital period matches Earth's rotation, making it appear stationary from the ground. The ITU manages
                this ring globally, allocating ~1,800 positions to member states who sublicense to private operators.
              </p>
              <p className="text-zinc-400 text-sm leading-relaxed mb-3">
                As of 2022, only 541 of those 1,800 slots are occupied by active satellites. An ITU survey found that
                45% of investigated satellite networks showed no proof of being brought into use a practice known as
                "paper satellites" or slot squatting. Positions over North America, Europe, and East Asia are fully
                congested; remote arcs sit empty.
              </p>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Slots are allocated at zero cost on a first-come, first-served basis, creating perverse incentives.
                Tonga famously auctioned its ITU filing rights for ~$2M/year per slot in 1988. The SES–Intelsat
                acquisition valued at $3.1B was substantially driven by Intelsat's orbital slot portfolio.
                Source: Aerospace Corporation, "Orbital Slots for Everyone?" (2018).
              </p>
            </div>

            <h3 className="text-white text-sm font-semibold mb-3">Status definitions</h3>
            <div className="space-y-2 mb-6">
              {[
                { status: "Active", color: "text-emerald-400 border-emerald-800 bg-emerald-950", desc: "Satellite confirmed operational in this slot. Verified against UCS database and operator disclosures." },
                { status: "Filed", color: "text-blue-400 border-blue-800 bg-blue-950", desc: "ITU filing submitted and accepted but satellite not yet launched or operational." },
                { status: "Squatted", color: "text-amber-400 border-amber-800 bg-amber-950", desc: "Filing exists but slot appears underutilized or satellite is not actively serving its licensed coverage area." },
                { status: "Inactive", color: "text-zinc-500 border-zinc-700 bg-zinc-900", desc: "Satellite has been decommissioned. Slot rights may still be held by the operator or subject to re-filing." },
              ].map((s) => (
                <div key={s.status} className="flex items-start gap-3">
                  <span className={`text-xs px-1.5 py-0.5 rounded border font-medium shrink-0 ${s.color}`}>{s.status}</span>
                  <p className="text-zinc-500 text-xs leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>

            <h3 className="text-white text-sm font-semibold mb-3">Frequency bands</h3>
            <div className="space-y-1.5 mb-6">
              {[
                { band: "C", range: "3.7–4.2 GHz (downlink)", desc: "Oldest commercial band. Large dishes, rain-resistant, used for cable TV distribution and legacy infrastructure." },
                { band: "Ku", range: "11.7–12.7 GHz", desc: "Primary direct-to-home broadcasting band. Smaller dishes, widely deployed for consumer satellite TV." },
                { band: "Ka", range: "26.5–40 GHz", desc: "High-throughput broadband. Susceptible to rain fade but delivers gigabit-class capacity per satellite." },
                { band: "X", range: "8–12 GHz", desc: "Military and government communications. Restricted to state and defense use in most jurisdictions." },
              ].map((b) => (
                <div key={b.band} className="border border-zinc-800 rounded-lg px-4 py-2.5 flex items-start gap-4 bg-zinc-900/5">
                  <span className="text-white font-bold font-mono text-sm w-6 shrink-0">{b.band}</span>
                  <span className="text-zinc-500 text-xs font-mono w-40 shrink-0">{b.range}</span>
                  <span className="text-zinc-500 text-xs leading-relaxed">{b.desc}</span>
                </div>
              ))}
            </div>

            <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/10">
              <div className="text-xs font-mono text-zinc-600 mb-2">// TOKENIZATION THESIS</div>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Orbital slot usage rights are held by SPVs (Special Purpose Vehicles) that hold ITU coordination agreements
                and national licensing rights. Tokenizing the SPV on Solana creates fractional ownership of the economic
                rights to the slot lease income, appreciation, and transfer rights without altering the underlying
                ITU filing structure. This mirrors real estate tokenization (RealT, Lofty) applied to space infrastructure.
              </p>
            </div>
          </Section>

          <Section id="companies" title="Companies">
            <p className="text-zinc-500 text-sm leading-relaxed mb-4">
              {companies.length} companies across {Object.keys(verticalLabels).length} verticals. Each entry includes
              founding year, headquarters, funding stage, and a primary description sourced from official company materials.
            </p>
            <div className="space-y-2">
              {[
                { field: "name", desc: "Legal entity name as registered." },
                { field: "vertical", desc: "Primary industry vertical from 13 defined categories." },
                { field: "hq", desc: "Primary headquarters city and country." },
                { field: "founded", desc: "Year of incorporation or public launch." },
                { field: "funding", desc: "Total disclosed funding from primary press releases and SEC filings. Excludes undisclosed rounds." },
                { field: "stage", desc: "private · public · acquired · defunct based on current status." },
                { field: "ticker", desc: "Exchange ticker for publicly traded companies (NYSE, NASDAQ)." },
                { field: "description", desc: "One-sentence description from primary company materials." },
              ].map((f) => (
                <div key={f.field} className="flex items-start gap-4 py-2 border-b border-zinc-800/50 last:border-0">
                  <span className="text-zinc-400 font-mono text-xs w-24 shrink-0 pt-0.5">{f.field}</span>
                  <span className="text-zinc-500 text-xs leading-relaxed">{f.desc}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section id="investors" title="Investors">
            <p className="text-zinc-500 text-sm leading-relaxed mb-4">
              {investors.length} investors including venture funds, corporate arms, and individual angels.
              Portfolio data is sourced from fund disclosures, LP letters, and company funding announcements.
            </p>
          </Section>

          <Section id="narratives" title="Narratives">
            <p className="text-zinc-500 text-sm leading-relaxed mb-4">
              {narratives.length} investment theses covering the major verticals. Each narrative includes
              conviction level, time horizon, key catalysts, risk factors, and the companies driving the thesis.
              These are analytical frameworks, not financial advice.
            </p>
            <div className="space-y-2">
              {[
                { field: "conviction", desc: "high · medium · watch editorial assessment of thesis strength given current data." },
                { field: "horizon", desc: "near (0–3yr) · mid (3–7yr) · long (7yr+) estimated time for thesis to play out." },
                { field: "catalysts", desc: "Specific events or milestones that would validate the thesis." },
                { field: "risks", desc: "Identified risks that could invalidate or delay the thesis." },
                { field: "keyTickers", desc: "Publicly traded companies most exposed to the thesis." },
                { field: "keyPrivate", desc: "Private companies central to the thesis." },
              ].map((f) => (
                <div key={f.field} className="flex items-start gap-4 py-2 border-b border-zinc-800/50 last:border-0">
                  <span className="text-zinc-400 font-mono text-xs w-28 shrink-0 pt-0.5">{f.field}</span>
                  <span className="text-zinc-500 text-xs leading-relaxed">{f.desc}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section id="api" title="API">
            <p className="text-zinc-500 text-sm leading-relaxed mb-4">
              Machine-readable JSON endpoints for all Clarke datasets.
            </p>
            <div className="space-y-2 mb-6">
              {[
                { path: "/api/companies", desc: "All companies with full metadata" },
                { path: "/api/companies/[slug]", desc: "Single company by slug" },
                { path: "/api/investors", desc: "All investor profiles" },
                { path: "/api/orbital-slots", desc: "GEO orbital slot registry" },
              ].map((e) => (
                <div key={e.path} className="border border-zinc-800 rounded-lg px-4 py-2.5 flex items-center gap-4 bg-zinc-900/5">
                  <span className="text-emerald-400 font-mono text-xs">GET</span>
                  <span className="text-zinc-300 font-mono text-xs">{e.path}</span>
                  <span className="text-zinc-600 text-xs">{e.desc}</span>
                </div>
              ))}
            </div>
            <Link href="/api-docs" className="text-zinc-400 text-sm hover:text-white transition-colors">
              Full API documentation →
            </Link>
          </Section>

          <Section id="methodology" title="Methodology">
            <div className="space-y-4">
              {[
                {
                  title: "Primary sources only",
                  body: "Company descriptions, funding figures, and founding dates are sourced from official company materials, SEC filings, and press releases. We don't aggregate from secondary databases without verification.",
                },
                {
                  title: "Orbital data currency",
                  body: "Slot status is verified against the ITU IFIC weekly publication and UCS satellite database (updated quarterly). Satellite decommissions and new launches are reflected within 30 days of public announcement.",
                },
                {
                  title: "Value estimates",
                  body: "Orbital slot value estimates are derived from disclosed transaction prices in public M&A filings, bankruptcy proceedings (Intelsat 2020), and analyst reports from Northern Sky Research and Euroconsult. Ranges reflect meaningful uncertainty.",
                },
                {
                  title: "No financial advice",
                  body: "Narratives, value estimates, and conviction ratings are analytical frameworks. Nothing on Clarke constitutes investment advice. The orbital slot tokenization features are demonstrations of mechanism, not investment products.",
                },
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
