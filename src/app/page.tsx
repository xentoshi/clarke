import { buildMeta } from "@/lib/metadata";
import { companies } from "@/data/companies";
import { stocks } from "@/data/stocks";
import { getFleetByKey } from "@/lib/fleet";
import { layerForSector } from "@/lib/value-chain";
import SpaceEconomyMap, { type MapCompany } from "./SpaceEconomyMap";

export const metadata = buildMeta({
  title: "The Space Economy",
  description:
    "An interactive map of the entire space economy — every company, from capital to launch to satellites in orbit to the services they power, organized as one explorable value chain.",
  tag: "Map",
});

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export default function HomePage() {
  const fleetByKey = getFleetByKey();

  // Reverse-map company slug -> stock ticker so the map can mark public names.
  const tickerBySlug: Record<string, string> = {};
  for (const s of stocks) {
    const sn = normalizeName(s.name);
    const match = companies.find((c) => {
      const cn = normalizeName(c.name);
      return cn.includes(sn) || sn.includes(cn);
    });
    if (match) tickerBySlug[match.slug] = s.ticker;
  }

  const mapped: MapCompany[] = companies.map((c) => ({
    slug: c.slug,
    name: c.name,
    sector: c.sector,
    layer: layerForSector(c.sector),
    description: c.description,
    hq: c.hq ?? null,
    founded: c.founded ?? null,
    website: c.website ?? null,
    fleet: fleetByKey[c.slug] ?? null,
    valuationUsd: c.funding?.valuationUsd ?? null,
    valuationAsOf: c.funding?.asOf ?? null,
    ticker: tickerBySlug[c.slug] ?? null,
  }));

  return <SpaceEconomyMap companies={mapped} />;
}
