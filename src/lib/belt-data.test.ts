import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { slots as curatedSlots } from "@/data/orbital-slots";
import { lonToSlug, mergeWithUcs } from "./satellites";
import { buildGeoBelt } from "./belt-data";
import { buildSlotTerminal } from "./slot-terminal";
import { circularAbsDiffDeg } from "./geo-angle";

const EM_DASH = "\u2014";

describe("GEO belt from clarke.db", () => {
  const belt = buildGeoBelt();
  const slugs = new Set(mergeWithUcs(curatedSlots).map((slot) => lonToSlug(slot.longitude)));

  it("plots TLE-primary occupancy only, and only onto registry slots", () => {
    assert.ok(belt.marks.length > 400);
    assert.equal(belt.unmatched, 0);
    assert.ok(belt.omittedUcs > 0);
    assert.equal(belt.marks.some((m) => m.id === "norad-28187"), false);
    for (const mark of belt.marks) {
      assert.equal(slugs.has(mark.slug), true, mark.slug);
      assert.ok(mark.longitude > -180 && mark.longitude <= 180);
      assert.ok(mark.dispute === "tle" || mark.dispute === "disputed");
    }
  });

  it("puts SES-1 on 101°W and MUOS-2 on its TLE longitude, disputed", () => {
    const ses = belt.marks.find((m) => m.id === "norad-36516");
    assert.ok(ses);
    assert.equal(ses.dispute, "tle");
    assert.equal(ses.slug, "101w");
    assert.ok(circularAbsDiffDeg(ses.longitude, -101) < 0.2);
    assert.equal(ses.operator, "SES S.A.");

    const muos = belt.marks.find((m) => m.id === "norad-39206");
    assert.ok(muos);
    assert.equal(muos.dispute, "disputed");
    assert.equal(muos.slug, "171-5e");
    assert.ok(circularAbsDiffDeg(muos.longitude, 171.5) < 0.2);
    assert.ok(circularAbsDiffDeg(muos.longitude, -100.1) > 10);
    assert.match(muos.slotLabel, /171/);
    assert.ok(buildSlotTerminal(muos.slug));
    assert.ok(buildSlotTerminal("67w"));
  });

  it("states the TLE epoch and does not call the picture an assignment", () => {
    assert.match(belt.epochLabel, /^2026-/);
    assert.match(belt.caption, /Space-Track TLE as of/);
    assert.match(belt.caption, /catalog names from UCS/);
    assert.match(belt.caption, /not an ITU assignment/);
    assert.equal(belt.caption.includes(EM_DASH), false);
  });
});
