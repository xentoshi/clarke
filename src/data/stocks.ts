export interface Stock {
  ticker: string;
  name: string;
  vertical: string;
  description: string;
  detail: string;
  clarkeRelevance: string;
}

export const stocks: Stock[] = [
  {
    ticker: "VSAT",
    name: "Viasat",
    vertical: "GEO Broadband",
    description: "ViaSat-3 global satellite broadband. Three GEO satellites covering Americas, EMEA, and Asia-Pacific.",
    detail: "Viasat operates its own geostationary orbital slots and leases transponder capacity to governments, airlines, and consumers. Revenue is ~$1B/year. The ViaSat-3 constellation represents $3B+ in capital investment.",
    clarkeRelevance: "Viasat's SEC filings are one of the clearest public windows into GEO slot economics: contracted transponder revenue, utilization rates, and slot-level capital values. A primary data source for orbital asset pricing.",
  },
  {
    ticker: "IRDM",
    name: "Iridium",
    vertical: "LEO Comms",
    description: "66-satellite LEO constellation. The only truly global voice and data network covering poles.",
    detail: "Iridium operates in low Earth orbit at 780km, not geostationary. Its unique pole-to-pole coverage makes it the standard for maritime, aviation, and government communications where other networks have no coverage. Revenue ~$750M/year.",
    clarkeRelevance: "Iridium's constellation economics, revenue per satellite, spectrum rights value, and orbital position yield, are a data point for pricing LEO assets as Clarke expands its registry beyond GEO.",
  },
  {
    ticker: "GSAT",
    name: "Globalstar",
    vertical: "LEO Comms",
    description: "LEO satellite network. Powers Apple Emergency SOS on every iPhone sold worldwide since 2022.",
    detail: "Globalstar operates 24 satellites in LEO providing voice, data, and IoT services. The Apple partnership, which routes emergency SOS messages via Globalstar, represents a transformative B2B contract that stabilized the company's revenue base.",
    clarkeRelevance: "The Apple contract illustrates how a single anchor tenant can define the value of a satellite operator's orbital positions. Understanding anchor-tenant economics is central to pricing orbital assets across all regimes.",
  },
  {
    ticker: "ASTS",
    name: "AST SpaceMobile",
    vertical: "Broadband",
    description: "Direct-to-device satellite broadband. Large-aperture LEO satellites connect directly to standard smartphones.",
    detail: "AST is building a constellation of large BlueBird satellites designed to connect directly to unmodified mobile phones. No special hardware required. Partnerships with AT&T, Verizon, Vodafone, and Rakuten. Revenue is early-stage but addressable market is global mobile coverage gaps.",
    clarkeRelevance: "AST's large-aperture LEO approach represents a new orbital asset class: satellites whose value is defined by their spectrum access and coverage geometry rather than transponder capacity. A test case for LEO asset valuation methodology.",
  },
  {
    ticker: "SPIR",
    name: "Spire Global",
    vertical: "Satellite Data",
    description: "100+ satellite constellation for weather prediction, maritime tracking, and aviation data.",
    detail: "Spire operates a fleet of small LEO satellites carrying weather, ADS-B, and AIS sensors. Its data products are sold to governments, hedge funds, shipping companies, and airlines. Revenue ~$100M/year with a data-as-a-service model.",
    clarkeRelevance: "Spire demonstrates that normalized satellite data commands a subscription premium over raw orbital access. Its data-as-a-service model is a direct precedent for what Clarke builds at the infrastructure layer: structured, priced, recurring data derived from orbital assets.",
  },
  {
    ticker: "PL",
    name: "Planet Labs",
    vertical: "Earth Observation",
    description: "World's largest commercial Earth observation fleet. Daily imaging of the entire landmass.",
    detail: "Planet operates 200+ Dove satellites providing daily sub-3m resolution imagery of Earth's entire land surface. Customers include governments, agricultural companies, and financial institutions monitoring physical assets from orbit. Revenue ~$220M/year.",
    clarkeRelevance: "Planet's constellation and its orbital positions represent a large, publicly disclosed LEO asset base. Its filings and operational data are inputs to Clarke's LEO registry and pricing models.",
  },
  {
    ticker: "BKSY",
    name: "BlackSky",
    vertical: "Earth Observation",
    description: "Real-time satellite tasking and geospatial intelligence for government and commercial customers.",
    detail: "BlackSky operates a small fleet of high-revisit LEO satellites and sells rapid-response imagery to US and allied governments. Its platform analyzes imagery automatically using AI. Primarily a defense and intelligence contractor.",
    clarkeRelevance: "Government contracts for specific orbital coverage zones reveal how defense customers price orbital access by geography, revisit rate, and resolution. That pricing signal is part of what Clarke normalizes across the orbital market.",
  },
  {
    ticker: "SATL",
    name: "Satellogic",
    vertical: "Earth Observation",
    description: "Sub-meter resolution LEO Earth observation. Building toward a 300-satellite constellation.",
    detail: "Satellogic focuses on high-resolution, affordable Earth imaging with a goal of remapping the entire planet at sub-meter resolution daily. Customers include governments in Latin America, the Middle East, and US agencies.",
    clarkeRelevance: "Satellogic's expansion across emerging market government contracts shows how orbital asset value varies by coverage geography. Pricing models for LEO assets need to account for regional demand variation that operators like Satellogic make visible.",
  },
  {
    ticker: "MYNA",
    name: "Mynaric",
    vertical: "Optical Comms",
    description: "Laser optical communications terminals for satellite constellations, airborne platforms, and ground stations.",
    detail: "Mynaric manufactures space-grade free-space optical communications hardware, enabling satellites to transmit data at multi-gigabit speeds using laser links instead of radio. Key supplier for US military space programs and commercial constellations.",
    clarkeRelevance: "Optical inter-satellite links change the throughput capacity of any given orbital position. As link capacity grows, the economic value of specific orbital slots changes. Infrastructure suppliers like Mynaric are upstream of the asset values Clarke tracks.",
  },
  {
    ticker: "KTOS",
    name: "Kratos Defense",
    vertical: "Ground Systems",
    description: "Satellite ground systems, command and control software, and OpenSpace virtual ground station platform.",
    detail: "Kratos builds the hardware and software that satellite operators use to command their satellites and process downlink data. Its OpenSpace platform virtualizes ground station infrastructure. Significant US government and DoD revenue base.",
    clarkeRelevance: "Ground system operators like Kratos sit at the interface between orbital assets and their terrestrial customers. Understanding ground infrastructure costs and capabilities is part of modeling the full economics of an orbital position.",
  },
  {
    ticker: "LMT",
    name: "Lockheed Martin",
    vertical: "Satellite Infrastructure",
    description: "Largest US defense contractor. Satellite systems division builds the platforms that carry transponders into GEO.",
    detail: "Lockheed's Space division builds satellite buses for commercial and government GEO operators, including its A2100 platform used by SES and others. It also manages the Sirius XM satellite radio infrastructure. Annual revenue ~$18B in space and defense.",
    clarkeRelevance: "Satellite manufacturing costs and platform lifetimes directly affect the economics of the orbital positions those satellites occupy. Lockheed's contract data and fleet disclosures are inputs to asset-level financial modeling.",
  },
];
