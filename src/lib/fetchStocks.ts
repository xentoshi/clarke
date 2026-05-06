export interface StockQuote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap?: number;
  high52w?: number;
  low52w?: number;
  volume?: number;
  name: string;
}

export async function fetchQuote(ticker: string): Promise<StockQuote | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 300 },
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const price = meta.regularMarketPrice ?? 0;
    const prev = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = price - prev;
    const changePercent = prev ? (change / prev) * 100 : 0;

    return {
      ticker,
      name: meta.shortName ?? ticker,
      price,
      change,
      changePercent,
      marketCap: meta.marketCap,
      high52w: meta.fiftyTwoWeekHigh,
      low52w: meta.fiftyTwoWeekLow,
      volume: meta.regularMarketVolume,
    };
  } catch {
    return null;
  }
}

export async function fetchAllQuotes(tickers: string[]): Promise<StockQuote[]> {
  if (tickers.length === 0) return [];
  try {
    const symbols = tickers.join(",");
    const res = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,marketCap,fiftyTwoWeekHigh,fiftyTwoWeekLow,regularMarketVolume,shortName`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 300 },
      }
    );
    if (!res.ok) throw new Error(`Yahoo Finance v7 returned ${res.status}`);
    const json = await res.json();
    const quotes: unknown[] = json?.quoteResponse?.result ?? [];
    return quotes
      .filter((q): q is Record<string, unknown> => typeof q === "object" && q !== null)
      .map((q) => {
        const price = (q.regularMarketPrice as number) ?? 0;
        const change = (q.regularMarketChange as number) ?? 0;
        const changePercent = (q.regularMarketChangePercent as number) ?? 0;
        return {
          ticker: q.symbol as string,
          name: (q.shortName as string) ?? (q.symbol as string),
          price,
          change,
          changePercent,
          marketCap: q.marketCap as number | undefined,
          high52w: q.fiftyTwoWeekHigh as number | undefined,
          low52w: q.fiftyTwoWeekLow as number | undefined,
          volume: q.regularMarketVolume as number | undefined,
        };
      });
  } catch {
    // Fall back to individual requests if the batch endpoint fails
    const results = await Promise.all(tickers.map(fetchQuote));
    return results.filter((r): r is StockQuote => r !== null);
  }
}

export function formatMarketCap(val?: number): string {
  if (!val) return "-";
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
  return `$${val.toLocaleString()}`;
}

export function formatVolume(val?: number): string {
  if (!val) return "-";
  if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(0)}K`;
  return val.toString();
}
