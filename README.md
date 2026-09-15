# Clarke

> **Under construction.** This project is actively being developed and is not production-ready.

**The data and intelligence layer for orbital infrastructure.**

Clarke normalizes public data across GEO, LEO, and MEO to build the orbital asset registry, pricing intelligence, and coordination layer the space economy is missing.

---

![Clarke structure](./public/clarke-structure.svg)

## What it is

- **Orbital registry** — a searchable, filterable, exportable explorer over every tracked GEO position, built from ITU, FCC, Space-Track, and UCS public data
- **GEO Slot Index** — `/index` (alias `/research`): method-note occupancy enter/leave, dispute flips, FCC deltas. Not a price index.
- **Intelligence layer** — valuation model v0 (range + confidence + driver breakdown + 30-day history), a normalized 0–100 congestion / coordination-risk score, and per-source data-freshness tracking
- **Terminal seats** — free thin registry; Pro unlocks driver breakdown, compare (up to 4), export+, and the Terminal API
- **Data quality** — occupancy clusters on Space-Track TLE longitude when the TLE passes published quality gates (UCS catalog longitude is kept and shown). Disagreements >2° are flagged. TLE longitude is not an FCC or ITU assignment.
- **Agent access** — a versioned read-only HTTP API (public agents + Pro Terminal) and an MCP server expose the registry to LLM agents and tools
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
| `GET /api/v1/openapi` | OpenAPI 3.1 spec for agents + Terminal routes |
| `GET /api/v1/terminal/slots` | **Pro** — Terminal summaries |
| `GET /api/v1/terminal/slots/{slug}` | **Pro** — full Terminal model (occupancy, FCC, valuation; experimental stubs included but labeled) |
| `GET /api/v1/terminal/valuations/{slug}` | **Pro** — current valuation v0 |
| `GET /api/v1/terminal/valuations/{slug}/history` | **Pro** — daily model snapshots |
| `GET /api/v1/terminal/compare?slugs=` | **Pro** — up to 4 slots |

Pro Terminal routes accept a session cookie or `Authorization: Bearer ck_live_…` / `X-Clarke-Key`. Mint a key from `/account` while signed in as Pro. Public agents API stays unauthenticated (60 req/min/IP); Pro keys get 300 req/min.

**MCP server** — the same registry as tools for Claude Code, Cursor, and other MCP clients:

```bash
npm run mcp
```

Tools: `clarke_list_slots`, `clarke_get_slot`, `clarke_get_terminal`, `clarke_list_satellites`. See the header of `scripts/clarke-mcp.ts` for a sample client config.

---

## Data pipeline

The registry is backed by a SQLite database (`data/clarke.db`) that ships committed, so the app runs out of the box. To rebuild it from source:

```bash
npm run ingest            # UCS Satellite Database (GEO subset)
npm run ingest:fcc        # FCC Approved Space Station List (from data/ssal.xlsx; see docs/FCC_REFRESH.md)
npm run vintages          # record UCS / FCC / TLE file vintages without a full re-download
npm run ingest:spacetrack # Space-Track satcat + TLEs (requires credentials)
npm run ingest:all        # all of the above
```

Each run records its timestamp, row count, and **source vintage** (UCS latest GEO launch, FCC workbook as-of, TLE epoch range) in `ingest_meta`, surfaced on Slot Terminal, `/about`, and the API's `meta.data_freshness`. Ingest `last_run` is not file vintage. Space-Track ingest stores satcat + TLEs and applies **TLE-primary occupancy authority**: UCS `longitude_geo` is preserved (wrap-normalized only); occupancy, congestion, and valuation v0 cluster on the TLE sub-satellite longitude when age/quality gates pass, otherwise UCS, with Δ / `positionDisputed` written as an audit trail. Against a DB that already has TLEs: `npm run apply:positions` then `npm run seed:valuations` (history is a labeled backfill, not trades).

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
npm run seed:valuations   # persist 30-day v0 history into data/terminal.db
npm run dev
```

Open `/orbital` for the registry, `/orbital/101w` (or `/slot/101w`) for Slot Terminal, `/login` for a free or **Demo Pro** seat, `/pricing` for the gate.

Valuation methodology: [`docs/VALUATION.md`](./docs/VALUATION.md) and `/docs/valuation`. Data trust: [`docs/DATA_TRUST.md`](./docs/DATA_TRUST.md) and `/docs/data-trust`.

```bash
npm test                  # valuation v0 + TLE occupancy authority tests
```

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_URL` | Yes (prod) | Canonical URL |
| `AUTH_SECRET` | Yes (prod) | HMAC secret for session cookies and API keys |
| `STRIPE_SECRET_KEY` | No | Stripe secret for Pro Checkout. If unset, `/pricing` issues a labeled demo Pro seat |
| `STRIPE_PRICE_ID` | No | Stripe Price id for a Terminal seat subscription |
| `STRIPE_WEBHOOK_SECRET` | No | TODO: verify `checkout.session.completed` in `/api/billing/webhook` |
| `SPACETRACK_USERNAME` | No | Space-Track login (for `npm run ingest:spacetrack`) |
| `SPACETRACK_PASSWORD` | No | Space-Track password (for `npm run ingest:spacetrack`) |
| `PV_SECRET` | No | Secret to read the internal page-view counter at `/api/pv` |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | No | Plausible analytics domain |

---

## License

MIT
