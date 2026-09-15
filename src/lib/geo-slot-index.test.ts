import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildGeoSlotIndex, GEO_SLOT_INDEX_SLUGS } from "./geo-slot-index";

describe("GEO Slot Index #1", () => {
  const edition = buildGeoSlotIndex();

  it("publishes five worked dossiers from live occupancy + FCC fields", () => {
    assert.equal(edition.edition, 1);
    assert.deepEqual(edition.dossiers.map((d) => d.slug), [...GEO_SLOT_INDEX_SLUGS]);
    for (const d of edition.dossiers) {
      assert.ok(d.label);
      assert.ok(d.ucsFileVintage);
      assert.ok(d.fccAsOf);
    }
  });

  it("treats 101°W occupancy enter/leave as TLE vs UCS, not prices", () => {
    const d = edition.dossiers.find((x) => x.slug === "101w");
    assert.ok(d);
    assert.ok(d.satCount >= 1);
    assert.ok(d.left.some((m) => /DirecTV/i.test(m.name)));
    assert.ok(d.entered.some((m) => /JCSat/i.test(m.name)));
    assert.ok(d.disputeFlips.some((f) => /JCSat/i.test(f.name)));
    assert.ok(d.fccRows.length >= 1);
  });

  it("includes a paper/empty FCC filing slot with no occupancy", () => {
    const d = edition.dossiers.find((x) => x.slug === "163w");
    assert.ok(d);
    assert.equal(d.satCount, 0);
    assert.equal(d.paperFiling, true);
    assert.ok(d.fccRows.length >= 1);
    assert.equal(d.tleEpochMax, null);
  });

  it("does not use valuation as the Index headline fields", () => {
    const json = JSON.stringify(edition);
    assert.doesNotMatch(json, /prices rose/i);
    assert.doesNotMatch(json, /\$350M/);
  });
});
