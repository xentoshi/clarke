# FCC SSAL refresh runbook

Clarke does **not** scrape fcc.gov. The Approved Space Station List sits behind Akamai bot protection; automated `curl` / headless Chromium requests return Access Denied. The product as-of date is the **workbook vintage** (sheet name, e.g. `Updated 30 April 2026`), not `ingest_meta.last_run`.

Daily `ingest.yml` still skips FCC so a re-parse of the same committed file cannot claim “updated today.” A **weekly** job re-parses `data/ssal.xlsx` and records vintage + sha256 without pretending the file was re-downloaded.

## Weekly (automated)

```
npm run ingest:fcc
```

This:

1. Reads `data/ssal.xlsx` (must exist, non-empty).
2. Parses sheet 0; GEO rows with an `N.N W.L.` / `E.L.` location.
3. Refuses to wipe `fcc_authorizations` if zero GEO rows parsed.
4. Writes `ingest_meta` for `FCC-SSAL`: `last_run` (parse clock), `file_vintage` / `source_as_of` (sheet “Updated …” date), `file_sha256`.
5. Diffs call signs vs the previous table (new / lapsed / licensee / grant-status events).

GitHub Actions: `.github/workflows/ingest-fcc.yml` (Mondays + `workflow_dispatch`). It commits `data/clarke.db` only if the database changed.

## Human refresh (when the FCC publishes a new list)

1. Open [https://www.fcc.gov/approved-space-station-list](https://www.fcc.gov/approved-space-station-list).
2. Download the Excel workbook (Approved Space Station List).
3. Replace `data/ssal.xlsx` in this repo (keep the filename).
4. Confirm the first sheet name looks like `Updated <day> <Month> <year>` — that string is the product as-of.
5. Run:

```
npm run ingest:fcc
npm run vintages          # backfill UCS / TLE vintages without re-downloading those feeds
```

6. Commit `data/ssal.xlsx` and `data/clarke.db`.
7. Check `/orbital/101w`: FCC as-of should match the sheet date; the stale banner clears when as-of is ≤ 14 days old.

## What the Terminal shows

| Field | Meaning |
|---|---|
| FCC SSAL as-of | Workbook vintage (`file_vintage`) |
| parsed | `last_run` — when Clarke last read the committed xlsx |
| Stale banner | Workbook as-of older than **14 days** |

Occupancy stays TLE-primary and does not wait on FCC.

## Credentials

None. No FCC API key. Space-Track credentials are unrelated (`ingest:spacetrack` only).
