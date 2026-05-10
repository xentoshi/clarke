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
    clarkeRelevance: "Direct Clarke operator candidate. Viasat holds GEO slots generating contracted transponder lease revenue. A Viasat slot listing would be Clarke's flagship offering.",
  },
  {
    ticker: "IRDM",
    name: "Iridium",
    vertical: "LEO Comms",
    description: "66-satellite LEO constellation. The only truly global voice and data network covering poles.",
    detail: "Iridium operates in low Earth orbit at 780km, not geostationary. Its unique pole-to-pole coverage makes it the standard for maritime, aviation, and government communications where other networks have no coverage. Revenue ~$750M/year.",
    clarkeRelevance: "LEO operator, not a GEO slot holder. Represents the communications satellite sector Clarke's infrastructure supports, and a potential future market as LEO slot coordination becomes valuable.",
  },
  {
    ticker: "GSAT",
    name: "Globalstar",
    vertical: "LEO Comms",
    description: "LEO satellite network. Powers Apple Emergency SOS on every iPhone sold worldwide since 2022.",
    detail: "Globalstar operates 24 satellites in LEO providing voice, data, and IoT services. The Apple partnership, which routes emergency SOS messages via Globalstar, represents a transformative B2B contract that stabilized the company's revenue base.",
    clarkeRelevance: "LEO operator. Not a GEO slot holder, but demonstrates how satellite operators unlock new revenue by licensing capacity to platform companies, the same dynamic Clarke enables at the slot level.",
  },
  {
    ticker: "ASTS",
    name: "AST SpaceMobile",
    vertical: "Broadband",
    description: "Direct-to-device satellite broadband. Large-aperture LEO satellites connect directly to standard smartphones.",
    detail: "AST is building a constellation of large BlueBird satellites designed to connect directly to unmodified mobile phones. No special hardware required. Partnerships with AT&T, Verizon, Vodafone, and Rakuten. Revenue is early-stage but addressable market is global mobile coverage gaps.",
    clarkeRelevance: "Represents next-generation satellite connectivity. As LEO broadband expands, GEO operators face substitution pressure in broadband but retain dominance in broadcast, where Clarke's primary use case sits.",
  },
  {
    ticker: "SPIR",
    name: "Spire Global",
    vertical: "Satellite Data",
    description: "100+ satellite constellation for weather prediction, maritime tracking, and aviation data.",
    detail: "Spire operates a fleet of small LEO satellites carrying weather, ADS-B, and AIS sensors. Its data products are sold to governments, hedge funds, shipping companies, and airlines. Revenue ~$100M/year with a data-as-a-service model.",
    clarkeRelevance: "Demonstrates the data economy built on satellite infrastructure. Spire's orbital positions are LEO, but the company represents how satellite capacity generates recurring subscription revenue, the same model Clarke monetizes for GEO slots.",
  },
  {
    ticker: "PL",
    name: "Planet Labs",
    vertical: "Earth Observation",
    description: "World's largest commercial Earth observation fleet. Daily imaging of the entire landmass.",
    detail: "Planet operates 200+ Dove satellites providing daily sub-3m resolution imagery of Earth's entire land surface. Customers include governments, agricultural companies, and financial institutions monitoring physical assets from orbit. Revenue ~$220M/year.",
    clarkeRelevance: "LEO Earth observation. Not a GEO slot holder, but demonstrates how satellite-derived recurring revenue scales. Planet's subscription model mirrors how Clarke structures yield distribution: contracted, recurring, data-driven.",
  },
  {
    ticker: "BKSY",
    name: "BlackSky",
    vertical: "Earth Observation",
    description: "Real-time satellite tasking and geospatial intelligence for government and commercial customers.",
    detail: "BlackSky operates a small fleet of high-revisit LEO satellites and sells rapid-response imagery to US and allied governments. Its platform analyzes imagery automatically using AI. Primarily a defense and intelligence contractor.",
    clarkeRelevance: "Government satellite market. Represents the defense segment of satellite customers, which relies on specific orbital coverage zones — the same geographic dependency that gives GEO broadcast slots their captive demand.",
  },
  {
    ticker: "SATL",
    name: "Satellogic",
    vertical: "Earth Observation",
    description: "Sub-meter resolution LEO Earth observation. Building toward a 300-satellite constellation.",
    detail: "Satellogic focuses on high-resolution, affordable Earth imaging with a goal of remapping the entire planet at sub-meter resolution daily. Customers include governments in Latin America, the Middle East, and US agencies.",
    clarkeRelevance: "Emerging market satellite operator. Satellogic's expansion into developing-market government contracts mirrors the untapped demand for GEO slot access in regions where Clarke could list regional operators.",
  },
  {
    ticker: "MYNA",
    name: "Mynaric",
    vertical: "Optical Comms",
    description: "Laser optical communications terminals for satellite constellations, airborne platforms, and ground stations.",
    detail: "Mynaric manufactures space-grade free-space optical communications hardware, enabling satellites to transmit data at multi-gigabit speeds using laser links instead of radio. Key supplier for US military space programs and commercial constellations.",
    clarkeRelevance: "Infrastructure supplier. As inter-satellite laser links become standard, they increase the capacity and value of orbital positions, including GEO slots. Higher slot capacity drives higher lease revenue, which drives higher yield for Clarke token holders.",
  },
  {
    ticker: "KTOS",
    name: "Kratos Defense",
    vertical: "Ground Systems",
    description: "Satellite ground systems, command and control software, and OpenSpace virtual ground station platform.",
    detail: "Kratos builds the hardware and software that satellite operators use to command their satellites and process downlink data. Its OpenSpace platform virtualizes ground station infrastructure. Significant US government and DoD revenue base.",
    clarkeRelevance: "Satellite operations infrastructure. Kratos systems are used by the same operators who hold GEO slots. As Clarke scales, ground system operators like Kratos become part of the operational layer supporting listed slots.",
  },
  {
    ticker: "LMT",
    name: "Lockheed Martin",
    vertical: "Satellite Infrastructure",
    description: "Largest US defense contractor. Satellite systems division builds the platforms that carry transponders into GEO.",
    detail: "Lockheed's Space division builds satellite buses for commercial and government GEO operators, including its A2100 platform used by SES and others. It also manages the Sirius XM satellite radio infrastructure. Annual revenue ~$18B in space and defense.",
    clarkeRelevance: "GEO satellite manufacturer. Lockheed builds the platforms that operators place in GEO slots. The slots Clarke tokenizes often carry Lockheed-built satellites. Illustrates how the GEO ecosystem is vertically integrated around a small number of key players.",
  },
];
