// The space economy organized as a value chain — the "stack" that turns capital
// into services on the ground. Every companies.ts sector maps into one layer.
// This is the educational backbone of the Space Economy Map.

export interface ChainLayer {
  id: string;
  title: string;
  blurb: string;
  sectors: string[];
}

export const LAYERS: ChainLayer[] = [
  {
    id: "capital",
    title: "Capital",
    blurb: "The money that funds everything above orbit. Specialist funds underwrite the decade-long bets the public market won't.",
    sectors: ["Space Finance"],
  },
  {
    id: "launch",
    title: "Launch & Propulsion",
    blurb: "Getting mass to orbit. Launch cost is the master variable — when it collapses, everything downstream becomes possible.",
    sectors: ["Launch", "Propulsion"],
  },
  {
    id: "spacecraft",
    title: "Spacecraft & Systems",
    blurb: "The satellites themselves: buses, power, robotics, and the components that survive years in vacuum.",
    sectors: ["Manufacturing", "Power", "Robotics", "Space Suits"],
  },
  {
    id: "operators",
    title: "Satellite Operators",
    blurb: "Who actually owns and runs fleets in orbit — the layer that holds the spectrum, the slots, and the customer relationships.",
    sectors: ["GEO Operators", "LEO Broadband", "Navigation", "Earth Observation"],
  },
  {
    id: "ground",
    title: "Ground & Compute",
    blurb: "The invisible half of every satellite: antennas, gateways, and on-orbit processing that turn signals into usable data.",
    sectors: ["Ground Infrastructure", "Space Compute"],
  },
  {
    id: "applications",
    title: "Applications & Data",
    blurb: "Where orbit meets a customer. Raw imagery and RF become maritime intelligence, crop forecasts, and trading signals.",
    sectors: ["Satellite Applications"],
  },
  {
    id: "inorbit",
    title: "In-Orbit Services",
    blurb: "A new economy in orbit itself: refueling, servicing, debris removal, and knowing what is where.",
    sectors: ["On-orbit Servicing", "Space Situational Awareness"],
  },
  {
    id: "frontier",
    title: "Frontier & Beyond",
    blurb: "Past Earth orbit: the Moon, habitats, mining, in-space food and manufacturing, and planetary-scale engineering.",
    sectors: ["Lunar", "Habitation", "ISRU", "Food", "Mining", "Manufacturing (in-space)", "Planetary Engineering"],
  },
  {
    id: "defense",
    title: "Defense & National Security",
    blurb: "The largest customer in space. Intelligence satellites, missile warning, and the contractors that build them.",
    sectors: ["Defense"],
  },
  {
    id: "risk",
    title: "Risk & Insurance",
    blurb: "The market that prices failure. Underwriters quantify launch and in-orbit risk for every asset above.",
    sectors: ["Space Insurance"],
  },
];

const SECTOR_TO_LAYER: Record<string, string> = {};
for (const layer of LAYERS) for (const s of layer.sectors) SECTOR_TO_LAYER[s] = layer.id;

export function layerForSector(sector: string): string {
  return SECTOR_TO_LAYER[sector] ?? "frontier";
}
