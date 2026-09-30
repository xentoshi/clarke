import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  listSlots,
  getSlotDossier,
  listSatellites,
} from "../lib/agents/operations";

export const CLARKE_LIST_SLOTS_DESCRIPTION =
  "List GEO slots in the Clarke registry (curated positions merged with UCS-derived positions). Each entry includes slug, label, longitude, region, operatorIdentity (split, single, or none) and operatorMix (canonical name, count, share, and raw source strings per operator), country, status, ituRecorded, satellite count, FCC authorizations, occupancy observations (TLE longitude and epoch, UCS longitude, delta, disputed flag, and which source supplied occupancy), dispute records (TLE vs UCS disagreement above 2 degrees, and UCS ghosts), and source vintage. operatorMix is who is in the occupancy window. A split window has no single holder name. Provenance is included for occupancy, the UCS catalog, FCC rows, license, and rights. ITU SNS is not ingested (ituRecorded is not_in_product). TLE longitude is a tracked position, not an FCC or ITU assignment.";

export const CLARKE_GET_SLOT_DESCRIPTION =
  "Agent slot record for one GEO position by slug (e.g. '19-2e' for 19.2E, '101w' for 101W). Operator identity is operatorMix, with raw source strings on each share. operatorIdentity is split when more than one canonical operator is in the occupancy window, single when one is, none when the window has no attributed operator. Also returns occupancy observations, FCC authorizations, dispute records, ituRecorded, and source vintage, with provenance on occupancy, UCS, FCC, license, and rights. ITU SNS is not ingested (ituRecorded is not_in_product). TLE longitude is a tracked position, not an FCC or ITU assignment.";

export const CLARKE_GET_TERMINAL_DESCRIPTION =
  "Agent slot record for one GEO position. Same payload as clarke_get_slot: operatorMix as the occupancy identity, FCC rows, disputes, ituRecorded, and source vintage. operatorIdentity split means the window is shared. ITU SNS is not ingested (ituRecorded is not_in_product). TLE longitude is a tracked position, not an FCC or ITU assignment.";

export const CLARKE_LIST_SATELLITES_DESCRIPTION =
  "List GEO satellites from the UCS Satellite Database, optionally filtered by operator or owner country. Returns up to `limit` rows (default unlimited; max 1000).";

const SAFE_SLUG = /^[a-z0-9-]+$/;
const SAFE_STRING = /^[A-Za-z0-9 .\-_&]{1,80}$/;

function textResult(payload: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
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
    {},
    async () => textResult(listSlots()),
  );

  server.tool(
    "clarke_get_slot",
    CLARKE_GET_SLOT_DESCRIPTION,
    { slug: z.string().regex(SAFE_SLUG).describe("Slot slug, e.g. '19-2e'") },
    async ({ slug }) => {
      const dossier = getSlotDossier(slug);
      if (!dossier) return errorResult(`No slot at slug '${slug}'`);
      return textResult(dossier);
    },
  );

  server.tool(
    "clarke_get_terminal",
    CLARKE_GET_TERMINAL_DESCRIPTION,
    { slug: z.string().regex(SAFE_SLUG).describe("Slot slug, e.g. '101w'") },
    async ({ slug }) => {
      const dossier = getSlotDossier(slug);
      if (!dossier) return errorResult(`No slot at slug '${slug}'`);
      return textResult(dossier);
    },
  );

  server.tool(
    "clarke_list_satellites",
    CLARKE_LIST_SATELLITES_DESCRIPTION,
    {
      operator: z.string().regex(SAFE_STRING).optional(),
      ownerCountry: z.string().regex(SAFE_STRING).optional(),
      limit: z.number().int().min(1).max(1000).optional(),
    },
    async ({ operator, ownerCountry, limit }) =>
      textResult(listSatellites({ operator, ownerCountry, limit })),
  );

  return server;
}
