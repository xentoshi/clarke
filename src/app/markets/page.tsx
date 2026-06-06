import { buildMeta } from "@/lib/metadata";
import { stocks } from "@/data/stocks";
import { companies } from "@/data/companies";
import { fetchAllQuotes } from "@/lib/fetchStocks";
import { fetchSparkline } from "@/lib/fetchSparkline";
import { getSatelliteStats } from "@/lib/satellites";
import { getFleetByKey } from "@/lib/fleet";
import MarketsClient, { type PrivateCompany } from "./MarketsClient";

export const metadata = buildMeta({
  title: "Markets",
  description:
    "Market data for space and satellite companies — public stocks and private valuations, market caps, sector performance, and satellites in orbit.",
  tag: "Markets",
  path: "/markets",
});

export const revalidate = 300;

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export default async function MarketsPage() {
  const tickers = stocks.map((s) => s.ticker);

  const [quotes, sparklines, satStats] = await Promise.all([
    fetchAllQuotes(tickers),
    Promise.all(
      stocks.map(async (s) => ({ ticker: s.ticker, values: await fetchSparkline(s.ticker) }))
    ),
    Promise.resolve(getSatelliteStats()),
  ]);

  const sparklineMap: Record<string, number[]> = {};
  for (const s of sparklines) sparklineMap[s.ticker] = s.values;

  const fleetByKey = getFleetByKey();

  const slugByTicker: Record<string, string> = {};
  for (const s of stocks) {
    const sn = normalizeName(s.name);
    const match = companies.find((c) => {
      const cn = normalizeName(c.name);
      return cn.includes(sn) || sn.includes(cn);
    });
    if (match) slugByTicker[s.ticker] = match.slug;
  }

  const publicSlugs = new Set(Object.values(slugByTicker));
  const privates: PrivateCompany[] = companies
    .filter((c) => !publicSlugs.has(c.slug))
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      sector: c.sector,
      valuationUsd: c.funding?.valuationUsd ?? null,
      valuationAsOf: c.funding?.asOf ?? null,
      fleet: fleetByKey[c.slug] ?? null,
    }));

  return (
    <MarketsClient
      quotes={quotes}
      sparklines={sparklineMap}
      slugByTicker={slugByTicker}
      fleetByKey={fleetByKey}
      privates={privates}
      satellitesTracked={satStats.total}
      geoCount={satStats.geoCount}
      companiesTracked={companies.length}
    />
  );
}
