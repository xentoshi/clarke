# Data trust audit — Slot Terminal / registry (Sep 2026)

Clarke is a public-data **registry plus heuristic model**, not a market. This note is the pre-monetization audit of what a paying operator can and cannot trust on Slot Terminal and `/api/v1/agents/slots/{slug}`.

Honest one-liner for distribution:

> Clarke v0 is a public-registry view (UCS occupancy, FCC SSAL licenses, Space-Track identity checks) plus a transparent heuristic implied-value range. It is not a live market, not an ITU deed, and not an appraisal. Curated dollar overlays are hand-checked opinions and do not replace the model.

## Ranked issues

| Rank | Severity | Issue | Status in this change |
|---|---|---|---|
| 1 | **High** | Remaining-life factor said “no usable lifetime data” on every GEO row. UCS stores **590/590** launch dates as `M/D/YY` (`11/14/10`); the parser required year > 1950, so `expectedLifetimeYears` was ignored. Terminal also printed launch years as `10` / `95` / `6`. UCS-derived `slot.launched` was `13` for MUOS-2. | **Fixed.** Shared `parseUcsLaunchYear`; remaining-life now uses design-life remaining. Re-seed snapshots after this change. |
| 2 | **High** | Operator contradiction at 101°W: registry/API `slot.operator=SES`, Terminal header = DirecTV (majority of ±0.4° window), congestion dominant = DirecTV (±2°). Occupancy metric implied DirecTV holds all 7 sats. Rights chain named Ligado DIP as *the* licensee because FCC rows are ordered west-to-east. | **Fixed.** Header uses registry/curated operator; occupancy mix is explicit; rights chain lists all FCC licensees. |
| 3 | **High** | “Nearest comps” were other longitudes **inside the same occupancy window** (101.08°W, 100.81°W, …), each re-bundling the same satellites with near-identical model values. | **Fixed.** Comps exclude ±0.4°. |
| 4 | **High** | Seeded valuation history shown as “persisted snapshot.” `terminal.db` only stores a deterministic v0 path. FCC provenance used the **latest any-source ingest**, so a 21-day-old SSAL looked like “Sep 15.” | **Fixed.** History labeled backfill; FCC/UCS `asOf` is per-source. |
| 5 | **High (open)** | Live Space-Track TLEs (epoch 2026-09-15) disagree with UCS GEO longitude by **>2° for 204/512** matched objects and **>10° for 168/512**. Ingest only rewrites `longitude_geo = 0` placeholders, not relocations. Example: MUOS-2 UCS **100.1°W**, TLE **~172°E**. Occupancy, congestion, and v0 are still UCS-positioned. | Documented. Applying TLE as the occupancy source of truth is a registry methodology change, not done here. |
| 6 | **Medium** | BIU label “Operating (non-US admin)” on US DoD birds with no FCC row (MUOS-2). | **Fixed.** Wording is “no FCC market-access row.” |
| 7 | **Medium** | Occupancy grouping 0.3° (agents dossier default) vs 0.4° (Terminal / congestion). | **Fixed.** Default co-location window is 0.4°. |
| 8 | **Medium** | Agents list valuation omitted satellite lifetimes, so remaining life stayed 1.0 even after a parser fix. | **Fixed.** `listSlots` / explorer / seed pass the occupancy window. |
| 9 | **Won’t invent** | Curated overlay ($350M+ at 101°W, $400M+ at 19.2°E) is far from v0 ($259M / $195M before remaining-life; **$228M at 101°W after**). | Overlay stays labeled; model remains the fair-value figure. No new prices invented. |
| 10 | **Open** | UCS ingest `last_run` is today; the **file vintage is ~May 2023** (latest GEO launch in DB is 2023). Terminal “as of today” is ingest time. FCC SSAL ~21 days stale by design (`ingest.yml` skips it). ITU SNS is not ingested. NORAD/COSPAR omitted from UI (known UCS ID errors); API still returns them. Duplicate slugs for absorbed longitudes remain. | Documented. |

## Spot checks (public API, 2026-09-15)

Occupancy window is ±0.4° unless noted. Valuations below are **pre-remaining-life-fix** live figures unless noted.

| Slot | Registry operator | Sats in window | Live v0 (point / CI) | Curated overlay | Contradictions |
|---|---|---|---|---|---|
| **101°W** (`101w`) | SES (curated) | 7 | Live was $259M ($202–317M) with remaining-life stuck at ×1.0; **after parser fix $228M ($178–279M)** (design-life remaining ~−3.9y, ×0.88). Congestion 100 | $350M+ | Header was DirecTV; mix is DirecTV 3, SES 2, LightSquared 1, MSV 1. FCC ×4 (Ligado, DIRECTV ×2, SES Americom). |
| **19.2°E** (`19-2e`) | SES | 4 Astra | $195M ($152–238M), congestion 43 | $400M+ | Operators consistent (SES S.A.). No FCC (non-US). Overlay ≫ model. Remaining life was broken (all 2-digit dates). |
| **13°E** (`13e`) | Eutelsat | 6 | $245M ($191–299M), congestion 63 | $250M+ | 5× EUTELSAT + German **COMSATBw-2** (Military) in the same window. Header would have been Eutelsat; military sat still priced into occupancy. Overlay ≈ model. |
| **72°E** (`72e`) | Intelsat | 1 (IS-22) | $125M ($98–153M), congestion 50 | $160M+ | Congestion **dominant operator = ISRO** (±2° neighborhood), not Intelsat. Occupancy is 1 Intelsat. FCC S2846 Intelsat License LLC. |
| **100.1°W** (`100-1w`) | DoD/US Navy | 1 (MUOS-2) | n/c (non-commercial); raw $81M | — | `slot.launched=13` (2-digit year bug). BIU said “non-US admin.” Congestion dominant DirecTV from the 101°W neighborhood. |
| **163°W** (`163w`) | Astranis (FCC-only) | 0 UCS | $18M ($9–27M) paper filing | — | FCC `dateInOrbit=2023-06-05` (ARCTURUS / Aurora 4A) but UCS has no sat — likely **UCS vintage**, not proof it is still paper. |

## Satellite identity cross-check (do not invent)

Compared Clarke UCS + Space-Track satcat to CelesTrak SATCAT (`/satcat/records.php?CATNR=`). Names, COSPAR, launch dates match. Sub-satellite longitude in the last column is from Clarke’s **Space-Track TLE at epoch 2026-09-15** (not CelesTrak SATCAT, which does not publish GEO longitude).

| Name (Clarke) | NORAD | COSPAR | CelesTrak name / launch | UCS lon | TLE lon (2026-09-15) |
|---|---|---|---|---|---|
| SES-1 (AMC-4R) | 36516 | 2010-016A | SES-1 / 2010-04-24 | −101 | **−100.98** (matches) |
| Astra 1M | 33436 | 2008-057A | ASTRA 1M / 2008-11-05 | 19.2 | **19.34** (within 0.4°) |
| Intelsat 22 | 38098 | 2012-011A | INTELSAT 22 / 2012-03-25 | 72 | **72.07** (matches) |
| AT&T T16 | 44333 | 2019-034A | AT&T T-16 / 2019-06-20 | −101 | **−100.87** (within 0.4°) |
| MUOS-2 | 39206 | 2013-036A | MUOS-2 / 2013-07-19 | −100.1 | **~172°E** (UCS stale) |

These five NORAD IDs did **not** reproduce the historical UCS mis-ID problem called out on About. Clarke still omits identifiers in the Terminal table; the agents API still returns them. Treat API NORAD/COSPAR as **UCS-attributed, Space-Track-joinable, not independently verified for every row**.

Fleet-wide, matching UCS GEO rows to Clarke TLEs: **204/512 differ by >2°, 168/512 by >10°**. Occupancy is still the UCS snapshot.

## Field trust matrix (Slot Terminal)

Legend: **V** = verified from a named public source in this product · **M** = modeled / heuristic, labeled · **S** = stub or simulated · **B** = bug or inconsistency (fixed in this PR unless marked open)

| Field | Class | Source / notes |
|---|---|---|
| Longitude label / slug | V/M | Rounded from UCS `longitude_geo` (or FCC). **Not** live TLE longitude except for the 0° placeholder rewrite on ingest. |
| Co-located satellite names, operators, purposes | V | UCS. Names checked well; operators can be stale (LightSquared, “DirecTV, Inc.”). |
| Satellite count | M | Count of UCS GEO rows in ±0.4°, not a unique ITU network count. Bundles physically distinct birds (SES-1 and DirecTV at 101°W). |
| Launch year | V | UCS `M/D/YY` now parsed. Was **B**. |
| Remaining life | M | UCS launch + **design** lifetime. Not remaining license term. Was **B** (always missing). |
| Registry / curated operator | V/M | Hand-set for curated slots; else UCS. |
| Occupancy-window majority | V | Mode of UCS operators in ±0.4°. Was shown as *the* operator (**B**). |
| Congestion score / tier | M | UCS density ±2°, co-location ±0.4°, operator contention. Decayed Space-Track objects excluded; graveyard/inclined not classified. |
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

- “Normalized public GEO occupancy from the UCS Satellite Database, with FCC SSAL license rows where the US has a record.”
- “Implied fair value v0 is a documented heuristic ($30M baseline × listed drivers), with a confidence band, not a market price.”
- “Congestion is a 0–100 coordination-risk index from UCS positions, not an ITU filing count.”
- “Identity of named satellites can be checked against Space-Track / CelesTrak; we do not treat UCS NORAD IDs as authoritative for every row.”

**Do not claim**

- Live transponder bids, last trade, or slot appraisal.
- ITU deed / brought-into-use as recorded (BIU is a Clarke hint).
- That the curated overlay is the model, or that history is a price index.
- That “operator” means exclusive holder of the longitude (it does not).
- That UCS `last_run` today means 2026 ephemerides.

## Minimal further trust-hardening (not in this PR)

1. Use Space-Track / TLE longitude as the occupancy position when it disagrees with UCS by more than the co-location window (204/512 GEO objects today), with a provenance flag.
2. Surface TLE longitude next to UCS longitude on Terminal.
3. Group registry rows so absorbed longitudes (101.08°W) are not separate pages.
4. Record UCS **file vintage** in `ingest_meta`, not only pull time.
5. Re-enable or document a real FCC SSAL refresh; 21-day lag is a product fact.
6. ITU BR IFIC when licensed — replace the stub rather than decorating it.
7. Daily valuation job that writes `source=model_run` only after ingest, still never `source=trade` until a tape exists.
