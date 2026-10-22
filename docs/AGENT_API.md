# Agent API

Public agents read one GEO slot record. HTTP `GET /api/v1/agents/slots/{slug}` returns it inside a `{ data, meta }` envelope. `GET /api/v1/agents/slots` defaults to a compact page of that registry. `view=full` returns the same record, paged. The MCP tools `clarke_get_slot` and `clarke_get_terminal` return the same JSON as the slug route. `clarke_get_terminal` is not a second schema. It is the same object as `clarke_get_slot`. `clarke_list_slots` defaults to the compact page.

`GET /api/v1/agents/deltas` is the on-ingest change feed for that record (Slot Index delta feed, edition 2). The MCP tool `clarke_list_deltas` returns the same JSON object. It is not a second copy of the slot record and it is not the human method note at `/index`.

The record is occupancy, operator identity, FCC rows, disputes, source vintage, and provenance. It is not the human Slot Terminal.

## Not in this payload

Valuation and congestion are not in the public agent or MCP payload. They live only as labeled models on the human Slot Terminal. Bid/ask, comps, valuation history, and dollar strings live on that Terminal surface. The slot record uses `operatorIdentity` and `operatorMix`, not a single headline operator. A mixed window used to be mis-labeled by a single headline name. That field is gone.

Congestion v0 and implied fair value live only as labeled models on the human Slot Terminal. They are not recorded facts. Agents must not treat them as facts, including when a person can still see them on the Terminal page. The Pro Terminal API (`/api/v1/terminal/...`) is a different, authenticated surface. It can return those labeled models. It is not this record. The delta feed follows the same exclusion.

The human Slot Terminal may still show a curated operator label. That label is intentional and separate. It is not a field on the agent record.

`provenance.rights` is a source note. It is not an ITU filing chain.

## Transports

The HTTP routes, remote MCP, and local stdio are read-only and unauthenticated. They share one builder, so a slug in the list, `GET /api/v1/agents/slots/{slug}`, and `clarke_get_slot` are the same object.

### HTTP

| Route | `data` |
|---|---|
| `GET /api/v1/agents/slots` | Compact page by default (50 rows): `slug`, `label`, `longitude`, `region`, `operatorIdentity`, `country`, `status`, `satCount`. Query: `view` (`compact` or `full`), `limit`, `offset`, `all=1`. Sorted by longitude (west, negative, through east). |
| `GET /api/v1/agents/slots/{slug}` | One slot record. |
| `GET /api/v1/agents/deltas` | Change feed. Query: `slug`, `domain` (`occupancy`, `fcc`, or `dispute`), `since` (exclusive time), `after` (exclusive change id from `nextAfter`). |

Successful JSON:

```json
{
  "data": {},
  "meta": {
    "version": "1.0",
    "generated_at": "2026-09-30T12:00:00.000Z",
    "count": 0,
    "data_freshness": []
  }
}
```

The fence is the key shape. `count` and the empty freshness array are not a live snapshot.

| `meta` field | Where | Meaning |
|---|---|---|
| `version` | Every 200 | `"1.0"`. |
| `generated_at` | Every 200 | ISO-8601 UTC. On a cached public read this is the `data/clarke.db` mtime, so the body and ETag stay stable until that file changes. |
| `count` | List routes, including the delta feed | `data.length` for slot and satellite pages. For the delta feed, `data.changes.length`. This is the page, not `meta.total`. |
| `total`, `offset`, `limit`, `next_offset`, `view` | Slot list and satellite list | Page window. `view` is only on the slot list (`compact` or `full`). `limit` is null when `all=1`. `next_offset` is null on the last page. |
| `data_freshness` | Slot list, slot detail, and the delta feed | Ingest rows. See freshness below. The satellites route does not send this array. |

Headers on 200: `Content-Type: application/json; charset=utf-8`, `ETag`, `Cache-Control: public, max-age=60, s-maxage=3600, stale-while-revalidate=86400`, `Vary: Accept-Encoding`, `Vercel-CDN-Cache-Control` with that same edge lifetime, `Access-Control-Allow-Origin: *`. The cache key is the URL. It does not vary on cookies or client IP. A request that sends `Accept-Encoding: gzip` gets `Content-Encoding: gzip`. The ETag is the uncompressed JSON. A matching `If-None-Match` returns 304 with an empty body.

Errors are `{ "error": "..." }`, not the envelope.

| Status | When |
|---|---|
| 400 | Slug fails `^[a-z0-9-]+$`. Body: `Invalid slug`. |
| 404 | Safe slug with no occupancy, no FCC row within 0.6 degrees, and no curated slot at that slug or within 0.4 degrees. Body: `No slot at slug '<slug>'`. A safe slug that is not a longitude (`abc`) is also 404. |
| 429 | Over 60 requests per minute per IP on this instance for a compact slot page, one slot, a delta page, or a satellite page at the default limit. `view=full`, slot `all=1`, and a satellite `all=1` or `limit` above 100 are 12 per minute on a separate counter. Header `Retry-After` is seconds. Body: `Too many requests`. The limiter is in-memory per server instance. |

Slugs from the list are the supported keys. Examples: `101w` (101 degrees west), `19-2e` (19.2 degrees east). A slug that is not in the list can still return 200 when occupancy, an FCC row, or a nearby registry row matches. `slug` and `longitude` are the path you asked for. `label` is the nominal longitude of that slug (`90-7e` is `90.7°E`). `country` and `status` can come from a registry row inside 0.4 degrees. Prefer list slugs.

Rate limit, CORS, and the envelope also apply to `GET /api/v1/agents/satellites` (UCS GEO rows, not this slot record). Filters: `operator`, `ownerCountry`, `limit` (1 to 1000), `offset`, `all=1`. Omitted `limit` returns 100 rows. `all=1` is the explicit full match list. That route's `meta` has `count`, `total`, `offset`, `limit`, and `next_offset`, and no `data_freshness`.

The slot list default does not include occupancy, FCC rows, or disputes. `view=full` returns the slot record below, 10 rows unless `limit` is set (max 25). `all=1` returns every row for that view. `all=1` with `view=full` is the explicit full registry and is the large body. Valuation and congestion are not in the compact row or the full record.

`GET /api/v1/openapi` is a short OpenAPI 3.1 index. This page is the field list. [llms.txt](https://www.clarkebelt.finance/llms.txt) is the site root index for these routes.

### MCP

Tool results are compact JSON text. They are not wrapped in `{ data, meta }`. Remote MCP and local stdio call the same builders. Neither calls the HTTP routes. `clarke_list_satellites` uses `limit` 100 when the argument is omitted (max 1000). `clarke_list_slots` defaults to the compact page. `view` `full` and `all` true match the HTTP list. `clarke_get_slot` and `clarke_get_terminal` return the full slot record. That record does not include valuation or congestion scores.

### Remote Streamable HTTP

`POST https://www.clarkebelt.finance/api/v1/mcp`

Stateless Streamable HTTP. Reads are open. The same 60 requests per minute per IP limit as the public agent routes, on this server instance, and shared with those routes. A 429 body is `{ "error": "Too many requests" }` with `Retry-After`, the same shape as the HTTP routes. CORS allows any origin.

Send one JSON-RPC message per POST. `Content-Type` is `application/json`. `Accept` must include both `application/json` and `text/event-stream`. A successful call returns `Content-Type: application/json` and one JSON-RPC object. `notifications/initialized` returns 202. `GET` returns 405 with `Allow: POST, DELETE, OPTIONS` because this host does not keep a server-push SSE stream. Clients continue with POST. `DELETE` returns 200 on this stateless endpoint. The older split transport (`GET /sse` plus `POST /messages`) is not mounted.

```json
{
  "mcpServers": {
    "clarke": {
      "url": "https://www.clarkebelt.finance/api/v1/mcp"
    }
  }
}
```

### Local stdio

`npm run mcp` reads the committed SQLite database in a checkout of this repo. Sample client config is in the header of `scripts/clarke-mcp.ts`.

| Tool | Arguments | Result |
|---|---|---|
| `clarke_list_slots` | optional `view` (`compact` or `full`), `limit`, `offset`, `all` | Compact page by default. `all: true` is the explicit full list for that view. |
| `clarke_get_slot` | `slug` matching `^[a-z0-9-]+$` | One slot record. |
| `clarke_get_terminal` | `slug` matching `^[a-z0-9-]+$` | The same JSON as `clarke_get_slot`. |
| `clarke_list_deltas` | optional `slug`, `domain`, `since`, `after` | The same object as `GET /api/v1/agents/deltas` `data`. Not wrapped in `{ data, meta }`. |

Unknown slug: error result whose text is `{ "error": "No slot at slug '<slug>'" }`. The tool schema rejects a slug that fails the pattern before that lookup.

`clarke_list_satellites` is a separate UCS catalog tool (`operator`, `ownerCountry`, `limit`). It is the catalog, not the slot record. Valuation and congestion live only as labeled models on the human Slot Terminal.

## Slot record

Keys below are the object in HTTP `data` and in the MCP tool text. Placeholder numbers are not a live registry.

```json
{
  "slug": "101w",
  "label": "101°W",
  "longitude": -101,
  "region": "North America",
  "operatorIdentity": "split",
  "operatorMix": [
    {
      "operator": "SES",
      "count": 1,
      "share": 0.25,
      "operatorRaw": ["SES"]
    }
  ],
  "country": "",
  "status": "active",
  "ituRecorded": "not_in_product",
  "ituDetail": "ITU filings are not in this product. ITU Space Explorer is the current ITU source. SNS Online shut down in January 2025.",
  "satCount": 1,
  "occupancyAuthority": "tle-primary",
  "fccAuthorizations": [],
  "occupancy": [],
  "disputes": [],
  "sourceVintage": {},
  "provenance": {}
}
```

`ituDetail` is that fixed sentence on every slot. The mix example shows the key shape only. Live names, counts, and shares come from the occupancy window.

| Field | Class | Type | Meaning |
|---|---|---|---|
| `slug` | V | string | Registry slug. List uses `lonToSlug` of the row longitude. |
| `label` | V/M | string | Curated or merged label, else a formatted longitude. |
| `longitude` | V | number | Degrees. Negative is west, positive is east. |
| `region` | M | string | Coarse band from longitude, not a beam. One of `Europe / Africa / MEA`, `Asia-Pacific`, `Pacific`, `North America`, `Atlantic / Latin America`. |
| `operatorIdentity` | M | string | `split`, `single`, or `none`. See below. |
| `operatorMix` | V/M | array | Who is in the occupancy window. See below. |
| `country` | V/M | string | Owner country of the occupancy rows when every row shares one. Empty when the window is mixed or has no owner country. Curated labels and FCC administrations are not copied into this field. |
| `status` | M | string | `active` when the occupancy window has a satellite and an FCC authorization, including when a curated label said squatted or inactive. `squatted` only when a satellite is on station and Clarke has no FCC row. Otherwise the curated status (`active`, `filed`, `squatted`, or `inactive`), or `active` when an uncurated window has satellites, else `filed`. |
| `ituRecorded` | S | string | Always `not_in_product`. |
| `ituDetail` | S | string | The fixed sentence in the example. |
| `satCount` | M | number | Occupancy rows in the 0.4 degree window, including a flagged servicing vehicle. |
| `occupancyAuthority` | V | string | Always `tle-primary`. That is the slot rule, not a claim that every row used a TLE. |
| `fccAuthorizations` | V/M | array | SSAL rows within 0.6 degrees of the slot longitude. Federal Government (Reserved) placeholder rows are omitted. |
| `occupancy` | V/M | array | Satellites whose occupancy longitude is inside ±0.4 degrees. |
| `disputes` | M | array | In-window TLE vs UCS disagreements, plus UCS ghosts. |
| `sourceVintage` | V | object | Workbook as-of, file vintages, ingest clocks, `fccStale`. |
| `provenance` | V | object | Source notes for occupancy, UCS, FCC, license, and rights. |

## Operator identity

`operatorIdentity` is the length of `operatorMix`. It is not a slot holder.

| Value | Rule |
|---|---|
| `split` | More than one canonical operator in the window. |
| `single` | Exactly one. |
| `none` | No attributed occupancy operator. `operatorMix` is `[]`. |

Each mix entry:

| Field | Class | Meaning |
|---|---|---|
| `operator` | M | Canonical display name from the alias map. Unmapped strings stay as trimmed source text. |
| `count` | M | Occupancy rows in that group. |
| `share` | M | `count` divided by the number of attributed occupancy rows. Not divided by `satCount` when some rows have no operator. Not rounded to a percent. |
| `operatorRaw` | V | Distinct UCS (or source) strings that rolled into `operator`, sorted A to Z. |

Mix order is count descending, then canonical name. A launch-vehicle string on a satellite is not an operator. Those rows are left out of the mix. Joint `A/B` source strings stay unmapped unless the alias list contains them. The alias map is not a corporate-ownership graph.

There is no single headline operator on the agent record. Read `operatorMix`. A `split` window has no single holder name.

Occupancy rows still carry per-satellite operators:

| Field | Class | Meaning |
|---|---|---|
| `operator` | M | Canonical display, or `null` when the source string is empty or is the launch vehicle. |
| `operatorRaw` | V | The source string, including a launch-vehicle string when `operator` is `null`. `null` when the satellite has no operator string. |

## Occupancy

The slot rule is TLE-primary. For each satellite, occupancy longitude is the Space-Track TLE sub-satellite longitude when published quality gates pass, otherwise the UCS catalog longitude. UCS `0` is not a usable fallback. TLE and UCS are never averaged. TLE longitude is a tracked position. It is not an FCC assignment and not an ITU filing. The quality gates are in [Data trust](./DATA_TRUST.md).

The occupancy window is 0.4 degrees on either side of the slot longitude. A satellite farther than 0.4 degrees is outside the window and is not an occupant. On the stored Space-Track TLE, MUOS-1 (NORAD 38093) is 0.42 degrees from 101W. A CelesTrak element set fetched 17 October 2026 places it at -100.495, 0.505 degrees from 101W. Both are outside the window. FCC matching is separate: 0.6 degrees on the authorization's own longitude.

A TLE whose mean motion is outside 1.0013 to 1.0041 revolutions per day is drifting. It has no occupancy longitude and does not fall back to the UCS catalog longitude. UCS fallback remains only when no TLE mean motion is stored and the UCS longitude is not the 0 degree placeholder.

A servicing vehicle that shares an element set with another satellite in the window is flagged on the occupancy row (`role` `servicing`, `slotHolder` false, `attachedToName`, `attachmentBasis` `identical_element_set`). `satCount` still includes that row. MEV-2 shares an element set with Intelsat 10-02. Docking was inferred from that match. A separate docking notice was not checked. Servicing rows are left out of `operatorMix`.

`occupancyAuthority` on the slot is the rule name `tle-primary`. On each occupancy row, `occupancyAuthority` is the source that supplied that object's longitude: `tle`, `ucs`, or `none`.

| Field | Class | Meaning |
|---|---|---|
| `id` | V | UCS row id, or a negative NORAD catalog number when the satellite launched after the UCS file vintage and is included from Space-Track. |
| `name` | V | UCS name, or the Space-Track object name for a post-vintage supplement. |
| `noradId` | M | UCS-attributed NORAD id, joinable to Space-Track. Not independently verified for every row. |
| `operator`, `operatorRaw` | V/M | See operator identity. |
| `launchDate` | V | UCS launch date string. |
| `tleLongitude` | V | TLE sub-satellite longitude at epoch, or `null`. |
| `tleEpoch` | V | Epoch of a stored element set, or `null`. When `occupancyAuthority` is `tle`, this is the epoch that supplied the occupancy longitude. When authority is `ucs` or `none`, a value here is an unused element set, not a catalog date standing in for a TLE. |
| `tleStale` | V | `true` only when `occupancyAuthority` is `tle` and `tleEpoch` parses and is older than `sourceVintage.tleStaleAfterDays`. `ucs` and `none` are `false`. A missing epoch is not stale. |
| `ucsLongitude` | V | UCS catalog longitude, or `null`. |
| `deltaDeg` | M | Circular absolute difference between UCS and TLE longitudes, or `null` when either longitude is missing. |
| `disputed` | M | `true` when `deltaDeg` is greater than 2. |
| `occupancyAuthority` | V | `tle`, `ucs`, or `none`. |

Ghosts are not in `occupancy`. They are outside the window. They appear only under `disputes`.

Station-kept GEO payloads launched after the UCS file vintage are included in occupancy when a Space-Track TLE passes the same quality gates. Satcat period must be 1434 to 1438 minutes. Those rows have no UCS catalog longitude. Operator is set only when one FCC licensee name matches the spacecraft. Country codes are not operator names. The UCS satellite list route does not return these rows. Federal Government (Reserved) SSAL rows are not FCC authorizations in this payload.

## Disputes

| `kind` | Rule |
|---|---|
| `tle_ucs_disagreement` | Satellite is inside the occupancy window and `disputed` is true (both longitudes exist and the absolute difference is greater than 2 degrees). |
| `ucs_ghost` | UCS catalog longitude is inside the ±0.4 degree window, occupancy longitude is outside it, and the absolute UCS-TLE difference is greater than 2 degrees or there is no measured delta. Agreement within 2 degrees, with the track just outside the co-location cut, is not a ghost. |

Each dispute object: `kind`, `name`, `noradId`, `ucsLongitude`, `tleLongitude`, `occupancyLongitude`, `deltaDeg`, `positionSource` (`tle`, `ucs`, or `none`).

## ITU

`ituRecorded` is `not_in_product` on every slot. ITU filings are not in this product. ITU Space Explorer is the current ITU source. SNS Online shut down in January 2025. `ituDetail` repeats that sentence on every slug.

The human Terminal shows the same fact as a thin Unrecorded chip. An empty experimental stub on that page is still not a deed.

## FCC freshness

FCC rows are the committed SSAL workbook, not a live fcc.gov scrape. Licensee display is the alias map. The workbook string is kept.

An authorization object is the SSAL row plus two alias fields:

| Field | Class | Meaning |
|---|---|---|
| `id`, `orbitalLocation`, `longitudeGeo`, `satelliteName`, `callSign`, `administration`, `service`, `frequencyRange`, `dateInOrbit`, `grantStatus`, `notes` | V | SSAL columns. Null when the workbook cell is empty. |
| `licensee` | V | SSAL licensee string. Same value as `licenseeRaw`. |
| `licenseeRaw` | V | SSAL licensee string. |
| `licenseeCanonical` | M | Alias-map display, or `null` when `licensee` is empty. |

`sourceVintage` on the slot:

| Field | Meaning |
|---|---|
| `ucsFileVintage` | Latest GEO launch date in the UCS snapshot, when recorded. Not the ingest clock. |
| `ucsIngestAt` | When Clarke parsed UCS. |
| `fccAsOf` | FCC workbook as-of (`file_vintage`, else `source_as_of`). Example shape: `2026-09-27` from a sheet named `Updated 27 September 2026`. |
| `fccIngestAt` | When Clarke parsed the committed workbook. Not the product as-of. |
| `fccStale` | `true` only when `fccAsOf` parses and is older than `fccStaleAfterDays`. |
| `fccStaleAfterDays` | `14`. |
| `tleEpochMin`, `tleEpochMax` | Epochs of TLEs that supplied occupancy in this window, sorted. Rows whose `occupancyAuthority` is `ucs` or `none` do not contribute. Null when the window used no TLE. |
| `tleStale` | `true` when at least one TLE-primary occupancy row has an epoch older than `tleStaleAfterDays`. `false` when the window used no TLE, every used epoch is inside the threshold, or a used epoch does not parse. |
| `tleStaleAfterDays` | `14`. |
| `tleIngestAt` | When Clarke ingested Space-Track TLEs. Not the epoch. |

`fccStale` is a comparison of the workbook date to 14 days. It is not "the FCC feed failed" and it is not a reason to drop occupancy. Occupancy stays TLE-primary and does not wait on FCC. A missing or unparsed `fccAsOf` is not marked stale (`fccStale` stays `false`). The human Trust bar uses this same flag. Workbook replace steps are in [FCC SSAL refresh](./FCC_REFRESH.md).

## TLE freshness

`tleStale` describes the element set that supplied the occupancy longitude. It does not switch that row to UCS. The 30 day ingest gate is separate: a TLE older than 30 days at ingest is not used, and the row falls back to UCS. A TLE that passed that gate can still be older than 14 days when you read it. That read is `tleStale`.

`sourceVintage.tleEpochMin` and `tleEpochMax` are the epochs of those used TLEs. `tleStaleAfterDays` is `14`. Age must be greater than 14 days. An epoch that is exactly 14 days old is not stale. A missing or unparsed epoch is not stale.

On each occupancy row, `tleStale` is `true` only when `occupancyAuthority` is `tle` and that row's `tleEpoch` is past the threshold. A UCS fallback row keeps `tleStale` false. Clarke does not copy a UCS launch date into `tleEpoch`. An unused element set may still sit on `tleEpoch` for audit. Do not cite that value as the epoch that placed the satellite.

The human Trust bar and the Slot Terminal freshness block use the same slot fields. `meta.data_freshness` does not include `tleStale`. Slot `sourceVintage.tleStale` is the field to trust for "is a TLE used at this slot old."

HTTP `meta.data_freshness` is a different object, snake_case, one row per `ingest_meta` source (names in the database include `UCS`, `FCC-SSAL`, `Space-Track TLE`, and any other ingest that has been recorded, such as `Space-Track satcat` or `SEC EDGAR`):

| Field | Meaning |
|---|---|
| `source` | Ingest name. |
| `last_run` | Parse clock. |
| `row_count` | Rows written by that ingest. |
| `age_days` | Age of `last_run`. |
| `file_vintage`, `source_as_of` | File or workbook vintage. Not the ingest clock. |
| `vintage_age_days` | Age of that vintage. |
| `tle_epoch_min`, `tle_epoch_max` | TLE epoch range for the Space-Track TLE source. Null on other sources. |

Slot `sourceVintage.fccStale` is the field to trust for "is this slot's FCC workbook old." `meta.data_freshness` does not include `fccStale`.

## Provenance

| Key | `source` | `note` |
|---|---|---|
| `occupancy` | Space-Track TLE (primary) plus UCS Satellite Database (fallback) | Window, how many rows are TLE-primary, the TLE epoch used for occupancy, `tleStale` after 14 days, and a reminder that TLE longitude is not an FCC or ITU assignment. |
| `ucsCatalog` | UCS Satellite Database | File vintage. The ingest clock is not the catalog epoch. |
| `fcc` | FCC Approved Space Station List | Workbook as-of and ingest time. |
| `license` | FCC SSAL plus UCS occupancy | No `note`. `source` and `asOf` only. |
| `rights` | FCC SSAL plus UCS; ITU not recorded in Clarke | No filing body. |

Each object has `asOf` (ISO-8601 UTC). These notes describe sources. They do not add valuation or congestion.

## Delta feed

`GET /api/v1/agents/deltas` and `clarke_list_deltas` return one object. HTTP wraps it in `{ data, meta }`. `meta.count` is `data.changes.length`. `meta.data_freshness` is the same ingest table as the slot list. MCP returns the object itself.

The feed is written when ingest captures a `registry_snapshots` row (FCC, UCS, Space-Track, position apply, or `npm run vintages`). A re-ingest that does not change occupancy membership, dispute records, FCC call-sign rows, parsed `data/ssal.xlsx` filings, or source file vintages does not append a row. `npm run snapshot:registry` records the current state once, including the parsed workbook when `data/ssal.xlsx` is present.

`coverage` is `bootstrap` when fewer than two snapshots are stored. `coverage` is `ingest_deltas` once a later snapshot exists. `coverageNote` and `limitations` say what that means. Do not read an empty occupancy list during bootstrap as "nothing entered this week."

| Field | Meaning |
|---|---|
| `edition` | `2`. Slot Index delta feed. The human page `/index` is edition 1, a method note, not this object. |
| `cadence` | `on_ingest`. Not a synthesized weekly calendar. |
| `occupancyAuthority` | `tle-primary`. The slot rule. Not a claim that every row used a TLE. |
| `coverage` | `bootstrap` or `ingest_deltas`. |
| `vintage` | File vintages from the latest snapshot (`ucsFileVintage`, `fccAsOf`, `tleEpochMin`, `tleEpochMax`) plus live ingest clocks (`ucsIngestAt`, `fccIngestAt`, `tleIngestAt`) as ISO-8601 UTC. |
| `baseline` | Latest snapshot id, `capturedAt`, kind, and counts. Null when no snapshot has been stored. Counts are not filtered by `slug` or `domain`. `occupancyCount` is window memberships, so one satellite in two windows counts twice. |
| `appliedFilter` | The slug, domain, and exclusive `since` that were applied to `changes`. Null fields mean that filter was not set. |
| `changes` | The deltas below. |

Each change:

| Field | Meaning |
|---|---|
| `id` | Stable id. Snapshot diffs use the snapshot id. Pre-snapshot FCC rows use `fcc:slot_event:<id>`. |
| `domain` | `occupancy`, `fcc`, or `dispute`. |
| `kind` | Occupancy: `enter`, `leave`, `authority_flip`, `tle_epoch`. FCC, when a snapshot does not store parsed workbook rows: `new`, `lapsed`, `licensee`, `status`, `as_of`. FCC, when both snapshots store parsed `data/ssal.xlsx` rows: `new`, `removed`, `changed`, plus `as_of` when the workbook date changes. Dispute: `appear`, `clear`, `kind`. |
| `slug` | Occupancy and dispute: registry slug of that window. FCC row: `lonToSlug` of the authorization longitude. `as_of`: null. A slug filter drops `as_of`. |
| `longitude` | Slot longitude, or the authorization longitude. Null for `as_of`. |
| `detectedAt` | ISO-8601 UTC. Snapshot diffs use the later snapshot time. FCC slot_events use the ingest detection time. |
| `vintage` | File vintages of the observation (the later snapshot, or the first snapshot for pre-snapshot FCC events). |
| `subject` | `noradId` and `name`, or `callSign` and `satelliteName`, or `field` = `fccAsOf`. |
| `before`, `after` | The membership or row that entered or left. Null on the side that did not exist. |
| `provenance` | `sources`, `store` (`registry_snapshots` or `slot_events`), `rule`, `eventId`, `fromSnapshotId`, `toSnapshotId`, `note`. |

`enter` and `leave` are membership in the ±0.4 degree TLE-primary window. A satellite that changes slug is a leave on the old slug and an enter on the new slug. `authority_flip` is the same slug and identity whose occupancy source changed between `tle`, `ucs`, and `none`. `tle_epoch` is that same member when the source stays `tle` and `tleEpoch` changes, or when `tleStale` changes between the two snapshot times. `before` and `after` include `tleEpoch` and `tleStale`. `tleStale` is computed at each snapshot time from the stored epoch. A UCS fallback row does not emit `tle_epoch`, even if an unused element set on the row changes. Bootstrap does not invent these rows. TLE longitude is not an FCC assignment or an ITU filing.

`appear` and `clear` are dispute records on a slug. `kind` is the same slug and identity whose dispute kind changed. `tle_ucs_disagreement` is an in-window pair with absolute UCS-TLE difference above 2 degrees. `ucs_ghost` is a UCS catalog longitude inside the window whose occupancy longitude is outside it and does not agree within 2 degrees.

FCC `new`, `lapsed`, `licensee`, and `status` follow real call signs on snapshots that do not store parsed workbook rows. Call sign `N/A` is not a key. `as_of` is one row with no slug when `fccAsOf` differs between snapshots.

When both snapshots store GEO rows parsed from `data/ssal.xlsx`, that interval uses `new`, `removed`, and `changed` instead of `lapsed`, `licensee`, and `status`. `new` is a call sign that appeared. `removed` is a call sign that left the workbook. `changed` is the same call sign whose orbital location, satellite name, licensee, administration, service, frequency range, in-orbit date, grant status, or notes differed. `subject.changedFields` lists those fields, comma-separated. Rows without an `N.N W.L.` or `E.L.` location are not in the workbook diff. The first snapshot that stores workbook rows does not mark every filing as `new`. NGSO rows are not included. This is not a live fcc.gov scrape.

What is not in the feed:

- Valuation, congestion, bid/ask, comps, and dollar amounts.
- ITU filings. ITU filings are not in this product. There is no `ituRecorded` field on this object.
- `satellite_relocated` rows from `slot_events`. Those are a TLE-to-TLE threshold log, including the one-shot Space-Track compare. They are not occupancy enter or leave.
- A weekly history from before the first snapshot. That history was not stored. The feed does not reconstruct it.
- An `as_of` row for the workbook refresh that overwrote `ingest_meta` before the first snapshot. Current `vintage.fccAsOf` is the date to cite. The prior workbook date is not in the database.

While `coverage` is `bootstrap`, FCC `new`, `lapsed`, `licensee`, and `status` rows are `slot_events` already recorded at FCC ingest, dated at or before the first snapshot. Occupancy and dispute `changes` are empty, including `tle_epoch`. The feed does not invent a TLE epoch history from the single snapshot. `baseline` is the state computed after the latest ingest, so an agent can cite snapshot id and vintages without calling the empty list a week of moves.

`slug` that matches no change returns 200 and `changes: []`. It is not a 404. `domain` must be `occupancy`, `fcc`, or `dispute`. `since` accepts ISO-8601 UTC or `YYYY-MM-DD HH:MM:SS` and is exclusive. `after` is an exclusive change id. Invalid `slug`, `domain`, `since`, or `after` is 400. Unknown `after` is 400. The same 60 per minute limit as a compact slot page applies.

Filters do not change `baseline`. `since` drops every change at or before that time, including rows that share the timestamp. Use it as a time filter. Use `after` to turn pages.

Public responses page `changes` at 40 rows and about 48 KB of change JSON. A timestamp with thousands of rows is split. `truncated` is true when more matches remain. `nextAfter` is the exclusive id for the next page. `nextSince` is set only when the page ended on a timestamp boundary, and is null when the page split a timestamp. Pass `after` from `nextAfter` to continue. A body above 2.5 MB is refused. One slot record fits under that cap. The explicit full slot list (`all=1` and `view=full`) is the large list and is gzip compressed. Satellite `limit` stays 1 to 1000. The satellite default is 100.

Those reads are cached in the server process until `data/clarke.db` changes. The process cache key is the query, not the client IP. HTTP sends `Cache-Control: public, max-age=60, s-maxage=3600, stale-while-revalidate=86400` and `Vary: Accept-Encoding`. A matching `If-None-Match` returns 304. Compact slot pages are 60 requests per minute per IP on each instance. Full slot pages and explicit full lists are 12 per minute. Remote MCP POST stays `no-store` because the body is JSON-RPC. A gzip `Accept-Encoding` still compresses that POST body. `initialize` and `tools/list` do not build the registry. Tool results reuse the same process cache. GET and OPTIONS on `/api/v1/mcp` send a public `Cache-Control` max-age. MCP request bodies above 64 KB are refused. Documented agent routes stay reachable. `robots.txt` asks crawlers to skip the delta feed, the satellite list, compare, and `/api/og`. It does not ask them to skip `/api/v1/agents/slots` or `/api/v1/mcp`.

## Usage logs

Public agent HTTP routes and remote MCP each write one JSON line to stdout when the function runs. Vercel Observability shows that line. A log drain attached to the project receives the same stdout. The write is not a database row and not a second request. It does not change the JSON body, the status code, the cache headers, or the rate limits. Ordinary reads stay at 60 per minute. A full slot page and an explicit full list stay at 12 per minute.

The event name is `clarke.usage`. Fields are `ts` (UTC timestamp), `transport` (`http` or `mcp`), `route`, `method`, `status`, `ipHash`, and `ua` when a user agent is present. `ipHash` is the first 16 hex characters of SHA-256 over a daily salt, the UTC date, and the client IP. The raw IP is not written. The same IP keeps the same hash until the next UTC day, then the hash changes. `USAGE_LOG_SALT` sets the salt. If it is unset, the salt is `AUTH_SECRET`.

MCP lines add `rpc` when the JSON-RPC method is a known method. `tools/call` also adds `tool` when the name matches `clarke_` plus letters, digits, and underscores. Whitelisted parameters are `slug`, `limit`, `view` (`compact` or `full`), `all` when it is true, and the page cursors `since`, `offset`, and `after`. `operator`, `ownerCountry`, `domain`, and every other argument are dropped. Cookies, authorization headers, and request bodies are not logged. OPTIONS preflight is not logged. A POST body larger than 8 KB is counted without `rpc` or parameters, so that body is not parsed twice. Local stdio (`npm run mcp`) does not write this line. Stdout on that process is the MCP transport.

MCP traffic is in these logs. Tool calls are POST and `Cache-Control: no-store`, so they run on the function and emit a line. Filter Vercel Observability for `clarke.usage` together with `"transport":"mcp"`. One tool is `"tool":"clarke_get_slot"`. HTTP agent routes use `"transport":"http"`. A caller on one UTC day is `"ipHash"` plus the 16 hex characters. A CDN cache hit does not run the function, so it does not emit a line. MCP POST is not cached, so those calls do.

These lines do not challenge or block clients. A scraper can still spend CPU on `/api/v1/mcp` until Firewall bot protection is turned on. The log says who called and which whitelisted query ran. Reads stay open. The routes stay unauthenticated, and a cookie is not required.

## Related pages

- [Data trust](./DATA_TRUST.md): TLE gates, registry row identity, V/M/S audit.
- [Valuation v0](./VALUATION.md): the labeled model on the human Slot Terminal. Not this payload.
- [FCC SSAL refresh](./FCC_REFRESH.md): workbook vintage and the 14-day stale rule.
