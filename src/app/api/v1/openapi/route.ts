import { NextResponse } from "next/server";

export const dynamic = "force-static";

const spec = {
  openapi: "3.1.0",
  info: {
    title: "Clarke API",
    version: "1.2.0",
    description:
      "Read-only GEO registry (public agents API) plus Pro Slot Terminal endpoints. Occupancy is TLE-primary (Space-Track) with UCS fallback; TLE longitude is not an FCC or ITU assignment. Valuation v0 is a model, not a live market price. Simulated bid/ask and ITU stubs are experimental, not the default Terminal view.",
  },
  servers: [{ url: "/api/v1" }],
  tags: [
    { name: "Agents", description: "Public registry reads. Rate-limited 60 req/min/IP." },
    { name: "Terminal", description: "Pro Slot Terminal. Cookie session or API key. 300 req/min." },
  ],
  components: {
    securitySchemes: {
      ApiKey: { type: "http", scheme: "bearer", bearerFormat: "ck_live_" },
      ClarkeKey: { type: "apiKey", in: "header", name: "X-Clarke-Key" },
    },
  },
  paths: {
    "/agents/slots": {
      get: {
        tags: ["Agents"],
        summary: "List orbital slots",
        description: "All registry positions with congestion score and heuristic valuation. Occupancy/congestion use TLE-primary longitudes. Operator display is a curated alias map (class M) over UCS/FCC strings; `operatorRaw` is the source. `ituRecorded` is `not_in_product` (SNS is not ingested).",
        responses: { "200": { description: "{ data, meta } envelope. meta.data_freshness includes last_run plus file_vintage / source_as_of / TLE epoch (not ingest clock alone)." } },
      },
    },
    "/agents/slots/{slug}": {
      get: {
        tags: ["Agents"],
        summary: "Slot dossier",
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string", example: "101w" } }],
        responses: { "200": { description: "Slot + satellites + FCC + congestion + valuation + positionTrust + sourceVintage + ituRecorded (not_in_product; SNS not ingested). Satellites include operatorCanonical / operatorRaw; FCC rows include licenseeCanonical / licenseeRaw." }, "404": { description: "Unknown slug" } },
      },
    },
    "/agents/satellites": {
      get: {
        tags: ["Agents"],
        summary: "List GEO satellites",
        parameters: [
          { name: "operator", in: "query", schema: { type: "string" } },
          { name: "ownerCountry", in: "query", schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 1000 } },
        ],
        responses: { "200": { description: "GEO satellite rows" } },
      },
    },
    "/terminal/slots": {
      get: {
        tags: ["Terminal"],
        summary: "Pro list of slots with Terminal valuation",
        security: [{ ApiKey: [] }, { ClarkeKey: [] }],
        responses: { "200": { description: "Slot summaries" }, "401": { description: "Pro required" } },
      },
    },
    "/terminal/slots/{slug}": {
      get: {
        tags: ["Terminal"],
        summary: "Full Slot Terminal model",
        security: [{ ApiKey: [] }, { ClarkeKey: [] }],
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string", example: "101w" } }],
        responses: { "200": { description: "Occupancy, recorded FCC, valuation, operator mix (canonical + operatorRaw), ituRecorded chip; experimental stubs (sim book, ITU) labeled" } },
      },
    },
    "/terminal/valuations/{slug}": {
      get: {
        tags: ["Terminal"],
        summary: "Current valuation v0",
        security: [{ ApiKey: [] }, { ClarkeKey: [] }],
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Fair value + CI + drivers" } },
      },
    },
    "/terminal/valuations/{slug}/history": {
      get: {
        tags: ["Terminal"],
        summary: "Valuation time-series",
        security: [{ ApiKey: [] }, { ClarkeKey: [] }],
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Daily model snapshots (persisted or backfill)" } },
      },
    },
    "/terminal/compare": {
      get: {
        tags: ["Terminal"],
        summary: "Compare up to 4 slots",
        security: [{ ApiKey: [] }, { ClarkeKey: [] }],
        parameters: [{ name: "slugs", in: "query", required: true, schema: { type: "string", example: "101w,19-2e,28-2e" } }],
        responses: { "200": { description: "Side-by-side Terminal metrics" } },
      },
    },
    "/keys": {
      post: {
        tags: ["Terminal"],
        summary: "Mint a Pro API key (session cookie required)",
        responses: { "200": { description: "Returns the raw key once" } },
      },
    },
  },
};

export function GET() {
  return NextResponse.json(spec, {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, s-maxage=3600",
    },
  });
}
