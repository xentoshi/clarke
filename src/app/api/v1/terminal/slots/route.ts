import type { NextRequest } from "next/server";
import { listTerminalSummaries } from "@/lib/slot-terminal";
import { freshnessMeta } from "@/lib/agents/operations";
import { ok, preflight } from "@/lib/agents/envelope";
import { gateTerminal } from "@/lib/terminal-gate";

export const OPTIONS = () => preflight();
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const gate = gateTerminal(req);
  if (!gate.ok) return gate.response;
  const data = listTerminalSummaries().map(({ slug, slot, congestion, valuation, satCount }) => ({
    slug,
    label: slot.label,
    longitude: slot.longitude,
    operator: slot.operator,
    country: slot.country,
    status: slot.status,
    satCount,
    congestionScore: congestion.score,
    valuation: {
      modelVersion: valuation.modelVersion,
      point: valuation.point,
      low: valuation.low,
      high: valuation.high,
      confidence: valuation.confidence,
      nonCommercial: valuation.nonCommercial,
      formatted: valuation.formatted,
      asOf: valuation.asOf,
      disclaimer: valuation.disclaimer,
    },
  }));
  return ok(data, { count: data.length, freshness: freshnessMeta(), cacheSeconds: 60 });
}
