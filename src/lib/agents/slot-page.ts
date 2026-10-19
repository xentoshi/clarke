import { listAgentSlots, toAgentSlotSummary, type AgentSlotPayload, type AgentSlotSummary } from "../agent-slot";

export const COMPACT_LIMIT_DEFAULT = 50;
export const COMPACT_LIMIT_MAX = 100;
export const FULL_LIMIT_DEFAULT = 10;
export const FULL_LIMIT_MAX = 25;

export interface SlotListQuery {
  view: "compact" | "full";
  offset: number;
  /** Null when `all` is set. The response then contains every remaining row. */
  limit: number | null;
  all: boolean;
}

export function slotListIsHeavy(query: SlotListQuery): boolean {
  return query.all || query.view === "full";
}

export function resolveSlotListQuery(input: {
  view?: string | null;
  limit?: number | null;
  offset?: number | null;
  all?: boolean | null;
}): { ok: true; query: SlotListQuery } | { ok: false; error: string } {
  const viewRaw = input.view?.trim() || "compact";
  if (viewRaw !== "compact" && viewRaw !== "full") return { ok: false, error: "view must be compact or full" };
  const view = viewRaw;
  const all = input.all === true;
  const offset = input.offset ?? 0;
  if (!Number.isInteger(offset) || offset < 0) return { ok: false, error: "offset must be an integer >= 0" };
  const max = view === "full" ? FULL_LIMIT_MAX : COMPACT_LIMIT_MAX;
  const fallback = view === "full" ? FULL_LIMIT_DEFAULT : COMPACT_LIMIT_DEFAULT;
  if (all) return { ok: true, query: { view, offset, limit: null, all: true } };
  if (input.limit == null) return { ok: true, query: { view, offset, limit: fallback, all: false } };
  if (!Number.isInteger(input.limit) || input.limit < 1 || input.limit > max) {
    return { ok: false, error: `limit must be 1..${max} when view is ${view}` };
  }
  return { ok: true, query: { view, offset, limit: input.limit, all: false } };
}

export function parseSlotListSearch(params: URLSearchParams): { ok: true; query: SlotListQuery } | { ok: false; error: string } {
  const limitRaw = params.get("limit");
  let limit: number | null = null;
  if (limitRaw !== null && limitRaw !== "") {
    if (!/^\d+$/.test(limitRaw)) return { ok: false, error: "limit must be an integer" };
    limit = Number(limitRaw);
  }
  const offsetRaw = params.get("offset");
  let offset: number | null = null;
  if (offsetRaw !== null && offsetRaw !== "") {
    if (!/^\d+$/.test(offsetRaw)) return { ok: false, error: "offset must be an integer" };
    offset = Number(offsetRaw);
  }
  return resolveSlotListQuery({
    view: params.get("view"),
    limit,
    offset,
    all: params.get("all") === "1",
  });
}

export interface SlotListPage {
  view: "compact" | "full";
  total: number;
  offset: number;
  limit: number | null;
  nextOffset: number | null;
  slots: AgentSlotSummary[] | AgentSlotPayload[];
}

export function pageSlotList(query: SlotListQuery): SlotListPage {
  const allRows = listAgentSlots();
  const total = allRows.length;
  const offset = Math.min(query.offset, total);
  const end = query.all || query.limit === null ? total : Math.min(total, offset + query.limit);
  const slice = allRows.slice(offset, end);
  const slots = query.view === "compact" ? slice.map(toAgentSlotSummary) : slice;
  return {
    view: query.view,
    total,
    offset,
    limit: query.all ? null : query.limit,
    nextOffset: end < total ? end : null,
    slots,
  };
}
