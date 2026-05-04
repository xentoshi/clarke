export interface Investor {
  name: string;
  slug: string;
  type: "vc" | "corporate" | "sovereign" | "angel";
  aum?: string;
  focus: string[];
  thesis: string;
  notableBets: { company: string; round: string; vertical: string }[];
  website: string;
  partners?: string[];
}

export const investors: Investor[] = [
  {
    name: "Andreessen Horowitz (a16z)",
    slug: "a16z",
    type: "vc",
    aum: "$35B+",
    focus: ["Space", "Launch", "Deep Tech", "Defense"],
    thesis: "American dynamism — backing companies rebuilding physical industries with software. Believes the next wave of wealth creation is in hard tech and space infrastructure, not pure software.",
    notableBets: [
      { company: "Axiom Space", round: "Series C", vertical: "Space Habitation" },
      { company: "Anduril", round: "Series E", vertical: "Defense" },
      { company: "Relativity Space", round: "Series E", vertical: "Launch" },
    ],
    website: "https://a16z.com",
    partners: ["Katherine Boyle", "David Ulevitch"],
  },
  {
    name: "Founders Fund",
    slug: "founders-fund",
    type: "vc",
    aum: "$11B+",
    focus: ["Space", "Launch", "Deep Tech", "Biotech"],
    thesis: "We wanted flying cars, instead we got 140 characters. Bets on transformative technology that others consider impossible — the earliest major backer of SpaceX when every other VC passed.",
    notableBets: [
      { company: "SpaceX", round: "Series A", vertical: "Launch" },
      { company: "Anduril", round: "Series F", vertical: "Defense" },
      { company: "Palantir", round: "Early", vertical: "Defense / AI" },
    ],
    website: "https://foundersfund.com",
    partners: ["Peter Thiel", "Brian Singerman", "Napoleon Ta"],
  },
  {
    name: "Lux Capital",
    slug: "lux-capital",
    type: "vc",
    aum: "$5B+",
    focus: ["Space", "Space Manufacturing", "Earth Observation", "Deep Tech"],
    thesis: "Invests at the frontier of science and technology where the line between possible and impossible is blurred. Among the first VCs to back in-space manufacturing and satellite data as commercial ventures.",
    notableBets: [
      { company: "Varda Space Industries", round: "Series A", vertical: "Space Manufacturing" },
      { company: "Spire Global", round: "Series B", vertical: "Earth Observation" },
      { company: "Physical Intelligence (π)", round: "Series B", vertical: "Robotics" },
    ],
    website: "https://luxcapital.com",
    partners: ["Josh Wolfe", "Peter Hébert"],
  },
  {
    name: "Khosla Ventures",
    slug: "khosla",
    type: "vc",
    aum: "$15B+",
    focus: ["Space Power", "Nuclear", "Deep Tech", "ISRU"],
    thesis: "High-risk, high-impact investments in breakthrough technologies. Vinod Khosla believes energy and space infrastructure — including advanced fission and in-space resource extraction — will define the next century.",
    notableBets: [
      { company: "Oklo", round: "Series B", vertical: "Space Power" },
      { company: "Commonwealth Fusion Systems", round: "Series B", vertical: "Power" },
      { company: "Covariant", round: "Series B", vertical: "Robotics" },
    ],
    website: "https://khoslaventures.com",
    partners: ["Vinod Khosla", "Samir Kaul"],
  },
  {
    name: "Eclipse Ventures",
    slug: "eclipse",
    type: "vc",
    aum: "$2B+",
    focus: ["Space Manufacturing", "Launch", "Deep Tech", "Hardware"],
    thesis: "Focused exclusively on 'hard tech' — companies solving physical-world problems. Increasingly active in space manufacturing and launch infrastructure as the sector matures past early-stage risk.",
    notableBets: [
      { company: "Relativity Space", round: "Series C", vertical: "Launch" },
      { company: "Bright Machines", round: "Series A", vertical: "Manufacturing" },
      { company: "Veo Robotics", round: "Series B", vertical: "Robotics" },
    ],
    website: "https://eclipse.vc",
    partners: ["Pierre Lamond", "Lior Susan"],
  },
  {
    name: "Tiger Global Management",
    slug: "tiger-global",
    type: "vc",
    aum: "$50B+",
    focus: ["Space", "Deep Tech", "AI"],
    thesis: "Growth-stage technology investing globally. Follows the momentum into space as the sector transitions from pure government to commercial — backing high-growth companies at the intersection of software and space infrastructure.",
    notableBets: [
      { company: "SpaceX", round: "Growth", vertical: "Launch" },
      { company: "Axiom Space", round: "Series B", vertical: "Space Habitation" },
    ],
    website: "https://tigerglobal.com",
    partners: ["Chase Coleman", "Scott Shleifer"],
  },
  {
    name: "NVIDIA Ventures",
    slug: "nvidia-ventures",
    type: "corporate",
    focus: ["Space Robotics", "AI Hardware", "Autonomous Systems", "Earth Observation"],
    thesis: "Strategic investment arm of NVIDIA. Backs companies building on the NVIDIA platform (CUDA, Isaac, Jetson). Space robotics and autonomous satellite operations are a natural extension of the autonomous systems thesis.",
    notableBets: [
      { company: "Planet Labs", round: "Strategic", vertical: "Earth Observation" },
      { company: "Figure AI", round: "Series B", vertical: "Robotics" },
      { company: "Wayve", round: "Series C", vertical: "Autonomous Systems" },
    ],
    website: "https://nvidia.com",
  },
  {
    name: "Microsoft M12",
    slug: "microsoft-m12",
    type: "corporate",
    focus: ["Space Power", "Space Communications", "Deep Tech", "Nuclear"],
    thesis: "Microsoft's venture fund invests in AI infrastructure and increasingly in energy and space connectivity. The nuclear and satellite communication bets reflect Microsoft's urgent need for power and global connectivity for Azure data centers.",
    notableBets: [
      { company: "Loft Orbital", round: "Series B", vertical: "Space Comms" },
      { company: "Helion Energy", round: "Series F", vertical: "Power" },
      { company: "Kairos Power", round: "Series B", vertical: "Power" },
    ],
    website: "https://m12.vc",
  },
  {
    name: "In-Q-Tel (IQT)",
    slug: "in-q-tel",
    type: "sovereign",
    focus: ["Earth Observation", "Space", "Launch", "Defense", "AI Hardware"],
    thesis: "CIA's venture arm. Invests in technologies critical to US national security. Being IQT-backed is a strong signal of defense applicability. Early backer of Planet Labs, Capella Space, and Spire Global — all now publicly traded.",
    notableBets: [
      { company: "Planet Labs", round: "Series B", vertical: "Earth Observation" },
      { company: "Capella Space", round: "Series B", vertical: "Earth Observation" },
      { company: "Spire Global", round: "Series C", vertical: "Earth Observation" },
    ],
    website: "https://iqt.org",
  },
  {
    name: "Sam Altman (Angel)",
    slug: "sam-altman",
    type: "angel",
    focus: ["Space Power", "Nuclear", "Deep Tech", "AI"],
    thesis: "Personally investing in the technologies he believes will matter most for humanity's long-term survival: nuclear energy for off-world power, and AI systems that will be necessary to operate planetary infrastructure autonomously.",
    notableBets: [
      { company: "Oklo", round: "Series B", vertical: "Space Power" },
      { company: "Helion Energy", round: "Series F", vertical: "Power" },
      { company: "1X Technologies", round: "Series A", vertical: "Robotics" },
    ],
    website: "https://twitter.com/sama",
  },
  {
    name: "Sequoia Capital",
    slug: "sequoia",
    type: "vc",
    aum: "$85B+",
    focus: ["Space", "Deep Tech", "AI Hardware", "Launch"],
    thesis: "The dominant generalist VC with increasing hard tech exposure. Following the commercial space build-out as a multi-decade infrastructure opportunity — similar to the internet infrastructure bets of the 1990s.",
    notableBets: [
      { company: "SpaceX", round: "Growth", vertical: "Launch" },
      { company: "Physical Intelligence (π)", round: "Series B", vertical: "Robotics" },
    ],
    website: "https://sequoiacap.com",
    partners: ["Roelof Botha", "Alfred Lin"],
  },
  {
    name: "General Catalyst",
    slug: "general-catalyst",
    type: "vc",
    aum: "$25B+",
    focus: ["Space", "Defense", "Deep Tech", "Launch"],
    thesis: "Resilience investing — backing companies that strengthen national infrastructure, defense, and industrial capacity. Views commercial space as critical national infrastructure requiring the same urgency as semiconductor independence.",
    notableBets: [
      { company: "Stoke Space", round: "Series A", vertical: "Launch" },
      { company: "Anduril", round: "Series D", vertical: "Defense" },
    ],
    website: "https://generalcatalyst.com",
    partners: ["Hemant Taneja", "Quentin Clark"],
  },
];

export const typeLabels: Record<Investor["type"], string> = {
  vc: "Venture Capital",
  corporate: "Corporate VC",
  sovereign: "Gov / Sovereign",
  angel: "Angel",
};

export const typeColors: Record<Investor["type"], string> = {
  vc: "text-violet-300 bg-violet-950 border-violet-800",
  corporate: "text-blue-300 bg-blue-950 border-blue-800",
  sovereign: "text-red-300 bg-red-950 border-red-800",
  angel: "text-amber-300 bg-amber-950 border-amber-800",
};
