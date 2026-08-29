import type { TocItem } from "@/components/TableOfContents";

export const toc: TocItem[] = [
  { id: "the-brief", label: "The brief" },
  { id: "radiation", label: "Radiation: go underground" },
  { id: "pressure", label: "Pressure: the vessel problem" },
  { id: "dust", label: "Dust: the slow killer" },
  { id: "volume", label: "Volume and psychology" },
  { id: "light", label: "Light" },
  { id: "isru-design", label: "Designing for what Mars provides" },
  { id: "the-airlock", label: "The airlock as infrastructure" },
  { id: "modularity", label: "Modularity and growth" },
  { id: "what-earth-gets-wrong", label: "What Earth architecture gets wrong" },
  { id: "sources", label: "Sources" },
];

export default function DesigningForMarsPost() {
  return (
    <>
      <p>
        Every building on Earth is designed with a set of assumptions so fundamental that architects
        rarely state them: the atmosphere provides pressure, the magnetosphere deflects radiation,
        gravity is 9.8 m/s², water flows from pipes, air comes through windows, and if something
        goes badly wrong, you can leave. Mars removes most of these assumptions and makes leaving
        impossible for a minimum of several months at a time: one-way transit has taken six to nine
        months on the missions flown so far.
      </p>
      <p>
        The result is that designing for Mars is not a matter of adapting Earth architecture to a
        harsher climate. The design constraints are different in kind, and they interact with each
        other in ways that make solutions to one problem generate new versions of another. Understanding
        what the building must do is where the design process has to start.
      </p>

      <h2 id="the-brief">The brief</h2>
      <p>
        A Mars habitat must maintain internal pressure at approximately 101 kilopascals while external
        pressure sits at roughly 0.6 kilopascals, a differential of about 168 to 1. It must limit crew
        radiation exposure toward the 50-millisievert-per-year threshold used for terrestrial radiation
        workers, in an environment that delivered an average of about 244 millisieverts per year at
        the surface during Curiosity&apos;s RAD measurements. It must remain habitable through daily
        temperature swings on the order of 70 degrees Celsius at equatorial sites, on top of a much
        wider seasonal range that reaches below -125°C near the winter poles. It must function as a
        dust-tight enclosure against a soil that contains toxic perchlorates at roughly 0.4 to 0.6
        percent concentration. And it must keep a small group of people psychologically functional
        across a multi-year stay with no prospect of early departure.
      </p>
      <p>
        These requirements push against each other constantly. Solving radiation exposure wants mass
        and burial. Solving pressure differential wants lightweight, airtight structures. Solving
        psychology wants space, windows, and natural light. Each solution has a cost in mass, energy,
        complexity, or the others.
      </p>

      <h2 id="radiation">Radiation: go underground</h2>
      <p>
        Mars has no global magnetic field and an atmosphere that provides a small fraction of
        Earth&apos;s radiation shielding. NASA&apos;s Curiosity rover measured an average surface dose
        equivalent rate of about 0.67 millisieverts per day at Gale Crater, roughly 244 millisieverts
        a year, close to five times the 50 millisievert annual limit used for terrestrial radiation
        workers. NASA&apos;s current career radiation limit for astronauts, a uniform 600 millisieverts
        regardless of age or sex, adopted after a 2021 National Academies recommendation, would be
        exceeded by an unshielded crew member in under three years at that surface dose rate.
      </p>
      <p>
        The material response to radiation is simple: mass between the crew and the sky. Water is
        an effective radiation shield and also a consumable already carried for other purposes.
        Martian regolith provides shielding if piled or printed over a structure. Polyethylene and
        hydrogen-rich polymers shield more efficiently per kilogram than most metals. But all of
        these approaches share a common implication: the habitat needs to be buried, covered, or
        substantially surrounded by material.
      </p>
      <p>
        The visual consequence is that the first generation of Mars habitats will look nothing like
        the glass domes in science fiction. Shielding studies generally put the regolith depth needed
        to meaningfully cut galactic cosmic ray dose in the range of one to a few meters, depending on
        the target dose reduction and the shielding material&apos;s composition. That is a buried building
        with no direct sky view. Windows of any kind become an engineering problem, not a design
        feature. Natural light requires fiber optic systems or light wells that add structural
        complexity.
      </p>
      <p>
        ESA&apos;s concept developed with Foster and Partners addressed this by separating the problem
        into two systems: an inflatable pressure shell provides the air-tight enclosure, while
        a 3D-printed regolith shell constructed by robots provides the radiation shielding and
        structural load bearing. The two systems are decoupled, which means neither has to solve
        both problems simultaneously. The printed shell does not need to be airtight. The
        inflatable does not need to be load-bearing.
      </p>

      <h2 id="pressure">Pressure: the vessel problem</h2>
      <p>
        Maintaining a pressure differential of roughly 168 to 1 continuously, for decades, through
        thermal cycling, dust abrasion, and the mechanical stress of airlocks cycling hundreds
        of times per year, is a structural engineering challenge that has no direct Earth analog.
        The closest comparison is a submarine hull, but submarines operate in a compressive
        environment where external pressure crushes inward. A Mars habitat operates in an
        expansive environment where internal pressure pushes outward, which changes the
        failure modes and the structural geometry.
      </p>
      <p>
        Curved surfaces distribute pressure stress more efficiently than flat ones. Spheres and
        cylinders handle pressure loads better than rectangles. This is why inflatable structures
        are attractive as pressure vessels: they naturally adopt curved geometries under load, and
        they can be packed into a small volume for launch and expanded to full size in place. The
        Bigelow Expandable Activity Module, attached to the ISS since 2016, has demonstrated
        that inflatable pressure shells can maintain integrity over multi-year timescales in a
        harsh orbital environment.
      </p>
      <p>
        The design implication is that rectangular rooms, right-angle corners, and flat walls,
        the basic vocabulary of Earth architecture, are structurally inconvenient on Mars.
        The shapes that work best under pressure loads are the shapes that 3D printing from
        local materials naturally produces. ICON&apos;s Vulcan printing system, and the geometry of
        Mars Dune Alpha it produced with Bjarke Ingels Group, generates curved interior volumes
        as a direct output of the printing process. The aesthetic emerges from the engineering,
        rather than being imposed on top of it.
      </p>

      <h2 id="dust">Dust: the slow killer</h2>
      <p>
        Martian dust is not like Earth dust. It is extremely fine, electrostatically charged,
        and chemically reactive. Perchlorates in the soil are toxic to humans at low concentrations
        and will corrode many metals over time. Dust accumulates on every surface, works its way
        into mechanical joints and bearing seals over repeated use cycles, and coats solar panels,
        reducing their output, and optical sensors, degrading their function.
      </p>
      <p>
        Apollo astronauts found that lunar dust contaminated their equipment faster than expected
        despite spending only a few hours on the surface. Martian dust is finer and more chemically
        aggressive. A habitat designed for years of surface operation needs to treat dust as a
        pervasive system-level problem rather than a housekeeping issue.
      </p>
      <p>
        The design responses operate at multiple scales. Airlocks need decontamination protocols
        and systems to remove dust from suits before crew enter the habitat. Suit storage ideally
        happens in a dedicated transition space where contaminated suits never enter the main
        habitat volume. Ventilation systems need filtration that captures particles at the
        perchlorate scale. Surfaces inside the habitat need to be easy to clean and resistant
        to the abrasion that dust causes when wiped repeatedly.
      </p>
      <p>
        Exterior components face the harder version of the problem. Mechanical seals on airlocks,
        joints on robotic systems, bearing surfaces on rovers: all of these degrade with dust
        ingestion in ways that are well understood from Mars rover operations but not yet solved
        for human-rated systems that must function reliably for years. Electrostatic dust
        mitigation, which uses electric fields to repel charged dust particles, has been
        tested in laboratory conditions but not validated at the scale of a human habitat.
      </p>

      <h2 id="volume">Volume and psychology</h2>
      <p>
        The question of how much space a person needs to remain psychologically functional over
        a multi-year Mars mission has no definitive answer yet, because no one has done it.
        NASA cites roughly 388 cubic meters of habitable volume aboard the ISS for a typical crew
        of seven, on the order of 55 cubic meters per person, well below the 100 to 500 cubic meter
        per-crew-member range NASA&apos;s own habitability guidance targets for long-duration missions.
        Submarine crews function in substantially less. Antarctic winter-over stations have generated
        extensive data on isolation psychology at timescales of six to twelve months.
      </p>
      <p>
        Mars Dune Alpha, the roughly 160-square-meter (1,700-square-foot) habitat 3D-printed by ICON
        and designed by Bjarke Ingels Group at NASA&apos;s Johnson Space Center, was built specifically
        to generate baseline data on this question. Four crew members completed a 378-day analog
        mission inside it starting in June 2023, the first of three planned CHAPEA missions. The
        structure includes distinct zones for sleeping, working, exercising, and food production,
        with spatial transitions between them that create a sense of progression through different
        functional areas rather than a single undifferentiated volume.
      </p>
      <p>
        The consistent finding from isolation analog studies, including submarine service, Antarctic
        stations, and previous NASA habitat simulations, is that the quality of the spatial
        experience matters more than the raw volume. A well-designed smaller footprint can sustain
        crew better than a poorly designed larger one. The specific factors that appear most
        significant are the ability to find genuine privacy, the existence of a social gathering
        space distinct from work and sleep areas, access to something that changes, whether that
        is growing plants, varying light, or a view, and the perception of control over the
        immediate environment.
      </p>
      <p>
        Hassell Studio&apos;s Mars habitat concept, developed with Eckersley O&apos;Callaghan for NASA&apos;s
        3D-Printed Habitat Challenge, addresses this through deliberate biome differentiation:
        sleeping pods offer genuine acoustic and visual privacy, a central commons serves as the
        social anchor, and integrated food growing areas create a living element within the
        inhabited space. The growing areas are not segregated as utility space. They are embedded
        in the areas where crew spend unstructured time, both because tending plants appears to
        have measurable positive effects in isolation studies and because the presence of something
        alive and changing is psychologically distinct from a static built environment.
      </p>

      <h2 id="light">Light</h2>
      <p>
        Mars receives about 43 percent of the solar energy Earth does at the top of each planet&apos;s
        atmosphere, a direct consequence of Mars orbiting roughly 1.5 times farther from the Sun.
        Buried or regolith-covered habitats receive none of it directly. Providing adequate light
        inside a Mars habitat is an energy problem as much as an architectural one.
      </p>
      <p>
        Artificial lighting can replicate the spectral content and intensity of sunlight, and
        tunable LED systems can cycle through color temperatures that track circadian rhythms
        across a Martian day, which runs 24 hours and 39 minutes. The circadian mismatch
        between Earth and Mars is small enough that the body adapts, but maintaining consistent
        light-dark cycles matters significantly for sleep quality and immune function in
        long-duration isolation. Antarctic winter-over research has produced evidence that
        inadequate light management is a contributing factor in the psychological deterioration
        observed in some winter crews.
      </p>
      <p>
        Where window access is possible, the design value exceeds the photon count. ISS crew
        members consistently report that time at the cupola window is among the most important
        psychological resources on the station. The view of Earth, its scale, color, and
        movement, provides a reference point that the interior environment cannot substitute.
        A Mars habitat offers a different but analogous view: a landscape that, however alien,
        is real, changing with time of day and weather, and vastly larger than any interior space.
        Engineering light wells or fiber optic systems to provide even limited sky access to the
        main habitat volume appears justified by the psychological data, even at significant
        structural cost.
      </p>

      <h2 id="isru-design">Designing for what Mars provides</h2>
      <p>
        Every kilogram of building material launched from Earth carries a substantial cost premium
        even under optimistic future launch price scenarios. The structural logic of Mars habitat
        design changes fundamentally when materials available on the surface can substitute for
        shipped mass.
      </p>
      <p>
        Martian regolith, after perchlorate removal and processing, can be sintered or printed
        into structural elements. The basalt composition of much Martian surface material is
        similar to terrestrial basalts that have been used as construction aggregate for
        centuries. Processed regolith can serve as radiation shielding, thermal mass, and
        structural shell material if the processing equipment is landed first.
      </p>
      <p>
        This creates a design approach where the building is conceived in two phases. Phase one,
        which arrives robotically before crew, establishes the regolith-based shell: radiation
        shielding, structural enclosure, landing pad, basic site preparation. Phase two, which
        arrives with or after crew, installs the pressure vessel, life support, and interior fit-out
        within the pre-built shell. The sequence matters: crew should not arrive on a surface
        where they must immediately build their own shelter in suits.
      </p>
      <p>
        Designing for ISRU from the beginning means treating the available local materials as a
        design constraint rather than a contingency. The geometry of what can be printed from
        regolith, the structural properties of sintered basalt, the thermal characteristics of
        a regolith-covered dome: these become inputs to the architectural language rather than
        features imposed after the fact.
      </p>

      <h2 id="the-airlock">The airlock as infrastructure</h2>
      <p>
        On Earth, a door is an afterthought. On Mars, the transition between inside and outside
        is a critical piece of life support infrastructure that every person will use multiple
        times daily for years.
      </p>
      <p>
        The airlock must maintain its pressure integrity through thousands of cycles. It must
        prevent dust contamination from entering the main habitat. It must accommodate suited
        crew members who have limited dexterity and cannot easily see what their hands are doing.
        It must function without failure in an environment where a seal failure causes rapid
        pressure loss.
      </p>
      <p>
        ISS spacewalk procedures normally involve one crew member inside supporting the one or two
        crew members outside, a buddy-system practice built around safety margins rather than a
        fixed mechanical requirement. A Mars habitat airlock designed for solo EVA operation, which
        a small crew will frequently need, requires different mechanical and procedural design.
        The time crew spend in the airlock pressurizing and depressurizing is dead time during
        which they are using consumables, so the cycle time matters for operational efficiency.
      </p>
      <p>
        The physical location of the airlock within the habitat plan is also a design decision
        with operational consequences. Airlocks that require passing through sleeping or
        laboratory areas to reach disturb other crew members and contaminate work spaces with
        dust tracked from the transition zone. Dedicated suit storage and decontamination areas
        adjacent to the airlock, designed as a third zone between outside and inside, appear in
        most serious habitat concepts as a non-negotiable spatial requirement.
      </p>

      <h2 id="modularity">Modularity and growth</h2>
      <p>
        A Mars settlement will not arrive fully formed. The first structure must function as a
        complete habitat for a small crew. Later additions must connect to it without requiring
        the original structure to be rebuilt. The design of connection points, pressure
        interfaces between modules, and the structural logic of expansion is therefore a
        first-order design problem even for the initial habitat.
      </p>
      <p>
        Standardized docking interfaces, borrowed from spacecraft design, allow modules to
        connect with known pressure-tight joints. The difficulty is that spacecraft docking
        interfaces are designed for occasional use in zero gravity. A Mars surface interface
        must work repeatedly in dusty, low-gravity conditions with suited crew, and must
        maintain integrity over decades of thermal cycling.
      </p>
      <p>
        The growth logic also determines the social geometry of the settlement over time.
        A habitat designed to add modules in a linear chain creates a corridor-based settlement.
        One designed around a central hub creates a radial settlement. One designed for
        underground tunnel networks creates a very different relationship between private and
        communal space than either surface alternative. These social geometries matter for
        how settlements of dozens or hundreds of people function, and they are determined by
        decisions made in the design of the first habitat before there is anyone to ask.
      </p>

      <h2 id="what-earth-gets-wrong">What Earth architecture gets wrong</h2>
      <p>
        The strongest lesson from the concepts and analog studies of the last decade is that
        Earth-trained architectural intuitions apply poorly to Mars in specific, predictable ways.
      </p>
      <p>
        The preference for large open plans, common in contemporary architecture, conflicts with
        both pressure vessel geometry and acoustic privacy requirements. Open plans are easier
        to heat and ventilate on Earth. In a sealed habitat, sound travels further and privacy
        is harder to achieve. The Mars Dune Alpha research program was designed in part to generate
        data on whether crew prefer spaces that can be physically closed off over open
        configurations, regardless of their stated preferences before the mission.
      </p>
      <p>
        The assumption that natural materials create warmer psychological environments is
        complicated by what natural materials are available. Regolith-printed surfaces have
        a characteristic texture and color that differs from any Earth building material.
        Whether that aesthetic reads as grounding or alienating over a multi-year exposure is
        unknown. Mars Dune Alpha used printed concrete with interior surfaces that softened the
        visual texture of the printing process. How crew respond to surfaces made from actual
        Martian regolith, which has a different color and composition, will only be known when
        someone lives in one.
      </p>
      <p>
        The deepest problem is that architecture on Earth is ultimately designed for buildings
        that can be left. The psychological burden of genuine inescapability, not discomfort
        or monotony but the fact that departure is physically impossible for months at a time,
        has no Earth analog except long-duration submarine patrols, which last weeks rather
        than years. Designing for that condition requires data that does not yet exist, from
        people who have not yet gone.
      </p>

      <h2 id="sources">Sources</h2>
      <ol className="text-zinc-600 text-xs space-y-1 font-mono">
        <li>D.M. Hassler et al., &quot;Mars&apos; Surface Radiation Environment Measured with the Mars Science Laboratory&apos;s Curiosity Rover,&quot; Science (December 2013)</li>
        <li>Southwest Research Institute, &quot;SwRI scientists publish first radiation measurements from the surface of Mars&quot; (December 2013)</li>
        <li>National Academies of Sciences, Engineering, and Medicine, &quot;Space Radiation and Astronaut Health: Managing and Communicating Cancer Risks&quot; (June 2021)</li>
        <li>NASA, &quot;Mars Facts,&quot; average surface pressure and temperature range (mars.nasa.gov)</li>
        <li>NASA JPL / Mars Exploration Program, &quot;Steady Temperatures at Mars&apos; Gale Crater&quot; (REMS daily temperature data)</li>
        <li>M.H. Hecht et al., &quot;Detection of Perchlorate and the Soluble Chemistry of Martian Soil at the Phoenix Lander Site,&quot; Science (July 2009)</li>
        <li>NASA, &quot;International Space Station Facts and Figures&quot; (nasa.gov)</li>
        <li>NASA, &quot;Crew Health and Performance Exploration Analog (CHAPEA)&quot; mission overview (nasa.gov)</li>
        <li>ICON, &quot;Mars Dune Alpha&quot; project page (iconbuild.com)</li>
        <li>ASCE, &quot;A 3D-Printed Habitat Is Home for Yearlong &apos;Missions to Mars&apos;&quot; (Civil Engineering Source, September 2023)</li>
        <li>NASA GISS, &quot;Mars24 Sunclock: Technical Notes on Mars Solar Time&quot;</li>
        <li>ESA, &quot;Building a Lunar Base With 3D Printing&quot; / Foster + Partners Mars habitat concept (esa.int)</li>
        <li>NASA Centennial Challenges, 3D-Printed Habitat Challenge, HASSELL + Eckersley O&apos;Callaghan Mars concept</li>
        <li>NASA, Bigelow Expandable Activity Module (BEAM) mission overview (nasa.gov)</li>
      </ol>
    </>
  );
}
