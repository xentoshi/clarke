import type { TocItem } from "@/components/TableOfContents";

export const toc: TocItem[] = [
  { id: "layer-01", label: "01 · Launch" },
  { id: "layer-02", label: "02 · Propulsion" },
  { id: "layer-03", label: "03 · Lunar" },
  { id: "layer-04", label: "04 · Habitation" },
  { id: "layer-045", label: "04.5 · Biology" },
  { id: "layer-05", label: "05 · Power" },
  { id: "layer-06", label: "06 · ISRU" },
  { id: "layer-07", label: "07 · Robotics" },
  { id: "layer-08", label: "08 · Food" },
  { id: "layer-09", label: "09 · Communications" },
  { id: "layer-10", label: "10 · Earth Observation" },
  { id: "layer-11", label: "11 · Suits" },
  { id: "layer-12", label: "12 · Mining" },
  { id: "layer-13", label: "13 · Manufacturing" },
  { id: "layer-14", label: "14 · Governance" },
  { id: "dependency-graph", label: "The dependency graph" },
  { id: "roadmap", label: "Roadmap 2026–2126" },
  { id: "the-bet", label: "The bet" },
  { id: "sources", label: "Sources" },
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

export default function MultiplanetaryPost() {
  return (
    <>
      <div className="border border-zinc-700 rounded-xl p-6 bg-zinc-900/30 mb-10">
        <div className="text-white/30 text-[10px] font-mono tracking-[0.3em] uppercase mb-3">TL;DR</div>
        <ul className="space-y-2 text-zinc-400 text-sm leading-relaxed">
          <li>Getting a self-sustaining human presence on another planet is fourteen problems stacked in sequence. You cannot skip steps.</li>
          <li>A 2020 engineering model puts the minimum threshold for technical survival on Mars at 110 people. Estimates for long-term genetic resilience across generations run much higher, and come from a different body of research entirely.</li>
          <li>Reproduction in reduced gravity is an open problem. A 2026 Adelaide University study found a roughly 30% drop in fertilization rates in simulated microgravity. Full-term pregnancy in Martian or Lunar gravity has never been tested.</li>
          <li>Self-replicating manufacturing could sharply cut the cost of local infrastructure over successive generations, in principle. There is no rigorous, sourced estimate of by how much, and any specific number attached to this idea should be treated as a back-of-envelope illustration, not a finding.</li>
          <li>The Artemis Accords and the Moon Treaty are legally irreconcilable on resource ownership. The conflict is deferred, not resolved.</li>
          <li>Communication delays of up to 22 minutes each way will make centralized Earth governance of Martian settlements operationally impossible, driving political autonomy regardless of intent.</li>
        </ul>
      </div>

      <p>
        The core problem is simple: Earth is one planet orbiting one star. Every extinction risk, asteroid
        impact, pandemic, nuclear war, runaway climate, supervolcano, has a single point of failure. A
        species on two planets has a backup. On many planets, it is nearly indestructible.
      </p>
      <p>
        Simple to state. Staggeringly hard to execute. Getting a self-sustaining human presence on another
        planet is fourteen problems stacked in sequence, each one requiring the previous to be substantially
        solved before it can begin. You cannot skip steps. You cannot parallelize the critical path.
        The constraint chain is the mission.
      </p>
      <p>
        What follows is that chain, from the ground up: what each layer actually requires, where the hard
        physics lives, what is being built today, and what remains unsolved.
      </p>

      <div id="layer-01" className="layer-block">
        <div className="layer-number">Layer 01</div>
        <div className="layer-title">Launch: Getting off Earth</div>
        <p>
          The first problem is the hardest physics. Earth&apos;s gravitational well requires roughly 9.4 km/s of
          delta-v to reach low orbit. That number is fixed by the mass of the planet. Chemical rockets,
          burning a fuel and oxidizer to produce hot exhaust, are the only proven method of generating
          that delta-v.
        </p>
        <p>
          The Tsiolkovsky rocket equation governs everything here. For a given exhaust velocity, the ratio
          of propellant mass to payload mass grows exponentially with the required delta-v. For a typical
          kerosene-oxygen rocket reaching orbit, roughly 85 to 90 percent of liftoff mass is propellant.
          The payload is a tiny fraction of what you start with on the pad.
        </p>
        <p>
          For decades, the response to this was expendable rockets: build the vehicle, fly it once, throw
          it away. The Saturn V that took Apollo to the Moon cost roughly $185 million per flight in the
          dollars of the day, on the order of $1 billion once adjusted for inflation to today. The Space
          Shuttle ended up costing on the order of $54,000 per kilogram to orbit once all program costs were
          amortized across every flight. SpaceX changed the equation with Falcon 9. By landing and reflying
          the first stage booster, they demonstrated that a rocket&apos;s most expensive component could be
          recovered and reused. The reused-booster cost is now on the order of $2,700 per kilogram to low
          Earth orbit. Starship, currently in flight testing, is targeting full reusability of both stages
          with a stated goal of costs in the range of $67 to $100 per kilogram to orbit at high flight rates,
          a target SpaceX has repeatedly pushed back and has not yet demonstrated.
        </p>
        <p>
          The difference between $54,000 and roughly $100 per kilogram, if Starship&apos;s target is actually
          reached, is the difference between a technology only governments can afford and one that can
          support an industrial economy in space. Every subsequent layer assumes launch costs continue to
          fall, though how far and how fast remains genuinely uncertain.
        </p>
        <div className="companies">
          {["SpaceX", "Rocket Lab", "Blue Origin", "Relativity Space", "Stoke Space", "Firefly", "Isar Aerospace", "LandSpace", "ABL Space"].map((c) => (
            <span key={c} className="company-tag">{c}</span>
          ))}
        </div>
      </div>

      <div id="layer-02" className="layer-block">
        <div className="layer-number">Layer 02</div>
        <div className="layer-title">In-Space Propulsion: Moving around once up</div>
        <p>
          Reaching low Earth orbit is step one. From there, the solar system requires different propulsion
          for different missions. A transfer to the Moon requires roughly 3 to 4 km/s beyond LEO. Mars
          requires 3.6 to 4.3 km/s depending on the launch window, which opens for about 30 days every 26
          months when Earth and Mars align. Missing a window means waiting two years.
        </p>
        <p>
          Chemical propulsion works for these transfers but is inefficient. The efficiency of a rocket
          engine is measured in specific impulse: seconds of thrust per unit of propellant consumed.
          The best chemical engines (hydrogen-oxygen) achieve around 450 seconds. Electric propulsion, ion
          thrusters and Hall-effect thrusters, can reach the low thousands of seconds, and some designs push
          higher still. The tradeoff is thrust level: electric propulsion generates millinewtons to newtons
          rather than the meganewtons of a chemical engine. It is extremely efficient but extremely slow.
          For cargo and satellites it is ideal. For crewed missions on tight timelines it is not sufficient
          alone.
        </p>
        <p>
          Nuclear thermal propulsion is the compelling middle ground. A nuclear reactor heats propellant,
          typically hydrogen, and expels it at high velocity. The NERVA program of the 1960s and 70s
          demonstrated working nuclear thermal engines on the ground, reaching a specific impulse of roughly
          825 to 850 seconds in testing, close to double chemical performance, at thrust levels useful for
          crewed missions. None have ever flown. Regulatory and political barriers have kept nuclear
          propulsion grounded for decades despite the engineering being substantially proven.
        </p>
        <p>
          For Mars, transit time matters enormously. A chemical transfer takes roughly 6 to 9 months. Crew
          are exposed to deep space radiation, microgravity bone loss, and muscle atrophy for the entire
          duration. A nuclear thermal transit is generally projected to cut that meaningfully, commonly
          cited in the 3-to-4-month range, reducing radiation exposure, consumables mass, and the
          psychological burden of confinement, though this remains a projection, not a flown result.
        </p>
        <div className="companies">
          {["Impulse Space", "Phase Four", "Exotrail", "ThrustMe", "Revolution Space", "Orbion", "Pale Blue"].map((c) => (
            <span key={c} className="company-tag">{c}</span>
          ))}
        </div>
      </div>

      <div id="layer-03" className="layer-block">
        <div className="layer-number">Layer 03</div>
        <div className="layer-title">Lunar: The Moon as proving ground</div>
        <p>
          Three days from Earth, with a return trip possible within days if something goes wrong, the Moon
          offers a proving ground for every capability that Mars will require. A failed ISRU system on the
          Moon means a mission abort and a lessons-learned document. The same failure on Mars means many
          months before any help can arrive.
        </p>
        <p>
          The most important lunar resource is water ice, confirmed in permanently shadowed craters at the
          poles by NASA&apos;s LCROSS impactor mission in 2009 and by subsequent orbital measurements. Water
          ice can be mined, melted, and electrolyzed into hydrogen and oxygen. Hydrogen and oxygen are
          rocket propellant. Oxygen is breathable air. A lunar propellant depot changes the economics of the
          entire solar system: instead of launching propellant from Earth&apos;s deep gravity well, you refuel
          at the Moon&apos;s much shallower one, roughly 2.4 km/s to escape the lunar surface versus 11.2 km/s
          from Earth.
        </p>
        <p>
          The Artemis program&apos;s goal of returning humans to the lunar surface is explicitly framed as
          proving the technologies needed for Mars. ISRU, surface mobility, dust mitigation, radiation
          management, in-suit operations: all of these get tested on the Moon before a crew is committed
          to a months-long transit from which there is no early return. A parallel commercial lunar economy
          is emerging through NASA&apos;s CLPS program, seeding a private-sector supply chain for lunar
          operations.
        </p>
        <div className="companies">
          {["Astrobotic", "Intuitive Machines", "ispace", "Firefly (Blue Ghost)", "Astrolab", "Lunar Outpost", "Masten Space"].map((c) => (
            <span key={c} className="company-tag">{c}</span>
          ))}
        </div>
      </div>

      <div id="layer-04" className="layer-block">
        <div className="layer-number">Layer 04</div>
        <div className="layer-title">Habitation: Keeping humans alive off-Earth</div>
        <p>
          On Earth, the atmosphere provides pressure, filters radiation, moderates temperature, and
          supplies oxygen. None of these are free off-Earth. Every one must be engineered, powered,
          and maintained continuously. A habitat failure on Mars carries no rescue window for at
          minimum several months.
        </p>
        <p>
          Radiation is the first-order problem most habitat designs underestimate. Surface measurements
          from Curiosity&apos;s RAD instrument put the Martian surface dose on the order of a few hundred
          millisieverts per year, commonly cited around 300. The occupational limit for radiation workers
          on Earth is 50 millisieverts annually. The only practical solutions are burying habitats under
          regolith, building substantial above-ground shielding, or locating underground. The sci-fi
          image of glass domes on the Martian surface is a long-term aspiration sitting on top of an
          engineering problem that first-generation construction cannot yet solve.
        </p>
        <p>
          Pressure is the second constraint. Mars atmospheric pressure is approximately 600 pascals,
          roughly 0.6% of Earth sea level. A pressurized habitat must maintain its pressure
          differential continuously through daily temperature swings on the order of 80 to 90 degrees
          Celsius, through dust storms lasting months, through the mechanical stress of airlocks cycling
          as crew and equipment move in and out.
        </p>
        <p>
          Psychology may be the most underestimated constraint of all. ISS crew data, Antarctic
          winter-over studies, and submarine analog research all point in the same direction: the
          quality of the living environment has measurable effects on crew performance, immune
          function, and psychological stability that no pharmaceutical fully substitutes. Window
          access, spatial variety, natural light cycles, the ability to grow plants: mission
          infrastructure, not amenities.
        </p>
        <p>
          Mars Dune Alpha, a 3D-printed analog habitat at NASA&apos;s Johnson Space Center designed by
          Bjarke Ingels Group and built by ICON, has run CHAPEA crew analog missions of roughly a year
          each to generate baseline data on exactly these questions. What volume does a crew member need?
          What spatial transitions matter? What light conditions preserve circadian rhythm?
        </p>
        <div className="companies">
          {["Axiom Space", "Vast Space", "Sierra Space", "Starlab", "ICON", "Bjarke Ingels Group", "Nanoracks"].map((c) => (
            <span key={c} className="company-tag">{c}</span>
          ))}
        </div>
      </div>

      <div id="layer-045" className="layer-block">
        <div className="layer-number">Layer 04.5</div>
        <div className="layer-title">Biology: Reproduction and minimum viable population</div>
        <p>
          Engineering a habitat keeps humans alive. Biology determines whether a colony is a
          permanent presence or a rotating outpost. The two questions are distinct, and the
          second is less understood than almost any other layer in this chain.
        </p>
        <p>
          Reproduction in reduced gravity is an open problem, and it is one of the few layers in this
          piece with a genuinely new 2026 data point. Researchers at the University of Adelaide&apos;s
          Robinson Research Institute published a study in <em>Communications Biology</em> showing that
          simulated microgravity impairs sperm navigation through channels modeling the female
          reproductive tract, without affecting motility itself, producing roughly a 30 percent drop in
          fertilization rates in mice. Adding progesterone, a hormone the egg itself releases to help
          guide sperm, measurably improved navigation in human sperm under the same simulated conditions.
          Separately, a 2023 study published in <em>iScience</em> used a purpose-built device to thaw and
          culture frozen two-cell mouse embryos aboard the ISS: 720 embryos were split between real
          microgravity and an onboard 1g control, and the microgravity group developed into blastocysts
          with normal cell counts and gene expression, indicating that gravity is not required for the
          earliest stages of mammalian cell differentiation.
        </p>
        <p>
          Whether a full-term pregnancy is viable in Martian gravity (0.38g) or Lunar gravity
          (0.16g) remains genuinely unknown. No mammal has been carried to term in reduced gravity, and the
          uterine and placental interactions involved in gestation have not been tested. Popular-science
          writing has floated various speculative names for a hypothetically space-adapted human lineage,
          but no such term is an established part of the scientific literature, and this piece will not
          invent one either. What is established is narrower and more useful: reproduction in altered
          gravity is unresolved, and it is the one layer in this chain whose failure mode cannot be
          engineered around the way a habitat or a power system can.
        </p>
        <p>
          Population thresholds for technical survival are better understood, though the figures below
          come from two different bodies of research answering two different questions, not one continuous
          model. Jean-Marc Salotti, a professor at Bordeaux INP, published the first quantitative
          engineering estimate of a minimum settlement size in <em>Scientific Reports</em> in 2020: 110
          people, the point at which task-sharing lets individuals specialize instead of each person
          needing to master the full survival skill set. That figure is specific and well sourced. The much
          larger numbers sometimes cited for long-term genetic resilience come from a separate literature
          on minimum viable population size for isolated, multi-generational groups, most notably
          anthropologist Cameron Smith&apos;s work proposing a founding population in the 20,000-to-40,000
          range for a multi-generational interstellar voyage. Other population-genetics estimates for a
          colony that must remain genetically healthy for centuries without immigration range more broadly,
          roughly 500 to 10,000 depending on the assumptions used. A Mars settlement fed by continuing
          arrivals from Earth is not the same problem as a sealed generation ship, so these numbers should
          be read as bounding the question, not as a single agreed answer.
        </p>
        <Table
          headers={["Population", "Basis", "Strategic position"]}
          rows={[
            ["110", "Salotti (2020): minimum for task-sharing and basic industrial cycles on Mars.", "Emergency fallback or early outpost."],
            ["500–10,000", "Range cited across population-genetics literature for a colony to stay genetically healthy for centuries without immigration.", "Self-sufficient settlement to city scale."],
            ["20,000–40,000", "Smith: founding population for a sealed, multi-generational interstellar voyage.", "A different problem than a resupplied Mars colony, included here for scale."],
          ]}
        />
      </div>

      <div id="layer-05" className="layer-block">
        <div className="layer-number">Layer 05</div>
        <div className="layer-title">Power: Energy without the grid</div>
        <p>
          Every system in a Mars habitat runs on electrical power. Life support, lighting, heating,
          computing, communications, ISRU processing, robotic systems, food production: all of it.
          There is no grid to connect to and no utility company to call. Power generation and storage
          must be entirely local, entirely reliable, and sized to handle peak demand without margin
          failure.
        </p>
        <p>
          Solar power works on Mars but is substantially degraded relative to Earth. Mars receives
          about 43% of the solar flux Earth does, a direct consequence of sitting roughly 1.5 times
          farther from the Sun. Dust opacity reduces this further: during the 2018 global dust storm,
          atmospheric optical depth over the Opportunity rover&apos;s location reached roughly 10, an
          extreme haze level that blocks the overwhelming majority of surface sunlight. Opportunity, which
          relied on solar power, entered hibernation during the storm and was never heard from again.
        </p>
        <p>
          Nuclear power is the answer for Mars. A fission reactor produces constant,
          weather-independent, 24-hour power regardless of dust, night, or seasonal variation.
          NASA&apos;s Kilopower project demonstrated a small fission reactor in 2018, the KRUSTY test,
          validating a design intended to scale to roughly 1 to 10 kilowatts continuously. Microreactor
          companies targeting terrestrial markets in remote locations and defense applications are
          building related technology, driven by commercial incentives that no longer depend solely on
          NASA contracts.
        </p>
        <div className="companies">
          {["Oklo", "Zeno Power", "BWXT", "X-energy", "Redwire (solar arrays)", "Spectrolab", "Kilopower (NASA)"].map((c) => (
            <span key={c} className="company-tag">{c}</span>
          ))}
        </div>
      </div>

      <div id="layer-06" className="layer-block">
        <div className="layer-number">Layer 06</div>
        <div className="layer-title">ISRU: Making resources locally</div>
        <p>
          In-Situ Resource Utilization is the layer that separates an outpost from a civilization.
          An outpost consumes what it brings from Earth. A civilization produces what it needs from
          what it finds. The economics of Mars make ISRU existential: even under the most optimistic
          launch-cost projections, any consumable that can be produced locally probably should be.
        </p>
        <p>
          The Mars atmosphere is about 95% carbon dioxide at low pressure. The MOXIE experiment on
          the Perseverance rover demonstrated in April 2021 that oxygen can be produced from the Martian
          atmosphere via solid oxide electrolysis, running at roughly 6 grams of oxygen per hour in its
          early tests and continuing to operate reliably across seven runs and multiple Martian seasons
          through the rest of 2021, toward a design target around 12 grams per hour. A full-scale system
          sized for a human mission would need to run continuously at far larger scale for months before
          crew arrive.
        </p>
        <p>
          Water is more complex. Mars has water ice in the polar caps and subsurface deposits at
          mid-latitudes. Extracting it requires drilling, heating, and collecting vapor in a
          low-pressure environment with abrasive dust. Water covers three needs simultaneously:
          drinking water, oxygen production via electrolysis, and hydrogen production for
          rocket propellant.
        </p>
        <p>
          Regolith, the loose rock and soil covering the surface, can be used as a construction
          material if properly processed. The perchlorates must be removed first. Processed
          regolith can be sintered or 3D printed into structural elements. ICON&apos;s research into
          printing structures from basalt analogs is directly aimed at developing a system
          adaptable to Martian feedstock.
        </p>
        <p>
          The seed factory concept, a small robotic package that uses in-situ resources to replicate
          itself, is an appealing idea for driving the cost of local infrastructure down over successive
          generations of self-replication. Cost projections for delivering mass to the Martian surface vary
          enormously depending on architecture, from SpaceX&apos;s own optimistic 2016 target of roughly
          $140 per kilogram for a fully reusable, ISRU-refueled system, to far higher figures for
          expendable, one-off missions. No credible, sourced figure exists for what a mature
          self-replicating factory would eventually bring the effective cost down to; any specific number
          attached to that idea, including figures that have circulated informally, should be treated as
          an illustrative back-of-envelope exercise, not a modeled result. Settlements will likely follow
          a vitamins-and-info model in the interim, importing high-complexity components such as computer
          chips from Earth while manufacturing bulk materials and fuel locally.
        </p>
        <Table
          headers={["Subsystem", "Function", "Technical maturity (2026)"]}
          rows={[
            ["Fabrication (3D printers)", "Production of components from regolith or metal powders.", "Validated on ISS (plastics)."],
            ["Actuators", "Production of motors and robotic arms for self-assembly.", "Research stage (3D-printed motors)."],
            ["Control electronics", "Production of circuit boards and sensors.", "Extremely difficult (nanoscale precision required)."],
            ["Refining and casting", "Extraction of aluminum, iron, and silicon from regolith.", "Demonstrated by MOXIE (oxygen extraction)."],
          ]}
        />
        <div className="companies">
          {["OxEon Energy (MOXIE heritage)", "Maana Electric", "Air Company", "Honeybee Robotics", "OffWorld", "ICON"].map((c) => (
            <span key={c} className="company-tag">{c}</span>
          ))}
        </div>
      </div>

      <div id="layer-07" className="layer-block">
        <div className="layer-number">Layer 07</div>
        <div className="layer-title">Robotics: Machines that go first</div>
        <p>
          Robots should build the landing pad, construct the initial habitat shell, activate the power
          systems, and verify that life support is functional before a crew commits to landing. The
          sequencing matters: every task completed by a robot before crew arrival reduces time crew
          must spend in suits doing dangerous surface work.
        </p>
        <p>
          Autonomy is non-negotiable for Mars robotics. The one-way communication delay between Earth
          and Mars ranges from about 3 to 22 minutes depending on orbital positions. Remote control of a
          robot digging a trench or assembling a structure is impossible at these delays. Mars robots
          must complete complex, multi-step tasks with minimal human oversight, detect and recover
          from failures autonomously, and communicate results back for human review rather than
          requesting instruction at every decision point.
        </p>
        <div className="companies">
          {["MDA Space", "Motiv Space Systems", "Astroscale", "GITAI", "Starfish Space", "Honeybee Robotics", "OffWorld", "Boston Dynamics"].map((c) => (
            <span key={c} className="company-tag">{c}</span>
          ))}
        </div>
      </div>

      <div id="layer-08" className="layer-block">
        <div className="layer-number">Layer 08</div>
        <div className="layer-title">Food: Closing the biological loop</div>
        <p>
          A human requires roughly 2,000 to 3,000 calories per day depending on body mass and activity
          level, plus adequate protein, fat, vitamins, and minerals for long-term health. A crew of six
          on Mars for two years, at a conservative 2,000-calorie planning figure, requires on the order of
          8.8 million calories across the mission, not counting the psychological and nutritional benefits
          of food variety that long-duration isolation studies consistently show matter to crew
          performance.
        </p>
        <p>
          Controlled-environment agriculture, growing plants in sealed chambers with recycled water,
          artificial lighting, and atmospheric CO2, is the near-term solution. The MELiSSA project
          run by ESA, initiated in 1989, has spent over three decades developing closed-loop life support
          systems that recycle organic waste into nutrients for plant growth.
        </p>
        <p>
          The longer-term solution is more radical. Solar Foods has demonstrated the ability to
          produce protein from CO2, water, and electricity using microorganisms, with no sunlight
          or agriculture required. Their product Solein is produced entirely from atmospheric gases.
          On Mars, with its CO2-rich atmosphere and nuclear electricity, this process requires no
          imported feedstock at all. Cultivated meat, grown from animal cell cultures without
          raising animals, closes the protein gap further. These technologies are being developed
          for Earth markets, but Mars is the environment they were effectively designed for.
        </p>
        <p>
          For long-term habitation, food and life support systems are increasingly framed around a
          bioregenerative model. A January 2026 paper in <em>The Innovation</em> lays out a four-stage
          paradigm for exactly this: biological pioneering, using extremophile microorganisms to
          establish baseline survival conditions; biological conversion, using microbes to biomine metals
          from regolith; biological fabrication, synthesizing construction materials through biological
          processes; and integration into a self-sustaining life support system. Related work in
          <em> Frontiers in Microbiology</em> in 2026 notes that biomining experiments such as BioRock and
          BioAsteroid have proven microorganisms can leach metals from rock under space-relevant
          conditions, though scale-up to industrial output has not yet been demonstrated.
        </p>
        <div className="companies">
          {["Interstellar Lab", "Solar Foods", "Air Protein", "Aleph Farms", "Space Tango", "MELiSSA (ESA)"].map((c) => (
            <span key={c} className="company-tag">{c}</span>
          ))}
        </div>
      </div>

      <div id="layer-09" className="layer-block">
        <div className="layer-number">Layer 09</div>
        <div className="layer-title">Communications: Staying connected</div>
        <p>
          Communication with Mars is governed by physics that cannot be engineered around. Earth-Mars
          distance varies from roughly 54.6 million to 401 million kilometers, producing one-way
          communication delays of about 3 to 22 minutes. Every communication is asynchronous. Mars crews
          cannot consult Earth for real-time guidance in emergencies. Mission control cannot remotely
          operate Mars systems in real time.
        </p>
        <p>
          The infrastructure requirements include relay satellites in Mars orbit to maintain contact
          when the planet rotates away from the direct Earth line, sufficient ground station capacity
          on Earth, and eventually a deep-space internet protocol capable of handling delay-tolerant
          networking. NASA&apos;s Deep Space Network currently handles Mars communications for robotic
          missions. Scaling it for crewed missions and a settlement with significant data requirements
          is an unsolved infrastructure problem.
        </p>
        <p>
          Within Mars itself, a local communications network is needed: surface relay stations,
          satellite constellations for global coverage, and high-bandwidth links between habitat
          modules and surface vehicles. Starlink is the Earth layer. The Mars layer has not been
          designed.
        </p>
        <div className="companies">
          {["SpaceX Starlink", "Amazon Kuiper", "ATLAS Space Operations", "Viasat", "Telesat", "NASA DSN"].map((c) => (
            <span key={c} className="company-tag">{c}</span>
          ))}
        </div>
      </div>

      <div id="layer-10" className="layer-block">
        <div className="layer-number">Layer 10</div>
        <div className="layer-title">Earth Observation: Eyes on everything</div>
        <p>
          Before landing humans anywhere on Mars, you need the surface in detail. Slope, composition,
          subsurface ice presence, dust storm frequency, thermal properties, hazard density: all of
          this must be mapped from orbit before a landing site is committed. Once settlement begins,
          ongoing observation supports site selection for expansion, resource prospecting, and
          monitoring of dust storm development that might affect solar power or EVA planning.
        </p>
        <p>
          Synthetic aperture radar sees through dust and functions at night, which makes it
          particularly valuable for Mars where global dust storms can obscure optical imaging for
          months. Hyperspectral imaging identifies mineral composition from orbit, supporting ISRU
          site selection. Thermal imaging maps subsurface ice through diurnal temperature variations.
        </p>
        <p>
          The commercial Earth observation industry has driven down the cost of satellite imagery
          dramatically. Planet Labs images most of Earth&apos;s landmass daily. Capella Space and Umbra
          provide commercial SAR. These companies are building the observation infrastructure and data
          processing pipelines that translate raw imagery into actionable intelligence: the same
          technology stack that reconnaissance for a settlement program requires.
        </p>
        <div className="companies">
          {["Planet Labs", "Capella Space", "Umbra", "BlackSky", "Spire Global", "ICEYE", "Albedo", "Pixxel"].map((c) => (
            <span key={c} className="company-tag">{c}</span>
          ))}
        </div>
      </div>

      <div id="layer-11" className="layer-block">
        <div className="layer-number">Layer 11</div>
        <div className="layer-title">Suits: The human-environment interface</div>
        <p>
          A spacesuit is the minimum viable habitat. It contains everything needed to keep a human
          alive in vacuum or near-vacuum: pressure shell, oxygen supply, CO2 scrubbing, temperature
          regulation, communications, and enough power for a multi-hour EVA, while allowing enough
          dexterity for a human to perform useful work with their hands.
        </p>
        <p>
          Martian dust is fine enough to penetrate most seal designs over repeated use cycles, and
          its perchlorate content makes contamination into the habitat a genuine health risk. Bearing
          seals, glove interfaces, and boot closures all degrade with dust ingestion in ways that
          are well documented from Apollo and still not fully solved. Dust mitigation through
          electrostatic repulsion, improved seal design, or decontamination airlocks is an active
          engineering problem.
        </p>
        <p>
          Suit mobility, the ability to bend, kneel, reach, and grip in a pressurized suit, has
          always been the fundamental ergonomic challenge of spacesuit design. Apollo astronauts
          fatigued quickly during EVAs partly from the muscular effort of working against suit
          pressure. Next-generation suits using advanced materials and improved joint designs aim
          to substantially reduce this fatigue load.
        </p>
        <div className="companies">
          {["Axiom Space (AxEMU)", "Collins Aerospace", "ILC Dover", "Final Frontier Design", "Pablo Design"].map((c) => (
            <span key={c} className="company-tag">{c}</span>
          ))}
        </div>
      </div>

      <div id="layer-12" className="layer-block">
        <div className="layer-number">Layer 12</div>
        <div className="layer-title">Mining: Raw materials</div>
        <p>
          Mars has iron, aluminum, silicon, magnesium, calcium, and sulfur in its surface rocks in
          quantities sufficient for large-scale construction. The asteroid belt contains metallic
          asteroids with iron-nickel cores and platinum-group metal concentrations far higher than
          Earth&apos;s richest surface deposits. The Moon has titanium in its mare basalts,
          helium-3 in regolith implanted by the solar wind, and water ice in permanently shadowed
          craters.
        </p>
        <p>
          The economics of asteroid mining depend entirely on whether extracted materials can be used
          in space rather than returned to Earth. Returning platinum to Earth from an asteroid
          requires overcoming Earth&apos;s gravity well twice. Using iron-nickel from a metallic asteroid
          to build space structures in orbit never has to lift that material out of Earth&apos;s gravity
          well at all. The value proposition shifts entirely when the customer is the space economy
          rather than the terrestrial one.
        </p>
        <div className="companies">
          {["AstroForge", "TransAstra", "OffWorld", "ispace (lunar water ice)", "Karman+"].map((c) => (
            <span key={c} className="company-tag">{c}</span>
          ))}
        </div>
      </div>

      <div id="layer-13" className="layer-block">
        <div className="layer-number">Layer 13</div>
        <div className="layer-title">Manufacturing: Making things off-Earth</div>
        <p>
          True independence from Earth requires the ability to manufacture: to take raw materials and
          produce functional equipment, replacement parts, construction elements, and eventually new
          technology without Earth supply chains.
        </p>
        <p>
          Microgravity manufacturing enables processes impossible on Earth. Without convection currents,
          crystal growth proceeds without gravity-driven defects. Fiber optic preforms grown in
          microgravity have demonstrated lower attenuation than Earth-grown equivalents in early
          commercial trials. Pharmaceutical crystals, high-performance alloys, and exotic semiconductor
          materials are all candidates for orbital manufacturing. Varda Space Industries is developing
          reentry capsules specifically to return microgravity-manufactured products to Earth customers.
        </p>
        <p>
          On planetary surfaces, additive manufacturing from local materials is the path to
          construction at scale. 3D printing concrete analogs from Martian regolith can produce
          structural elements without importing building materials. ICON&apos;s Project Olympus work for
          NASA is developing the construction technology that a Mars settlement will require.
        </p>
        <p>
          The full vision is a closed manufacturing loop: ISRU extracts raw materials, robotics
          processes them, manufacturing converts them into equipment and structures, and the
          settlement grows without requiring a proportional growth in Earth supply missions.
          That is the threshold condition for a self-sustaining civilization.
        </p>
        <div className="companies">
          {["Varda Space Industries", "Space Forge", "Redwire", "ICON", "Nanoracks", "Made In Space"].map((c) => (
            <span key={c} className="company-tag">{c}</span>
          ))}
        </div>
      </div>

      <div id="layer-14" className="layer-block">
        <div className="layer-number">Layer 14</div>
        <div className="layer-title">Governance: Law without a jurisdiction</div>
        <p>
          Every prior layer is an engineering problem. This one is not. The legal framework
          governing what happens in space was written in 1967 and has not been substantively
          updated since. It was not written for private companies building settlements or
          extracting resources at commercial scale.
        </p>
        <p>
          The foundational tension is between two incompatible frameworks. The Artemis Accords,
          a US-led bilateral framework, permit the extraction and private ownership of space resources,
          and had grown to roughly 70 signatory countries by mid-2026. The Moon Treaty of 1979 defines
          space resources as the common heritage of mankind and effectively prohibits private ownership.
          The Moon Treaty lacks the signatures of any major spacefaring nation, which does not resolve
          the conflict so much as defer it. As resource extraction becomes commercially real, the
          legal gap between these two frameworks becomes an operational one. Which law governs a
          mining claim on the lunar surface? Which court adjudicates a dispute between operators
          from signatory and non-signatory nations? No current answer exists.
        </p>
        <p>
          The communication delay creates a second governance problem that physics imposes without
          appeal. One-way delay between Earth and Mars ranges from roughly 3 to 22 minutes. A round-trip
          lag that can approach 45 minutes at maximum distance makes centralized Earth governance of a
          Martian settlement operationally unworkable. Emergency decisions cannot wait for Earth&apos;s
          input. Legal disputes cannot be adjudicated on Earth timescales. Martian settlements will of
          necessity develop independent governance structures capable of making binding decisions without
          reference to Earth. The legal literature describes this trajectory as polycentric governance:
          independent decision centers operating without a central authority, analogous to
          maritime law in its early development. The eventual outcome, on long enough timescales,
          is plausibly some form of political autonomy. That is not speculation about distant futures.
          It is the logical endpoint of the physics.
        </p>
      </div>

      <h2 id="dependency-graph">The dependency graph</h2>
      <p>
        These layers are not parallel tracks. Each one depends on the layers below it being
        substantially functional. Habitation without Power is a dead habitat. ISRU without Robotics
        means humans doing backbreaking surface work in suits. Manufacturing without ISRU means
        shipping raw materials from Earth indefinitely. The graph matters because it tells you where
        investment bottlenecks live.
      </p>
      <div className="dep-graph">{`Launch → Propulsion → Lunar (proving ground)
                        ↓
            Habitation + Power + ISRU (survival triad)
                        ↓
         Biology: reproduction + population thresholds
                        ↓
       Robotics + Food + Manufacturing (industrial base)
                        ↓
           Governance + Sovereignty (political base)
                        ↓
       Comms + Observation + Suits + Mining (scale)`}</div>
      <p>
        The survival triad is the current bottleneck in engineering terms. Power is the furthest
        along, driven by commercial microreactor development and legacy NASA nuclear programs.
        ISRU is being actively demonstrated on Mars by Perseverance. Habitation is the least
        mature, which is why the analog mission programs running now are generating the baseline
        data that habitat designers need.
      </p>
      <p>
        The biological layer sits below the survival triad and has received almost no serious
        investment relative to its importance. It is the only layer whose failure mode is not a
        technical problem that can be engineered around: if full-term pregnancy in reduced gravity
        proves impossible, a colony fed only by local reproduction does not sustain itself. The
        Salotti threshold of 110 people for technical survival, and the much larger population figures
        debated in the genetic-resilience literature, define the outer bounds of the population ramp
        that every other layer must eventually support.
      </p>
      <p>
        Governance is the layer that does not appear on most technical roadmaps and will arrive
        anyway. Communication physics makes some degree of Martian political autonomy very likely
        on long enough timescales. The legal framework for the transition does not exist yet.
      </p>

      <h2 id="roadmap">Roadmap 2026–2126</h2>
      <p>
        What follows is a speculative century-scale sequencing model, not a forecast grounded in any
        agency&apos;s published plan. It is one way to think about ordering, not a prediction of dates.
      </p>
      <p>
        An exploration phase, roughly 2026 to 2040, would focus on establishing lunar
        infrastructure hubs for power and water extraction and validating in-situ resource
        utilization at operational scale. The Moon is the proving ground: three days from Earth,
        with a return window measured in days rather than months.
      </p>
      <p>
        A foundational phase, roughly 2040 to 2075, would see the first Martian settlements approach
        the Salotti threshold of 110 people. Serious research on extraterrestrial reproduction would need
        to begin in earnest during this window. Whether a self-sustaining biological presence is
        possible would need to be answered here, before the population investment required for the next
        phase becomes difficult to reverse.
      </p>
      <p>
        A later, sovereign phase, roughly 2075 to 2126, would see Martian and orbital populations reach
        into the thousands or tens of thousands, with meaningful industrial self-sufficiency. A
        transition toward some form of interplanetary political structure would plausibly begin, driven
        by communication physics as much as by political will. Governance structures capable of
        operating without Earth&apos;s input would need to have been developing for decades by this
        point.
      </p>

      <h2 id="the-bet">The bet</h2>
      <p>
        The companies in each vertical above are building discrete pieces of a system no single entity
        could assemble alone. Launch, shelter, power, air, food, construction, raw materials: each is
        a separate industry, a separate capital stack, a separate technical discipline. What connects
        them is the dependency chain above.
      </p>
      <p>
        The physics mostly works, or is close enough to working that the remaining problems are
        engineering, not new laws of nature. The economics are approaching viability as launch costs
        fall, if they keep falling. The technology in each layer is in various stages of active
        development. The remaining questions are sequencing, capital allocation, and which layers get
        solved in which order, plus at least one open biological question nobody currently knows how to
        answer.
      </p>
      <p>
        Understanding the constraint chain is understanding where the leverage lives. The layers that
        are genuinely bottlenecked, where progress unlocks everything downstream, are where the most
        important work is being done. That is the map.
      </p>

      <h2 id="sources">Sources</h2>
      <ol className="text-zinc-600 text-xs space-y-1 font-mono">
        <li>Nature Scientific Reports, Jean-Marc Salotti, &quot;Minimum Number of Settlers for Survival on Another Planet&quot; (2020)</li>
        <li>Communications Biology, &quot;Simulated microgravity alters sperm navigation, fertilization, and embryo development in mammals&quot; (University of Adelaide, Robinson Research Institute, 2026)</li>
        <li>iScience / Cell Press, &quot;Effect of microgravity on mammalian embryo development evaluated at the International Space Station&quot; (2023)</li>
        <li>The Innovation, &quot;Extraterrestrial bioconstruction technology system: Bridging space station applications and deep-space missions&quot; (January 2026)</li>
        <li>Frontiers in Microbiology, &quot;Integrating resource utilization and bioregenerative life support systems for sustainable space exploration&quot; (2026)</li>
        <li>NASA, &quot;10 Things: Massive Dust Storm on Mars&quot; and Mars Reconnaissance Orbiter dust-storm reporting (2018)</li>
        <li>NASA, &quot;NASA&apos;s Perseverance Mars Rover Extracts First Oxygen From Red Planet&quot; (April 2021); MIT News, MOXIE mission coverage</li>
        <li>NASA, &quot;Demonstration Proves Nuclear Fission System Can Provide Space Exploration Power&quot; (Kilopower/KRUSTY, 2018)</li>
        <li>NASA Goddard Space Flight Center, Moon Fact Sheet (escape velocity and lunar constants)</li>
        <li>Wikipedia / AIAA, NERVA program specific impulse and Project Rover history</li>
        <li>The Planetary Society, &quot;How much did the Apollo program cost?&quot; (Saturn V per-launch cost)</li>
        <li>Hacker News discussion citing Space Shuttle and Falcon 9 cost-per-kilogram figures; New Space Economy, &quot;How Accurate Were Elon Musk&apos;s Falcon 9 and Starship $/kg Claims?&quot; (2026)</li>
        <li>SpaceX, Interplanetary Transport System presentation (2016), cost-per-kilogram-to-Mars target</li>
        <li>NASA Science, Mars temperature overview; Royal Belgian Institute for Space Aeronomy, Mars day-night temperature difference</li>
        <li>NASA, Artemis Accords signatory tracker; State Department, Artemis Accords program page (2026 signatory count)</li>
        <li>Planet Pailly / Cameron Smith (Portland State University), minimum viable population estimates for interstellar colonization</li>
      </ol>
    </>
  );
}
