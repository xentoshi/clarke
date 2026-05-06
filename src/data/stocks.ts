export interface Stock {
  ticker: string;
  name: string;
  vertical: string;
  description: string;
}

export const stocks: Stock[] = [
  { ticker: "RKLB", name: "Rocket Lab", vertical: "Launch", description: "Electron launch vehicle + Neutron in development" },
  { ticker: "LUNR", name: "Intuitive Machines", vertical: "Lunar", description: "NOVA-C landers landed on Moon Feb 2024 & Mar 2025" },
  { ticker: "RDW", name: "Redwire", vertical: "Manufacturing / Power", description: "Roll-Out Solar Arrays, bioprinting, in-space manufacturing" },
  { ticker: "PL", name: "Planet Labs", vertical: "Observation", description: "200+ satellite daily Earth imaging constellation" },
  { ticker: "SPIR", name: "Spire Global", vertical: "Observation / Comms", description: "100+ satellite weather, maritime, ADS-B data" },
  { ticker: "BKSY", name: "BlackSky", vertical: "Observation", description: "Real-time satellite tasking and geospatial intelligence" },
  { ticker: "OKLO", name: "Oklo", vertical: "Power", description: "Aurora fission microreactor for deep space and planetary power" },
  { ticker: "MNTS", name: "Momentus", vertical: "Propulsion", description: "Vigoride in-space transfer vehicle" },
  { ticker: "ASTS", name: "AST SpaceMobile", vertical: "Comms", description: "Direct-to-device satellite broadband constellation" },
  { ticker: "VSAT", name: "Viasat", vertical: "Comms", description: "ViaSat-3 global satellite broadband" },
  { ticker: "NOC", name: "Northrop Grumman", vertical: "Habitation", description: "HALO module for Gateway lunar station, Cygnus cargo" },
  { ticker: "BWXT", name: "BWXT Technologies", vertical: "Power", description: "Nuclear thermal propulsion and microreactors for NASA" },
  { ticker: "LMT", name: "Lockheed Martin", vertical: "Launch / Habitation", description: "Orion crew capsule, space systems, Sirius satellite infrastructure" },
  { ticker: "BA", name: "Boeing", vertical: "Launch / Habitation", description: "Starliner crew capsule, SLS rocket co-contractor" },
  { ticker: "IRDM", name: "Iridium", vertical: "Comms", description: "66-satellite LEO constellation only truly global voice and data network" },
  { ticker: "GSAT", name: "Globalstar", vertical: "Comms", description: "LEO satellite comms powers Apple Emergency SOS on iPhone" },
  { ticker: "SATL", name: "Satellogic", vertical: "Observation", description: "Sub-meter resolution Earth observation constellation" },
  { ticker: "MYNA", name: "Mynaric", vertical: "Comms", description: "Laser/optical comms terminals for satellite mega-constellations" },
  { ticker: "SPCE", name: "Virgin Galactic", vertical: "Launch", description: "Space tourism aboard VSS Delta suborbital spaceplane" },
  { ticker: "KTOS", name: "Kratos Defense", vertical: "Launch", description: "Satellite ground systems, tactical rocket targets, space propulsion" },
];
