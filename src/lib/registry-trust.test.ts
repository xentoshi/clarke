import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { slots as curatedSlots } from "@/data/orbital-slots";
import { agentPayloadViolations, buildAgentSlot } from "./agent-slot";
import { densestBySatelliteCount } from "./densest";
import { buildExplorerRows } from "./explorer";
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

  it("applies the audited occupancy counts and lets densest follow satCount", () => {
    const absent = (slug: string, count: number, names: RegExp[]) => {
      const agent = buildAgentSlot(slug);
      assert.ok(agent, slug);
      assert.equal(agent.satCount, count, slug);
      assert.equal(agent.occupancy.length, count, slug);
      assert.deepEqual(agentPayloadViolations(agent), []);
      assert.equal("valuation" in agent, false);
      assert.equal("congestion" in agent, false);
      for (const name of names) {
        assert.equal(agent.occupancy.some((row) => name.test(row.name)), false, name.source);
      }
    };
    absent("101w", 3, [/MSAT/i]);
    absent("45w", 1, [/Intelsat 1R/i]);
    absent("169e", 1, [/Fengyun/i]);
    // The 2026-10-17 refresh places Express-AM33 (NORAD 32478) at -1.37,
    // 0.37 degrees from 1W, with mean motion 1.00250657. That is station-kept
    // and inside the window, so 1W is 6 after the three drifters leave.
    absent("1w", 6, [/Astra 1G/i, /Skynet 4C/i, /DSP 20/i]);

    const one = buildAgentSlot("1w");
    assert.ok(one);
    assert.ok(one.occupancy.some((row) => row.noradId === "32478"));
    const mev = one.occupancy.find((row) => row.noradId === "46113");
    assert.ok(mev);
    assert.equal(mev.role, "servicing");
    assert.equal(mev.slotHolder, false);
    assert.equal(mev.attachedToNoradId, "28358");
    assert.equal(mev.attachmentBasis, "identical_element_set");
    assert.equal(one.operatorMix.some((share) => share.operator === "Space Logistics LLC"), false);
    assert.ok(one.operatorMix.some((share) => share.operator === "Space Norway"));
    const sesAt1w = one.operatorMix.find((share) => share.operator === "SES");
    assert.match(sesAt1w?.notes ?? "", /Former name Intelsat/);
    assert.match(sesAt1w?.notes ?? "", /17 July 2025/);
    assert.equal(one.country, "");

    const west = buildAgentSlot("101w");
    assert.equal(west?.country, "");
    const mid = buildAgentSlot("45w");
    assert.equal(mid?.occupancy[0]?.operator, "SES");
    assert.match(mid?.operatorMix[0]?.notes ?? "", /17 July 2025/);
    assert.equal(mid?.country, "USA");
    const pacific = buildAgentSlot("169e");
    assert.equal(pacific?.occupancy[0]?.operator, "Horizons-3 Satellite LLC");
    assert.equal(pacific?.country, "USA/Japan");

    const rows = buildExplorerRows();
    const densest = densestBySatelliteCount(rows);
    const max = Math.max(...rows.map((row) => row.satCount));
    assert.equal(densest?.satCount, max);
    assert.equal(densest?.label, rows.find((row) => row.satCount === max)?.label);
    assert.equal(densest?.label, "128.2°E");
    assert.equal(densest?.satCount, 7);
    assert.equal(rows.find((row) => row.slug === "1w")?.satCount, 6);
    assert.equal(rows.find((row) => row.slug === "101w")?.satCount, 3);
    assert.equal(rows.find((row) => row.slug === "45w")?.satCount, 1);
    assert.equal(rows.find((row) => row.slug === "169e")?.satCount, 1);
  });
});
