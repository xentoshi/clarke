export interface SolanaHardwareProject {
  name: string;
  slug: string;
  description: string;
  category: "depin" | "compute" | "mobile" | "sensor" | "mapping";
  token?: string;
  website: string;
  twitter?: string;
  status: "live" | "beta" | "announced";
  hardwareType: string;
  solanaProgram?: string;
  founded?: number;
  hq?: string;
  notable?: string;
}

export const categoryLabels: Record<SolanaHardwareProject["category"], string> = {
  depin: "DePIN Network",
  compute: "Distributed Compute",
  mobile: "Hardware Device",
  sensor: "Sensor Network",
  mapping: "Physical Mapping",
};

export const statusColors: Record<SolanaHardwareProject["status"], string> = {
  live: "text-emerald-400 bg-emerald-950 border-emerald-800",
  beta: "text-amber-400 bg-amber-950 border-amber-800",
  announced: "text-zinc-400 bg-zinc-900 border-zinc-700",
};

export const solanaHardwareProjects: SolanaHardwareProject[] = [
  {
    name: "Helium",
    slug: "helium",
    description: "Decentralized wireless infrastructure — IoT (LoRaWAN) and mobile (5G) hotspot networks rewarding operators with HNT tokens. Migrated to Solana in April 2023.",
    category: "depin",
    token: "HNT",
    website: "https://helium.com",
    twitter: "https://twitter.com/helium",
    status: "live",
    hardwareType: "LoRaWAN / 5G hotspots",
    founded: 2013,
    hq: "San Francisco, CA",
    notable: "1M+ hotspots deployed globally; largest DePIN network by device count",
  },
  {
    name: "Hivemapper",
    slug: "hivemapper",
    description: "Dashcam-based decentralized mapping network — drivers earn HONEY tokens for contributing street-level imagery used to train and update the Hivemapper map.",
    category: "mapping",
    token: "HONEY",
    website: "https://hivemapper.com",
    twitter: "https://twitter.com/hivemapper",
    status: "live",
    hardwareType: "4K dashcams (Bee / Bee Pro)",
    founded: 2021,
    hq: "San Francisco, CA",
    notable: "Covered 30%+ of roads Google Maps has mapped — at a fraction of the cost",
  },
  {
    name: "GEODNET",
    slug: "geodnet",
    description: "Decentralized GNSS (GPS) correction network — station operators earn GEOD tokens for providing centimeter-level positioning data used in precision agriculture, autonomous vehicles, and construction.",
    category: "sensor",
    token: "GEOD",
    website: "https://geodnet.com",
    twitter: "https://twitter.com/geodnet",
    status: "live",
    hardwareType: "Multi-band GNSS reference stations",
    founded: 2022,
    hq: "Los Angeles, CA",
    notable: "5,000+ stations; centimeter-accuracy correction replacing $3B/yr commercial services",
  },
  {
    name: "Render Network",
    slug: "render-network",
    description: "Distributed GPU rendering and AI compute marketplace — GPU owners contribute idle capacity and earn RENDER tokens. Migrated from Ethereum to Solana in 2023.",
    category: "compute",
    token: "RENDER",
    website: "https://rendernetwork.com",
    twitter: "https://twitter.com/rendernetwork",
    status: "live",
    hardwareType: "Consumer and data center GPUs",
    founded: 2017,
    hq: "Los Angeles, CA",
    notable: "Used by Hollywood VFX studios; $1B+ market cap; OTOY partnership",
  },
  {
    name: "io.net",
    slug: "io-net",
    description: "Decentralized GPU network aggregating underutilized compute from data centers, crypto miners, and consumer devices — targeting AI/ML training and inference workloads.",
    category: "compute",
    token: "IO",
    website: "https://io.net",
    twitter: "https://twitter.com/ionet",
    status: "live",
    hardwareType: "Data center and consumer GPUs",
    founded: 2023,
    hq: "San Francisco, CA",
    notable: "500,000+ GPUs aggregated; raised $30M at $1B valuation",
  },
  {
    name: "Solana Mobile",
    slug: "solana-mobile",
    description: "Android smartphones with native Solana integration — Seed Vault secure enclave for private key storage, Mobile Wallet Adapter protocol, and dApp store. Saga sold out; Chapter 2 announced.",
    category: "mobile",
    website: "https://solanamobile.com",
    twitter: "https://twitter.com/solanamobile",
    status: "live",
    hardwareType: "Android smartphones (Saga, Chapter 2)",
    founded: 2022,
    hq: "New York, NY",
    notable: "Chapter 2 pre-orders exceeded 140,000 units; each ships with token distributions",
  },
  {
    name: "NATIX Network",
    slug: "natix",
    description: "Decentralized traffic and street data network — drivers use the NATIX Drive& app on any dashcam or phone camera to contribute spatial data and earn tokens on Solana.",
    category: "mapping",
    token: "NATIX",
    website: "https://natix.network",
    twitter: "https://twitter.com/natixnetwork",
    status: "live",
    hardwareType: "Smartphones and IP cameras",
    founded: 2021,
    hq: "Munich, Germany",
    notable: "Real-time traffic AI processing at edge; city contracts in Europe and Middle East",
  },
  {
    name: "Ambient",
    slug: "ambient-weather",
    description: "Decentralized environmental monitoring network — personal weather station operators earn tokens for contributing hyperlocal climate data on Solana.",
    category: "sensor",
    token: "AMB",
    website: "https://ambientweather.net",
    twitter: "https://twitter.com/ambientweather",
    status: "beta",
    hardwareType: "Personal weather stations",
    founded: 2022,
    hq: "Scottsdale, AZ",
    notable: "10,000+ stations contributing data; partnered with WeatherFlow Tempest hardware",
  },
];
