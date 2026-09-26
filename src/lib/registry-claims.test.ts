import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { slots as curatedSlots } from "@/data/orbital-slots";
import { lonToSlug, mergeWithUcs } from "./satellites";
import { buildSlotTerminal } from "./slot-terminal";
import { collapseUcsClaimSlots, pickClaimOperator, type UcsClaimSatellite } from "./registry-claims";

function sat(partial: Partial<UcsClaimSatellite> & Pick<UcsClaimSatellite, "name" | "longitudeGeo">): UcsClaimSatellite {
  return {
    operator: null,
    ownerCountry: null,
    purpose: null,
    detailedPurpose: null,
    launchDate: null,
    launchVehicle: null,
    cosparId: null,
    noradId: null,
    comments: null,
    users: null,
    ...partial,
  };
}

describe("UCS claim collapse", () => {
  it("keeps one row per 0.1° slug and does not invent an operator from a launch vehicle", () => {
    const rows = collapseUcsClaimSlots(
      [
        sat({ name: "SES-18", longitudeGeo: -103.12, operator: "SES S.A.", noradId: "1", ownerCountry: "Luxembourg" }),
        sat({ name: "SES-20", longitudeGeo: -103.08, operator: "SES S.A.", noradId: "2", ownerCountry: "Luxembourg" }),
        sat({ name: "STPSat-6", longitudeGeo: -111.9, operator: "Atlas 5", launchVehicle: "Atlas 5", noradId: "49817", ownerCountry: "USA" }),
      ],
      new Set(),
    );
    assert.equal(rows.length, 2);
    const ses = rows.find((row) => row.label === "103.1°W");
    assert.ok(ses);
    assert.equal(ses.operator, "SES");
    assert.match(ses.operatorRaw, /SES S\.A\./);
    assert.match(ses.description, /same 0\.1° slug/);
    assert.match(ses.description, /SES-18/);
    assert.match(ses.description, /not merged/);
    assert.equal(ses.ucsCount, 2);

    const stp = rows.find((row) => row.noradIds?.includes("49817"));
    assert.ok(stp);
    assert.equal(stp.operator, "");
    assert.equal(stp.operatorRaw, "Atlas 5");
    assert.match(stp.description, /launch vehicle/);
    assert.doesNotMatch(stp.operator, /Atlas/);
  });

  it("picks the canonical majority and keeps every source string", () => {
    const pick = pickClaimOperator([
      sat({ name: "A", longitudeGeo: -95, operator: "US Air Force" }),
      sat({ name: "B", longitudeGeo: -95, operator: "DoD/US Navy" }),
      sat({ name: "C", longitudeGeo: -95, operator: "Intelsat S.A." }),
    ]);
    assert.equal(pick.display, "US DoD");
    assert.deepEqual(pick.raws, ["DoD/US Navy", "Intelsat S.A.", "US Air Force"]);
  });
});

describe("live registry claims (clarke.db)", () => {
  const rows = mergeWithUcs(curatedSlots);

  it("has one registry row per slug, including the review examples", () => {
    const bySlug = new Map<string, number>();
    for (const row of rows) {
      const slug = lonToSlug(row.longitude);
      bySlug.set(slug, (bySlug.get(slug) ?? 0) + 1);
    }
    const dups = [...bySlug.entries()].filter(([, n]) => n > 1);
    assert.deepEqual(dups, []);

    for (const slug of ["103-1w", "102-7w", "61w", "95w"]) {
      const group = rows.filter((row) => lonToSlug(row.longitude) === slug);
      assert.equal(group.length, 1, slug);
    }
    const ses = rows.find((row) => lonToSlug(row.longitude) === "103-1w");
    const directv = rows.find((row) => lonToSlug(row.longitude) === "102-7w");
    const hispamar = rows.find((row) => lonToSlug(row.longitude) === "61w");
    const dod = rows.find((row) => lonToSlug(row.longitude) === "95w");
    assert.equal(ses?.operator, "SES");
    assert.equal(directv?.operator, "DirecTV");
    assert.equal(hispamar?.operator, "Hispamar");
    assert.equal(dod?.operator, "US DoD");
    assert.ok((hispamar?.ucsCount ?? 0) >= 3);
  });

  it("does not list Atlas 5 as a GEO operator or borrow a neighbor", () => {
    assert.equal(rows.some((row) => row.operator === "Atlas 5"), false);
    const stp = rows.find((row) => row.noradIds?.includes("49817") || /STPSat-6/.test(row.satellite ?? ""));
    assert.ok(stp);
    assert.equal(stp.operator, "");
    assert.match(stp.operatorRaw, /Atlas 5/);
    const model = buildSlotTerminal(lonToSlug(stp.longitude));
    assert.ok(model);
    assert.equal(model.operator, "");
    assert.match(model.operatorRaw, /Atlas 5/);
  });
});
