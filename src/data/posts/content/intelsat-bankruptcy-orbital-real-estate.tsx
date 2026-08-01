import type { TocItem } from "@/components/TableOfContents";

export const toc: TocItem[] = [
  { id: "from-utility-to-asset",    label: "From utility to commercial asset" },
  { id: "the-debt-trap",            label: "The debt trap" },
  { id: "c-band-the-reveal",        label: "C-band: the regulatory asset revealed" },
  { id: "the-acquisition",          label: "The SES acquisition as market verdict" },
  { id: "what-this-tells-us",       label: "What this tells us about orbital real estate" },
  { id: "sources",                  label: "Sources" },
];

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto my-6">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} className="text-left text-white/50 font-mono uppercase tracking-wider px-4 py-2 border border-zinc-800 bg-zinc-900/40">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2 text-zinc-400 border border-zinc-800 leading-relaxed">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Post() {
  return (
    <div className="prose-clarke">
      <p>
        On May 13, 2020, Intelsat S.A. filed for Chapter 11 bankruptcy protection in the Eastern District
        of Virginia, listing approximately $14.8 billion in debt and a fleet of more than 50 geostationary
        satellites serving media companies, telecommunications operators, and the United States military
        across every inhabited region of Earth. The filing was the largest in the history of the satellite
        industry.
      </p>
      <p>
        What made it instructive was not the collapse but the survival. Through two years of restructuring,
        Intelsat&apos;s orbital slot portfolio emerged largely intact. The company deleveraged from $16 billion
        to $7 billion in debt, and in 2025, SES acquired Intelsat for $3.1 billion. That acquisition price
        is the market&apos;s answer to a question the industry had never been forced to price precisely: how much
        are the regulatory rights to occupy a specific longitude in geostationary orbit actually worth?
      </p>

      <h2 id="from-utility-to-asset">From Intergovernmental Utility to Commercial Asset</h2>
      <p>
        Intelsat was established in the 1960s under the Kennedy administration as an intergovernmental
        entity, designed to provide global telecommunications coverage under the principle that outer space
        was the &quot;province of all mankind,&quot; a phrase echoed in the 1967 Outer Space Treaty. For decades the
        company operated as a protected monopoly, authorized by international treaties to occupy prime
        positions in the geostationary arc.
      </p>
      <p>
        The geostationary orbit sits 35,786 kilometers above the equator, the only altitude where a
        satellite&apos;s period matches Earth&apos;s rotation, allowing it to appear fixed over a single geographic
        region from the ground. That physical characteristic made GEO satellites the most efficient
        mechanism for broadcast television and long-distance telecommunications. The International
        Telecommunication Union became the de facto registrar for these positions, managing rights on a
        first-come, first-served basis among member states.
      </p>
      <p>
        The 2000 ORBIT Act mandated the privatization of Intelsat, completed in 2001. The newly private
        company inherited a massive portfolio of grandfathered orbital slots and spectrum rights that
        remained its core value proposition. These positions had accumulated over decades of intergovernmental
        coordination and could not simply be replicated by a new entrant. They became the foundation for a
        global satellite fleet serving customers under long-term contracts, and the basis for a capital
        structure that assumed those contracts would remain stable.
      </p>

      <h2 id="the-debt-trap">The Debt Trap</h2>
      <p>
        The financial structure that collapsed Intelsat was not unusual for large infrastructure companies
        that had passed through leveraged buyouts. By 2019, the company was generating $2.06 billion in
        revenue and $1.48 billion in Adjusted EBITDA, representing a 72% margin. These metrics would
        suggest a healthy, cash-generative business in most industries.
      </p>

      <Table
        headers={["Metric", "2019 Figure"]}
        rows={[
          ["Total Revenue", "$2,061,465,000"],
          ["Adjusted EBITDA", "$1,481,529,000"],
          ["EBITDA Margin", "72%"],
          ["Annual Interest Expense", "~$1,130,000,000"],
          ["Satellite Impairment Losses", "$381,565,000"],
          ["Net Loss Attributable to Intelsat S.A.", "$913,595,000"],
          ["Total Debt Principal", "~$14,800,000,000"],
        ]}
      />

      <p>
        The problem was approximately $1.13 billion in annual interest expense on $14.8 billion in debt,
        combined with the capital intensity of operating a satellite fleet where each GEO satellite costs
        between $300 million and $500 million to build and launch. The company required continuous capital
        expenditure to maintain and replace aging hardware across a fleet designed to last 15 years, while
        also recording $381 million in satellite impairment charges. The EBITDA margin was masking a
        structural free cash flow crisis.
      </p>
      <p>
        The revenue base was deteriorating in parallel. Terrestrial fiber-optic networks had displaced
        satellite as the preferred medium for data transmission across most developed markets, and the rise
        of streaming services was undermining the broadcast television distribution contracts that had
        historically anchored Intelsat&apos;s customer base. The company was locked into a cycle of launching
        expensive, long-lived assets to protect its orbital filings even as the market value of those
        assets&apos; bandwidth was declining.
      </p>

      <h2 id="c-band-the-reveal">C-Band: The Regulatory Asset Revealed</h2>
      <p>
        The immediate trigger for the bankruptcy filing was a Federal Communications Commission order
        regarding the C-band spectrum, the 3.7 to 4.2 GHz frequency range that Intelsat and other
        operators had used for decades to distribute video programming to approximately 120 million homes
        across the United States.
      </p>
      <p>
        In early 2020, the FCC finalized a plan to clear 280 MHz of the C-band to make room for 5G
        terrestrial wireless services, offering nearly $10 billion in accelerated relocation payments to
        operators who could complete the transition by December 2023, two years ahead of schedule.
        Intelsat was eligible for approximately $4.87 billion of these payments. SES was eligible for
        approximately $4 billion.
      </p>

      <Table
        headers={["Operator", "C-Band Incentive Payment"]}
        rows={[
          ["Intelsat S.A.", "~$4.87 billion"],
          ["SES S.A.", "~$3.97 billion"],
          ["Eutelsat S.A.", "~$507 million"],
          ["Telesat Canada", "~$340 million"],
          ["Total Industry", "~$9.7 billion"],
        ]}
      />

      <p>
        The catch was that Intelsat needed to spend more than $1.2 billion on new satellites and ground
        infrastructure to execute the clearing, and its existing debt load made raising that capital on
        private markets impossible without the protection of a bankruptcy filing. The Chapter 11 process
        provided the legal framework to obtain debtor-in-possession financing, prioritize the clearing
        project, and ultimately collect the incentive payments that funded the company&apos;s emergence from
        restructuring.
      </p>
      <p>
        The C-band episode is the clearest illustration of why orbital slot valuations are so difficult
        to assess through conventional means. The FCC was not paying Intelsat for its satellites. It was
        paying for the company&apos;s regulatory right to transmit within a specific frequency range at specific
        orbital positions. When the opportunity cost of that spectrum for terrestrial 5G exceeded its
        value in satellite broadcasting, the regulatory system ran what amounted to a forced market-clearing
        event, and the price it revealed (nearly $5 billion for Intelsat&apos;s share alone) exceeded the
        company&apos;s eventual total acquisition price.
      </p>

      <h2 id="the-acquisition">The SES Acquisition as Market Verdict</h2>
      <p>
        Intelsat emerged from bankruptcy in early 2022 with its debt reduced from approximately $16 billion
        to $7 billion. The orbital slot portfolio was intact. The satellites were still operating. The
        customer contracts were in place. SES acquired Intelsat in 2025 for $3.1 billion, creating the
        largest combined satellite operator in the world by fleet size and orbital position coverage.
      </p>
      <p>
        The transaction was framed publicly as the creation of a multi-orbit operator capable of combining
        GEO&apos;s broad regional coverage with MEO and LEO capacity for low-latency data services. That framing
        is accurate. The more precise reading is that SES paid $3.1 billion for a portfolio of
        ITU-coordinated orbital positions, the spectrum licenses attached to them, and the customer
        relationships built on top of them over six decades. The satellites occupying those positions were
        depreciating hardware. The ITU filings were not.
      </p>

      <h2 id="what-this-tells-us">What This Tells Us About Orbital Real Estate</h2>
      <p>
        The Intelsat case establishes several facts about GEO orbital slots as an asset class that are
        difficult to derive from first principles alone.
      </p>
      <p>
        Regulatory incumbency is durable in a way that satellite hardware is not. A satellite launched in
        2010 is operating on 2005-era technology in 2025. The ITU filing that governs its position has not
        aged at all. The slot remains coordinated and protected from interference by the same international
        framework that granted it decades ago, regardless of what happens to the company above it in the
        capital structure.
      </p>
      <p>
        The value of an orbital position is substantially a function of its spectrum license rather than
        the hardware occupying it. The C-band clearing demonstrated that the same frequency rights Intelsat
        had used for broadcast distribution could be repriced to reflect their opportunity cost in 5G
        wireless, and that repricing yielded more than the company&apos;s total post-restructuring equity value.
        The spectrum rights were the asset. The satellites were the instrument.
      </p>
      <p>
        High debt loads are structurally incompatible with the replacement cycles that maintaining an
        orbital slot portfolio requires. A company that cannot continuously refresh its hardware at the
        positions it holds will see those positions gradually devalue, not because the filings expire, but
        because the hardware becomes incapable of serving the market demand that justified the filing
        in the first place.
      </p>
      <p>
        The SES acquisition was not a distressed opportunistic purchase. It was the market pricing a
        mature, well-positioned portfolio of coordinated GEO slots with full knowledge of the technology
        risk and revenue erosion that had preceded the bankruptcy. That price was $3.1 billion. The
        question Clarke is built to answer is how to systematize that pricing before the next transaction
        forces it into the open.
      </p>

      <h2 id="sources">Sources</h2>
      <ol className="text-zinc-600 text-xs space-y-1 font-mono">
        <li>Intelsat S.A. Bankruptcy Filing, Eastern District of Virginia, Case No. 3:20-bk-32299 (May 14, 2020)</li>
        <li>Intelsat S.A. Form 8-K / EX-99.1, SEC EDGAR (February 2020)</li>
        <li>FCC Report and Order, C-Band Spectrum Reallocation, FCC-20-22 (March 2020)</li>
        <li>&quot;Evaluating the FCC&apos;s $10 Billion Gamble: Successfully Accelerating Access to Spectrum in Auction 107,&quot; ResearchGate</li>
        <li>&quot;SES Completes FCC&apos;s C-Band Transition Clearing,&quot; SES Press Release (ses.com)</li>
        <li>&quot;Intelsat wipes out $9bn debt as it emerges from bankruptcy,&quot; Capacity Media (2022)</li>
        <li>SES and Intelsat FCC Transfer Application, SB Docket No. 24-267 (FCC, 2024)</li>
        <li>&quot;The new economics of GEO: from scarcity to abundance,&quot; London Economics</li>
        <li>&quot;Paper satellites and the free use of outer space,&quot; NYU Law Global (Globalex)</li>
        <li>&quot;Launch Cost Deflation and the Economics of Satellite Deployment,&quot; Anser Press / ResearchGate</li>
      </ol>
    </div>
  );
}
