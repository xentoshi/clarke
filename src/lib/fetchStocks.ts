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

// The Yahoo v8 chart endpoint (fetchQuote) returns price but not market cap.
// Yahoo's batch quote endpoint does, but now requires a crumb + cookie. We fetch
// that session once, then a single authenticated batch call returns price,
// change, market cap, and 52-week range for every ticker (US and international).
const YAHOO_UA = "Mozilla/5.0";
let _session: { cookie: string; crumb: string } | null = null;

async function getYahooSession(): Promise<{ cookie: string; crumb: string } | null> {
  if (_session) return _session;
  try {
    const r1 = await fetch("https://fc.yahoo.com/", { headers: { "User-Agent": YAHOO_UA } });
    const setCookies = (r1.headers.getSetCookie?.() ?? []) as string[];
    const single = r1.headers.get("set-cookie");
    const cookie = (setCookies.length ? setCookies : single ? [single] : [])
      .map((c) => c.split(";")[0])
      .join("; ");
    if (!cookie) return null;

    const r2 = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
      headers: { "User-Agent": YAHOO_UA, Cookie: cookie },
    });
    const crumb = (await r2.text()).trim();
    if (!crumb || crumb.includes("<") || crumb.length > 32) return null;

    _session = { cookie, crumb };
    return _session;
  } catch {
    return null;
  }
}

export async function fetchAllQuotes(tickers: string[]): Promise<StockQuote[]> {
  if (tickers.length === 0) return [];

  const session = await getYahooSession();
  if (session) {
    try {
      const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(tickers.join(","))}&crumb=${encodeURIComponent(session.crumb)}`;
      const res = await fetch(url, {
        headers: { "User-Agent": YAHOO_UA, Cookie: session.cookie },
        next: { revalidate: 300 },
      });
      if (res.ok) {
        const json = await res.json();
        const result: unknown[] = json?.quoteResponse?.result ?? [];
        if (result.length > 0) {
          return result
            .filter((q): q is Record<string, unknown> => typeof q === "object" && q !== null)
            .map((q) => ({
              ticker: q.symbol as string,
              name: (q.shortName as string) ?? (q.longName as string) ?? (q.symbol as string),
              price: (q.regularMarketPrice as number) ?? 0,
              change: (q.regularMarketChange as number) ?? 0,
              changePercent: (q.regularMarketChangePercent as number) ?? 0,
              marketCap: q.marketCap as number | undefined,
              high52w: q.fiftyTwoWeekHigh as number | undefined,
              low52w: q.fiftyTwoWeekLow as number | undefined,
              volume: q.regularMarketVolume as number | undefined,
            }));
        }
      }
      _session = null; // crumb likely stale — drop it so the next call re-auths
    } catch {
      _session = null;
    }
  }

  // Fallback: per-ticker v8 chart (price/change only, no market cap).
  const results = await Promise.all(tickers.map(fetchQuote));
  return results.filter((r): r is StockQuote => r !== null);
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
