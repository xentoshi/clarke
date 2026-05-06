export type Horizon = "2-3y" | "3-7y" | "7-15y";
export type Conviction = "high" | "medium" | "watch";

export interface Narrative {
  slug: string;
  title: string;
  tagline: string;
  thesis: string;
  verticals: string[];
  horizon: Horizon;
  conviction: Conviction;
  catalysts: string[];
  risks: string[];
  keyTickers: string[];
  keyPrivate: string[];
  updatedAt: string;
}

export const horizonLabels: Record<Horizon, string> = {
  "2-3y": "2–3 Years",
  "3-7y": "3–7 Years",
  "7-15y": "7–15 Years",
};

export const convictionLabels: Record<Conviction, string> = {
  high: "High Conviction",
  medium: "Medium Conviction",
  watch: "Watch List",
};

export const convictionColors: Record<Conviction, string> = {
  high: "text-emerald-300 bg-emerald-950 border-emerald-800",
  medium: "text-amber-300 bg-amber-950 border-amber-800",
  watch: "text-zinc-400 bg-zinc-900 border-zinc-700",
};

export const horizonColors: Record<Horizon, string> = {
  "2-3y": "text-violet-300 bg-violet-950 border-violet-800",
  "3-7y": "text-blue-300 bg-blue-950 border-blue-800",
  "7-15y": "text-zinc-400 bg-zinc-900 border-zinc-700",
};

export const narratives: Narrative[] = [
  {
    slug: "starship-civilizational-bet",
    title: "The Starship Civilizational Bet",
    tagline: "Starship is not a rocket. It is the economic infrastructure for a spacefaring civilization.",
    thesis: "Every previous rocket was expendable or partially reusable. Starship is designed to be fully and rapidly reusable like a commercial aircraft. If the cost to orbit drops from $2,000/kg (Falcon 9) to $100/kg (Starship target), the economics of everything above the atmosphere changes permanently. Satellite constellations that cost billions become affordable. Lunar bases that require decades of logistics become supply-chain problems. Mars becomes a 6-month voyage instead of a generational aspiration. The bet is not on SpaceX specifically it is that full reusability is an inevitable engineering milestone, and the companies that architect their business models around cheap access to space will define the next century.",
    verticals: ["Launch Vehicles", "Space Habitation", "Lunar Infrastructure"],
    horizon: "2-3y",
    conviction: "high",
    catalysts: [
      "Starship IFT-4 and IFT-5 demonstrating full-stack reuse including booster catch at the tower (2024)",
      "NASA HLS contract for Starship as Artemis lunar lander forcing full flight qualification",
      "SpaceX targeting 100+ Starship launches per year by 2026, compressing cost-to-orbit by 10x",
      "Rocket Lab Neutron development creating credible second fully reusable medium-lift option",
      "Stoke Space Nova demonstrating full second-stage reuse proving the approach is not a SpaceX monopoly",
    ],
    risks: [
      "Regulatory bottleneck: FAA environmental review and launch license delays have slipped every Starship flight",
      "Heat shield reliability at scale each reuse requires inspection and tile replacement that may cap launch cadence",
      "A catastrophic failure at high cadence could ground the program for 12-24 months and reset investor confidence",
      "Cost reduction targets may stall: Falcon 9 settled at $2,700/kg despite years of iteration",
      "Starship success could commoditize launch economics so severely it destroys the economics of every other launch provider",
    ],
    keyTickers: ["RKLB", "RDW", "LUNR"],
    keyPrivate: ["SpaceX", "Blue Origin", "Relativity Space", "Stoke Space"],
    updatedAt: "2025-04-01",
  },
  {
    slug: "lunar-water-ice-economy",
    title: "The Lunar Water Ice Economy",
    tagline: "Water ice at the lunar poles is rocket fuel. Whoever controls it controls the economics of deep space.",
    thesis: "The Moon's permanently shadowed craters at the poles contain an estimated 600 million metric tons of water ice. Water is H2O electrolysis splits it into hydrogen (fuel) and oxygen (oxidizer and breathable air). A lunar propellant depot changes the economics of the entire solar system: spacecraft refueling at the Moon rather than carrying all propellant from Earth can carry 3-5x more payload to Mars or the asteroid belt. ISRU closes the loop. The Artemis program is not nostalgia for Apollo it is the construction phase of a fuel depot that changes every mission economics beyond Earth.",
    verticals: ["Lunar Infrastructure", "ISRU", "Space Power"],
    horizon: "3-7y",
    conviction: "high",
    catalysts: [
      "NASA LCROSS confirmed water ice in Cabeus crater at 5.6% concentration resource is real and economically extractable",
      "Intuitive Machines IM-1 and IM-2 missions collecting in-situ data on polar terrain and ice accessibility",
      "NASA CLPS program creating a regular cadence of commercial lunar landers 10+ missions contracted through 2028",
      "Blue Moon HLS contract giving Blue Origin a funded reason to develop lunar propellant infrastructure",
      "Artemis base camp planning explicitly includes propellant production US government validating the economic model",
    ],
    risks: [
      "Water ice concentration at accessible depths may be lower than current estimates, destroying the economics",
      "Extracting ice in permanently shadowed craters requires power infrastructure that doesn't yet exist on the Moon",
      "Geopolitical risk: China's ILRS program is targeting the same polar regions first-mover resource access undefined by international law",
      "Artemis schedule has slipped 2-3 years per milestone lunar infrastructure buildout may be a 2035+ story",
      "Propellant depot economics require high launch cadence to Moon that may not materialize in the 2030 timeframe",
    ],
    keyTickers: ["LUNR", "OKLO", "RDW"],
    keyPrivate: ["Astrobotic", "ispace", "Maana Electric", "Blue Origin", "Axiom Space"],
    updatedAt: "2025-03-01",
  },
  {
    slug: "isru-or-nothing",
    title: "ISRU or Nothing",
    tagline: "You cannot ship civilization from Earth. Every meaningful off-world settlement makes its own air, fuel, and food.",
    thesis: "NASA's MOXIE experiment on Mars Perseverance produced oxygen from CO2 in 2021 the first demonstration of ISRU on another planet. It produced 122 grams total. A human crew of four needs 1 ton of oxygen per year for breathing alone, plus propellant for the return trip. The math is unambiguous: you cannot sustain humans on Mars by shipping oxygen from Earth. MOXIE proved the chemistry works. The next step is scaling from grams to tonnes. This is the single most important unsolved engineering problem for Mars colonization, and the companies solving it electrolysis systems, autonomous mining robots, regolith processing hardware are building the foundation of any off-Earth civilization.",
    verticals: ["ISRU", "Space Robotics", "Space Manufacturing"],
    horizon: "7-15y",
    conviction: "high",
    catalysts: [
      "MOXIE produced 122g of oxygen on Mars across 16 runs at 98% purity chemistry fully validated at planet scale",
      "NASA MOXIE+ planning for a scaled system 100x larger as part of human Mars mission hardware",
      "OxEon Energy supplying MOXIE heritage electrolysis cells for NASA's next-generation ISRU demonstrations",
      "DOE and NASA joint funding of $50M+ for in-situ resource utilization technology development (2023-2026)",
      "Lunar ISRU demonstrations planned for Artemis base camp 2030s Moon as testbed before Mars",
    ],
    risks: [
      "Scaling from lab demonstration to industrial-scale production is a 3-5 order of magnitude engineering challenge",
      "Martian dust covering everything, clogging mechanisms, reducing solar power output may defeat ISRU hardware",
      "Nuclear power required for continuous ISRU through Martian night adds cost and regulatory complexity",
      "No commercial business model exists for ISRU technology until humans are actually on Mars pure government funding dependency",
      "Radiation and extreme temperature cycling on Mars surfaces will degrade ISRU equipment faster than Earth-based testing can predict",
    ],
    keyTickers: ["OKLO", "RDW"],
    keyPrivate: ["OxEon Energy", "OffWorld", "Honeybee Robotics", "Maana Electric", "Air Company"],
    updatedAt: "2025-02-01",
  },
  {
    slug: "observation-layer",
    title: "The Observation Layer",
    tagline: "Before you can build on another world, you need to see it. Earth observation is the intelligence layer for planetary infrastructure.",
    thesis: "You cannot land a habitat on terrain you cannot map. You cannot mine resources you cannot locate. You cannot route supply chains across a surface you cannot monitor. Earth observation SAR radar, hyperspectral imaging, daily revisit constellations is not just valuable for Earth-based intelligence. It is the prerequisite capability for any planetary surface operation. The companies building sub-meter SAR and hyperspectral from orbit are building the sensor layer that will eventually be deployed around the Moon and Mars. Planet Labs proved daily full-planet imaging is economically viable. Capella proved SAR through clouds and darkness. Albedo is proving 10cm resolution from very-low orbit. Each breakthrough in Earth observation is a template for what gets deployed at the next world.",
    verticals: ["Earth Observation", "Space Communications", "Space Robotics"],
    horizon: "2-3y",
    conviction: "medium",
    catalysts: [
      "Planet Labs achieving daily full-planet imaging now standard in hedge fund research and government intelligence workflows",
      "Capella Space and Umbra proving commercial SAR at sub-meter resolution, penetrating cloud cover and operating at night",
      "Albedo first satellites launching 2024-2025 from 300km altitude 10cm resolution that makes individual vehicles identifiable",
      "Pixxel hyperspectral constellation enabling mineral detection, crop health, and pollution monitoring impossible with RGB imaging",
      "Ukraine conflict driving urgent demand for commercial satellite intelligence, accelerating government procurement cycles",
    ],
    risks: [
      "Planet Labs struggling to achieve profitability despite 200+ satellite constellation revenue growth not covering constellation maintenance costs",
      "SpaceX Starlink direct-to-cell service may commoditize low-bandwidth space connectivity and compress pricing across the sector",
      "Chinese commercial observation companies (Chang Guang Satellite, Spacety) offering comparable imagery at significantly lower cost",
      "Regulatory risk: very-low-orbit operations by Albedo require sustained atmospheric drag compensation and raise debris concerns",
    ],
    keyTickers: ["PL", "SPIR", "BKSY"],
    keyPrivate: ["Capella Space", "Umbra", "ICEYE", "Albedo", "Pixxel"],
    updatedAt: "2025-01-15",
  },
];
