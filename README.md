# Clarke

> **Under construction.** This project is actively being developed and is not production-ready.

**The data and intelligence layer for orbital infrastructure.**

Clarke normalizes public data across GEO, LEO, and MEO to build the orbital asset registry, pricing intelligence, and coordination layer the space economy is missing.

---

![Clarke structure](./public/clarke-structure.svg)

## What it is

- **Orbital registry** — a searchable, filterable, exportable explorer over every tracked GEO position, built from ITU, FCC, Space-Track, and UCS public data
- **Intelligence layer** — a heuristic valuation model (value range + confidence + factor breakdown), a normalized 0–100 congestion / coordination-risk score, and per-source data-freshness tracking
- **Data quality** — source longitude data is cross-checked against Space-Track TLEs on ingest to catch and correct placeholder or malformed positions rather than trusting them blindly
- **Agent access** — a versioned read-only HTTP API and an MCP server expose the registry to LLM agents and tools
- **Blog** — long-form writing on orbital infrastructure, space compute, and the space economy
- **About** — what Clarke is, why now, data sources, registry methodology, and data quality notes, all on one page

---

## Agents API & MCP

Clarke exposes its registry as machine-readable data for LLM agents and tools.

**HTTP API** — versioned, read-only, rate-limited, CORS-enabled, and ETag-cached. Responses are wrapped in a `{ data, meta }` envelope, where `meta.data_freshness` reports when each source was last ingested.

| Endpoint | Returns |
|---|---|
| `GET /api/v1/agents/slots` | All orbital positions, each with a congestion score and heuristic valuation |
| `GET /api/v1/agents/slots/{slug}` | Full dossier for one slot: co-located satellites, FCC authorizations, congestion + valuation breakdowns |
| `GET /api/v1/agents/satellites` | GEO satellites (filter by `operator`, `ownerCountry`, `limit`) |

**MCP server** — the same registry as tools for Claude Code, Cursor, and other MCP clients:

```bash
npm run mcp
```

Tools: `clarke_list_slots`, `clarke_get_slot`, `clarke_list_satellites`. See the header of `scripts/clarke-mcp.ts` for a sample client config.

---

## Data pipeline

The registry is backed by a SQLite database (`data/clarke.db`) that ships committed, so the app runs out of the box. To rebuild it from source:

```bash
npm run ingest            # UCS Satellite Database (GEO subset)
npm run ingest:fcc        # FCC Approved Space Station List (from data/ssal.xlsx)
npm run ingest:spacetrack # Space-Track satcat + TLEs (requires credentials)
npm run ingest:all        # all of the above
```

Each run records its timestamp and row count in an `ingest_meta` table, surfaced on the `/about` page and in the API's `meta.data_freshness`. The Space-Track step also cross-checks UCS's reported GEO longitude against live TLE data, correcting placeholder or malformed positions and flagging genuinely unknown ones instead of trusting the raw source value.

---

## Stack

- **Frontend:** Next.js 16, Tailwind CSS 4, Manrope + IBM Plex Mono
- **Database:** SQLite via `better-sqlite3`
- **Agent interface:** versioned REST API + MCP server (`@modelcontextprotocol/sdk`)
- **Data:** ITU SNS, FCC IBFS, Space-Track, UCS Satellite Database, SEC EDGAR

---

## Running locally

```bash
npm install
npm run dev
```

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_URL` | Yes (prod) | Canonical URL |
| `SPACETRACK_USERNAME` | No | Space-Track login (for `npm run ingest:spacetrack`) |
| `SPACETRACK_PASSWORD` | No | Space-Track password (for `npm run ingest:spacetrack`) |
| `PV_SECRET` | No | Secret to read the internal page-view counter at `/api/pv` |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | No | Plausible analytics domain |

---

## License

MIT
