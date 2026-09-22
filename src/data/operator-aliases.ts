// Curated GEO operator identity map (class M).
// Display/grouping only. Raw UCS/FCC strings stay inspectable.
// Not a corporate-ownership graph: joint "A/B" source strings stay unmapped
// unless the whole string is listed. Successor/rebrand notes are explicit.

export interface OperatorAliasEntry {
  canonical: string;
  aliases: string[];
  notes?: string;
}

export const OPERATOR_ALIAS_ENTRIES: OperatorAliasEntry[] = [
  {
    canonical: "SES",
    aliases: [
      "SES S.A.",
      "SES Americom, Inc.",
      "SES Americom",
      "SES Satellites (Gibraltar) Limited",
      "SES-17 S.a r.l.",
      "SES DTH do Brasil Ltda",
      "New Skies Satellites B.V.",
      "SES S.A. -- total capacity leased to subsidiary of EchoStar Corp.",
    ],
    notes: "UCS SES S.A. and FCC SES / New Skies legal entities. New Skies is the SES brand, not a second operator.",
  },
  {
    canonical: "Intelsat",
    aliases: [
      "Intelsat S.A.",
      "Intelsat License LLC",
      "Intelsat Inflight Licenses LLC",
      "PanAmSat (Intelsat S.A.)",
      "PanAmSat",
    ],
    notes: "PanAmSat strings in UCS are Intelsat fleet identity, not a live second operator.",
  },
  {
    canonical: "Eutelsat",
    aliases: [
      "EUTELSAT S.A.",
      "Eutelsat S.A.",
      "EUTELSAT Americas",
      "ES 172 LLC",
    ],
    notes: "ES 172 LLC is the FCC licensee string for Eutelsat 172. Joint EUTELSAT/Nilesat rows stay unmapped.",
  },
  {
    canonical: "DirecTV",
    aliases: [
      "DirecTV, Inc.",
      "DIRECTV Enterprises, LLC",
      "DIRECTV Latin America, LLC",
      "AT&T",
    ],
    notes: "UCS still says DirecTV, Inc. for AT&T T16. FCC is DIRECTV Enterprises. Brand, not an AT&T ownership graph.",
  },
  {
    canonical: "Ligado",
    aliases: [
      "LightSquared",
      "Ligado Networks Subsidiary, LLC, Debtor-in-Possession",
      "Ligado Networks",
      "Mobile Satellite Ventures",
      "SkyTerra",
    ],
    notes: "Successor/rebrand: Mobile Satellite Ventures to SkyTerra to LightSquared to Ligado. Not a parent-subsidiary tree.",
  },
  {
    canonical: "Sky Perfect JSAT",
    aliases: [
      "Sky Perfect JSAT Corporation",
      "Sky Perfect JSAT Corp.",
      "JSAT",
      "JCSat",
      "JCSAT",
    ],
    notes: "UCS Sky Perfect JSAT Corporation. JCSat is the satellite family name, not a second operator.",
  },
  {
    canonical: "Astranis",
    aliases: ["Astranis Projects USA LLC"],
  },
  {
    canonical: "US DoD",
    aliases: [
      "DoD/US Navy",
      "US Navy",
      "US Air Force",
      "Military Satellite Communications - US Air Force",
      "Air Force Satellite Control Network",
      "Air Force Research Laboratory",
      "US Space Force",
      "U.S. Space Force/Other Transaction Authority",
      "National Reconnaissance Office (NRO)/US Air Force",
      "National Reconnaissance Office (NRO)",
      "National Reconnaissance Office",
      "Unknown US agency",
      "Federal Government (Reserved)",
    ],
    notes: "UCS/FCC US military and reserved-federal strings, including MUOS (DoD/US Navy). Not a single program office.",
  },
  {
    canonical: "EchoStar",
    aliases: [
      "Echostar Satellite Services, LLC",
      "EchoStar Satellite Services L.L.C.",
      "EchoStar Satellite Operating Corporation",
      "EchoStar BSS Corporation",
      "EchoStar Broadcasting Corp.",
      "EchoStar Corporation",
    ],
    notes: "EchoStar legal-entity variants. DISH FCC rows stay DISH. Hughes stays Hughes.",
  },
  {
    canonical: "DISH",
    aliases: ["DISH Operating L.L.C.", "DISH Operating LLC"],
  },
  {
    canonical: "Inmarsat",
    aliases: [
      "INMARSAT, Ltd.",
      "Inmarsat Inc.",
      "Inmarsat Group Holdings Limited",
    ],
  },
  {
    canonical: "Telesat",
    aliases: [
      "Telesat Canada Ltd. (BCE, Inc.)",
      "Telesat Canada/Telesat Spectrum Corporation",
      "Telesat Brasil Capacidade de Satelites Ltda.",
      "Telesat International Limited",
      "Skynet Satellite Corporation",
    ],
    notes: "Skynet Satellite Corporation is the Telesat US FCC licensee name.",
  },
  {
    canonical: "ViaSat",
    aliases: ["ViaSat, Inc.", "Viasat"],
  },
  {
    canonical: "Sirius XM",
    aliases: [
      "Sirius XM Holdings",
      "Sirius XM Radio Inc.",
      "Sirius XM Radio LLC",
      "XM Satellite Radio",
      "XM Radio LLC",
      "Satellite CD Radio LLC",
    ],
    notes: "Sirius/XM radio GEO brand variants.",
  },
  {
    canonical: "China Satcom",
    aliases: ["China Satellite Communication Corp. (China Satcom)"],
  },
  {
    canonical: "ISRO",
    aliases: ["Indian Space Research Organization (ISRO)"],
  },
  {
    canonical: "Arabsat",
    aliases: ["Arab Satellite Communications Org. (ASCO)"],
  },
  {
    canonical: "Hispasat",
    aliases: ["Hispasat, S.A."],
    notes: "Hispamar rows stay Hispamar. Not merged into Hispasat.",
  },
  {
    canonical: "Hispamar",
    aliases: [
      "Hispamar (subsidiary of Hispasat - Spain)",
      "Hispamar Satélites, S.A.",
    ],
  },
  {
    canonical: "Embratel Star One",
    aliases: [
      "Embratel TVSAT Telecomunicacões S.A.",
      "Embratel Tvsat Telecomunicações S.A.",
    ],
  },
  {
    canonical: "Hughes",
    aliases: ["Hughes Network Systems, LLC", "Hughes Space and Communications Co."],
  },
  {
    canonical: "Optus",
    aliases: ["Optus Communications (Parent: Singapore Telecom)"],
  },
  {
    canonical: "Measat",
    aliases: ["MEASAT Satellite Systems Sdn. Bhd."],
  },
  {
    canonical: "AsiaSat",
    aliases: ["Asia Satellite Telecommunications Co. Ltd."],
  },
  {
    canonical: "RSCC",
    aliases: ["Russian Satellite Communications Company"],
  },
  {
    canonical: "Türksat",
    aliases: ["Turksat"],
  },
  {
    canonical: "Yahsat",
    aliases: ["Al Yah Satellite Communications Co. (YAHSAT)"],
  },
  {
    canonical: "Thaicom",
    aliases: ["Thaicom Public Company Ltd."],
  },
  {
    canonical: "APT",
    aliases: ["APT Satellite Holdings Ltd."],
  },
  {
    canonical: "ABS",
    aliases: ["Asia Broadcast Satellite Ltd.", "ABS Global Ltd."],
  },
  {
    canonical: "Satmex",
    aliases: ["Satélites Mexicanos S.A. de C.V."],
  },
  {
    canonical: "ArSat",
    aliases: ["Empresa Argentina de Soluciones Satelitales S.A."],
  },
  {
    canonical: "Avanti",
    aliases: ["Avanti Communications, PLC", "Avanti Hylas 2 Ltd."],
  },
  {
    canonical: "NASA",
    aliases: [
      "National Aeronautics and Space Administration (NASA)",
      "National Aeronautics and Space Administration (NASA)/Goddard Space Flight Center",
      "SpaceData International LLC (NASA)",
    ],
  },
];
