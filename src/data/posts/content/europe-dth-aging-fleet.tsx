import type { TocItem } from "@/components/TableOfContents";

export const toc: TocItem[] = [
  { id: "the-finding",          label: "The finding" },
  { id: "the-19-2-cluster",     label: "19.2°E: the Astra heartland" },
  { id: "the-28-2-cluster",     label: "28.2°E: the UK anchor" },
  { id: "why-design-life",      label: "What past design life means" },
  { id: "the-capex-read",       label: "The capex read" },
  { id: "the-public-record",    label: "What the public record shows" },
  { id: "sources",              label: "Sources" },
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
        Two orbital positions carry most of Europe&apos;s satellite television. At 19.2°E, the Astra
        neighborhood beams direct-to-home programming into Germany, France, Spain, and a dozen other
        markets. At 28.2°E, a second Astra cluster anchors the United Kingdom and Ireland. Together they
        reach tens of millions of households and represent a meaningful share of SES&apos;s revenue base.
      </p>
      <p>
        Both are flying on an aging fleet. A position-level read of the public satellite record shows that
        every operational SES satellite at 19.2°E is past its nominal fifteen-year design life, and the
        older half of the 28.2°E cluster is too. This is not a prediction about failure. It is a quantified,
        public signal about a refleet decision that is approaching at two of the most valuable positions in
        the geostationary arc.
      </p>

      <h2 id="the-finding">The finding</h2>
      <p>
        Clarke normalizes public orbital data into a registry organized by position rather than by company.
        That reorganization surfaces things that company-level reporting does not. One of them is fleet age
        at a specific longitude. When you line up the satellites parked at Europe&apos;s two DTH anchors and
        compare each one&apos;s in-service date against its nominal design life, the same pattern appears at
        both: the hardware holding these positions is old, and at 19.2°E it is uniformly past design life.
      </p>

      <h2 id="the-19-2-cluster">19.2°E: the Astra heartland</h2>
      <p>
        19.2°E is the original Astra position and the commercial heart of continental European DTH. Four
        co-located SES satellites operate within a third of a degree of one another, a tight cluster that
        lets a single dish reach the entire programming lineup. Every one of them is past its fifteen-year
        nominal design life.
      </p>

      <Table
        headers={["Satellite", "Longitude", "Launched", "Age (2026)", "Design life", "Status"]}
        rows={[
          ["Astra 1G",  "19.24°E", "1997", "29 yr", "15 yr", "Past design life"],
          ["Astra 1KR", "19.16°E", "2006", "20 yr", "15 yr", "Past design life"],
          ["Astra 1L",  "19.30°E", "2007", "19 yr", "15 yr", "Past design life"],
          ["Astra 1M",  "19.20°E", "2008", "18 yr", "15 yr", "Past design life"],
        ]}
      />

      <p>
        The youngest satellite in the cluster launched in 2008. The oldest has been on station since 1997,
        nearly twice its design life. A position whose entire co-located fleet is beyond nominal life is a
        position carrying concentrated replacement risk at a revenue anchor where service continuity to
        millions of households is the product.
      </p>

      <h2 id="the-28-2-cluster">28.2°E: the UK anchor</h2>
      <p>
        28.2°E carries DTH into the United Kingdom and Ireland. The cluster is larger and the age profile is
        more layered. Three satellites are well past design life, and the workhorse trio that carries most of
        the current capacity is approaching it.
      </p>

      <Table
        headers={["Satellite", "Launched", "Age (2026)", "Design life", "Status"]}
        rows={[
          ["Astra 2A", "1998", "28 yr", "15 yr", "Past design life"],
          ["Astra 2D", "2000", "26 yr", "15 yr", "Past design life"],
          ["Astra 2C", "2001", "25 yr", "15 yr", "Past design life"],
          ["Astra 1N", "2011", "15 yr", "15 yr", "At design life"],
          ["Astra 2F", "2012", "14 yr", "15 yr", "Approaching"],
          ["Astra 2E", "2013", "13 yr", "15 yr", "Approaching"],
          ["Astra 2G", "2014", "12 yr", "15 yr", "Approaching"],
        ]}
      />

      <p>
        The Astra 2E, 2F, and 2G trio launched between 2012 and 2014 and now carries the bulk of UK DTH
        capacity. All three cross the fifteen-year design-life mark between 2027 and 2029. The 28.2°E refleet
        is not a single event, it is a wave that arrives over the next three to four years.
      </p>

      <h2 id="why-design-life">What past design life means</h2>
      <p>
        A satellite operating past its design life has not failed. Spacecraft routinely outlast their nominal
        life, sometimes by a decade, running on remaining station-keeping propellant before they are retired
        to a graveyard orbit. Nominal design life is an engineering estimate, not an expiry date.
      </p>
      <p>
        What it does signal is probability. Beyond design life, the risk of component degradation rises, the
        propellant margin that holds a satellite within its assigned box shrinks, and the operator&apos;s
        optionality narrows. When an entire co-located cluster sits beyond that line, the operator is no
        longer managing one aging asset, it is managing the timing of replacing a whole neighborhood. For a
        DTH position, where continuity to subscribers is the entire value, that timing is a board-level
        capital question.
      </p>

      <h2 id="the-capex-read">The capex read</h2>
      <p>
        A geostationary satellite costs roughly $300 million to $500 million to build and launch. Replacing
        the capacity at a single marquee arc is a multi-hundred-million-dollar program, and the cadence of
        those programs is one of the largest swing factors in a listed operator&apos;s free cash flow.
      </p>
      <p>
        Read together, the two clusters describe a replacement obligation that is already due at 19.2°E and
        arrives in a wave at 28.2°E through the end of the decade. An investor modeling SES, or a counterparty
        evaluating the durability of either position, would want that schedule in front of them. It does not
        appear in a sell-side note, because sell-side research is built at the company level. It is observable
        today only if someone has normalized orbital occupancy by position and joined it to fleet age.
      </p>

      <h2 id="the-public-record">What the public record shows</h2>
      <p>
        Everything above comes from public data. Orbital positions, launch dates, and nominal design life are
        drawn from the UCS Satellite Database and normalized into Clarke&apos;s position-level registry. The
        same view exists for every tracked geostationary position, not just these two.
      </p>
      <p>
        Two honest caveats. First, nominal design life is a single public field, not a read on any specific
        satellite&apos;s remaining propellant or health, which are operator-private. Some of the oldest
        satellites listed here may already be in inclined-orbit or reduced-service modes. Second, the precise
        revenue attributable to each position is not in this dataset, that is the pricing layer Clarke is
        building next from SEC disclosures. The point of this piece is narrower and, we think, more useful:
        the public record already carries a clear, quantified fleet-age signal at Europe&apos;s two most
        important DTH positions, and until now nobody has been normalizing and publishing it.
      </p>
      <p>
        That is the work Clarke exists to do. Make the orbital record legible at the level of the asset, so
        the people pricing it, regulating it, and trading it are working from the same view.
      </p>

      <h2 id="sources">Sources</h2>
      <ol className="text-zinc-600 text-xs space-y-1 font-mono">
        <li>Union of Concerned Scientists Satellite Database (orbital position, launch date, nominal design life)</li>
        <li>SES S.A. fleet information, ses.com</li>
        <li>SES S.A. Annual Report and Form 20-F disclosures, SEC EDGAR</li>
        <li>Clarke position-level orbital registry (clarke), data ingested 2026-06-02</li>
        <li>&quot;The new economics of GEO: from scarcity to abundance,&quot; London Economics</li>
      </ol>
    </div>
  );
}
