export function formatMoney(usd: number): string {
  if (usd >= 1e9) return `$${(usd / 1e9).toFixed(usd / 1e9 >= 10 ? 0 : 1)}B`;
  if (usd >= 1e6) return `$${Math.round(usd / 1e6)}M`;
  return `$${Math.round(usd / 1e3)}K`;
}
