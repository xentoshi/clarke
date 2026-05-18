import { buildMeta } from "@/lib/metadata";
import { slots } from "@/data/orbital-slots";
import { getSatelliteStats, getFccCount } from "@/lib/satellites";

export const metadata = buildMeta({
  title: "Docs",
  description: "Technical documentation for Clarke: orbital slots, data sources, yield accounting, the on-chain program, and legal structure.",
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
  { id: "how-it-works",        label: "How It Works" },
  { id: "tokens",              label: "Slot Tokens" },
  { id: "fees",                label: "Fee Structure" },
  { id: "legal",               label: "Legal Structure" },
  { id: "program",             label: "On-Chain Program" },
  { id: "yield",               label: "Yield Accounting" },
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
  const fccCount = getFccCount();
  const listedSlots = slots.filter(s => s.tokenization?.status === "listed").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <p className="text-zinc-600 text-xs font-mono mb-3">// DOCUMENTATION</p>
        <h1 className="text-2xl font-bold text-white mb-3">Docs</h1>
        <p className="text-zinc-500 text-sm max-w-2xl leading-relaxed">
          Technical reference for Clarke: how the on-chain program works, where the orbital slot data comes from, and how the legal structure is designed. Clarke is building capital markets for orbital infrastructure. This is the engineering and methodology behind it.
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
                { value: geoCount,    label: "GEO satellites tracked" },
                { value: fccCount,    label: "FCC authorizations" },
                { value: listedSlots, label: "On devnet" },
              ].map((s) => (
                <div key={s.label} className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/10 text-center">
                  <div className="text-2xl font-bold font-mono text-white">{s.value}</div>
                  <div className="text-zinc-600 text-xs mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">
              Clarke is building capital markets for orbital infrastructure: the registry, pricing layer, and exchange for orbital slots across GEO, LEO, and MEO. The on-chain program is a proof of concept for fractional positions in orbital slot revenue, currently running on Solana devnet with three GEO slots modeled as a technical demonstration.
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
              All data in Clarke is derived from public sources. The two sources currently integrated are marked Live below. Sources marked Planned are in the roadmap but not yet ingested.
            </p>
            <div className="space-y-3">
              <DataSourceCard name="UCS Satellite Database" url="https://www.ucsusa.org/resources/satellite-database" type="Satellites" license="Live" description={`Union of Concerned Scientists normalized catalog of active satellites, updated twice yearly. Clarke ingests the full dataset (${geoCount} GEO satellites from the May 2023 snapshot), providing operator attribution, orbital positions, launch dates, and purpose classifications for all tracked positions.`} />
              <DataSourceCard name="FCC Approved Space Station List" url="https://www.fcc.gov/approved-space-station-list" type="US Licenses" license="Live" description={`The FCC's official list of all space stations authorized to operate in or serve the United States. Clarke ingests ${fccCount} GEO authorizations covering call signs, licensed frequency bands, licensee names, administrations, and in-orbit dates from government records.`} />
              <DataSourceCard name="ITU Space Network System" url="https://www.itu.int/itu-r/space/apps/public/spaceexplorer/networks-explorer" type="Orbital Filings" license="Planned" description="The canonical international registry for every coordinated orbital position and frequency assignment. Bulk data access requires an ITU BR IFIC subscription and arrives in Microsoft Access format. Integration will extend the registry from active satellites to the full universe of filed and coordinated positions." />
              <DataSourceCard name="SEC EDGAR" url="https://www.sec.gov/cgi-bin/browse-edgar" type="Financial Filings" license="Planned" description="Annual and quarterly filings from publicly traded satellite operators including SES, Viasat, Eutelsat, and Telesat. Integration will power the pricing layer by mapping disclosed transponder revenues and slot valuations to specific orbital positions." />
              <DataSourceCard name="Space-Track.org" url="https://www.space-track.org" type="Orbital Mechanics" license="Planned" description="US Space Force catalog of all tracked orbital objects with daily TLE updates. Planned as the cross-reference layer for validating satellite positions and correcting identifier accuracy in the UCS import." />
            </div>
          </Section>

          <Section id="registry-methodology" title="Registry Methodology">
            <div className="space-y-4">
              {[
                { title: "Satellite and ownership layer", body: `The registry is built from the UCS Satellite Database, which provides a normalized record of active satellites including operator, owner country, orbital position, launch date, and purpose. Clarke ingests all ${geoCount} GEO satellites from the current snapshot, making each one queryable by position, operator, and purpose. The UCS data is the satellite layer: it tells Clarke what is physically operating at each position and who operates it.` },
                { title: "Authorization layer", body: `FCC authorization records from the Approved Space Station List are ingested as a second layer on top of the UCS satellite data. For each GEO position, Clarke queries the FCC table for any authorization within 0.6 degrees of the nominal longitude. Where a match exists, the detail page for that position shows the FCC call sign, licensee name, authorized frequency bands, administration, and in-orbit date. Where no match exists, the position has no US FCC authorization, which is expected for satellites licensed under non-US administrations.` },
                { title: "Co-location grouping", body: "Multiple satellites operating at the same nominal longitude are grouped together using a tolerance of 0.4 degrees. This matches the standard ITU coordination practice where satellites in the same coordination filing cluster within fractions of a degree. The grouping ensures that the four SES Astra satellites at 19.2°E, for example, all appear together on a single position page rather than as four separate entries." },
                { title: "Congestion scoring", body: "The congestion score for a position is computed by counting all active GEO satellites in the UCS database within 2 degrees on either side of that position's nominal longitude, covering a total arc of 4 degrees. This score is a proxy for arc commercial density and spectrum coordination pressure. The tiers are Sparse for scores of 1 to 2, Low for 3 to 5, Moderate for 6 to 10, High for 11 to 18, and Critical for 19 and above. The score reflects active operational satellites rather than filed positions, so it understates total coordination pressure in arcs with heavy squatting activity." },
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
                { title: "Yield estimates", body: "Lease yield estimates of 5-9% are based on publicly disclosed transponder lease rates in operator earnings reports and industry research. Actual yield depends on individual lease terms negotiated between the operator and their broadcast customers." },
                { title: "Not financial advice", body: "Nothing on Clarke constitutes investment advice. Value estimates, yield projections, and slot data are informational. The devnet tokenization features are a technical demonstration. Mainnet investment involves real financial risk." },
              ].map((item) => (
                <div key={item.title} className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/10">
                  <div className="text-white text-sm font-semibold mb-2">{item.title}</div>
                  <p className="text-zinc-500 text-xs leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="how-it-works" title="How It Works">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { step: "01", actor: "Operator", action: "Submits an International Telecommunication Union-registered orbital slot. Clarke verifies the lease contract and creates an on-chain offering." },
                { step: "02", actor: "Investor",  action: "Buys tokens with SOL. Capital flows immediately to the operator treasury. Tokens represent a fractional claim on future transponder lease revenue." },
                { step: "03", actor: "Operator",  action: "Submits transponder lease revenue quarterly. The configured yield share accumulates in the offering account. Token holders claim their proportional share at any time." },
              ].map((s) => (
                <div key={s.step} className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/10">
                  <div className="text-white/20 text-xs font-mono mb-3">{s.step}</div>
                  <div className="text-white text-sm font-semibold mb-2">{s.actor}</div>
                  <p className="text-zinc-500 text-xs leading-relaxed">{s.action}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="tokens" title="Slot Tokens">
            <p className="text-zinc-500 text-sm leading-relaxed mb-6">
              Each listed slot has a dedicated yield token on Solana with its own ticker. The token represents a fractional claim on that slot's quarterly transponder lease revenue, recorded as an on-chain position in the Clarke program. These three tokens are currently deployed on Solana devnet as a technical proof of concept, not a live investment product.
            </p>
            <div className="space-y-3 mb-6">
              {[
                { ticker: "$ASTRA19", name: "Astra 19.2°E Yield Token", slot: "19.2°E · SES · Ku/Ka-band", yield: "est. 6.2% APY", what: "19.2°E is the most valuable GEO slot in Europe. Home to Astra 1N, it serves Sky Deutschland, Sky UK, and 120M+ European homes. Each yield token entitles the holder to a proportional share of transponder lease revenue from this position." },
                { ticker: "$SES28",   name: "SES 28.2°E Yield Token",   slot: "28.2°E · SES · Ku-band",    yield: "est. 5.9% APY", what: "28.2°E is the primary slot for Sky UK, serving 11M+ subscribers. Sky's entire UK broadcasting infrastructure depends on this position. Each yield token entitles the holder to a share of the transponder lease revenue SES collects from Sky and other Ku-band users at this longitude." },
                { ticker: "$SATMEX101", name: "SatMex / SES 101°W Yield Token", slot: "101°W · SES · C/Ku-band", yield: "est. 5.8% APY", what: "101°W is a premium North American orbital position serving major US cable operators and broadcasters. Originally operated by Satellites Mexicanos (SatMex), the slot is now held by SES following their 2014 acquisition (hence the ticker). C-band capacity supports legacy cable TV distribution across the continental United States. Each yield token entitles the holder to a share of lease revenue from C-band and Ku-band transponder usage." },
              ].map((t) => (
                <div key={t.ticker} className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/10">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <span className="text-white font-mono font-bold text-sm">{t.ticker}</span>
                      <span className="text-zinc-500 text-xs ml-3">{t.name}</span>
                    </div>
                    <span className="text-emerald-400 font-mono text-xs shrink-0">{t.yield}</span>
                  </div>
                  <div className="text-zinc-600 text-xs font-mono mb-2">{t.slot}</div>
                  <p className="text-zinc-500 text-xs leading-relaxed">{t.what}</p>
                </div>
              ))}
            </div>
            <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/10">
              <div className="text-xs font-mono text-zinc-600 mb-3">// TICKER NAMING CONVENTION</div>
              <p className="text-zinc-500 text-xs leading-relaxed">
                Tickers follow the pattern $[OPERATOR/SATELLITE][LONGITUDE]. New slots added to Clarke will follow the same convention. The ticker, slot ID, and on-chain offering PDA are permanently linked at the time of listing and cannot be changed.
              </p>
            </div>
          </Section>

          <Section id="fees" title="Fee Structure">
            <p className="text-zinc-500 text-sm leading-relaxed mb-6">
              Clarke charges fees to operators only. Investors receive yield net of the operator's yield share commitment. No fees are deducted from investor distributions.
            </p>
            <div className="space-y-3">
              {[
                { fee: "2% origination fee", when: "At listing", detail: "Charged on the total capital raised when an operator's slot offering closes. A $10M raise generates $200K for Clarke. This is Clarke's primary revenue source in the early phase." },
                { fee: "5% yield distribution fee", when: "Quarterly", detail: "Charged on each yield distribution flowing through the platform. As listed slots and invested capital grow, this becomes recurring revenue compounding without additional sales effort. Ten slots distributing $5M/year in yield generates $250K/year for Clarke." },
              ].map((f) => (
                <div key={f.fee} className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/10">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <span className="text-white font-bold text-sm">{f.fee}</span>
                    <span className="text-zinc-600 text-xs font-mono shrink-0">{f.when}</span>
                  </div>
                  <p className="text-zinc-500 text-xs leading-relaxed">{f.detail}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="legal" title="Legal Structure">
            <div className="space-y-4">
              {[
                { label: "WHAT IS TOKENIZED", body: "Clarke does not tokenize orbital slots themselves. International Telecommunication Union filings cannot be transferred on-chain. What Clarke tokenizes is a Special Purpose Vehicle that holds the operator's contractual right to receive transponder lease revenue from a specific position. Token holders receive fractional economic rights to that revenue stream. This is identical in structure to real estate tokenization, where an LLC holding a lease is fractionalized rather than the land title itself." },
                { label: "SPV JURISDICTION",  body: "The target jurisdiction for Clarke SPVs is the Cayman Islands. This jurisdiction offers neutral tax treatment, a mature legal framework for fund and SPV structures, no withholding on distributions to foreign investors, and established precedent across the RWA tokenization and crypto industries. Each slot would get a dedicated SPV with no cross-exposure to other offerings or the Clarke operating entity. Clarke is in the design phase. No SPVs have been formed." },
                { label: "OPERATOR RIGHTS",  body: "The satellite operator retains full ownership of their International Telecommunication Union filing, their satellite, and all operational responsibilities. Listing on Clarke does not modify the filing, transfer the frequency license, or affect the operator's relationship with the national administration holding their coordination agreement. Clarke tokenizes only the revenue stream." },
                { label: "PRECEDENTS",        body: "The SPV tokenization structure is used by Securitize (BlackRock BUIDL fund), RealT (real estate), Maple Finance (private credit), and Centrifuge (trade receivables). Clarke applies the same framework to orbital infrastructure." },
              ].map((s) => (
                <div key={s.label} className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/10">
                  <div className="text-xs font-mono text-zinc-600 mb-3">// {s.label}</div>
                  <p className="text-zinc-500 text-sm leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="program" title="On-Chain Program">
            <p className="text-zinc-500 text-sm leading-relaxed mb-6">
              The Clarke program is deployed on Solana devnet at{" "}
              <a href="https://explorer.solana.com/address/3KFUjEeu7efYuvLuAvEeKQqVt3pyoghUafoPSWzYif57?cluster=devnet"
                target="_blank" rel="noreferrer"
                className="text-white/60 hover:text-white font-mono text-xs transition-colors">
                3KFUjEe…if57
              </a>
              . Written in Rust using Anchor 0.29.
            </p>
            <div className="space-y-2 mb-6">
              {[
                { ix: "initialize",          who: "Admin",          desc: "One-time setup. Creates the ProgramAuthority PDA that gates admin instructions. Can only succeed once." },
                { ix: "create_offering",     who: "Admin",          desc: "Creates a SlotOffering PDA. Sets total token supply, price in lamports, and yield share in basis points." },
                { ix: "invest",              who: "Investor",       desc: "Buys tokens. SOL transfers directly to the operator treasury. Creates an InvestorPosition PDA on first purchase." },
                { ix: "distribute_yield",    who: "Admin/Operator", desc: "Deposits transponder lease revenue. The configured yield share (e.g. 80%) accumulates for token holders." },
                { ix: "claim_yield",         who: "Investor",       desc: "Withdraws accrued yield to the investor's wallet. Cannot drain the PDA below its rent-exempt minimum." },
                { ix: "set_offering_status", who: "Admin",          desc: "Pauses or closes an offering." },
                { ix: "transfer_authority",  who: "Admin",          desc: "Transfers the program admin role to a new public key." },
              ].map((ix) => (
                <div key={ix.ix} className="flex items-start gap-4 py-2.5 border-b border-zinc-800/50 last:border-0">
                  <span className="text-emerald-400/70 font-mono text-xs w-44 shrink-0 pt-0.5">{ix.ix}</span>
                  <span className="text-zinc-600 text-xs w-24 shrink-0 pt-0.5">{ix.who}</span>
                  <span className="text-zinc-500 text-xs leading-relaxed">{ix.desc}</span>
                </div>
              ))}
            </div>
            <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/10">
              <div className="text-xs font-mono text-zinc-600 mb-3">// PDA SEEDS</div>
              <div className="space-y-1.5">
                {[
                  { account: "ProgramAuthority", seeds: '["authority"]' },
                  { account: "SlotOffering",      seeds: '["offering", slot_id]' },
                  { account: "InvestorPosition",  seeds: '["position", investor, offering]' },
                ].map((p) => (
                  <div key={p.account} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <span className="text-zinc-400 font-mono text-xs sm:w-44 shrink-0">{p.account}</span>
                    <code className="text-zinc-500 text-xs">{p.seeds}</code>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Section id="yield" title="Yield Accounting">
            <p className="text-zinc-500 text-sm leading-relaxed mb-6">
              Clarke uses the reward-per-token accumulator pattern, the same approach used by Synthetix, Uniswap v3, and most Solana staking programs. It distributes yield in O(1) regardless of how many investors hold tokens.
            </p>
            <div className="space-y-4">
              {[
                { title: "Accumulator", body: "Each SlotOffering tracks yield_per_token_acc: a running total of yield-per-token distributed since the offering was created. When an operator deposits revenue, this increases by (holder_share / sold_tokens)." },
                { title: "Debt tracking", body: "Each InvestorPosition records yield_debt: the value of yield_per_token_acc at the time tokens were last purchased or yield was last claimed. This represents yield the investor is not entitled to because it predates their position." },
                { title: "Claimable amount", body: "Claimable yield at any moment is: tokens x (yield_per_token_acc - yield_debt). Computed on-chain at claim time with no iteration over other positions." },
                { title: "Rent protection", body: "The claim_yield instruction verifies the offering PDA retains enough lamports to remain rent-exempt after transfer. Yield can never drain the account below its minimum balance." },
              ].map((s) => (
                <div key={s.title} className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/10">
                  <div className="text-white text-sm font-semibold mb-2">{s.title}</div>
                  <p className="text-zinc-500 text-xs leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}
