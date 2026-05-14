export interface Company {
  slug: string;
  name: string;
  sector: string;
  subsector?: string;
  description: string;
  hq?: string;
  founded?: number;
}

export const companies: Company[] = [
  // Launch
  { slug: "spacex", name: "SpaceX", sector: "Launch", hq: "Hawthorne, CA", founded: 2002, description: "Develops the Falcon 9 and Starship launch vehicles. Pioneered orbital booster reusability with Falcon 9, which has become the world's most frequently flown rocket. Starship, currently in flight testing, targets full stack reusability and sub-$100/kg to orbit." },
  { slug: "rocket-lab", name: "Rocket Lab", sector: "Launch", hq: "Long Beach, CA", founded: 2006, description: "Operates the Electron small launch vehicle with a partially reusable first stage. Developing the larger Neutron rocket for medium-lift missions. Has completed over 50 Electron launches, making it the second most frequently flown orbital rocket after Falcon 9." },
  { slug: "blue-origin", name: "Blue Origin", sector: "Launch", hq: "Kent, WA", founded: 2000, description: "Develops the New Shepard suborbital vehicle and New Glenn orbital rocket. New Glenn completed its first orbital mission in 2025. Also developing the Blue Moon lunar lander for NASA's Artemis program." },
  { slug: "relativity-space", name: "Relativity Space", sector: "Launch", hq: "Long Beach, CA", founded: 2015, description: "3D prints the majority of its launch vehicles, aiming to dramatically reduce part count and manufacturing time. Pivoted from Terran 1 small rocket to the larger, fully reusable Terran R after Terran 1's first flight." },
  { slug: "stoke-space", name: "Stoke Space", sector: "Launch", hq: "Kent, WA", founded: 2019, description: "Developing a fully reusable two-stage launch vehicle with a hydrogen-oxygen upper stage that uses a unique full-flow engine cycle. Has tested both stages independently and is targeting full integrated flight." },
  { slug: "firefly", name: "Firefly Aerospace", sector: "Launch", subsector: "Lunar", hq: "Cedar Park, TX", founded: 2017, description: "Operates the Alpha small launch vehicle and delivered the Blue Ghost lunar lander to the Moon's surface in 2025 under NASA's CLPS program, making it one of the first commercial companies to achieve a successful lunar landing." },
  { slug: "isar-aerospace", name: "Isar Aerospace", sector: "Launch", hq: "Munich, Germany", founded: 2018, description: "European small launch vehicle developer building the Spectrum rocket. Targets the growing European demand for sovereign launch capability and serves commercial constellation customers." },
  { slug: "abl-space", name: "ABL Space Systems", sector: "Launch", hq: "El Segundo, CA", founded: 2017, description: "Developing the RS1 small launch vehicle with a focus on rapid field deployment. Has a contract with Lockheed Martin for potential use on future missions." },

  // Propulsion
  { slug: "impulse-space", name: "Impulse Space", sector: "Propulsion", hq: "Hawthorne, CA", founded: 2021, description: "Builds in-space propulsion vehicles including Mira, an orbital transfer vehicle. Founded by former SpaceX VP of propulsion Tom Mueller. Focuses on last-mile delivery services for satellite operators." },
  { slug: "phase-four", name: "Phase Four", sector: "Propulsion", hq: "El Segundo, CA", founded: 2015, description: "Develops radio-frequency thrusters for small satellites. Their Maxwell thruster uses an RF plasma source rather than electrodes, reducing wear and enabling longer operational lifetimes." },
  { slug: "exotrail", name: "Exotrail", sector: "Propulsion", hq: "Massy, France", founded: 2017, description: "French in-space propulsion company developing Hall-effect thrusters for small satellites. Their ExoMG thruster line targets the growing small satellite constellation market." },
  { slug: "accion-systems", name: "Accion Systems", sector: "Propulsion", hq: "Boston, MA", founded: 2014, description: "Develops TILE electrospray propulsion systems for CubeSats and small satellites. Their ionic liquid ion source technology enables precise attitude control and orbit adjustment for very small spacecraft." },
  { slug: "orbion-space", name: "Orbion Space Technology", sector: "Propulsion", hq: "Houghton, MI", founded: 2016, description: "Manufactures Aurora Hall-effect thrusters for small satellites. Focuses on high-volume production to serve the growing small satellite constellation market at scale." },
  { slug: "ultra-safe-nuclear", name: "Ultra Safe Nuclear", sector: "Propulsion", subsector: "Power", hq: "Seattle, WA", founded: 2011, description: "Developing nuclear thermal propulsion systems and microreactors for space applications. Their NEVIS nuclear thermal propulsion concept aims to halve transit times to Mars compared to chemical rockets." },

  // Lunar
  { slug: "astrobotic", name: "Astrobotic", sector: "Lunar", hq: "Pittsburgh, PA", founded: 2007, description: "Develops lunar landers under NASA's CLPS program. Their Peregrine lander experienced a propellant anomaly on its first mission. Their larger Griffin lander is designed to deliver NASA's VIPER rover to the lunar south pole." },
  { slug: "intuitive-machines", name: "Intuitive Machines", sector: "Lunar", hq: "Houston, TX", founded: 2013, description: "Operates the Nova-C lunar lander. Their IM-1 mission in 2024 became the first US commercial lunar landing, though the vehicle tipped on landing. Publicly traded on Nasdaq under LUNR." },
  { slug: "ispace", name: "ispace", sector: "Lunar", subsector: "Mining", hq: "Tokyo, Japan", founded: 2010, description: "Japanese lunar exploration company developing the HAKUTO-R lander series. Targeting lunar water ice extraction as a long-term commercial objective. Lost their first lander during final descent in 2023." },
  { slug: "astrolab", name: "Astrolab", sector: "Lunar", hq: "Los Angeles, CA", founded: 2019, description: "Developing the FLEX large lunar rover, capable of transporting substantial payloads across the lunar surface. Selected by SpaceX to fly on Starship as part of NASA's lunar surface work." },
  { slug: "lunar-outpost", name: "Lunar Outpost", sector: "Lunar", hq: "Denver, CO", founded: 2017, description: "Developing small mobile robots for lunar surface operations including the MAPP rover. Also building resource prospecting systems to characterize lunar regolith composition and ice content." },

  // Habitation
  { slug: "axiom-space", name: "Axiom Space", sector: "Habitation", subsector: "Suits", hq: "Houston, TX", founded: 2016, description: "Building the first commercial space station, Axiom Station, to be assembled in orbit and eventually detached from the ISS as an independent facility. Also developed the AxEMU spacesuit for NASA's Artemis lunar surface missions." },
  { slug: "vast-space", name: "Vast Space", sector: "Habitation", hq: "Long Beach, CA", founded: 2021, description: "Developing Haven-1, a commercial space station module to be launched on a SpaceX Falcon 9. Targeting a 2025 launch and planning a larger Haven-2 multi-module station." },
  { slug: "sierra-space", name: "Sierra Space", sector: "Habitation", hq: "Louisville, CO", founded: 2021, description: "Developing the Dream Chaser spaceplane for cargo delivery to the ISS and the LIFE inflatable habitat module. LIFE uses Bigelow-heritage expandable structure technology and targets over 1,400 cubic meters of pressurized volume." },
  { slug: "icon", name: "ICON", sector: "Habitation", subsector: "ISRU", hq: "Austin, TX", founded: 2017, description: "Large-format construction 3D printing company. On Earth, prints full-size houses from concrete. For space, developing the Vulcan construction system and Lavacrete material under NASA's Project Olympus to print structures from lunar and Martian regolith." },
  { slug: "nanoracks", name: "Nanoracks", sector: "Habitation", subsector: "Manufacturing", hq: "Webster, TX", founded: 2009, description: "Commercial space company offering payload integration on the ISS and developing Starlab, a commercial space station in partnership with Voyager Space and Airbus. Acquired by Voyager Space." },

  // Power
  { slug: "oklo", name: "Oklo", sector: "Power", hq: "Santa Clara, CA", founded: 2013, description: "Developing compact fission power plants, initially targeting terrestrial remote power markets. Their Aurora microreactor is designed for outputs of 1 to 15 megawatts. The same compact, reliable, weather-independent power profile is directly applicable to lunar and Martian surface operations. Publicly traded on NYSE under OKLO." },
  { slug: "zeno-power", name: "Zeno Power", sector: "Power", hq: "Seattle, WA", founded: 2018, description: "Developing radioisotope power systems (RPS) for space and defense applications. Their systems use the heat from radioactive decay to generate electricity, providing reliable low-power output with no moving parts and decade-scale operational lifetimes." },
  { slug: "bwxt", name: "BWXT", sector: "Power", hq: "Lynchburg, VA", founded: 1999, description: "Defense and government contractor developing nuclear thermal propulsion systems and space nuclear reactors under NASA and DARPA contracts. Has significant heritage in naval nuclear reactor manufacturing." },
  { slug: "redwire", name: "Redwire", sector: "Power", subsector: "Manufacturing", hq: "Jacksonville, FL", founded: 2020, description: "Space infrastructure company manufacturing solar arrays, deployable structures, and in-space manufacturing systems. Their rollable solar array technology is deployed on the ISS. Publicly traded on NYSE under RDW." },

  // ISRU
  { slug: "honeybee-robotics", name: "Honeybee Robotics", sector: "ISRU", subsector: "Robotics", hq: "Altadena, CA", founded: 1983, description: "Long-standing space robotics company developing drilling, sampling, and excavation systems for planetary surfaces. Built the rock abrasion tools on NASA's Mars Exploration Rovers and developing ISRU sampling equipment for future missions." },
  { slug: "offworld", name: "OffWorld", sector: "ISRU", subsector: "Robotics", hq: "Pasadena, CA", founded: 2016, description: "Developing industrial robots for mining and construction on planetary surfaces and asteroids. Their robots are designed to work collaboratively in swarms with minimal human oversight, relevant for the autonomous ISRU operations Mars will require." },

  // Robotics
  { slug: "mda-space", name: "MDA Space", sector: "Robotics", hq: "Brampton, Canada", founded: 1969, description: "Developed Canadarm, Canadarm2, and Dextre for the Space Shuttle and ISS. Building Canadarm3 for the Lunar Gateway. One of the most experienced space robotics companies in the world, with five decades of heritage in on-orbit manipulation." },
  { slug: "motiv-space-systems", name: "Motiv Space Systems", sector: "Robotics", hq: "Pasadena, CA", founded: 2014, description: "Builds robotic arm systems for planetary rovers and space applications. Their xLink robotic joint technology powers robotic arms on Mars missions. Developing surface robotics for future lunar and Mars applications." },
  { slug: "astroscale", name: "Astroscale", sector: "Robotics", hq: "Tokyo, Japan", founded: 2013, description: "Developing active debris removal and satellite servicing spacecraft. Completed the first commercial debris capture demonstration in orbit. Building a commercial refueling and servicing ecosystem for operational satellites." },
  { slug: "gitai", name: "GITAI", sector: "Robotics", hq: "Los Angeles, CA", founded: 2016, description: "Japanese robotics company developing general-purpose robots for space station operations, EVA task assistance, and eventually surface construction. Has demonstrated robotic task completion inside ISS mockups." },
  { slug: "starfish-space", name: "Starfish Space", sector: "Robotics", hq: "Kent, WA", founded: 2019, description: "Developing the Otter spacecraft for satellite docking, servicing, and repositioning. Targeting the growing market for on-orbit servicing as satellite operators seek to extend the operational life of expensive GEO assets." },

  // Food
  { slug: "interstellar-lab", name: "Interstellar Lab", sector: "Food", hq: "Paris, France", founded: 2018, description: "Develops BioPods, controlled-environment growing systems for plants and microorganisms. Designing closed-loop life support systems for long-duration space habitation, with terrestrial applications in vertical farming and pharmaceutical production." },
  { slug: "solar-foods", name: "Solar Foods", sector: "Food", hq: "Helsinki, Finland", founded: 2017, description: "Produces Solein, a protein powder made from CO2, water, and electricity using hydrogen-oxidizing microorganisms. No agriculture required. On Mars, where the atmosphere is 95% CO2 and nuclear electricity is available, the process requires no imported feedstock whatsoever." },
  { slug: "aleph-farms", name: "Aleph Farms", sector: "Food", hq: "Rehovot, Israel", founded: 2017, description: "Produces cultivated beef from animal cells without raising animals. Demonstrated meat cultivation on the ISS in 2019. For long-duration space missions, cultivated meat eliminates the need to raise livestock while providing animal protein." },
  { slug: "space-tango", name: "Space Tango", sector: "Food", subsector: "Manufacturing", hq: "Lexington, KY", founded: 2014, description: "Operates manufacturing and research facilities on the ISS. Has run over 300 experiments including food production, cell cultivation, and materials science. Provides a commercial route to access microgravity for research and production." },

  // Earth Observation
  { slug: "planet-labs", name: "Planet Labs", sector: "Earth Observation", hq: "San Francisco, CA", founded: 2010, description: "Operates the world's largest fleet of Earth imaging satellites, capturing daily global coverage at 3-5 meter resolution. Their Dove and SuperDove constellations image every point on Earth every day. Publicly traded on NYSE under PL." },
  { slug: "capella-space", name: "Capella Space", sector: "Earth Observation", hq: "San Francisco, CA", founded: 2016, description: "Operates a constellation of synthetic aperture radar (SAR) satellites capable of imaging through clouds and at night. Provides sub-meter resolution SAR imagery to government and commercial customers." },
  { slug: "umbra", name: "Umbra", sector: "Earth Observation", hq: "Santa Barbara, CA", founded: 2015, description: "Developing high-resolution SAR satellites capable of 16-centimeter resolution, the highest resolution commercial SAR available. SAR's ability to operate through clouds and darkness makes it particularly valuable for monitoring dynamic situations." },
  { slug: "spire-global", name: "Spire Global", sector: "Earth Observation", hq: "Vienna, Austria", founded: 2012, description: "Operates a constellation of over 100 satellites collecting GPS radio occultation data for weather forecasting, maritime tracking, aviation, and climate monitoring. Provides data-as-a-service to government and commercial customers. Publicly traded on NYSE under SPIR." },
  { slug: "iceye", name: "ICEYE", sector: "Earth Observation", hq: "Espoo, Finland", founded: 2014, description: "Finnish SAR satellite operator with a constellation optimized for very high revisit rates. Can image specific locations multiple times per day. Primarily serves government intelligence and insurance customers monitoring floods, disasters, and infrastructure." },
  { slug: "albedo", name: "Albedo", sector: "Earth Observation", hq: "Denver, CO", founded: 2020, description: "Developing very low Earth orbit satellites capable of 10-centimeter resolution optical imagery from space, closer to aerial imagery quality than traditional satellite. Operating in VLEO requires more fuel for drag compensation but dramatically improves resolution." },
  { slug: "pixxel", name: "Pixxel", sector: "Earth Observation", hq: "Bengaluru, India", founded: 2019, description: "Developing hyperspectral imaging satellites that capture hundreds of wavelength bands simultaneously. Hyperspectral data identifies material composition from orbit, enabling applications in agriculture, mining, environmental monitoring, and ISRU site selection." },

  // Mining
  { slug: "astroforge", name: "AstroForge", sector: "Mining", hq: "Huntington Beach, CA", founded: 2022, description: "Developing asteroid mining technology targeting platinum-group metals. Launched their first refinery demonstration spacecraft in 2023. Plans asteroid reconnaissance missions to characterize target bodies before full-scale mining operations." },
  { slug: "transastra", name: "TransAstra", sector: "Mining", hq: "Los Angeles, CA", founded: 2015, description: "Developing optical mining technology using concentrated sunlight to extract water and volatiles from asteroids and the Moon. Their Worker Bee spacecraft is designed to capture and process small near-Earth asteroids for propellant production." },

  // Manufacturing
  { slug: "varda-space", name: "Varda Space Industries", sector: "Manufacturing", hq: "El Segundo, CA", founded: 2020, description: "Manufactures products in microgravity using small reentry capsules hosted on Rocket Lab satellites. First customers are pharmaceutical companies seeking to grow drug crystals in microgravity conditions impossible to replicate on Earth. First successful reentry in 2024." },
  { slug: "space-forge", name: "Space Forge", sector: "Manufacturing", hq: "Cardiff, UK", founded: 2018, description: "UK company developing ForgeStar reusable reentry vehicles for in-space manufacturing of advanced materials including semiconductors, fiber optics, and exotic alloys that benefit from microgravity processing." },

  // In-space compute
  { slug: "lumen-orbit", name: "Lumen Orbit", sector: "Space Compute", hq: "San Francisco, CA", founded: 2023, description: "Developing in-space data processing platforms that process satellite imagery and sensor data on-orbit. Eliminates the need to downlink raw data to Earth by running analysis in space and transmitting only results." },
  { slug: "d-orbit", name: "D-Orbit", sector: "Space Compute", hq: "Como, Italy", founded: 2011, description: "Provides orbital transportation and in-space services including their ION Satellite Carrier platform. Increasingly offering in-orbit computing capabilities alongside precision deployment for satellite constellation customers." },
];

export const companiesBySlug: Record<string, Company> = Object.fromEntries(
  companies.map((c) => [c.slug, c])
);

export const companiesByName: Record<string, Company> = Object.fromEntries(
  companies.map((c) => [c.name.toLowerCase(), c])
);

export const sectors = [...new Set(companies.map((c) => c.sector))].sort();

export function findCompany(name: string): Company | undefined {
  const key = name.toLowerCase().replace(/\s*\(.*?\)/g, "").trim();
  return companiesByName[key] ?? companies.find((c) =>
    key.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(key)
  );
}
