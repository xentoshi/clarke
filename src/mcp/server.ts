import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  listSlots,
  getSlotDossier,
  listSatellites,
} from "../lib/agents/operations";

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
    "List all orbital slots in the Clarke registry: curated GEO positions with operator/value details merged with the broader set derived from the UCS satellite database. Each entry includes a normalized congestion score (0-100), FCC filing status, and a heuristic valuation (estimated value range, point estimate, confidence, and factor breakdown). Curated entries additionally include an authoritative valuation override.",
    {},
    async () => textResult(listSlots()),
  );

  server.tool(
    "clarke_get_slot",
    "Get a full dossier for a single orbital slot identified by its slug (e.g. '19-2e' for 19.2°E, '101w' for 101°W). Returns the slot record plus all UCS satellites at that longitude, FCC authorizations, the normalized congestion score with its factor breakdown, and a heuristic valuation (range, confidence, and per-factor multipliers).",
    { slug: z.string().regex(SAFE_SLUG).describe("Slot slug, e.g. '19-2e'") },
    async ({ slug }) => {
      const dossier = getSlotDossier(slug);
      if (!dossier) return errorResult(`No slot at slug '${slug}'`);
      return textResult(dossier);
    },
  );

  server.tool(
    "clarke_list_satellites",
    "List GEO satellites from the UCS Satellite Database, optionally filtered by operator or owner country. Returns up to `limit` rows (default unlimited; max 1000).",
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
