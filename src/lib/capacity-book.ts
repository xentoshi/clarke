import type { SlotValuation } from "./valuation";
import type { CongestionData } from "./satellites";
import type { Provenance } from "./provenance";

// Simulated capacity book. Explicitly NOT a live market: there is no public
// GEO transponder bid/ask feed. Spreads and sizes are derived from the v0
// valuation and congestion so the Terminal can show a market-like strip
// without presenting fake prints as real trades.

export interface BookLevel {
  side: "bid" | "ask";
  priceUsd: number;
  sizeMhz: number;
  label: string;
}

export interface CapacityBook {
  simulated: true;
  disclaimer: string;
  midUsd: number;
  spreadPct: number;
  unit: string;
  bids: BookLevel[];
  asks: BookLevel[];
  provenance: Provenance;
}

export const CAPACITY_DISCLAIMER =
  "SIMULATED capacity book — not live bids, offers, or trades. Derived from valuation v0 and congestion so the strip can be read; it is not a marketplace.";

export function simulatedCapacityBook(
  valuation: SlotValuation,
  congestion: CongestionData,
  asOf: string,
): CapacityBook {
  const mid = valuation.nonCommercial ? 0 : valuation.point;
  // Tighter spread on congested (more "liquid") arcs; wider on sparse ones.
  const spreadPct = round4(0.07 + (1 - congestion.score / 100) * 0.06);
  const half = spreadPct / 2;
  const unit = "36 MHz transponder-equivalent · USD (simulated)";

  const bids: BookLevel[] = mid
    ? [0, 1, 2].map((i) => {
        const price = Math.round(mid * (1 - half - i * 0.025));
        const size = Math.round(36 * (3 - i) * (0.6 + congestion.score / 200));
        return { side: "bid" as const, priceUsd: price, sizeMhz: size, label: `Bid ${i + 1}` };
      })
    : [];

  const asks: BookLevel[] = mid
    ? [0, 1, 2].map((i) => {
        const price = Math.round(mid * (1 + half + i * 0.025));
        const size = Math.round(36 * (2.4 - i * 0.6) * (0.6 + congestion.score / 200));
        return { side: "ask" as const, priceUsd: price, sizeMhz: size, label: `Ask ${i + 1}` };
      })
    : [];

  return {
    simulated: true,
    disclaimer: CAPACITY_DISCLAIMER,
    midUsd: mid,
    spreadPct,
    unit,
    bids,
    asks,
    provenance: {
      source: "Clarke simulated book (not a market)",
      asOf,
      note: "Function of valuation v0 midpoint + congestion score",
    },
  };
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
