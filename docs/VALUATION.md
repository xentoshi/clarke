# Valuation v0

Clarke’s Slot Terminal fair-value figure is a labeled **model**: a documented heuristic so operators and investors can inspect an implied range and its drivers. It is not a live exchange price, an appraisal, or an offer to transact.

## Formula

```
point = $30M baseline
      × arc desirability
      × coverage (GDP/pop heuristic)
      × occupancy (co-located satellite count)
      × remaining life / occupancy quality
      × operator tier
      × spectrum (bands, when known)
      × scarcity (congestion score)
      × license / brought-into-use
```

Confidence interval: ±22% (high) / ±35% (medium) / ±50% (low) around the point. High confidence is reserved for curated positions; government/military-only UCS `users` are flagged non-commercial and forced to low confidence.

Curated `valueEstimate` strings (e.g. `$350M+`) are a **hand estimate / curated opinion** (class M). They are secondary to the v0 range and do **not** replace it. Valuation `basis` is always `model`.

## Inputs

| Driver | Source | Notes |
|---|---|---|
| Arc desirability | Longitude band | Same corridors as the previous heuristic (Europe, North America, Asia, …) |
| Coverage GDP/pop | `src/lib/coverage-proxy.ts` | Public regional GDP and population shares, rounded. Not a measured beam footprint. |
| Occupancy | TLE-primary GEO longitude ±0.4° | Space-Track TLE when age/quality pass; UCS catalog fallback otherwise. Not an FCC/ITU assignment. |
| Remaining life | UCS launch date + expected lifetime | UCS dates are `M/D/YY`; v0 expands 57–99 → 1957–1999 and 00–56 → 2000–2056. Missing lifetime → multiplier 1.0 (no invented youth/expiry). UCS expected lifetime is **design life**, not remaining licensed life — many GEO birds fly past it. |
| Operator tier | Operator name vs tier-1 list | SES, Intelsat, Eutelsat, … |
| Spectrum | Curated band tags | UCS-derived rows often have no band data |
| Scarcity | Clarke congestion 0–100 | Density, co-location, operator contention on **TLE-primary** occupancy longs |
| License / BIU | FCC SSAL + UCS occupancy | Paper filing vs in-orbit vs non-US operating |

## History

`npm run seed:valuations` writes 30 daily snapshots per slot into `data/terminal.db`. Until a real daily job exists, those points are a **deterministic model path** (smooth drift from the current v0 point), labeled `backfill` even when read back from SQLite — not observed trades. Re-run the seed after ingest or model changes. The sparkline is **not on the default Terminal**; it sits behind Experimental disclosure as “MODEL BACKFILL — not trades.”

## What v0 is not

- Not a live bid/ask or last trade
- Not an ITU deed or FCC license valuation
- Not advice to buy, lease, or file
- Simulated capacity books are Experimental, labeled SIMULATED, derived from the same midpoint + congestion, and are not on the default Terminal first screen
