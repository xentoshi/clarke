import type { TocItem } from "@/components/TableOfContents";
import { CompanyTag } from "@/components/CompanyTag";

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
          <li>The minimum threshold for technical survival on Mars is 110 people. Long-term genetic resilience requires approximately 40,000.</li>
          <li>Reproduction in reduced gravity is an open problem. A 2026 study found a 30% drop in fertilization rates in microgravity. Full-term pregnancy in Martian or Lunar gravity has never been tested.</li>
          <li>A 1-ton self-replicating seed factory could reduce the effective cost of local infrastructure from $2 million per kilogram to under $20 within seven generations of replication.</li>
          <li>The Artemis Accords and the Moon Treaty are legally irreconcilable on resource ownership. The conflict is deferred, not resolved.</li>
          <li>Communication delays of up to 20 minutes will make centralized Earth governance of Martian settlements operationally impossible, driving political autonomy regardless of intent.</li>
        </ul>
      </div>

      <p>
        The core problem is simple: Earth is one planet orbiting one star. Every extinction risk, asteroid
        impact, pandemic, nuclear war, runaway climate, supervolcano, has a single point of failure. A
        species on two planets has a backup. On many planets, it is nearly indestructible.
      </p>
      <p>
        Simple to state. Staggeringly hard to execute. Getting a self-sustaining human presence on another
        planet is thirteen problems stacked in sequence, each one requiring the previous to be substantially
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
          it away. The Saturn V that took Apollo to the Moon cost roughly $185 million per flight in 2023
          dollars. The Space Shuttle ended up costing approximately $54,000 per kilogram to orbit once all
          costs were accounted for. SpaceX changed the equation with Falcon 9. By landing and reflying the
          first stage booster, they demonstrated that a rocket&apos;s most expensive component could be recovered
          and reused. The cost fell to roughly $2,700 per kilogram to low Earth orbit. Starship, currently
          in flight testing, targets full reusability of both stages and aims for costs below $100 per
          kilogram to orbit.
        </p>
        <p>
          The difference between $54,000 and $100 per kilogram is the difference between a technology
          only governments can afford and one that can support an industrial economy in space. Every
          subsequent layer assumes launch costs continue to fall.
        </p>
        <div className="companies">
          {["SpaceX", "Rocket Lab", "Blue Origin", "Relativity Space", "Stoke Space", "Firefly", "Isar Aerospace", "LandSpace", "ABL Space"].map((c) => (
            <CompanyTag key={c} name={c} />
          ))}
        </div>
      </div>

      <div id="layer-02" className="layer-block">
        <div className="layer-number">Layer 02</div>
        <div className="layer-title">In-Space Propulsion: Moving around once up</div>
        <p>
          Reaching low Earth orbit is step one. From there, the solar system requires different propulsion
          for different missions. A transfer to the Moon requires about 3.1 km/s beyond LEO. Mars requires
          3.6 to 4.3 km/s depending on the launch window, which opens for about 30 days every 26 months
          when Earth and Mars align. Missing a window means waiting two years.
        </p>
        <p>
          Chemical propulsion works for these transfers but is inefficient. The efficiency of a rocket
          engine is measured in specific impulse: seconds of thrust per unit of propellant consumed.
          The best chemical engines achieve around 450 seconds. Electric propulsion, ion thrusters and
          Hall-effect thrusters, achieves 1,500 to 10,000 seconds. The tradeoff is thrust level: electric
          propulsion generates millinewtons to newtons rather than the meganewtons of a chemical engine.
          It is extremely efficient but extremely slow. For cargo and satellites it is ideal. For crewed
          missions on tight timelines it is not sufficient alone.
        </p>
        <p>
          Nuclear thermal propulsion is the compelling middle ground. A nuclear reactor heats propellant,
          typically hydrogen, and expels it at high velocity. Theoretical specific impulse is around 900
          seconds, twice chemical performance, at thrust levels useful for crewed missions. The US ran the
          NERVA program in the 1960s and demonstrated working nuclear thermal engines on the ground. None
          have ever flown. Regulatory and political barriers have kept nuclear propulsion grounded for fifty
          years despite the engineering being substantially proven.
        </p>
        <p>
          For Mars, transit time matters enormously. A chemical transfer takes 6 to 9 months. Crew are
          exposed to deep space radiation, microgravity bone loss, and muscle atrophy for the entire
          duration. A nuclear thermal transit could cut that to 3 to 4 months, reducing radiation
          exposure, consumables mass, and the psychological burden of confinement.
        </p>
        <div className="companies">
          {["Impulse Space", "Phase Four", "Exotrail", "ThrustMe", "Revolution Space", "Orbion", "Pale Blue"].map((c) => (
            <CompanyTag key={c} name={c} />
          ))}
        </div>
      </div>

      <div id="layer-03" className="layer-block">
        <div className="layer-number">Layer 03</div>
        <div className="layer-title">Lunar: The Moon as proving ground</div>
        <p>
          Three days from Earth, with a return trip possible within days if something goes wrong, the Moon
          offers a proving ground for every capability that Mars will require. A failed ISRU system on the
          Moon means a mission abort and a lessons-learned document. The same failure on Mars means nine
          months before any help can arrive.
        </p>
        <p>
          The most important lunar resource is water ice, confirmed in permanently shadowed craters at the
          poles by LCROSS impact data and orbital measurements. Water ice can be mined, melted, and
          electrolyzed into hydrogen and oxygen. Hydrogen and oxygen are rocket propellant. Oxygen is
          breathable air. A lunar propellant depot changes the economics of the entire solar system:
          instead of launching propellant from Earth&apos;s deep gravity well, you refuel at the Moon&apos;s
          shallow one (1.6 km/s to escape versus 11.2 km/s from Earth).
        </p>
        <p>
          The Artemis program&apos;s goal of returning humans to the lunar surface is explicitly framed as
          proving the technologies needed for Mars. ISRU, surface mobility, dust mitigation, radiation
          management, in-suit operations: all of these get tested on the Moon before a crew is committed
          to a 9-month transit from which there is no early return. A parallel commercial lunar economy
          is emerging through NASA&apos;s CLPS program, seeding a private-sector supply chain for lunar
          operations.
        </p>
        <div className="companies">
          {["Astrobotic", "Intuitive Machines", "ispace", "Firefly (Blue Ghost)", "Astrolab", "Lunar Outpost", "Masten Space"].map((c) => (
            <CompanyTag key={c} name={c} />
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
          minimum seven months.
        </p>
        <p>
          Radiation is the first-order problem most habitat designs underestimate. The Martian surface
          receives roughly 300 millisieverts per year. The occupational limit for radiation workers on
          Earth is 50 millisieverts annually. The only practical solutions are burying habitats under
          regolith, building substantial above-ground shielding, or locating underground. The sci-fi
          image of glass domes on the Martian surface is a long-term aspiration sitting on top of an
          engineering problem that first-generation construction cannot yet solve.
        </p>
        <p>
          Pressure is the second constraint. Mars atmospheric pressure is approximately 600 pascals,
          roughly 0.6% of Earth sea level. A pressurized habitat must maintain its pressure
          differential continuously through temperature swings of 100 degrees Celsius in a single
          day, through dust storms lasting months, through the mechanical stress of airlocks cycling
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
          Bjarke Ingels Group and built by ICON, is running crew analog missions of 12 months to
          generate baseline data on exactly these questions. What volume does a crew member need?
          What spatial transitions matter? What light conditions preserve circadian rhythm?
        </p>
        <div className="companies">
          {["Axiom Space", "Vast Space", "Sierra Space", "Starlab", "ICON", "Bjarke Ingels Group", "Nanoracks"].map((c) => (
            <CompanyTag key={c} name={c} />
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
          Reproduction in reduced gravity is an open problem. A 2026 study from Adelaide University
          found that sperm maintain motility in microgravity but lose directional sense, producing
          a 30 percent drop in successful fertilization rates. The addition of progesterone improved
          navigation, suggesting that hormonal intervention may be a prerequisite for extraterrestrial
          conception. ISS experiments between 2023 and 2026 demonstrated that frozen mouse two-cell
          embryos can develop into blastocysts under microgravity with normal cell numbers and gene
          expression, establishing that early cell differentiation is not gravity-dependent.
        </p>
        <p>
          Whether a full-term pregnancy is viable in Martian gravity (0.38g) or Lunar gravity
          (0.16g) is unknown. No mammal has been carried to term in reduced gravity. The uterine
          and placental interactions involved in gestation have not been tested. Concerns include
          misdirected body axis formation and accidental monozygotic twinning from altered cell
          localization in the blastocyst cavity. Children born in low gravity may undergo permanent
          physiological adaptation, reduced bone density and altered musculoskeletal development,
          that could prevent them from ever returning to Earth. The evolutionary branch has a name
          in the literature: Homo Spatialis. Whether that represents an obstacle or an outcome
          depends on the timescale you are planning for.
        </p>
        <p>
          Population thresholds are better understood. Research by Professor Jean-Marc Salotti
          establishes 110 people as the minimum threshold for technical survival on Mars. The model
          compares time required to perform all tasks essential for survival against time available
          to settlers. Below 110, individuals must master too many disparate skills to maintain the
          full industrial cycle. Above it, a sharing factor emerges: specialization becomes viable,
          complex tools can be shared, and the colony can sustain itself without each person being
          competent in everything. At 500 people, short-term genetic stability is achievable. For
          long-term genetic resilience across generations and the capacity to survive pandemics or
          catastrophic accidents, the required population is approximately 40,000. The difference
          between an outpost and a civilization is that number.
        </p>
        <Table
          headers={["Population", "Role", "Strategic position"]}
          rows={[
            ["110", "Minimum threshold for technical survival and basic industrial cycles.", "Emergency fallback or early outpost."],
            ["500", "Short-term genetic stability and foundational social structures.", "Self-sufficient village scale."],
            ["10,000", "Significant industrial and cultural diversity.", "Large orbital or Martian city."],
            ["40,000", "Long-term genetic resilience and complex, independent economy.", "Foundation of an independent planetary civilization."],
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
          about 43% of the solar flux Earth does due to its greater distance from the Sun. Dust
          opacity reduces this further: the 2018 global dust storm reduced solar flux at the surface
          by approximately 97% for several months. The Opportunity rover, which relied on solar power,
          died in that storm.
        </p>
        <p>
          Nuclear power is the answer for Mars. A fission reactor produces constant,
          weather-independent, 24-hour power regardless of dust, night, or seasonal variation.
          NASA&apos;s Kilopower project demonstrated a small fission reactor in 2018 producing 1 to 10
          kilowatts continuously. Microreactor companies targeting terrestrial markets in remote
          locations and defense applications are building the same technology Mars needs, driven
          by commercial incentives that no longer depend solely on NASA contracts.
        </p>
        <div className="companies">
          {["Oklo", "Zeno Power", "BWXT", "X-energy", "Redwire (solar arrays)", "Spectrolab", "Kilopower (NASA)"].map((c) => (
            <CompanyTag key={c} name={c} />
          ))}
        </div>
      </div>

      <div id="layer-06" className="layer-block">
        <div className="layer-number">Layer 06</div>
        <div className="layer-title">ISRU: Making resources locally</div>
        <p>
          In-Situ Resource Utilization is the layer that separates an outpost from a civilization.
          An outpost consumes what it brings from Earth. A civilization produces what it needs from
          what it finds. The economics of Mars make ISRU existential: even at Starship&apos;s target
          costs, any consumable that can be produced locally must be.
        </p>
        <p>
          The Mars atmosphere is 95% carbon dioxide at low pressure. The MOXIE experiment on
          the Perseverance rover demonstrated in 2021 that oxygen can be produced from the Martian
          atmosphere via solid oxide electrolysis. MOXIE produced about 6 grams of oxygen per hour
          at small scale. A full-scale system sized for a human mission would need to produce
          kilograms per hour and run continuously for months before crew arrive.
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
          The seed factory concept is the most efficient path to infrastructure at scale: a minimalistic
          robotic package that uses in-situ resources to replicate itself. NASA estimates launching
          1 kilogram to Mars costs $2.7 million. A self-replicating system could reduce the cost of
          local infrastructure to under $20 per kilogram within seven generations of replication.
          Settlements will likely follow a vitamins and info model in the interim, importing
          high-complexity components such as computer chips from Earth while manufacturing bulk
          materials and fuel locally.
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
            <CompanyTag key={c} name={c} />
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
          and Mars ranges from 4 to 24 minutes depending on orbital positions. Remote control of a
          robot digging a trench or assembling a structure is impossible at these delays. Mars robots
          must complete complex, multi-step tasks with minimal human oversight, detect and recover
          from failures autonomously, and communicate results back for human review rather than
          requesting instruction at every decision point.
        </p>
        <div className="companies">
          {["MDA Space", "Motiv Space Systems", "Astroscale", "GITAI", "Starfish Space", "Honeybee Robotics", "OffWorld", "Boston Dynamics"].map((c) => (
            <CompanyTag key={c} name={c} />
          ))}
        </div>
      </div>

      <div id="layer-08" className="layer-block">
        <div className="layer-number">Layer 08</div>
        <div className="layer-title">Food: Closing the biological loop</div>
        <p>
          A human requires roughly 2,000 calories per day, plus adequate protein, fat, vitamins,
          and minerals for long-term health. A crew of six on Mars for two years requires
          approximately 8.8 million calories, not counting the psychological and nutritional
          benefits of food variety that long-duration isolation studies consistently show matter
          to crew performance.
        </p>
        <p>
          Controlled-environment agriculture, growing plants in sealed chambers with recycled water,
          artificial lighting, and atmospheric CO2, is the near-term solution. The MELiSSA project
          run by ESA has spent over 30 years developing closed-loop life support systems that recycle
          organic waste into nutrients for plant growth.
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
          For long-term habitation, food systems must evolve from agricultural chambers into
          integrated biological ecosystems. A 2026 framework proposes four stages: biological
          pioneering, deploying extremophiles to establish basic survival conditions; biological
          conversion, using microbes for biomining metals from regolith; biological fabrication,
          synthesizing construction materials through microbial processes; and integration into
          life support, combining these systems into a self-sustaining bioregenerative loop where
          only energy crosses the system boundary.
        </p>
        <div className="companies">
          {["Interstellar Lab", "Solar Foods", "Air Protein", "Aleph Farms", "Space Tango", "MELiSSA (ESA)"].map((c) => (
            <CompanyTag key={c} name={c} />
          ))}
        </div>
      </div>

      <div id="layer-09" className="layer-block">
        <div className="layer-number">Layer 09</div>
        <div className="layer-title">Communications: Staying connected</div>
        <p>
          Communication with Mars is governed by physics that cannot be engineered around. Earth-Mars
          distance varies from 54.6 million to 401 million kilometers, producing one-way communication
          delays of 3 to 22 minutes. Every communication is asynchronous. Mars crews cannot consult
          Earth for real-time guidance in emergencies. Mission control cannot remotely operate Mars
          systems in real time.
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
            <CompanyTag key={c} name={c} />
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
          dramatically. Planet Labs images the entire Earth daily. Capella Space and Umbra provide
          commercial SAR. These companies are building the observation infrastructure and data
          processing pipelines that translate raw imagery into actionable intelligence: the same
          technology stack that reconnaissance for a settlement program requires.
        </p>
        <div className="companies">
          {["Planet Labs", "Capella Space", "Umbra", "BlackSky", "Spire Global", "ICEYE", "Albedo", "Pixxel"].map((c) => (
            <CompanyTag key={c} name={c} />
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
            <CompanyTag key={c} name={c} />
          ))}
        </div>
      </div>

      <div id="layer-12" className="layer-block">
        <div className="layer-number">Layer 12</div>
        <div className="layer-title">Mining: Raw materials</div>
        <p>
          Mars has iron, aluminum, silicon, magnesium, calcium, and sulfur in its surface rocks in
          quantities sufficient for large-scale construction. The asteroid belt contains metallic
          asteroids with iron-nickel cores and platinum-group metal concentrations orders of magnitude
          higher than Earth&apos;s richest surface deposits. The Moon has titanium in its mare basalts,
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
            <CompanyTag key={c} name={c} />
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
          microgravity have demonstrated substantially lower attenuation than Earth-grown equivalents.
          Pharmaceutical crystals, high-performance alloys, and exotic semiconductor materials are all
          candidates for orbital manufacturing. Varda Space Industries is developing reentry capsules
          specifically to return microgravity-manufactured products to Earth customers.
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
            <CompanyTag key={c} name={c} />
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
          a US-led bilateral framework signed by over forty countries, permit the extraction and
          private ownership of space resources. The Moon Treaty of 1979 defines space resources
          as the common heritage of mankind and effectively prohibits private ownership. The
          Moon Treaty lacks the signatures of any major spacefaring nation, which does not resolve
          the conflict so much as defer it. As resource extraction becomes commercially real, the
          legal gap between these two frameworks becomes an operational one. Which law governs a
          mining claim on the lunar surface? Which court adjudicates a dispute between operators
          from signatory and non-signatory nations? No current answer exists.
        </p>
        <p>
          The communication delay creates a second governance problem that physics imposes without
          appeal. One-way delay between Earth and Mars ranges from 3 to 22 minutes. A 20-minute
          round-trip lag makes centralized Earth governance of a Martian settlement operationally
          unworkable. Emergency decisions cannot wait for Earth&apos;s input. Legal disputes cannot
          be adjudicated on Earth timescales. Martian settlements will of necessity develop
          independent governance structures capable of making binding decisions without reference
          to Earth. The legal literature describes this trajectory as polycentric governance:
          independent decision centers operating without a central authority, analogous to
          maritime law in its early development. The eventual outcome, on long enough timescales,
          is a charter of sovereignty. This is not speculation about distant futures. It is the
          logical endpoint of the physics.
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
        investment. It is the only layer whose failure mode is not a technical problem that can
        be engineered around: if full-term pregnancy in reduced gravity proves impossible, the
        colony does not reproduce. The Salotti threshold of 110 people for technical survival
        and 40,000 for long-term genetic stability define the population ramp that every other
        layer must support.
      </p>
      <p>
        Governance is the layer that does not appear on most technical roadmaps and will arrive
        anyway. Communication physics guarantees Martian political autonomy on long enough
        timescales. The legal framework for the transition does not exist.
      </p>

      <h2 id="roadmap">Roadmap 2026–2126</h2>
      <p>
        The exploration phase, running from 2026 to 2040, focuses on establishing lunar
        infrastructure hubs for power and water extraction and validating in-situ resource
        utilization at operational scale. The Moon is the proving ground: three days from Earth,
        with a return window measured in days rather than months.
      </p>
      <p>
        The foundational phase, from 2040 to 2075, sees the first Martian settlements approach
        the Salotti threshold of 110 people. Early research on extraterrestrial reproduction
        begins in earnest during this window. Whether a self-sustaining biological presence is
        possible must be answered here, before the population investment required for the next
        phase becomes irreversible.
      </p>
      <p>
        The sovereign phase, from 2075 to 2126, sees Martian and orbital populations reach tens
        of thousands, achieving total industrial closure. The transition to an interplanetary
        confederation begins, driven by communication physics as much as political will.
        Governance structures capable of operating without Earth&apos;s input will have been
        developing for decades by this point, whether or not anyone planned for them.
      </p>

      <h2 id="the-bet">The bet</h2>
      <p>
        The companies in each vertical above are building discrete pieces of a system no single entity
        could assemble alone. Launch, shelter, power, air, food, construction, raw materials: each is
        a separate industry, a separate capital stack, a separate technical discipline. What connects
        them is the dependency chain above.
      </p>
      <p>
        The physics works. The economics are approaching viability as launch costs fall. The technology
        in each layer is in various stages of active development. The remaining questions are
        sequencing, capital allocation, and which layers get solved in which order.
      </p>
      <p>
        Understanding the constraint chain is understanding where the leverage lives. The layers that
        are genuinely bottlenecked, where progress unlocks everything downstream, are where the most
        important work is being done. That is the map.
      </p>
    </>
  );
}
