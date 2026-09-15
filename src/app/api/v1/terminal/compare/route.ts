import type { NextRequest } from "next/server";
import { buildSlotTerminal } from "@/lib/slot-terminal";
import { isSafeSlug, freshnessMeta } from "@/lib/agents/operations";
import { ok, badRequest, preflight } from "@/lib/agents/envelope";
import { gateTerminal } from "@/lib/terminal-gate";

export const OPTIONS = () => preflight();
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const gate = gateTerminal(req);
  if (!gate.ok) return gate.response;

  const raw = req.nextUrl.searchParams.get("slugs") ?? "";
  const slugs = [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))];
  if (slugs.length === 0) return badRequest("Pass slugs as comma-separated query, max 4");
  if (slugs.length > 4) return badRequest("Compare is limited to 4 slots");
  if (slugs.some((s) => !isSafeSlug(s))) return badRequest("Invalid slug");

  const slots = slugs.map((slug) => {
    const model = buildSlotTerminal(slug);
    if (!model) return { slug, missing: true as const };
    return {
      slug,
      missing: false as const,
      label: model.label,
      operator: model.operator,
      country: model.country,
      status: model.status,
      satCount: model.satCount,
      congestion: model.congestion,
      valuation: model.valuation,
      license: model.valuation.license,
      asOf: model.asOf,
    };
  });

  return ok(slots, { count: slots.length, freshness: freshnessMeta(), cacheSeconds: 60 });
}
