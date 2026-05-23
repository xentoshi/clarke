import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  listSlots,
  getSlotDossier,
  listSatellites,
  listCompanies,
  getCompanyProfile,
  listCompanySectors,
  listStocks,
} from "../lib/agents/operations";

const SAFE_SLUG = /^[a-z0-9-]+$/;
const SAFE_TICKER = /^[A-Z0-9.-]{1,10}$/;
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
    "List all orbital slots in the Clarke registry: curated GEO positions with operator/value/tokenization details merged with the broader set derived from the UCS satellite database. UCS-derived entries have basic fields only; curated entries additionally include valuation and on-chain tokenization status.",
    {},
    async () => textResult(listSlots()),
  );

  server.tool(
    "clarke_get_slot",
    "Get a full dossier for a single orbital slot identified by its slug (e.g. '19-2e' for 19.2°E, '101w' for 101°W). Returns the slot record plus all UCS satellites at that longitude, FCC authorizations, and congestion data.",
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

  server.tool(
    "clarke_list_companies",
    "List space companies in the Clarke registry, optionally filtered by sector (e.g. 'Launch', 'GEO Operators', 'Lunar', 'Earth Observation'). Use clarke_company_sectors to discover the full list of sectors.",
    { sector: z.string().regex(SAFE_STRING).optional() },
    async ({ sector }) => textResult(listCompanies({ sector })),
  );

  server.tool(
    "clarke_get_company",
    "Get a company profile by slug (e.g. 'ses', 'spacex', 'intuitive-machines'). Returns the company record along with cross-references: its publicly traded stock (if any), the orbital slots it operates, and the satellites it owns. Matching uses word-boundary name comparison against operator fields.",
    { slug: z.string().regex(SAFE_SLUG) },
    async ({ slug }) => {
      const profile = getCompanyProfile(slug);
      if (!profile) return errorResult(`No company at slug '${slug}'`);
      return textResult(profile);
    },
  );

  server.tool(
    "clarke_company_sectors",
    "List the distinct sectors used in the Clarke company registry, with the count of companies in each. Use this before clarke_list_companies to discover valid sector filters.",
    {},
    async () => textResult(listCompanySectors()),
  );

  server.tool(
    "clarke_list_stocks",
    "List publicly traded space companies tracked by Clarke. Optionally filter by vertical (e.g. 'GEO Operators', 'Launch') or fetch a specific ticker. Returns the static catalog only; live stock prices are not exposed through the agents API.",
    {
      vertical: z.string().regex(SAFE_STRING).optional(),
      ticker: z.string().regex(SAFE_TICKER).optional(),
    },
    async ({ vertical, ticker }) => textResult(listStocks({ vertical, ticker })),
  );

  return server;
}
