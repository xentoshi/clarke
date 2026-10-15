import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { slots as curatedSlots } from "@/data/orbital-slots";
import { agentPayloadViolations, buildAgentSlot } from "./agent-slot";
import { densestBySatelliteCount } from "./densest";
import { isDodPlaceholderAuthorization } from "./fcc-placeholder";
import { isStationKeptPostUcsPayload, loadPostUcsGeoOccupants, ucsFileVintageIso } from "./post-ucs-occupancy";
import { reconcileRegistryStatus } from "./slot-status";
import { getGeoSatellites, lonToSlug, mergeWithUcs } from "./satellites";

describe("registry status", () => {
  it("does not keep squatted when a satellite and an FCC row are both present", () => {
    assert.equal(
      reconcileRegistryStatus({ curated: "squatted", occupied: true, fccLicensed: true }),
      "active",
    );
    assert.equal(
      reconcileRegistryStatus({ curated: "inactive", occupied: true, fccLicensed: true }),
      "active",
    );
    assert.equal(
      reconcileRegistryStatus({ curated: "squatted", occupied: true, fccLicensed: false }),
      "squatted",
    );
    assert.equal(
      reconcileRegistryStatus({ curated: "squatted", occupied: false, fccLicensed: false }),
      "filed",
    );
  });
});

describe("densest label", () => {
  it("uses satellite count, not congestion score", () => {
    const rows = [
      { label: "101°W", satCount: 5, congestionScore: 80 },
      { label: "19.2°E", satCount: 9, congestionScore: 40 },
      { label: "72°E", satCount: 9, congestionScore: 99 },
    ];
    assert.equal(densestBySatelliteCount(rows)?.label, "19.2°E");
    assert.equal(densestBySatelliteCount([]), null);
  });
});

describe("post-UCS occupancy gate", () => {
  const vintage = "2023-04-07";
  const base = {
    noradId: "56371",
    launchDate: "2023-05-01",
    periodMin: 1436.1,
    objectType: "PAYLOAD",
    decayDate: null,
    current: "Y",
    noradInUcs: false,
  };

  it("accepts a station-kept payload launched after the UCS vintage", () => {
    assert.equal(isStationKeptPostUcsPayload(base, vintage), true);
  });

  it("rejects drifting periods, earlier launches, UCS rows, and debris", () => {
    assert.equal(isStationKeptPostUcsPayload({ ...base, periodMin: 1446 }, vintage), false);
    assert.equal(isStationKeptPostUcsPayload({ ...base, periodMin: 1431 }, vintage), false);
    assert.equal(isStationKeptPostUcsPayload({ ...base, launchDate: "2023-04-07" }, vintage), false);
    assert.equal(isStationKeptPostUcsPayload({ ...base, noradInUcs: true }, vintage), false);
    assert.equal(isStationKeptPostUcsPayload({ ...base, objectType: "DEBRIS" }, vintage), false);
    assert.equal(isStationKeptPostUcsPayload({ ...base, decayDate: "2024-01-01" }, vintage), false);
  });
});

describe("DoD reservation placeholders", () => {
  it("recognizes the SSAL reserved-federal licensee and nothing else", () => {
    assert.equal(isDodPlaceholderAuthorization({ licensee: "Federal Government (Reserved)" }), true);
    assert.equal(isDodPlaceholderAuthorization({ licensee: "Intelsat License LLC" }), false);
    assert.equal(isDodPlaceholderAuthorization({ licensee: "US Air Force" }), false);
  });
});

describe("live registry trust (clarke.db)", () => {
  const rows = mergeWithUcs(curatedSlots);

  it("shows 45W and 169E as on station, not squatted", () => {
    const w45 = rows.find((row) => row.id === "45w");
    const e169 = rows.find((row) => row.id === "169e");
    assert.equal(w45?.status, "active");
    assert.equal(e169?.status, "active");
    assert.match(w45?.description ?? "", /Intelsat 14/);
    assert.match(e169?.description ?? "", /Horizons 3e/);
    assert.doesNotMatch(`${w45?.status} ${e169?.status}`, /squatted/);
  });

  it("includes station-kept satellites launched after the UCS vintage in occupancy", () => {
    assert.equal(ucsFileVintageIso(), "2023-04-07");
    const added = loadPostUcsGeoOccupants(new Set(getGeoSatellites().filter((s) => s.catalogSource !== "tle-supplement").map((s) => s.noradId).filter((id): id is string => Boolean(id))));
    assert.ok(added.length >= 70 && added.length <= 76, `expected about 73, got ${added.length}`);
    assert.ok(added.some((s) => /ARCTURUS/i.test(s.name)));
    assert.ok(added.every((s) => s.catalogSource === "tle-supplement"));
    assert.ok(added.every((s) => s.longitudeGeo !== null && s.positionSource === "tle"));
    const geo = getGeoSatellites();
    assert.ok(geo.some((s) => s.noradId === "56371" && s.catalogSource === "tle-supplement"));
  });

  it("does not list Federal Government reservation rows", () => {
    assert.equal(
      rows.some((row) => /federal government \(reserved\)/i.test(row.operator) || /federal government \(reserved\)/i.test(row.operatorRaw ?? "")),
      false,
    );
    const fccOnly = rows.filter((row) => row.source === "fcc");
    assert.ok(fccOnly.length < 15, `empty licensed rows still ${fccOnly.length}`);
    for (const row of fccOnly) {
      assert.match(row.description, /not a count of unlaunched satellites/);
      assert.doesNotMatch(row.description, /in orbit here yet/);
    }
  });

  it("keeps valuation and congestion out of the default agent payload", () => {
    for (const slug of ["45w", "169e", "101w"]) {
      const agent = buildAgentSlot(slug);
      assert.ok(agent, slug);
      assert.deepEqual(agentPayloadViolations(agent), []);
      assert.equal("valuation" in agent, false);
      assert.equal("congestion" in agent, false);
    }
    const w45 = buildAgentSlot("45w");
    assert.equal(w45?.status, "active");
    assert.ok((w45?.satCount ?? 0) > 0);
    const e169 = buildAgentSlot("169e");
    assert.equal(e169?.status, "active");
    assert.ok((e169?.satCount ?? 0) > 0);
    assert.equal(lonToSlug(-45), "45w");
  });
});
