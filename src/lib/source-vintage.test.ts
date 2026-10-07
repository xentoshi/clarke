import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  FCC_STALE_AFTER_DAYS,
  TLE_STALE_AFTER_DAYS,
  ageDaysFrom,
  fccIsStale,
  occupancyTleIsStale,
  parseFccSheetVintage,
  slotSourceVintage,
  tleIsStale,
  ucsVintageFromLaunchDates,
} from "./source-vintage";

describe("FCC / UCS / TLE source vintage", () => {
  it("parses the SSAL workbook sheet name into an as-of date", () => {
    assert.equal(parseFccSheetVintage("Updated 30 April 2026"), "2026-04-30");
    assert.equal(parseFccSheetVintage("Updated 27 September 2026"), "2026-09-27");
    assert.equal(parseFccSheetVintage("Sheet1"), null);
  });

  it("treats FCC as stale after N days from workbook vintage, not ingest clock", () => {
    const now = new Date("2026-09-15T00:00:00Z");
    assert.equal(FCC_STALE_AFTER_DAYS, 14);
    assert.equal(fccIsStale("2026-04-30", now), true);
    assert.equal(fccIsStale("2026-09-10", now), false);
    assert.equal(ageDaysFrom("2026-04-30", now), 138);
    const refreshDay = new Date("2026-10-02T00:00:00Z");
    assert.equal(ageDaysFrom("2026-09-27", refreshDay), 5);
    assert.equal(fccIsStale("2026-09-27", refreshDay), false);
  });

  it("approximates UCS file vintage from latest GEO launch in the snapshot", () => {
    assert.equal(ucsVintageFromLaunchDates(["11/14/10", "3/17/23", "4/7/95"]), "2023-03-17");
  });

  it("surfaces TLE epoch range on the slot vintage block", () => {
    const v = slotSourceVintage(
      [{ tleEpoch: "2026-09-14" }, { tleEpoch: "2026-09-15" }, { tleEpoch: null }],
      [
        { source: "UCS", lastRun: "2026-09-15 11:47:37", fileVintage: "2023-05-01", sourceAsOf: "2023-05-01", tleEpochMin: null, tleEpochMax: null },
        { source: "FCC-SSAL", lastRun: "2026-08-25 04:30:24", fileVintage: "2026-04-30", sourceAsOf: "2026-04-30", tleEpochMin: null, tleEpochMax: null },
        { source: "Space-Track TLE", lastRun: "2026-09-15 11:52:32", fileVintage: "2026-09-15", sourceAsOf: "2026-09-15", tleEpochMin: "2026-05-14", tleEpochMax: "2026-09-15" },
      ],
      new Date("2026-09-15T12:00:00Z"),
    );
    assert.equal(v.ucsFileVintage, "2023-05-01");
    assert.equal(v.fccAsOf, "2026-04-30");
    assert.equal(v.fccStale, true);
    assert.equal(v.tleEpochMin, "2026-09-14");
    assert.equal(v.tleEpochMax, "2026-09-15");
    assert.equal(v.tleStale, false);
    assert.equal(v.tleStaleAfterDays, 14);
  });

  it("does not copy fleet-wide TLE epochs onto an empty occupancy window", () => {
    const v = slotSourceVintage(
      [],
      [
        { source: "Space-Track TLE", lastRun: "2026-09-15 11:52:32", fileVintage: "2026-09-15", sourceAsOf: "2026-09-15", tleEpochMin: "2026-05-14", tleEpochMax: "2026-09-15" },
      ],
      new Date("2026-09-15T12:00:00Z"),
    );
    assert.equal(v.tleEpochMin, null);
    assert.equal(v.tleEpochMax, null);
    assert.equal(v.tleStale, false);
  });

  it("marks a used TLE stale after 14 days and leaves a fresh epoch unmarked", () => {
    const now = new Date("2026-09-15T00:00:00Z");
    assert.equal(TLE_STALE_AFTER_DAYS, 14);
    assert.equal(ageDaysFrom("2026-09-01", now), 14);
    assert.equal(tleIsStale("2026-09-01", now), false);
    assert.equal(tleIsStale("2026-08-31", now), true);
    assert.equal(tleIsStale("2026-09-10", now), false);
    assert.equal(tleIsStale(null, now), false);
    assert.equal(occupancyTleIsStale("ucs", "2020-01-01", now), false);
    assert.equal(occupancyTleIsStale("none", "2020-01-01", now), false);
    assert.equal(occupancyTleIsStale("tle", "2026-08-01", now), true);
    assert.equal(occupancyTleIsStale("tle", "2026-09-10", now), false);

    const fresh = slotSourceVintage(
      [{ tleEpoch: "2026-09-10", occupancyAuthority: "tle" }],
      [],
      now,
    );
    assert.equal(fresh.tleStale, false);
    assert.equal(fresh.tleEpochMin, "2026-09-10");
    assert.equal(fresh.tleEpochMax, "2026-09-10");

    const stale = slotSourceVintage(
      [{ tleEpoch: "2026-08-01", occupancyAuthority: "tle" }],
      [],
      now,
    );
    assert.equal(stale.tleStale, true);
    assert.equal(stale.tleEpochMax, "2026-08-01");
    assert.equal(stale.tleStaleAfterDays, 14);
  });

  it("does not treat a UCS fallback epoch as the TLE used for occupancy", () => {
    const now = new Date("2026-09-15T12:00:00Z");
    const v = slotSourceVintage(
      [
        { tleEpoch: "2026-09-14", occupancyAuthority: "tle" },
        { tleEpoch: "2020-01-01", occupancyAuthority: "ucs" },
        { tleEpoch: "2019-06-01", occupancyAuthority: "none" },
      ],
      [],
      now,
    );
    assert.equal(v.tleEpochMin, "2026-09-14");
    assert.equal(v.tleEpochMax, "2026-09-14");
    assert.equal(v.tleStale, false);

    const onlyUcs = slotSourceVintage(
      [{ tleEpoch: "2020-01-01", occupancyAuthority: "ucs" }],
      [],
      now,
    );
    assert.equal(onlyUcs.tleEpochMin, null);
    assert.equal(onlyUcs.tleEpochMax, null);
    assert.equal(onlyUcs.tleStale, false);

    const mixedStale = slotSourceVintage(
      [
        { tleEpoch: "2026-09-14", occupancyAuthority: "tle" },
        { tleEpoch: "2026-08-01", occupancyAuthority: "tle" },
        { tleEpoch: "2018-01-01", occupancyAuthority: "ucs" },
      ],
      [],
      now,
    );
    assert.equal(mixedStale.tleEpochMin, "2026-08-01");
    assert.equal(mixedStale.tleEpochMax, "2026-09-14");
    assert.equal(mixedStale.tleStale, true);
  });
});
