import type { NextRequest } from "next/server";
import { buildSlotTerminal } from "@/lib/slot-terminal";
import { isSafeSlug, freshnessMeta } from "@/lib/agents/operations";
import { ok, notFound, badRequest, preflight } from "@/lib/agents/envelope";
import { gateTerminal } from "@/lib/terminal-gate";

export const OPTIONS = () => preflight();
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const gate = gateTerminal(req);
  if (!gate.ok) return gate.response;

  const { slug } = await ctx.params;
  if (!isSafeSlug(slug)) return badRequest("Invalid slug");
  const model = buildSlotTerminal(slug);
  if (!model) return notFound(`No slot at slug '${slug}'`);

  return ok(
    {
      slug: model.slug,
      source: model.historySource,
      series: model.history,
      note: model.historySource === "backfill"
        ? "Series is a deterministic v0 model path (not observed trades). Run npm run seed:valuations to persist snapshots."
        : "Series read from data/terminal.db. Last point is a model snapshot, not a trade print.",
    },
    { count: model.history.length, freshness: freshnessMeta(), cacheSeconds: 60 },
  );
}
