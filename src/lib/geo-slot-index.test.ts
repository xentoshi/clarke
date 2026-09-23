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
    assert.ok(d.left.length >= 1);
    // Enter and in-window dispute-flip counts move with the TLE snapshot.
    // This edition's 101°W signal is leave: UCS still lists birds whose TLE left.
    assert.ok(d.entered.length + d.left.length >= 1);
    assert.ok(d.fccRows.length >= 1);
    const json = JSON.stringify(d);
    assert.doesNotMatch(json, /prices rose/i);
  });

  it("includes an FCC filing slot in the Index set (163°W)", () => {
    const d = edition.dossiers.find((x) => x.slug === "163w");
    assert.ok(d);
    assert.ok(d.fccRows.length >= 1);
    if (d.satCount === 0) {
      assert.equal(d.paperFiling, true);
      assert.equal(d.tleEpochMax, null);
    } else {
      assert.equal(d.paperFiling, false);
    }
  });

  it("does not use valuation as the Index headline fields", () => {
    const json = JSON.stringify(edition);
    assert.doesNotMatch(json, /prices rose/i);
    assert.doesNotMatch(json, /\$350M/);
  });
});
