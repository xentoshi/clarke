import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  FCC_STALE_AFTER_DAYS,
  ageDaysFrom,
  fccIsStale,
  parseFccSheetVintage,
  slotSourceVintage,
  ucsVintageFromLaunchDates,
} from "./source-vintage";

describe("FCC / UCS / TLE source vintage", () => {
  it("parses the SSAL workbook sheet name into an as-of date", () => {
    assert.equal(parseFccSheetVintage("Updated 30 April 2026"), "2026-04-30");
    assert.equal(parseFccSheetVintage("Sheet1"), null);
  });

  it("treats FCC as stale after N days from workbook vintage, not ingest clock", () => {
    const now = new Date("2026-09-15T00:00:00Z");
    assert.equal(FCC_STALE_AFTER_DAYS, 14);
    assert.equal(fccIsStale("2026-04-30", now), true);
    assert.equal(fccIsStale("2026-09-10", now), false);
    assert.equal(ageDaysFrom("2026-04-30", now), 138);
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
  });
});
