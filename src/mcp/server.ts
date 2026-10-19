import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  getSlotDossier,
  listSatellites,
  listDeltas,
} from "../lib/agents/operations";
import { pageSlotList, resolveSlotListQuery } from "../lib/agents/slot-page";
import { DeltaQueryError } from "../lib/delta-feed";
import { MAX_PUBLIC_JSON_BYTES, cachedRead } from "../lib/process-cache";

export const CLARKE_LIST_SLOTS_DESCRIPTION =
  "List GEO slots in the Clarke registry (curated positions merged with UCS-derived positions). The default is a compact page of 50: slug, label, longitude, region, operatorIdentity (split, single, or none), country, status, and satCount. Pass offset to continue. view=full returns occupancy observations (tleEpoch and tleStale, older than 14 days when a TLE supplied occupancy), operatorMix, FCC rows, disputes, and source vintage, in pages of 10 (max 25). all=true is the explicit full list for that view and is large when view is full. The human Terminal models are not in either view. ITU filings are not in this product. ITU Space Explorer is the current ITU source. SNS Online shut down in January 2025 (ituRecorded is not_in_product on the full record). TLE longitude is a tracked position, not an FCC or ITU assignment.";

export const CLARKE_GET_SLOT_DESCRIPTION =
  "Agent slot record for one GEO position by slug (e.g. '19-2e' for 19.2E, '101w' for 101W). Operator identity is operatorMix, with raw source strings on each share. operatorIdentity is split when more than one canonical operator is in the occupancy window, single when one is, none when the window has no attributed operator. Also returns occupancy observations (tleEpoch and tleStale), FCC authorizations, dispute records, ituRecorded, and source vintage (tleEpochMin, tleEpochMax, tleStale, tleStaleAfterDays 14), with provenance on occupancy, UCS, FCC, license, and rights. tleStale is true only for a TLE that supplied occupancy and is older than 14 days. UCS fallback does not invent a TLE epoch. ITU filings are not in this product. ITU Space Explorer is the current ITU source. SNS Online shut down in January 2025 (ituRecorded is not_in_product). TLE longitude is a tracked position, not an FCC or ITU assignment.";

export const CLARKE_GET_TERMINAL_DESCRIPTION =
  "Agent slot record for one GEO position. Same payload as clarke_get_slot: operatorMix as the occupancy identity, FCC rows, disputes, ituRecorded, and source vintage including tleStale (older than 14 days). operatorIdentity split means the window is shared. ITU filings are not in this product. ITU Space Explorer is the current ITU source. SNS Online shut down in January 2025 (ituRecorded is not_in_product). TLE longitude is a tracked position, not an FCC or ITU assignment.";

export const MCP_SATELLITE_DEFAULT_LIMIT = 100;

export const CLARKE_LIST_SATELLITES_DESCRIPTION =
  "List GEO satellites from the UCS Satellite Database, optionally filtered by operator or owner country. Returns up to `limit` rows (default 100; max 1000).";

export const CLARKE_LIST_DELTAS_DESCRIPTION =
  "On-ingest change feed for GEO slot occupancy, FCC rows, and disputes (Slot Index delta feed, edition 2). coverage is bootstrap when fewer than two registry snapshots are stored, and ingest_deltas once a later snapshot exists. Each change has slug, longitude when available, detectedAt, source vintage, before and after, and provenance. Occupancy changes are enter, leave, authority_flip, and tle_epoch. tle_epoch is a TLE epoch change or a 14 day stale transition on a TLE used for occupancy. Bootstrap does not invent occupancy history. FCC changes are new, lapsed, licensee, status, and as_of when a snapshot does not store parsed workbook rows. When both snapshots store parsed data/ssal.xlsx rows, filing diffs for that interval are new, removed, and changed. removed is a call sign that left the workbook. changed is the same call sign with a different orbital location, satellite name, licensee, administration, service, frequency range, in-orbit date, grant status, or notes. Dispute changes are appear, clear, and kind. ITU filings are not in this product. ITU Space Explorer is the current ITU source. SNS Online shut down in January 2025. TLE longitude is a tracked position, not an FCC or ITU assignment. satellite_relocated rows are not occupancy changes. Optional filters: slug, domain (occupancy, fcc, dispute), since (exclusive ISO-8601 UTC). The public page keeps at most 40 changes and about 48 KB of change JSON. A timestamp with many rows is split. truncated is true when more changes matched. Pass after from nextAfter to continue. since stays an exclusive time filter. nextSince is set only when the page ended on a timestamp boundary.";

const SAFE_SLUG = /^[a-z0-9-]+$/;
const SAFE_STRING = /^[A-Za-z0-9 .\-_&]{1,80}$/;

function textResult(text: string) {
  if (text.length > MAX_PUBLIC_JSON_BYTES) {
    return errorResult(`Response exceeds ${MAX_PUBLIC_JSON_BYTES} bytes. Narrow the query with slug, domain, since, or limit.`);
  }
  return {
    content: [
      {
        type: "text" as const,
        text,
      },
    ],
  };
}

function cachedJson(key: string, load: () => unknown) {
  return textResult(cachedRead(key, () => JSON.stringify(load())));
}

function errorResult(message: string) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify({ error: message }) }],
    isError: true,
  };
}

export function createServer(): McpServer {
  const server = new McpServer(
    { name: "clarke", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );

  server.tool(
    "clarke_list_slots",
    CLARKE_LIST_SLOTS_DESCRIPTION,
    {
      view: z.enum(["compact", "full"]).optional().describe("compact (default) or full slot record"),
      limit: z.number().int().min(1).max(100).optional(),
      offset: z.number().int().min(0).optional(),
      all: z.boolean().optional().describe("Explicit full list for this view"),
    },
    async ({ view, limit, offset, all }) => {
      const parsed = resolveSlotListQuery({ view, limit, offset, all: all === true });
      if (!parsed.ok) return errorResult(parsed.error);
      const query = parsed.query;
      return cachedJson(
        `mcp:list-slots:${query.view}:${query.all ? "all" : "page"}:${query.offset}:${query.limit ?? ""}`,
        () => pageSlotList(query).slots,
      );
    },
  );

  server.tool(
    "clarke_get_slot",
    CLARKE_GET_SLOT_DESCRIPTION,
    { slug: z.string().regex(SAFE_SLUG).describe("Slot slug, e.g. '19-2e'") },
    async ({ slug }) => {
      const dossier = getSlotDossier(slug);
      if (!dossier) return errorResult(`No slot at slug '${slug}'`);
      return cachedJson(`mcp:slot:${slug}`, () => dossier);
    },
  );

  server.tool(
    "clarke_get_terminal",
    CLARKE_GET_TERMINAL_DESCRIPTION,
    { slug: z.string().regex(SAFE_SLUG).describe("Slot slug, e.g. '101w'") },
    async ({ slug }) => {
      const dossier = getSlotDossier(slug);
      if (!dossier) return errorResult(`No slot at slug '${slug}'`);
      return cachedJson(`mcp:slot:${slug}`, () => dossier);
    },
  );

  server.tool(
    "clarke_list_deltas",
    CLARKE_LIST_DELTAS_DESCRIPTION,
    {
      slug: z.string().regex(SAFE_SLUG).optional().describe("Registry or FCC slug, e.g. '101w' or '101-2w'"),
      domain: z.enum(["occupancy", "fcc", "dispute"]).optional(),
      since: z.string().optional().describe("Exclusive time filter. ISO-8601 UTC or YYYY-MM-DD HH:MM:SS"),
      after: z.string().optional().describe("Exclusive change id from nextAfter"),
    },
    async ({ slug, domain, since, after }) => {
      try {
        return cachedJson(
          `mcp:deltas:${slug ?? ""}:${domain ?? ""}:${since ?? ""}:${after ?? ""}`,
          () => listDeltas({ slug, domain, since, after }),
        );
      } catch (err) {
        if (err instanceof DeltaQueryError) return errorResult(err.message);
        throw err;
      }
    },
  );

  server.tool(
    "clarke_list_satellites",
    CLARKE_LIST_SATELLITES_DESCRIPTION,
    {
      operator: z.string().regex(SAFE_STRING).optional(),
      ownerCountry: z.string().regex(SAFE_STRING).optional(),
      limit: z.number().int().min(1).max(1000).default(MCP_SATELLITE_DEFAULT_LIMIT),
    },
    async ({ operator, ownerCountry, limit }) =>
      cachedJson(
        `mcp:satellites:${operator ?? ""}:${ownerCountry ?? ""}:${limit ?? MCP_SATELLITE_DEFAULT_LIMIT}`,
        () => listSatellites({
          operator,
          ownerCountry,
          limit: limit ?? MCP_SATELLITE_DEFAULT_LIMIT,
        }),
      ),
  );

  return server;
}
