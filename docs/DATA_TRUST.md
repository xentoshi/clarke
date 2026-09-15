# Data trust audit — Slot Terminal / registry (Sep 2026)

Clarke is a public-data **registry plus heuristic model**, not a market. This note is the pre-monetization audit of what a paying operator can and cannot trust on Slot Terminal and `/api/v1/agents/slots/{slug}`.

Honest one-liner for distribution:

> Clarke v0 is a public-registry view (TLE-primary occupancy, UCS identity, FCC SSAL licenses) plus a transparent heuristic implied-value range. It is not a live market, not an ITU deed, and not an appraisal. Curated dollar overlays are hand-checked opinions and do not replace the model. TLE longitude is a tracked-object location, never an FCC assignment or ITU filing.

## Ranked issues

| Rank | Severity | Issue | Status in this change |
|---|---|---|---|
| 1 | **High** | Remaining-life factor said “no usable lifetime data” on every GEO row. UCS stores **590/590** launch dates as `M/D/YY` (`11/14/10`); the parser required year > 1950, so `expectedLifetimeYears` was ignored. Terminal also printed launch years as `10` / `95` / `6`. UCS-derived `slot.launched` was `13` for MUOS-2. | **Fixed.** Shared `parseUcsLaunchYear`; remaining-life now uses design-life remaining. Re-seed snapshots after this change. |
| 2 | **High** | Operator contradiction at 101°W: registry/API `slot.operator=SES`, Terminal header = DirecTV (majority of ±0.4° window), congestion dominant = DirecTV (±2°). Occupancy metric implied DirecTV holds all 7 sats. Rights chain named Ligado DIP as *the* licensee because FCC rows are ordered west-to-east. | **Fixed.** Header uses registry/curated operator; occupancy mix is explicit; rights chain lists all FCC licensees. |
| 3 | **High** | “Nearest comps” were other longitudes **inside the same occupancy window** (101.08°W, 100.81°W, …), each re-bundling the same satellites with near-identical model values. | **Fixed.** Comps exclude ±0.4°. |
| 4 | **High** | Seeded valuation history shown as “persisted snapshot.” `terminal.db` only stores a deterministic v0 path. FCC provenance used the **latest any-source ingest**, so a 21-day-old SSAL looked like “Sep 15.” | **Fixed.** History labeled backfill; FCC/UCS `asOf` is per-source. |
| 5 | **High** | Live Space-Track TLEs (epoch 2026-09-15) disagree with UCS GEO longitude by **>2° for 204/512** matched objects and **>10° for 168/512**. Ingest only rewrote `longitude_geo = 0` placeholders, so occupancy/congestion/v0 clustered on stale UCS longs (MUOS-2 at 100.1°W vs TLE **172.0°E**). | **Fixed.** Occupancy is TLE-primary (see Position authority). UCS catalog longitude is preserved and shown. |
| 6 | **Medium** | BIU label “Operating (non-US admin)” on US DoD birds with no FCC row (MUOS-2). | **Fixed.** Wording is “no FCC market-access row.” |
| 7 | **Medium** | Occupancy grouping 0.3° (agents dossier default) vs 0.4° (Terminal / congestion). | **Fixed.** Default co-location window is 0.4°. |
| 8 | **Medium** | Agents list valuation omitted satellite lifetimes, so remaining life stayed 1.0 even after a parser fix. | **Fixed.** `listSlots` / explorer / seed pass the occupancy window. |
| 9 | **Won’t invent** | Curated overlay ($350M+ at 101°W, $400M+ at 19.2°E) is far from v0. After remaining-life fix UCS occupancy was **$228M at 101°W**; after TLE-primary occupancy **$198M** (5 sats, congestion 80). | Overlay stays labeled; model remains the fair-value figure. No new prices invented. |
| 10 | **Open** | UCS ingest `last_run` is today; the **file vintage is ~May 2023** (latest GEO launch in DB is 2023). Terminal “as of today” is ingest time. FCC SSAL ~21 days stale by design (`ingest.yml` skips it). ITU SNS is not ingested. NORAD/COSPAR omitted from UI (known UCS ID errors); API still returns them. Duplicate slugs for absorbed longitudes remain. | Documented. |

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
5. Occupancy / congestion window remains **±0.4°** co-location and **±2°** neighborhood, using circular longitude difference.

Ingest (`npm run ingest:spacetrack`, or `npm run apply:positions` against an existing TLE table) writes audit columns (`longitude_ucs`, `longitude_tle`, `longitude_occupancy`, `position_source`, `position_delta_deg`, `position_disputed`, `tle_epoch`, …) without replacing the UCS catalog field. Live clustering **recomputes** from the TLE table at query time so occupancy cannot drift from the audit trail.

### Before / after (Space-Track TLE epoch 2026-09-15, apply 2026-09-15)

| | Before (UCS clustering) | After (TLE-primary) |
|---|---|---|
| GEO rows | 590 | 590 |
| UCS∩TLE longs | 512 | 512 (513 TLE-primary incl. UCS-null / 0° cases) |
| \|Δ\| > 2° / > 10° | 204 / 168 — **hidden** (occupancy still UCS) | 204 / 168 — **flagged** on satellite + slot banner |
| Occupancy source | UCS `longitude_geo` (+ 0° TLE rewrite only) | 513 TLE-primary · 73 UCS fallback · 4 unknown |
| MUOS-2 (39206) | clustered at UCS **100.1°W** | occupies TLE **172.04°E**, `positionDisputed`, Δ **87.9°** |
| SES-1 (36516) | 101°W | still 101°W (TLE **−100.98**, Δ 0.02°, not disputed) |
| 101°W ±0.4° | 7 (DirecTV-8/9S, SES-14, SES-1, AT&T T16, SkyTerra 1, MSAT 2) | **5** (SES-1, AT&T T16, SkyTerra 1, MSAT 2, **JCSat 2A** whose TLE is −100.90; UCS listed JCSat 2A at 154°E). DirecTV-8 TLE **119.0°W**, DirecTV-9S TLE **149.2°W**, SES-14 TLE **47.5°W** leave the window and are UCS ghosts on the 101°W banner. |
| 101°W congestion / v0 | 100 / $228M (remaining-life fix, UCS occupancy) | **80** / **$198M** ($155–242M), 5 co-located, history re-seeded as `backfill` |

## Spot checks (public API, 2026-09-15)

Occupancy window is ±0.4° TLE-primary unless noted.

| Slot | Registry operator | Sats in window | Live v0 (point / CI) | Curated overlay | Contradictions |
|---|---|---|---|---|---|
| **101°W** (`101w`) | SES (curated) | **5** TLE-primary | **$198M** ($155–242M); congestion **80**. Was 7 UCS-clustered / $228M / congestion 100 after remaining-life fix. | $350M+ | Mix is no longer DirecTV-heavy in ±0.4°. JCSat 2A is in-window and `positionDisputed`. UCS ghosts: DirecTV-8/9S, SES-14. FCC still lists DIRECTV / SES / Ligado at this **license** longitude. |
| **19.2°E** (`19-2e`) | SES | Astra fleet (TLE ≈ UCS) | Model; congestion from TLE-primary density | $400M+ | Operators consistent (SES S.A.). Overlay ≫ model. |
| **13°E** (`13e`) | Eutelsat | TLE-primary window | Model | $250M+ | Military COMSATBw-2 still in occupancy if TLE agrees. |
| **72°E** (`72e`) | Intelsat | IS-22 (TLE 72.07 matches UCS) | Model | $160M+ | Congestion dominant operator can still differ in the ±2° neighborhood. |
| **172°E** (`172e`) | — | MUOS-2 + Eutelsat 172B + UFO-4 | MUOS-2 n/c (military); slot is TLE occupancy, **not** an FCC assignment at 172°E | — | MUOS-2 UCS still 100.1°W. Banner: disputed. |
| **100.1°W** (`100-1w`) | — | MUOS-2 **left** | Page remains only if FCC/curated/other occupancy; MUOS-2 is not clustered here | — | UCS catalog still says 100.1°W; occupancy does not. |
| **163°W** (`163w`) | Astranis (FCC-only) | 0 occupancy | Paper filing | — | FCC `dateInOrbit=2023-06-05` vs UCS vintage. |

## Satellite identity cross-check (do not invent)

Compared Clarke UCS + Space-Track satcat to CelesTrak SATCAT (`/satcat/records.php?CATNR=`). Names, COSPAR, launch dates match. Sub-satellite longitude in the last column is from Clarke’s **Space-Track TLE at epoch 2026-09-15** (not CelesTrak SATCAT, which does not publish GEO longitude).

| Name (Clarke) | NORAD | COSPAR | CelesTrak name / launch | UCS lon | TLE lon (2026-09-15) |
|---|---|---|---|---|---|
| SES-1 (AMC-4R) | 36516 | 2010-016A | SES-1 / 2010-04-24 | −101 | **−100.98** (matches) |
| Astra 1M | 33436 | 2008-057A | ASTRA 1M / 2008-11-05 | 19.2 | **19.34** (within 0.4°) |
| Intelsat 22 | 38098 | 2012-011A | INTELSAT 22 / 2012-03-25 | 72 | **72.07** (matches) |
| AT&T T16 | 44333 | 2019-034A | AT&T T-16 / 2019-06-20 | −101 | **−100.87** (within 0.4°) |
| MUOS-2 | 39206 | 2013-036A | MUOS-2 / 2013-07-19 | −100.1 | **172.04°E** (UCS stale; occupancy is TLE) |

These five NORAD IDs did **not** reproduce the historical UCS mis-ID problem called out on About. Terminal now shows UCS lon, TLE lon, Δ, source, and epoch; the agents API returns the same fields plus `positionTrust` on the slot dossier. Treat API NORAD/COSPAR as **UCS-attributed, Space-Track-joinable, not independently verified for every row**.

Fleet-wide, matching UCS GEO rows to Clarke TLEs: **204/512 differ by >2°, 168/512 by >10°**. Occupancy is TLE-primary (513 / 73 UCS fallback / 4 unknown). Disagreements are flagged, not hidden.

## Field trust matrix (Slot Terminal)

Legend: **V** = verified from a named public source in this product · **M** = modeled / heuristic, labeled · **S** = stub or simulated · **B** = bug or inconsistency (fixed in this PR unless marked open)

| Field | Class | Source / notes |
|---|---|---|
| Longitude label / slug | V/M | Registry slug is the curated / occupancy / FCC position. Occupancy clustering uses **TLE-primary** longitude, not UCS `longitude_geo`. TLE lon is **not** an FCC assignment or ITU filing. |
| UCS longitude | V | UCS catalog. Stale vs TLE for 204/512 matched GEO objects. Shown next to TLE. |
| TLE longitude / epoch | V | Space-Track TLE at ingest. Sub-satellite lon at TLE epoch (`tsince=0`). |
| `positionDisputed` | M | Circular \|UCS−TLE\| > 2°. Slot banner when in-window sats disagree or UCS ghosts remain. |
| Co-located satellite names, operators, purposes | V | UCS identity. Names checked well; operators can be stale (LightSquared, “DirecTV, Inc.”). |
| Satellite count | M | Count of GEO rows whose **occupancy** lon is in ±0.4°, not a unique ITU network count. |
| Launch year | V | UCS `M/D/YY` now parsed. Was **B**. |
| Remaining life | M | UCS launch + **design** lifetime. Not remaining license term. Was **B** (always missing). |
| Registry / curated operator | V/M | Hand-set for curated slots; else UCS. |
| Occupancy-window majority | V | Mode of UCS operators in the TLE-primary ±0.4° window. Was shown as *the* operator (**B**, previous PR). |
| Congestion score / tier | M | TLE-primary density ±2°, co-location ±0.4°, operator contention. Decayed Space-Track objects excluded; graveyard/inclined not classified. |
| Congestion dominant operator | V | Majority in ±2° neighborhood — often a different company than the registry row (ISRO vs Intelsat at 72°E). |
| Fair value point / CI | M | $30M × drivers. **Not a quote.** CI is a confidence spread, not a statistical interval. |
| Curated `$NNN M+` overlay | M | Hand-checked opinion. Not the model. Can diverge by 2×. |
| Coverage GDP/pop | M | Longitude band heuristic (`coverage-proxy.ts`). Not a measured beam. |
| Spectrum bands | V/M | Curated tags only. UCS-derived rows often empty. |
| License / BIU | M | Heuristic: UCS sat + FCC row ≠ ITU brought-into-use. “Paper filing” can be a UCS lag (163°W). |
| FCC table (call sign, licensee, service) | V | SSAL. Freshness is the FCC ingest, not “today.” Notes can mention later ICFS grants. |
| Rights: national admin / FCC licensees | V | FCC when present; else inferred country. |
| Rights: ITU filing | S | Not ingested. Quarantined stub. |
| Rights: sub-lease | S | No public feed. Quarantined stub. |
| Simulated capacity book | S | Function of v0 midpoint + congestion. Labeled SIMULATED. |
| Valuation chart / 30-day history | S | Seeded model path. Not trades. |
| Data freshness `age_days` | V | Ingest clock. UCS `0 days` ≠ live catalog. FCC ~21 days is real. |
| Non-commercial flag | V | UCS `users` without “Commercial.” |
| NORAD / COSPAR (API) | M | Stored from UCS; some historical IDs were wrong. UI still hides them. |

## Claim language Clarke can use

**Safe**

- “Normalized public GEO occupancy: Space-Track TLE longitude when the TLE passes published quality gates, otherwise the UCS catalog longitude.”
- “Implied fair value v0 is a documented heuristic ($30M baseline × listed drivers), with a confidence band, not a market price.”
- “Congestion is a 0–100 coordination-risk index from TLE-primary occupancy positions, not an ITU filing count.”
- “Identity of named satellites can be checked against Space-Track / CelesTrak; we do not treat UCS NORAD IDs as authoritative for every row.”
- “UCS vs TLE longitude disagreement is shown (Δ and `positionDisputed`); TLE longitude is not an FCC or ITU assignment.”

**Do not claim**

- Live transponder bids, last trade, or slot appraisal.
- ITU deed / brought-into-use as recorded (BIU is a Clarke hint).
- That the curated overlay is the model, or that history is a price index.
- That “operator” means exclusive holder of the longitude (it does not).
- That UCS `last_run` today means 2026 ephemerides.
- That a TLE sub-satellite longitude is the FCC-authorized or ITU-filed location.

## Re-ingest

Scheduled `ingest.yml` already runs UCS then Space-Track; the Space-Track step now applies TLE-primary audit columns. Against a DB that already has TLEs:

```
npm run apply:positions    # audit columns; live occupancy also recomputes at query time
npm run seed:valuations    # backfill model path (not trades) after occupancy/model changes
```

Space-Track credentials are required only for a live TLE refresh (`npm run ingest:spacetrack`), not for `apply:positions`.

## Minimal further trust-hardening (not in this PR)

1. Group registry rows so absorbed longitudes are not separate pages.
2. Record UCS **file vintage** in `ingest_meta`, not only pull time.
3. Re-enable or document a real FCC SSAL refresh; 21-day lag is a product fact.
4. ITU BR IFIC when licensed — replace the stub rather than decorating it.
5. Daily valuation job that writes `source=model_run` only after ingest, still never `source=trade` until a tape exists.
