import type { TocItem } from "@/components/TableOfContents";

export const toc: TocItem[] = [
  { id: "tracking-data-mandate", label: "The tracking-data mandate" },
  { id: "the-carve-out",         label: "The carve-out" },
  { id: "the-authority-question",label: "The authority question" },
  { id: "geo-implications",      label: "What this means for GEO" },
  { id: "sources",               label: "Sources" },
];

export default function Post() {
  return (
    <div className="prose-clarke">
      <p>
        On July 22, the FCC voted 3-0 to replace its decades-old satellite licensing framework, Part 25,
        with a new Part 100, formally titled <em>Space Modernization for the 21st Century</em> (Report and
        Order and Further Notice of Proposed Rulemaking, FCC 26-47, SB Docket No. 25-306). The headline is
        speed: applications meeting bright-line criteria are now presumed to serve the public interest,
        filings shrink from technical narratives to modular checklists, the public notice window drops
        from 30 days to 15, and if the Commission hasn&apos;t acted within 60 days of comments closing, it
        now has to tell the applicant why not.
      </p>
      <p>
        For anyone who tracks orbital positions for a living, three things in this order matter more than
        the headline.
      </p>

      <h2 id="tracking-data-mandate">First: the tracking-data mandate is a genuine first</h2>
      <p>
        Part 100 makes it an operational condition of licensing — not a best practice, a condition — that
        satellite operators provide ephemeris data to an FCC-approved space situational awareness (SSA)
        provider. Under Part 25, data sharing was voluntary and uneven. This is the first time the FCC has
        legally compelled competing operators into a common tracking framework.
      </p>
      <p>
        Who the &quot;approved provider&quot; will be remains undesignated — the order itself doesn&apos;t
        name one. Instead the Commission delegates that determination to the Space Bureau, explicitly so
        the requirement can flex &quot;as the SSA ecosystem evolves.&quot; The pool of plausible candidates
        — the ecosystem built around Commerce&apos;s TraCSS pathfinder program, companies like LeoLabs,
        Slingshot Aerospace, COMSPOC, Kayhan Space, and SpaceNav — is obvious. None of them has been named.
      </p>

      <h2 id="the-carve-out">Second: the carve-out</h2>
      <p>
        The order&apos;s streamlined process doesn&apos;t reach the filings that best justify its
        existence. The clearest case is SpaceX&apos;s January 30, 2026 application for an Orbital Data
        Center constellation of up to one million satellites — accepted by the FCC on February 4 — which
        multiple outlets covering the order report is excluded from the new framework&apos;s
        revised processing timelines. Blue Origin filed its own orbital-compute application in March
        (Project Sunrise, up to 51,600 satellites), and a startup called Orbital Compute filed a
        100,000-satellite version in July — meaning this isn&apos;t a SpaceX-specific problem, it&apos;s
        now a whole emerging sub-industry sitting outside the fast lane.
      </p>
      <p>
        The order itself doesn&apos;t name any of these filings. What it does is define seven &quot;targeted
        review categories&quot; — Failure to Certify, Waiver Requests, Market Access, Foreign Ownership,
        <strong> Processing Round</strong>, Spectral Constraints, and Federal Coordination — that pull an
        application out of the default &quot;presumed acceptable&quot; treatment and into the slower,
        case-by-case track. Unprecedented-scale, multi-band NGSO systems like these are the textbook case
        for landing in Processing Round or Spectral Constraints review, and that&apos;s the mechanism
        multiple outlets covering the order point to for why the megaconstellation filings are excluded,
        though the order&apos;s text doesn&apos;t spell out the specific clause. Whatever the precise
        mechanism, the agency built an assembly line and left its largest-ever filings at the manual
        workstation, with no committed timeline. Whatever you think of a million-satellite compute cloud, the case that most argues for
        reform is the case reform doesn&apos;t reach.
      </p>

      <h2 id="the-authority-question">Third: the authority question is now live</h2>
      <p>
        The FCC&apos;s legal foundation is spectrum — the Communications Act of 1934. Debris mitigation,
        collision-risk certification, and mandatory tracking data are orbital <em>safety</em> regulation,
        and the House Science Committee&apos;s chairman and ranking member — Reps. Brian Babin (R-Texas)
        and Zoe Lofgren (D-Calif.), a bipartisan pair — told the FCC in writing twice, first in February
        and again on July 21, the day before the vote, that Congress never granted it that authority. Their
        February letter put it directly: &quot;The Communications Act of 1934 — enacted decades before the
        advent of spaceflight — contains no clear congressional authorization empowering the FCC to
        regulate space safety, space traffic management, or broader noncommunications space
        operations.&quot; The Commission didn&apos;t change course and voted 3-0 anyway.
      </p>
      <p>
        Meanwhile the Senate&apos;s SAT Streamlining Act (S. 3639, sponsored by Sens. Ted Cruz and Peter
        Welch) has already cleared the Commerce Committee and is awaiting a full Senate floor vote — and it
        would grant the FCC explicit statutory authority for exactly this kind of rulemaking. That a bill
        doing precisely that is moving through Congress at the same time means even the order&apos;s allies
        are implicitly conceding it currently rests on contestable ground. Between a possible Congressional
        Review Act challenge and litigation exposure under the major questions doctrine, Part 100 is in
        force but not settled.
      </p>

      <h2 id="geo-implications">What this means for GEO specifically</h2>
      <p>
        Most coverage has treated Part 100 as a LEO mega-constellation story. But the order applies across
        the licensing system, and the GEO implications are underexamined — which is what this registry
        exists to examine.
      </p>
      <p>
        Clarke currently tracks 522 GEO positions, 517 active, of which 143 carry an FCC filing flag —
        meaning more than a quarter of the geostationary arc in the registry runs through the licensing
        machinery this order just rebuilt. Three concrete effects to watch:
      </p>
      <p>
        <strong>Filing velocity becomes a signal.</strong> Under Part 25, the gap between filing and grant
        was noisy — months to years, driven by process as much as merit. Under a 60-day accountability
        clock, that gap becomes informative: a filing that stalls now stalls for a reason. For anyone
        reading the registry&apos;s FCC flags as market signal, the noise floor just dropped.
      </p>
      <p>
        <strong>The transparency asymmetry inverts.</strong> GEO operators have historically been the
        opaque end of the market — long-lived assets, quiet bilateral deals, information living in PDFs
        and phone calls. A mandatory common SSA feed means position data for every FCC-licensed GEO asset
        becomes systematically available in one place for the first time. Clarke&apos;s congestion model
        today is built from the UCS Satellite Database — a twice-yearly snapshot, currently dated May
        2023 — cross-referenced against FCC authorization records; Space-Track TLE data is ingested
        separately for position validation, not as the congestion engine&apos;s primary input. A
        designated, mandatory SSA provider regime would be a real upgrade to what&apos;s knowable about
        the arc, not a cosmetic one.
      </p>
      <p>
        <strong>Regulatory risk becomes an attribute of the slot.</strong> If Part 100 is narrowed by
        Congress or the courts, the rules governing any given position could change again within a year or
        two. A registry that records only <em>who</em> holds a position, and not <em>under which regime it
        was licensed</em>, will misprice that risk. That&apos;s a data-model question Clarke now has to
        answer — and a follow-up post once the litigation picture clarifies.
      </p>
      <p>
        The honest bottom line: Part 100 is simultaneously a real improvement, a jurisdictional gamble, and
        an admission of limits. Faster process, on legally contested foundations, with its hardest cases
        deferred. For the GEO arc, the near-term effect is more legible data and more meaningful filing
        signals — which is to say, the exact conditions under which a structured registry becomes more
        useful than a stack of PDFs. That&apos;s not a coincidence we&apos;re complaining about.
      </p>

      <h2 id="sources">Sources</h2>
      <ol className="text-zinc-600 text-xs space-y-1 font-mono">
        <li>FCC, Space Modernization for the 21st Century, Report and Order and Further Notice of Proposed Rulemaking, FCC 26-47, SB Docket No. 25-306 (July 22, 2026)</li>
        <li>FCC Press Release, &quot;FCC Adopts Groundbreaking Overhaul of Space Bureau&apos;s Licensing Process&quot; (July 22, 2026)</li>
        <li>Reps. Brian Babin and Zoe Lofgren, House Science Committee, letters to FCC Chairman Brendan Carr (February 2026; July 21, 2026)</li>
        <li>S. 3639, SAT Streamlining Act, 119th Congress, congress.gov</li>
        <li>SpaceX, FCC application for Orbital Data Center constellation (filed January 30, 2026; accepted February 4, 2026)</li>
        <li>SpaceNews, &quot;FCC to vote on satellite licensing overhaul July 22&quot;</li>
        <li>Via Satellite, &quot;FCC Overhauls Satellite Licensing, Adopts &apos;Assembly Line&apos; Approach&quot; (July 22, 2026)</li>
        <li>CNN, &quot;Who gets to make rules about space? A new vote is reigniting the debate&quot; (July 22, 2026)</li>
      </ol>
    </div>
  );
}
