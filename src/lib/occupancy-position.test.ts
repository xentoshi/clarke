import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getGeoSatellites, getGeoSatellitesByLongitude, COLOCATION_TOLERANCE_DEG } from "./satellites";
import { circularAbsDiffDeg, withinLongitudeWindow } from "./geo-angle";

describe("live TLE-primary occupancy (clarke.db)", () => {
  it("SES-1 (UCS ≈ TLE) still occupies the 101°W window", () => {
    const ses1 = getGeoSatellites().find((s) => s.noradId === "36516");
    assert.ok(ses1, "SES-1 should be in the GEO catalog");
    assert.equal(ses1.positionSource, "tle");
    assert.equal(ses1.positionDisputed, false);
    assert.ok(ses1.longitudeGeo !== null);
    assert.ok(ses1.longitudeUcs !== null);
    assert.ok(circularAbsDiffDeg(ses1.longitudeUcs, -101) < 0.2);
    assert.ok(withinLongitudeWindow(ses1.longitudeGeo, -101, COLOCATION_TOLERANCE_DEG));

    const window = getGeoSatellitesByLongitude(-101, COLOCATION_TOLERANCE_DEG);
    assert.ok(window.some((s) => s.noradId === "36516"));
  });

  it("MUOS-2 occupies at TLE ~172°E, not UCS 100.1°W, and is flagged disputed", () => {
    const muos = getGeoSatellites().find((s) => s.noradId === "39206");
    assert.ok(muos, "MUOS-2 should be in the GEO catalog");
    assert.ok(muos.longitudeUcs !== null);
    assert.ok(circularAbsDiffDeg(muos.longitudeUcs, -100.1) < 0.2);
    assert.equal(muos.positionSource, "tle");
    assert.equal(muos.positionDisputed, true);
    assert.ok((muos.positionDeltaDeg ?? 0) > 10);
    assert.ok(muos.longitudeGeo !== null);
    assert.ok(withinLongitudeWindow(muos.longitudeGeo, 172, 5));
    assert.ok(!withinLongitudeWindow(muos.longitudeGeo, -101, COLOCATION_TOLERANCE_DEG));
    assert.ok(!withinLongitudeWindow(muos.longitudeGeo, -100.1, COLOCATION_TOLERANCE_DEG));

    const atUcs = getGeoSatellitesByLongitude(-100.1, COLOCATION_TOLERANCE_DEG);
    assert.ok(!atUcs.some((s) => s.noradId === "39206"));
    const atTle = getGeoSatellitesByLongitude(muos.longitudeGeo, COLOCATION_TOLERANCE_DEG);
    assert.ok(atTle.some((s) => s.noradId === "39206"));
  });
});
