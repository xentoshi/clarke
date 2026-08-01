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
];

export default function DesigningForMarsPost() {
  return (
    <>
      <p>
        Every building on Earth is designed with a set of assumptions so fundamental that architects
        rarely state them: the atmosphere provides pressure, the magnetosphere deflects radiation,
        gravity is 9.8 m/s², water flows from pipes, air comes through windows, and if something
        goes badly wrong, you can leave. Mars removes most of these assumptions and makes leaving
        impossible for at minimum seven months.
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
        pressure sits at 0.6 kilopascals, a differential of roughly 168 to 1. It must limit crew
        radiation exposure to below 50 millisieverts per year in an environment that delivers around
        300 millisieverts annually on the surface. It must remain habitable through daily temperature
        swings between -80 and +20 degrees Celsius. It must function as a dust-tight enclosure against
        a soil that contains toxic perchlorates at roughly 0.5 percent concentration. And it must keep
        a small group of people psychologically functional across a multi-year stay with no prospect
        of early departure.
      </p>
      <p>
        These requirements push against each other constantly. Solving radiation exposure wants mass
        and burial. Solving pressure differential wants lightweight, airtight structures. Solving
        psychology wants space, windows, and natural light. Each solution has a cost in mass, energy,
        complexity, or the others.
      </p>

      <h2 id="radiation">Radiation: go underground</h2>
      <p>
        Mars has no global magnetic field and an atmosphere that provides less than 1 percent of
        Earth&apos;s radiation shielding. The surface dose of around 300 millisieverts per year is six
        times the occupational limit for radiation workers on Earth and would exceed NASA&apos;s historical
        career limit for astronauts in under three years. A crew spending a decade on Mars at surface
        exposure levels accumulates a radiation dose that meaningfully raises lifetime cancer risk.
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
        the glass domes in science fiction. A structure that provides adequate radiation shielding
        from surface-piled regolith needs roughly 2.5 to 3 meters of Martian soil above it. That
        is a buried building with no direct sky view. Windows of any kind become an engineering
        problem, not a design feature. Natural light requires fiber optic systems or light wells
        that add structural complexity.
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
        Maintaining a pressure differential of 168 to 1 continuously, for decades, through
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
        ISS provides roughly 93 cubic meters of habitable volume per crew member across its
        pressurized modules. Submarine crews function in substantially less. Antarctic
        winter-over stations have generated extensive data on isolation psychology at timescales
        of six to twelve months.
      </p>
      <p>
        Mars Dune Alpha, the 160-square-meter habitat 3D-printed by ICON and designed by Bjarke
        Ingels Group at NASA&apos;s Johnson Space Center, was built specifically to generate baseline
        data on this question. Four crew members completed a 12-month analog mission inside it
        starting in 2023. The structure includes distinct zones for sleeping, working, exercising,
        and food production, with spatial transitions between them that create a sense of
        progression through different functional areas rather than a single undifferentiated volume.
      </p>
      <p>
        The consistent finding from isolation analog studies, including submarine service, Antarctic
        stations, and previous NASA habitat simulations, is that the quality of the spatial
        experience matters more than the raw volume. A well-designed 50 cubic meters sustains crew
        better than a poorly designed 150 cubic meters. The specific factors that appear most
        significant are the ability to find genuine privacy, the existence of a social gathering
        space distinct from work and sleep areas, access to something that changes, whether that
        is growing plants, varying light, or a view, and the perception of control over the
        immediate environment.
      </p>
      <p>
        Hassell Studio&apos;s Mars habitat concept addresses this through deliberate biome differentiation:
        sleeping pods offer genuine acoustic and visual privacy, a central commons serves as the
        social anchor, and integrated food growing areas create a living element within the
        inhabited space. The growing areas are not segregated as utility space. They are embedded
        in the areas where crew spend unstructured time, both because tending plants appears to
        have measurable positive effects in isolation studies and because the presence of something
        alive and changing is psychologically distinct from a static built environment.
      </p>

      <h2 id="light">Light</h2>
      <p>
        Mars receives about 43 percent of the solar irradiance Earth does, and buried or
        regolith-covered habitats receive none of it directly. Providing adequate light inside
        a Mars habitat is an energy problem as much as an architectural one.
      </p>
      <p>
        Artificial lighting can replicate the spectral content and intensity of sunlight, and
        tunable LED systems can cycle through color temperatures that track circadian rhythms
        across a Martian day, which runs 24 hours and 37 minutes. The circadian mismatch
        between Earth and Mars is small enough that the body adapts, but maintaining consistent
        light-dark cycles matters significantly for sleep quality and immune function in
        long-duration isolation. Antarctic winter-over research has produced strong evidence
        that inadequate light management is a primary driver of the psychological deterioration
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
        Every kilogram of building material launched from Earth costs thousands of dollars
        even at optimistic future launch prices. The structural logic of Mars habitat design
        changes fundamentally when materials available on the surface can substitute for
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
        The standard ISS airlock design requires two people to operate safely: one inside and
        one outside. A Mars habitat airlock designed for solo EVA operation, which a small
        crew will frequently need, requires different mechanical and procedural design.
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
        The strongest lesson from the commissions and analog studies of the last decade is that
        Earth-trained architectural intuitions apply poorly to Mars in specific, predictable ways.
      </p>
      <p>
        The preference for large open plans, common in contemporary architecture, conflicts with
        both pressure vessel geometry and acoustic privacy requirements. Open plans are easier
        to heat and ventilate on Earth. In a sealed habitat, sound travels further and privacy
        is harder to achieve. The Mars Dune Alpha research has generated data suggesting that
        crew strongly prefer spaces that can be physically closed off over open configurations,
        regardless of their stated preferences before the mission.
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
    </>
  );
}
