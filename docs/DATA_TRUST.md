# Data trust audit — Slot Terminal / registry (Sep 2026)

Clarke is the registry for orbital infrastructure: a public-data **registry plus labeled heuristic model**. This page is the audit of what a paying operator can trust on Slot Terminal and `/api/v1/agents/slots/{slug}`.

> Clarke v0 is a public-registry view (TLE-primary occupancy, UCS identity, FCC SSAL licenses) plus a transparent heuristic implied-value range. It is not a live exchange, not an ITU deed, and not an appraisal. Curated dollar overlays are hand-checked opinions and do not replace the model. TLE longitude is a tracked-object location, never an FCC assignment or ITU filing.

## Product chrome (Sep 2026 design pass)

Registry and Slot Terminal are data surfaces. First screens answer who is on station, rights, and freshness. Dollars are secondary.

| Surface | Rule |
|---|---|
| Registry columns | Slot, status, occupancy, and FCC are the default columns. Congestion is not a column. Fair value stays off until **Show fair value**. Congestion v0 and fair value are labeled models on the human Slot Terminal. They are not recorded facts. |
| Slot Terminal fold | Title, trust line, and occupancy share the first viewport. Recorded FCC rights and freshness follow. Congestion v0 is on the page as a labeled model. Implied fair value, nearest comps, Unlock Pro, and the model path sit behind one closed **Labeled model** disclosure. |
| Trust bar | FCC stale and position disagreement share one compact line (`FCC SSAL stale · Position disagreement · Details`) with expand-in-place. Not stacked orange banners. |
| Unlock Pro | Driver-panel gate only. Verified occupancy is never blurred or paywalled. |
| Nav | Registry · Index · Docs. Terminal opens from a registry row (sample: `/orbital/101w`). |
| Wallpaper | Solid near-black + hairline borders on `/orbital`, `/orbital/[slug]`, and `/docs`. Earth imagery stays off those surfaces. |

## Default Terminal quarantine

The default Slot Terminal screen is **occupancy + recorded FCC + ingest freshness**, plus labeled models: congestion v0 on the page, implied fair value behind one disclosure. Simulated trading UI is not the default.

| Surface | Default Terminal | Why |
|---|---|---|
| Simulated capacity book | **Off the Terminal.** Not rendered on the slot page. Method note only (this page and Valuation v0). API may still return `bidAsk` for inspection. | Function of v0 midpoint + congestion. There is no public GEO bid/ask feed. |
| ITU filing layer | **Unrecorded.** Default Terminal shows a thin chip only: **Unrecorded in Clarke** (`ituRecorded: not_in_product`). Experimental keeps an empty rights-chain stub, not a filled row. | ITU SNS is not ingested. The flag is not a network name, not brought-into-use evidence, and not a filled filing row. |
| Sub-lease / capacity-lease layer | **Quarantined stub.** Same Experimental disclosure. | No public sub-lease registry. Must not look like a named lessee. |
| Seeded valuation sparkline | **Inside Labeled model.** Model path, labeled model backfill, not trades. Not on the default fold. | `terminal.db` is a deterministic v0 path, not observed trades. |
| Curated `$NNN M+` overlay | **Visible, secondary.** Class **M** “hand estimate / curated opinion,” under the model range, not a competing headline. Valuation `basis` is always `model`. | Overlay can diverge ~2× from v0. V/M/S discipline. |
| Recorded FCC rows + TLE-primary occupancy | **Primary.** | Named public sources. |

Pro API still returns `bidAsk` / full `rightsChain` / history so agents can inspect the stubs; the HTML default view does not present them as filled primary panels.

GEO Slot Index #1 (`/index`) is distribution content from the same occupancy / FCC fields: enter/leave vs UCS, dispute flips, license-table mismatches. It does not publish prices.

The machine-readable Slot Index delta feed is `GET /api/v1/agents/deltas` (see [Agent API](./AGENT_API.md)). It diffs stored registry snapshots. It does not turn the Index method note, or `satellite_relocated` events, into a weekly tape.

Tests: `src/lib/terminal-default.test.ts` asserts default primary markup does not contain a filled ITU filing panel (`data-rights-layer="itu"`). The thin Unrecorded chip is allowed. `src/lib/operator-identity.test.ts` covers alias resolution.

## Ranked issues

| Rank | Severity | Issue | Status |
|---|---|---|---|
| 1 | **High** | Remaining-life factor said “no usable lifetime data” on every GEO row. UCS stores **590/590** launch dates as `M/D/YY` (`11/14/10`); the parser required year > 1950, so `expectedLifetimeYears` was ignored. Terminal also printed launch years as `10` / `95` / `6`. UCS-derived `slot.launched` was `13` for MUOS-2. | **Fixed.** Shared `parseUcsLaunchYear`; remaining-life now uses design-life remaining. Re-seed snapshots after the parser fix. |
| 2 | **High** | Operator contradiction at 101°W: registry/API `slot.operator=SES`, Terminal header = DirecTV (majority of ±0.4° window), congestion dominant = DirecTV (±2°). Occupancy metric implied DirecTV holds all 7 sats. Rights chain named Ligado DIP as *the* licensee because FCC rows are ordered west-to-east. UCS/FCC strings also disagree (DirecTV vs AT&T, LightSquared vs Ligado, SES S.A. vs SES). | **Fixed.** Header uses registry/curated operator; occupancy mix is explicit; rights chain lists all FCC licensees. Alias map canonicalizes display/grouping; raw strings stay on tooltip/API. |
| 3 | **High** | “Nearest comps” were other longitudes **inside the same occupancy window** (101.08°W, 100.81°W, …), each re-bundling the same satellites with near-identical model values. | **Fixed.** Comps exclude ±0.4°. |
| 4 | **High** | Seeded valuation history shown as “persisted snapshot.” `terminal.db` only stores a deterministic v0 path. FCC provenance used the **latest any-source ingest**, so a 21-day-old SSAL looked like “Sep 15.” | **Fixed.** History labeled backfill; FCC/UCS `asOf` is per-source. |
| 5 | **High** | Live Space-Track TLEs (epoch 2026-09-15) disagree with UCS GEO longitude by **>2° for 204/512** matched objects and **>10° for 168/512**. Ingest only rewrote `longitude_geo = 0` placeholders, so occupancy/congestion/v0 clustered on stale UCS longs (MUOS-2 at 100.1°W vs TLE **172.0°E**). | **Fixed.** Occupancy is TLE-primary (see Position authority). UCS catalog longitude is preserved and shown. |
| 6 | **Medium** | BIU label “Operating (non-US admin)” on US DoD birds with no FCC row (MUOS-2). | **Fixed.** Wording is “no FCC market-access row.” |
| 7 | **Medium** | Occupancy grouping 0.3° (agents dossier default) vs 0.4° (Terminal / congestion). | **Fixed.** Default co-location window is 0.4°. |
| 8 | **Medium** | Agents list valuation omitted satellite lifetimes, so remaining life stayed 1.0 even after a parser fix. | **Fixed.** `listSlots` / explorer / seed pass the occupancy window. |
| 9 | **Won’t invent** | Curated overlay ($350M+ at 101°W, $400M+ at 19.2°E) can sit far from v0. The cutover off UCS clustering moved the model. The live Terminal is the current v0. | Overlay is class M, secondary to the model; `basis` is always `model`. No new prices invented. |
| 10 | **Open** | UCS ingest `last_run` is the parse clock. The **file vintage** is the latest GEO launch in the snapshot, not that clock. Terminal shows file vintage, TLE epoch, and FCC workbook as-of separately. FCC SSAL workbook as-of is the committed sheet name (Updated 27 September 2026). The stale flag is true only when that date is older than 14 days. ITU SNS is not ingested. NORAD/COSPAR omitted from UI; API still returns them. | Vintage fields + compact Trust bar (FCC stale / position disagreement expand-in-place); weekly `ingest:fcc` re-parse documented. Same-slug duplicate rows are collapsed (see Registry row identity). |
| 11 | **High (UI)** | Simulated book, ITU/sub-lease stubs, and seeded sparkline still sat on the default Terminal as filled panels. | **Fixed.** Simulated book is docs-only. Implied value, comps, and the model path are behind one Labeled model disclosure. ITU/sub-lease stubs stay collapsed under Experimental. |

## Position authority (TLE-primary occupancy)

Dual-track. `satellites.longitude_geo` remains the **UCS catalog** longitude (wrap-normalized only; `0°` placeholders are no longer silently overwritten). Occupancy, congestion, comps, and valuation v0 cluster on a chosen **occupancy longitude**:

1. Prefer Space-Track / Clarke TLE sub-satellite longitude when all of these hold:
   - Object is a satcat **PAYLOAD** (or satcat type is missing — UCS GEO identity is kept). Explicit `DEBRIS`, `ROCKET BODY`, and `UNKNOWN` are not moved.
   - Not decayed (`decay_date` empty) and satcat `current` is not `N`.
   - TLE epoch was within **30 days of TLE ingest** (the Space-Track query already filters `EPOCH > now-30`; usability is relative to ingest, so a shipped snapshot does not silently revert to UCS as the wall clock moves).
   - Eccentricity ≤ 0.01 and mean motion in [0.99, 1.01] rev/day when those elements parse (same gates as the GEO TLE feed).
   - SGP4 at the TLE epoch (`tsince=0`) returns a finite longitude in (−180, 180].
2. Else fall back to UCS longitude **unless** that value is the `0°` placeholder (classified/undisclosed pile-up). No TLE and UCS `0` → occupancy `null` (do not invent a Prime-Meridian station).
3. Never interpolate UCS and TLE. Never present TLE longitude as an FCC assignment or ITU filing location. FCC matching stays on the authorization’s own longitude (±0.6°).
4. Flag `positionDisputed` when both longs exist and circular \|UCS−TLE\| > **2°** (tunable `POSITION_DISPUTE_DEG`).
5. A UCS ghost is a catalog longitude inside the slot window whose occupancy longitude is outside that window and whose \|UCS−TLE\| exceeds 2°. Agreement within 2°, with the track just outside the ±0.4° co-location cut, is the same station-keeping neighborhood, not a stale catalog hit.
6. Occupancy / congestion window remains **±0.4°** co-location and **±2°** neighborhood, using circular longitude difference.

Ingest (`npm run ingest:spacetrack`, or `npm run apply:positions` against an existing TLE table) writes audit columns (`longitude_ucs`, `longitude_tle`, `longitude_occupancy`, `position_source`, `position_delta_deg`, `position_disputed`, `tle_epoch`, …) without replacing the UCS catalog field. Live clustering **recomputes** from the TLE table at query time so occupancy cannot drift from the audit trail.

## Registry row identity

The registry table is one row per slug. Same-slug duplicate rows are shipped as a single row.

UCS satellites outside every curated slot's ±0.4° window are grouped by `lonToSlug` (occupancy longitude rounded to 0.1°). Satellites that share that slug are one row, not one row per satellite. Different slugs stay separate rows even when they sit inside ±0.4° of each other. A satellite inside a curated slot's ±0.4° window is occupancy on that curated row, not a second table row.

The registry operator is the canonical name with the most satellites in the slug (tie: alphabetical canonical name). Source strings stay on `operatorRaw`. A UCS operator string that equals that satellite's launch vehicle is not treated as a GEO operator and is not replaced with a guessed owner.

A detail URL can still open for an occupancy slug that the table folded into a nearby curated row. That URL resolves to the curated dossier. It is not a second registry row.

### Before / after (Space-Track TLE epoch 2026-09-15, apply 2026-09-15)

This table is the cutover snapshot. It is not the live registry and not the live Slot Terminal. Later TLE ingests move occupancy counts, congestion v0, and fair value. Those live figures are not reprinted here, because a hardcoded count goes stale on the next refresh.

| | Before (UCS clustering) | Cutover snapshot (TLE-primary) |
|---|---|---|
| UCS GEO satellites | 590 | 590 |
| UCS∩TLE longs | 512 | 512 (513 TLE-primary incl. UCS-null / 0° cases) |
| \|Δ\| > 2° / > 10° | 204 / 168 — **hidden** (occupancy still UCS) | 204 / 168 — **flagged** on satellite + slot banner |
| Occupancy source | UCS `longitude_geo` (+ 0° TLE rewrite only) | 513 TLE-primary · 73 UCS fallback · 4 unknown |
| MUOS-2 (39206) | clustered at UCS **100.1°W** | occupies TLE **172.04°E**, `positionDisputed`, Δ **87.9°** |
| SES-1 (36516) | 101°W | still 101°W (TLE **−100.98**, Δ 0.02°, not disputed) |
| 101°W ±0.4° | 7 (DirecTV-8/9S, SES-14, SES-1, AT&T T16, SkyTerra 1, MSAT 2) | **5** (SES-1, AT&T T16, SkyTerra 1, MSAT 2, **JCSat 2A** whose TLE is −100.90; UCS listed JCSat 2A at 154°E). DirecTV-8 TLE **119.0°W**, DirecTV-9S TLE **149.2°W**, SES-14 TLE **47.5°W** leave the window and are UCS ghosts on the 101°W banner. |
| 101°W congestion / v0 | 100 / $228M (remaining-life fix, UCS occupancy) | **80** / **$198M** ($155–242M), 5 co-located, history re-seeded as `backfill` |

## Spot checks

Occupancy window is ±0.4° TLE-primary. Satellite counts, congestion v0, and fair value move when TLEs refresh, so this table does not print them. Open the Slot Terminal for the live labeled models.

| Slot | Registry operator | What holds |
|---|---|---|
| **101°W** (`101w`) | SES (curated) | Occupancy is the TLE-primary window, not the old UCS cluster. A UCS ghost is a bird whose catalog longitude is still near the slot while TLE occupancy is elsewhere (DirecTV-8, DirecTV-9S, SES-14 are the standing examples). FCC rows at the license longitude are not occupancy. Curated overlay $350M+ is class M. |
| **19.2°E** (`19-2e`) | SES | Astra names stay when TLE agrees with the UCS catalog. Curated overlay $400M+ is class M. |
| **13°E** (`13e`) | Eutelsat | A military bird stays in the window only when its TLE is inside it. Curated overlay $250M+ is class M. |
| **72°E** (`72e`) | Intelsat | The congestion majority in the ±2° neighborhood can be a different operator than the registry row. Curated overlay $160M+ is class M. |
| **172°E** (`172e`) | Canonical majority on the slug | MUOS-2 occupies here while its TLE is near 172°E. That is occupancy, not an FCC assignment. The UCS catalog still says 100.1°W, and the row is `positionDisputed`. |
| **100.1°W** (`100-1w`) | Canonical majority on the slug | MUOS-2 is not clustered here while its TLE occupancy is elsewhere. The UCS catalog can still read 100.1°W. |
| **163°W** (`163w`) | Astranis (FCC-only) | A paper filing can show zero occupancy when neither TLE nor UCS places a satellite in the window. |

## Satellite identity cross-check (do not invent)

Compared Clarke UCS + Space-Track satcat to CelesTrak SATCAT (`/satcat/records.php?CATNR=`). Names, COSPAR, launch dates match. Sub-satellite longitude in the last column is from Clarke’s **Space-Track TLE at epoch 2026-09-15** (not CelesTrak SATCAT, which does not publish GEO longitude).

| Name (Clarke) | NORAD | COSPAR | CelesTrak name / launch | UCS lon | TLE lon (2026-09-15) |
|---|---|---|---|---|---|
| SES-1 (AMC-4R) | 36516 | 2010-016A | SES-1 / 2010-04-24 | −101 | **−100.98** (matches) |
| Astra 1M | 33436 | 2008-057A | ASTRA 1M / 2008-11-05 | 19.2 | **19.34** (within 0.4°) |
| Intelsat 22 | 38098 | 2012-011A | INTELSAT 22 / 2012-03-25 | 72 | **72.07** (matches) |
| AT&T T16 | 44333 | 2019-034A | AT&T T-16 / 2019-06-20 | −101 | **−100.87** (within 0.4°) |
| MUOS-2 | 39206 | 2013-036A | MUOS-2 / 2013-07-19 | −100.1 | **172.04°E** (UCS stale; occupancy is TLE) |

These five NORAD IDs did **not** reproduce the historical UCS mis-ID problem called out on About. Terminal now shows UCS lon, TLE lon, Δ, source, and epoch. The agents slot payload returns those occupancy fields, FCC rows, dispute records, and source vintage. Treat NORAD on that payload as **UCS-attributed, Space-Track-joinable, not independently verified for every row**.

On that 2026-09-15 snapshot, disagreements were flagged instead of hidden, and occupancy was already TLE-primary. The live disagreement count moves with each TLE ingest and is not reprinted here.

## Field trust matrix (Slot Terminal)

Legend: **V** = verified from a named public source in this product · **M** = modeled / heuristic, labeled · **S** = stub or simulated · **B** = bug or inconsistency (fixed unless marked open)

| Field | Class | Source / notes |
|---|---|---|
| Longitude label / slug | V/M | Registry slug is the curated / occupancy / FCC position. Occupancy clustering uses **TLE-primary** longitude, not UCS `longitude_geo`. TLE lon is **not** an FCC assignment or ITU filing. |
| UCS longitude | V | UCS catalog. Stale vs TLE for 204/512 matched GEO objects. Shown next to TLE. |
| TLE longitude / epoch | V | Space-Track TLE at ingest. Sub-satellite lon at TLE epoch (`tsince=0`). |
| `positionDisputed` | M | Circular \|UCS−TLE\| > 2°. Trust bar chip when in-window sats disagree or UCS ghosts remain. |
| Co-located satellite names, operators, purposes | V | UCS identity. Names checked well. Operator *display* is class M (alias map); hover/API keeps the UCS string. |
| Operator display / grouping | M | Curated alias map (`src/data/operator-aliases.ts`) over UCS/FCC strings. Canonical name is shown on Registry rows, occupancy mix, congestion majority, and FCC licensee. The agent slot record has no headline `operator`. Canonical names are `operatorMix.operator` and per-satellite `operator`, with raw strings on `operatorRaw`. The satellite list still returns `operatorCanonical`, `operatorRaw`, and `aliases`. Not a corporate-ownership graph. Joint `A/B` UCS strings stay unmapped unless listed. Congestion *score* still counts distinct source strings so valuation is unchanged. |
| Satellite count | M | Count of GEO rows whose **occupancy** lon is in ±0.4°, not a unique ITU network count. |
| Launch year | V | UCS `M/D/YY` now parsed. Was **B**. |
| Remaining life | M | UCS launch + **design** lifetime. Not remaining license term. Was **B** (always missing). |
| Registry / curated operator | V/M | Hand-set for curated slots then passed through the alias map; else UCS canonicalized. Raw on `operatorRaw`. |
| Occupancy-window majority | V/M | Mode of UCS operators in the TLE-primary ±0.4° window, grouped by canonical name. Was shown as *the* operator (**B**, previous PR). |
| Congestion score / tier | M | Labeled model on the human Slot Terminal (congestion v0). Not a recorded fact and not a registry column. TLE-primary density ±2°, co-location ±0.4°, operator contention on **raw** source strings. Decayed Space-Track objects excluded; graveyard/inclined not classified. |
| Congestion dominant operator | V/M | Majority source string in ±2°, displayed under the alias map. Often a different company than the registry row (ISRO vs Intelsat at 72°E). |
| Fair value point / CI | M | Labeled model behind the **Labeled model** disclosure. Not a recorded fact. Registry column only after **Show fair value**. $30M × drivers. **Not a quote.** CI is a confidence spread, not a statistical interval. |
| Curated `$NNN M+` overlay | M | Hand-checked opinion. Secondary to v0. Not the model, not a headline. Can diverge by 2×. |
| Coverage GDP/pop | M | Longitude band heuristic (`coverage-proxy.ts`). Not a measured beam. |
| Spectrum bands | V/M | Curated tags only. UCS-derived rows often empty. |
| License / BIU | M | Heuristic: UCS sat + FCC row ≠ ITU brought-into-use. Labeled as a Clarke hint. “Paper filing” can be a UCS lag (163°W). Do not read BIU from UCS+FCC without this label. |
| FCC table (call sign, licensee, service) | V | SSAL. Licensee *display* is class M (alias map); raw licensee stays in the cell tooltip and API `licenseeRaw`. Freshness is the FCC ingest, not “today.” Notes can mention later ICFS grants. Default Terminal primary. |
| Rights: national admin / FCC licensees | V/M | FCC when present; else inferred country. Licensee names canonicalized. Default Terminal primary. |
| Rights: ITU filing | S | ITU SNS is not ingested. `ituRecorded` is `not_in_product`. Thin “Unrecorded in Clarke” chip on the default Terminal. The flag is not a network name, not brought-into-use evidence, and not a filled filing row. Experimental holds an empty stub, not a deed. |
| Rights: sub-lease | S | No public feed. **Quarantined** — Experimental only. |
| Simulated capacity book | S | Function of v0 midpoint + congestion. **Not rendered** on Slot Terminal. Documented here only. |
| Valuation chart / 30-day history | S | Seeded model path. Inside the **Labeled model** disclosure (Model path), labeled model backfill. Not trades. |
| Data freshness `age_days` | V | Ingest clock (`last_run`). Not file vintage. |
| File vintage / source as-of | V | UCS: latest GEO launch in snapshot. FCC: SSAL sheet “Updated …”. TLE: epoch min/max. Shown on Terminal + agents `meta.data_freshness`. |
| FCC stale / position disagreement | V | Workbook as-of older than 14 days, or in-window \|UCS−TLE\| / UCS ghosts. Compact Trust bar chips; details expand in place. Occupancy does not wait on FCC. |
| Non-commercial flag | V | UCS `users` without “Commercial.” |
| NORAD / COSPAR (API) | M | Stored from UCS; some historical IDs were wrong. UI still hides them. |

## Claim language Clarke can use

**Safe**

- “Normalized public GEO occupancy: Space-Track TLE longitude when the TLE passes published quality gates, otherwise the UCS catalog longitude.”
- “Implied fair value v0 is a documented heuristic ($30M baseline × listed drivers), with a confidence band, not a market price.”
- “Congestion is a 0–100 coordination-risk index from TLE-primary occupancy positions, not an ITU filing count.”
- “Identity of named satellites can be checked against Space-Track / CelesTrak; we do not treat UCS NORAD IDs as authoritative for every row.”
- “UCS vs TLE longitude disagreement is shown (Δ and `positionDisputed`); TLE longitude is not an FCC or ITU assignment.”
- “Clarke does not record ITU deeds. `ituRecorded` is `not_in_product` because SNS is not ingested. The Unrecorded chip is not a network name, not brought-into-use evidence, and not a filled filing row.”
- “The registry table is one row per slug.”
- “Congestion v0 and implied fair value are labeled models on the Slot Terminal.”
- “Operator labels are a curated alias map over UCS and FCC strings; source strings remain inspectable.”
- “The public agent record has no headline operator, no valuation, and no congestion score. `ituRecorded` is `not_in_product`.”

**Do not claim**

- Live transponder bids, last trade, or slot appraisal.
- ITU deed / brought-into-use as recorded (BIU is a Clarke hint from UCS occupancy + FCC rows, not SNS).
- That the curated overlay is the model, or that history is a price index.
- That the default Terminal is a live exchange (simulated book is Experimental only).
- That “operator” means exclusive holder of the longitude (it does not).
- That UCS `last_run` today means 2026 ephemerides.
- That a TLE sub-satellite longitude is the FCC-authorized or ITU-filed location.
- That the operator alias map is a live ownership or sub-lease graph.
- That congestion v0 or fair value is a recorded occupancy or license fact.
- That the agent payload includes a single operator, a valuation, or a congestion score.
- That the Unrecorded chip names an ITU network, proves brought-into-use, or fills a filing row.

## Re-ingest

Scheduled `ingest.yml` already runs UCS then Space-Track; the Space-Track step now applies TLE-primary audit columns. FCC is weekly (`ingest-fcc.yml`) against committed `data/ssal.xlsx` — see [FCC SSAL refresh](./FCC_REFRESH.md). Against a DB that already has TLEs:

```
npm run apply:positions    # audit columns; live occupancy also recomputes at query time
npm run ingest:fcc         # parse data/ssal.xlsx; record workbook vintage
npm run vintages           # backfill UCS / TLE / FCC vintages without re-downloading UCS
npm run seed:valuations    # backfill model path (not trades) after occupancy/model changes
```

Space-Track credentials are required only for a live TLE refresh (`npm run ingest:spacetrack`), not for `apply:positions` or `ingest:fcc`.

## Agent slot payload

The field list is [Agent API](./AGENT_API.md). HTTP `GET /api/v1/agents/slots` and `GET /api/v1/agents/slots/{slug}`, and the MCP tools `clarke_list_slots`, `clarke_get_slot`, and `clarke_get_terminal`, return that record. `clarke_get_terminal` is the same JSON as `clarke_get_slot`.

The record includes occupancy (TLE-primary, UCS fallback), `operatorIdentity` (`split`, `single`, or `none`) and `operatorMix` (canonical name, count, share, raw source strings), per-satellite operators on occupancy rows, FCC rows, disputes, source vintage, and provenance. `occupancyAuthority` on the slot is `tle-primary`. Each observation's `occupancyAuthority` is `tle`, `ucs`, or `none`. There is no slot-level `operator` or `operatorRaw`. A split window has no single holder name. The human Terminal can still show its curated registry label. That label is not the agent record. Disputes are in-window TLE vs UCS disagreement plus UCS ghosts (catalog inside the window, occupancy outside, absolute UCS-TLE difference greater than 2 degrees, or no measured delta). `ituRecorded` is `not_in_product` on every slot. `sourceVintage.fccStale` is true when the FCC workbook as-of parses and is older than 14 days. A missing as-of is not marked stale.

Valuation, congestion, bid/ask, comps, and dollar strings are not in the agent payload. Congestion v0 and implied fair value live only as labeled models on the human Slot Terminal. Agents must not treat them as facts. The Pro Terminal API can still return those labeled models. It is not the agent record.

## Not yet shipped

1. ITU BR IFIC when licensed. Replace the empty stub rather than decorating it. SNS stays out of the product until then.
2. Daily valuation job that writes `source=model_run` only after ingest, still never `source=trade` until observed trades exist.
3. A real FCC download when the agency publishes a bot-reachable file. Until then, the human replace-xlsx steps in [FCC SSAL refresh](./FCC_REFRESH.md).
