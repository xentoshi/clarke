# Agent API

Public agents read one GEO slot record. HTTP `GET /api/v1/agents/slots` and `GET /api/v1/agents/slots/{slug}` return it inside a `{ data, meta }` envelope. The MCP tools `clarke_list_slots`, `clarke_get_slot`, and `clarke_get_terminal` return the same JSON. `clarke_get_terminal` is not a second schema. It is the same object as `clarke_get_slot`.

The record is occupancy, operator identity, FCC rows, disputes, source vintage, and provenance. It is not the human Slot Terminal.

## Not in this payload

Valuation, congestion, bid/ask, comps, valuation history, and dollar strings are not in the agent payload. There is no slot-level `operator` or `operatorRaw`. A mixed window used to be mis-labeled by a single headline name. That field is gone.

Congestion v0 and implied fair value live only as labeled models on the human Slot Terminal. They are not recorded facts. Agents must not treat them as facts, including when a person can still see them on the Terminal page. The Pro Terminal API (`/api/v1/terminal/...`) is a different, authenticated surface. It can return those labeled models. It is not this record.

The human Slot Terminal may still show a curated operator label. That label is intentional and separate. It is not a field on the agent record.

`provenance.rights` is a source note. It is not an ITU filing chain.

## Transports

Both transports are read-only and unauthenticated. They share one builder, so a slug in the list and `GET /api/v1/agents/slots/{slug}` are the same object.

### HTTP

| Route | `data` |
|---|---|
| `GET /api/v1/agents/slots` | Array of slot records, one per registry slug, sorted by longitude (west, negative, through east). |
| `GET /api/v1/agents/slots/{slug}` | One slot record. |

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
| `generated_at` | Every 200 | ISO-8601 UTC time the envelope was built. |
| `count` | List routes only | `data.length`. Registry rows, not the UCS satellite total. |
| `data_freshness` | Slot list and slot detail | Ingest rows. See freshness below. The satellites route does not send this array. |

Headers on 200: `Content-Type: application/json`, `ETag`, `Cache-Control: public, s-maxage=300, stale-while-revalidate=60`, `Access-Control-Allow-Origin: *`. The handler sets `ETag`. It does not return 304 when `If-None-Match` is sent.

Errors are `{ "error": "..." }`, not the envelope.

| Status | When |
|---|---|
| 400 | Slug fails `^[a-z0-9-]+$`. Body: `Invalid slug`. |
| 404 | Safe slug with no occupancy, no FCC row within 0.6 degrees, and no curated slot at that slug or within 0.4 degrees. Body: `No slot at slug '<slug>'`. A safe slug that is not a longitude (`abc`) is also 404. |
| 429 | Over 60 requests per minute per IP on this instance. Header `Retry-After` is seconds. Body: `Too many requests`. The limiter is in-memory per server instance. |

Slugs from the list are the supported keys. Examples: `101w` (101 degrees west), `19-2e` (19.2 degrees east). A slug that is not in the list can still return 200 when occupancy, an FCC row, or a nearby curated slot matches. `slug` and `longitude` are then the path you asked for. `label`, `country`, and `status` can come from that nearby curated row. Prefer list slugs.

Rate limit, CORS, and the envelope also apply to `GET /api/v1/agents/satellites` (UCS GEO rows, not this slot record). Filters: `operator`, `ownerCountry`, `limit` (1 to 1000). That route's `meta` has `count` and no `data_freshness`.

`GET /api/v1/openapi` is a short OpenAPI 3.1 index. This page is the field list.

### MCP

Local stdio server, `npm run mcp`. It reads the committed SQLite database in the repo. It does not call the HTTP API. Tool results are pretty-printed JSON text. They are not wrapped in `{ data, meta }`.

| Tool | Arguments | Result |
|---|---|---|
| `clarke_list_slots` | none | JSON array of slot records. |
| `clarke_get_slot` | `slug` matching `^[a-z0-9-]+$` | One slot record. |
| `clarke_get_terminal` | `slug` matching `^[a-z0-9-]+$` | The same JSON as `clarke_get_slot`. |

Unknown slug: error result whose text is `{ "error": "No slot at slug '<slug>'" }`. The tool schema rejects a slug that fails the pattern before that lookup.

`clarke_list_satellites` is a separate UCS catalog tool (`operator`, `ownerCountry`, `limit`). It is not the slot record and it does not carry valuation or congestion.

Sample client config is in the header of `scripts/clarke-mcp.ts`.

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
  "country": "USA",
  "status": "active",
  "ituRecorded": "not_in_product",
  "ituDetail": "ITU SNS is not ingested. This flag is not a network name, not brought-into-use evidence, and not a filled filing row.",
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
| `country` | V/M | string | Curated country, else the first occupancy row's owner country, else the first FCC administration. Empty string when none of those exist. |
| `status` | M | string | Curated status when the row has one: `active`, `filed`, `squatted`, or `inactive`. Otherwise `active` when the window has satellites, else `filed`. |
| `ituRecorded` | S | string | Always `not_in_product`. |
| `ituDetail` | S | string | The fixed sentence in the example. |
| `satCount` | M | number | Occupancy rows in the ±0.4 degree window. Not an ITU network count. |
| `occupancyAuthority` | V | string | Always `tle-primary`. That is the slot rule, not a claim that every row used a TLE. |
| `fccAuthorizations` | V/M | array | SSAL rows within 0.6 degrees of the slot longitude. |
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

The window is ±0.4 degrees on that occupancy longitude. FCC matching is separate: ±0.6 degrees on the authorization's own longitude.

`occupancyAuthority` on the slot is the rule name `tle-primary`. On each occupancy row, `occupancyAuthority` is the source that supplied that object's longitude: `tle`, `ucs`, or `none`.

| Field | Class | Meaning |
|---|---|---|
| `id` | V | UCS row id. |
| `name` | V | UCS name. |
| `noradId` | M | UCS-attributed NORAD id, joinable to Space-Track. Not independently verified for every row. |
| `operator`, `operatorRaw` | V/M | See operator identity. |
| `launchDate` | V | UCS launch date string. |
| `tleLongitude` | V | TLE sub-satellite longitude at epoch, or `null`. |
| `tleEpoch` | V | TLE epoch, or `null`. |
| `ucsLongitude` | V | UCS catalog longitude, or `null`. |
| `deltaDeg` | M | Circular absolute difference between UCS and TLE longitudes, or `null` when either longitude is missing. |
| `disputed` | M | `true` when `deltaDeg` is greater than 2. |
| `occupancyAuthority` | V | `tle`, `ucs`, or `none`. |

Ghosts are not in `occupancy`. They are outside the window. They appear only under `disputes`.

## Disputes

| `kind` | Rule |
|---|---|
| `tle_ucs_disagreement` | Satellite is inside the occupancy window and `disputed` is true (both longitudes exist and the absolute difference is greater than 2 degrees). |
| `ucs_ghost` | UCS catalog longitude is inside the ±0.4 degree window, occupancy longitude is outside it, and the absolute UCS-TLE difference is greater than 2 degrees or there is no measured delta. Agreement within 2 degrees, with the track just outside the co-location cut, is not a ghost. |

Each dispute object: `kind`, `name`, `noradId`, `ucsLongitude`, `tleLongitude`, `occupancyLongitude`, `deltaDeg`, `positionSource` (`tle`, `ucs`, or `none`).

## ITU

`ituRecorded` is `not_in_product` on every slot. That is the permanent hole until a real ITU ingest exists. ITU SNS is not ingested. The flag is not a network name, not brought-into-use evidence, and not a filled filing row. Do not claim ITU filings are in the product. `ituDetail` repeats that limit in one sentence and does not vary by slug.

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
| `tleEpochMin`, `tleEpochMax` | TLE epochs on satellites in this occupancy window, sorted. Null when the window has no epochs. |
| `tleIngestAt` | When Clarke ingested Space-Track TLEs. |

`fccStale` is a comparison of the workbook date to 14 days. It is not "the FCC feed failed" and it is not a reason to drop occupancy. Occupancy stays TLE-primary and does not wait on FCC. A missing or unparsed `fccAsOf` is not marked stale (`fccStale` stays `false`). The human Trust bar uses this same flag. Workbook replace steps are in [FCC SSAL refresh](./FCC_REFRESH.md).

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
| `occupancy` | Space-Track TLE (primary) plus UCS Satellite Database (fallback) | Window, how many rows are TLE-primary, TLE epoch, and a reminder that TLE longitude is not an FCC or ITU assignment. |
| `ucsCatalog` | UCS Satellite Database | File vintage. The ingest clock is not the catalog epoch. |
| `fcc` | FCC Approved Space Station List | Workbook as-of and ingest time. |
| `license` | FCC SSAL plus UCS occupancy | No `note`. `source` and `asOf` only. |
| `rights` | FCC SSAL plus UCS; ITU not recorded in Clarke | No filing body. |

Each object has `asOf` (ISO-8601 UTC). These notes describe sources. They do not add valuation or congestion.

## Related pages

- [Data trust](./DATA_TRUST.md): TLE gates, registry row identity, V/M/S audit.
- [Valuation v0](./VALUATION.md): the labeled model on the human Slot Terminal. Not this payload.
- [FCC SSAL refresh](./FCC_REFRESH.md): workbook vintage and the 14-day stale rule.
