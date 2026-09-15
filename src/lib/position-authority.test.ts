import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  resolveOccupancyPosition,
  buildSlotPositionTrust,
  POSITION_DISPUTE_DEG,
  COLOCATION_WINDOW_DEG,
  type OccupancyPosition,
} from "./position-authority";
import { circularAbsDiffDeg, withinLongitudeWindow, formatLonFixed } from "./geo-angle";

const ingest = "2026-09-15 11:52:32";
const asOf = new Date("2026-09-15T12:00:00Z");

function tleOk(over: Partial<Parameters<typeof resolveOccupancyPosition>[0]> = {}): OccupancyPosition {
  return resolveOccupancyPosition({
    ucsLongitude: -101,
    tleLongitude: -100.98,
    tleEpoch: "2026-09-15",
    tleIngestedAt: ingest,
    tleMeanMotion: 1.0027,
    tleEccentricity: 0.00025,
    objectType: "PAYLOAD",
    decayDate: null,
    current: "Y",
    asOf,
    ...over,
  });
}

describe("resolveOccupancyPosition", () => {
  it("prefers a fresh GEO-payload TLE over a matching UCS longitude (SES-1 class)", () => {
    const p = tleOk();
    assert.equal(p.source, "tle");
    assert.equal(p.tleUsable, true);
    assert.ok(p.occupancyLongitude !== null);
    assert.ok(circularAbsDiffDeg(p.occupancyLongitude, -101) < COLOCATION_WINDOW_DEG);
    assert.equal(p.disputed, false);
    assert.ok((p.deltaDeg ?? 99) < POSITION_DISPUTE_DEG);
  });

  it("flags MUOS-2-class UCS/TLE disagreement and occupies at the TLE longitude", () => {
    const p = tleOk({
      ucsLongitude: -100.1,
      tleLongitude: 172.05,
      tleEccentricity: 0.0057,
      tleMeanMotion: 1.0025,
    });
    assert.equal(p.source, "tle");
    assert.equal(p.disputed, true);
    assert.ok((p.deltaDeg ?? 0) > 10);
    assert.ok(p.occupancyLongitude !== null);
    assert.ok(circularAbsDiffDeg(p.occupancyLongitude, 172.05) < 0.01);
    assert.ok(!withinLongitudeWindow(p.occupancyLongitude, -101, COLOCATION_WINDOW_DEG));
  });

  it("falls back to UCS when no TLE longitude exists", () => {
    const p = tleOk({ tleLongitude: null, tleEpoch: null });
    assert.equal(p.source, "ucs");
    assert.equal(p.occupancyLongitude, -101);
    assert.equal(p.tleUsable, false);
    assert.equal(p.disputed, false);
  });

  it("does not occupy at UCS 0° when that value is a placeholder and no TLE exists", () => {
    const p = tleOk({ ucsLongitude: 0, tleLongitude: null, tleEpoch: null });
    assert.equal(p.source, "none");
    assert.equal(p.occupancyLongitude, null);
  });

  it("still uses a TLE near 0°E rather than inventing or keeping the UCS placeholder", () => {
    const p = tleOk({ ucsLongitude: 0, tleLongitude: 0.12 });
    assert.equal(p.source, "tle");
    assert.equal(p.occupancyLongitude, 0.12);
  });

  it("does not move debris / rocket bodies / unknown satcat types onto a TLE longitude", () => {
    const debris = tleOk({ objectType: "DEBRIS", tleLongitude: 40 });
    assert.equal(debris.source, "ucs");
    assert.equal(debris.occupancyLongitude, -101);
    assert.equal(debris.tleUsable, false);
    assert.equal(debris.tleRejectReason, "object_type_debris");

    const rb = tleOk({ objectType: "ROCKET BODY", tleLongitude: 40 });
    assert.equal(rb.source, "ucs");
    assert.equal(rb.tleUsable, false);
  });

  it("does not use a TLE for a decayed object", () => {
    const p = tleOk({ decayDate: "2024-01-01", tleLongitude: 12 });
    assert.equal(p.tleUsable, false);
    assert.equal(p.tleRejectReason, "decayed");
    assert.equal(p.source, "ucs");
  });

  it("rejects element sets outside GEO eccentricity / mean-motion gates", () => {
    const ecc = tleOk({ tleEccentricity: 0.05, tleLongitude: 10 });
    assert.equal(ecc.tleUsable, false);
    assert.equal(ecc.source, "ucs");
    const mm = tleOk({ tleMeanMotion: 12.5, tleLongitude: 10 });
    assert.equal(mm.tleUsable, false);
  });

  it("rejects a TLE that was already stale when Space-Track ingested it", () => {
    const p = tleOk({
      tleEpoch: "2026-07-01",
      tleIngestedAt: ingest,
      tleLongitude: 50,
    });
    assert.equal(p.tleUsable, false);
    assert.equal(p.tleRejectReason, "tle_stale_at_ingest");
    assert.equal(p.source, "ucs");
  });

  it("does not interpolate UCS and TLE when they disagree", () => {
    const p = tleOk({ ucsLongitude: -100.1, tleLongitude: 172 });
    assert.equal(p.occupancyLongitude, 172);
    assert.ok(p.occupancyLongitude !== (-100.1 + 172) / 2);
  });
});

describe("buildSlotPositionTrust", () => {
  it("surfaces disputed occupants and UCS ghosts inside the occupancy window", () => {
    const ses1 = {
      name: "SES-1 (AMC-4R)",
      noradId: "36516",
      longitudeUcs: -101,
      longitudeTle: -100.98,
      longitudeGeo: -100.98,
      positionSource: "tle" as const,
      positionDeltaDeg: 0.02,
      positionDisputed: false,
    };
    const ghost = {
      name: "Stale-UCS bird",
      noradId: "99999",
      longitudeUcs: -101.1,
      longitudeTle: 40,
      longitudeGeo: 40,
      positionSource: "tle" as const,
      positionDeltaDeg: 141.1,
      positionDisputed: true,
    };
    const muos = {
      name: "MUOS-2",
      noradId: "39206",
      longitudeUcs: -100.1,
      longitudeTle: 172.1,
      longitudeGeo: 172.1,
      positionSource: "tle" as const,
      positionDeltaDeg: 87.8,
      positionDisputed: true,
    };
    const trust101 = buildSlotPositionTrust(-101, [ses1], [ses1, ghost, muos]);
    assert.equal(trust101.tlePrimaryCount, 1);
    assert.equal(trust101.disputedCount, 0);
    assert.equal(trust101.ucsGhosts.length, 1);
    assert.equal(trust101.ucsGhosts[0].noradId, "99999");

    const trust172 = buildSlotPositionTrust(172.1, [muos], [ses1, ghost, muos]);
    assert.equal(trust172.disputedCount, 1);
    assert.equal(trust172.disputedSatellites[0].name, "MUOS-2");
  });
});

describe("geo-angle", () => {
  it("treats a 179 → −179 move as 2°, not 358°", () => {
    assert.equal(circularAbsDiffDeg(179, -179), 2);
    assert.equal(formatLonFixed(-100.98, 1), "101.0°W");
  });
});
