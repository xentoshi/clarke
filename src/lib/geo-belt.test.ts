import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  beltCaption,
  selectTickLabels,
  beltDisputeClass,
  beltReaderModel,
  beltTicks,
  formatBeltEpoch,
  formatDisputeDetail,
  isTleBeltMark,
  matchRegistrySlot,
  panLongitudeWindow,
  parseBeltWindow,
  placeBeltMarks,
  projectLongitude,
  stepBeltSelection,
  unprojectLongitude,
  beltFilterWindow,
  windowAround,
  zoomLongitudeWindow,
  type BeltMark,
} from "./geo-belt";
import { GeoBeltMap } from "@/components/belt/GeoBeltMap";

const EM_DASH = "\u2014";
const EN_DASH = "\u2013";

describe("GEO belt projection", () => {
  it("maps longitude onto a flat west-to-east axis", () => {
    assert.equal(projectLongitude(-179, 360), 1);
    assert.equal(projectLongitude(0, 360), 180);
    assert.equal(projectLongitude(180, 360), 360);
    assert.equal(projectLongitude(-101, 360), 79);
  });

  it("round-trips a longitude through the visible window", () => {
    const width = 1000;
    const lonMin = -110;
    const lonMax = -90;
    const x = projectLongitude(-100.98, width, lonMin, lonMax);
    const back = unprojectLongitude(x, width, lonMin, lonMax);
    assert.ok(Math.abs(back - -100.98) < 1e-9);
  });

  it("zooms toward an anchor and stays inside the belt", () => {
    const zoomed = zoomLongitudeWindow({ min: -180, max: 180 }, -101, 0.5);
    assert.ok(zoomed.max - zoomed.min < 360);
    assert.ok(zoomed.min >= -180 && zoomed.max <= 180);
    const before = (-101 - -180) / 360;
    const ratio = (-101 - zoomed.min) / (zoomed.max - zoomed.min);
    assert.ok(Math.abs(ratio - before) < 0.02);

    const edge = zoomLongitudeWindow({ min: -180, max: 180 }, -180, 0.1);
    assert.equal(edge.min, -180);
    assert.ok(edge.max <= 180);

    const panned = panLongitudeWindow({ min: -10, max: 10 }, -40);
    assert.equal(panned.min, -50);
    assert.equal(panned.max, -30);
    const stuck = panLongitudeWindow({ min: -180, max: -160 }, -30);
    assert.equal(stuck.min, -180);
  });

  it("rejects a window that is not a real belt span", () => {
    assert.equal(parseBeltWindow("-105", "-95")?.min, -105);
    assert.equal(parseBeltWindow("-0.2", "0.2"), null);
    assert.equal(parseBeltWindow("10", "5"), null);
    assert.equal(parseBeltWindow("nope", "12"), null);
    assert.deepEqual(windowAround(171.5, 8).min, 167.5);
  });
});

describe("GEO belt dispute class", () => {
  it("keeps disputed birds in a separate class and drops UCS fallback", () => {
    assert.equal(beltDisputeClass(false), "tle");
    assert.equal(beltDisputeClass(true), "disputed");
    assert.equal(isTleBeltMark({ positionSource: "tle", longitudeGeo: -101, tleUsable: true }), true);
    assert.equal(isTleBeltMark({ positionSource: "ucs", longitudeGeo: -139, tleUsable: false }), false);
    assert.equal(isTleBeltMark({ positionSource: "tle", longitudeGeo: null, tleUsable: true }), false);
    assert.equal(isTleBeltMark({ positionSource: "tle", longitudeGeo: 10, tleUsable: false }), false);
    assert.equal(isTleBeltMark({ positionSource: "none", longitudeGeo: null, tleUsable: false }), false);
  });

  it("matches only a registry slot already inside the co-location window", () => {
    const slots = [
      { id: "curated-101", slug: "101w", longitude: -101 },
      { id: "ucs-100-6", slug: "100-6w", longitude: -100.6 },
      { id: "far", slug: "20e", longitude: 20 },
    ];
    const hit = matchRegistrySlot(-100.98, slots, 0.4);
    assert.equal(hit?.slug, "101w");
    assert.equal(matchRegistrySlot(50, slots, 0.4), null);
    assert.equal(matchRegistrySlot(-100.98, [], 0.4), null);

    const tied = matchRegistrySlot(0, [
      { id: "b", slug: "b", longitude: 0 },
      { id: "a", slug: "a", longitude: 0 },
    ], 0.4);
    assert.equal(tied?.slug, "a");
  });
});

describe("GEO belt layout and copy", () => {
  it("stacks overlapping longitudes without moving them", () => {
    const placed = placeBeltMarks(
      [
        { id: "a", longitude: -101 },
        { id: "b", longitude: -100.99 },
        { id: "c", longitude: 20 },
      ],
      { width: 360, lonMin: -180, lonMax: 180, minGapPx: 4, maxLanes: 4 },
    );
    const a = placed.find((p) => p.id === "a");
    const b = placed.find((p) => p.id === "b");
    const c = placed.find((p) => p.id === "c");
    assert.ok(a && b && c);
    assert.equal(a.longitude, -101);
    assert.equal(b.longitude, -100.99);
    assert.notEqual(a.lane, b.lane);
    assert.equal(c.lane, 0);
    assert.equal(placed.find((p) => p.longitude === 400), undefined);
  });

  it("writes the honesty sentence without an em dash", () => {
    const epoch = formatBeltEpoch(["2026-09-21", "2026-09-09 00:00:00", null]);
    assert.equal(epoch, "2026-09-09 to 2026-09-21");
    const caption = beltCaption(epoch!);
    assert.equal(
      caption,
      "Positions from Space-Track TLE as of 2026-09-09 to 2026-09-21 · catalog names from UCS · not an ITU assignment.",
    );
    assert.equal(caption.includes(EM_DASH), false);
    assert.equal(caption.includes(EN_DASH), false);
    const detail = formatDisputeDetail(88.4, -100.1);
    assert.match(detail ?? "", /UCS catalog/);
    assert.equal((detail ?? "").includes(EM_DASH), false);
  });

  it("steps selection along longitude order", () => {
    assert.equal(stepBeltSelection(["a", "b", "c"], "b", 1), "c");
    assert.equal(stepBeltSelection(["a", "b", "c"], "a", -1), "a");
    assert.equal(stepBeltSelection(["a", "b"], null, 1), "a");
  });

  it("renders a mark as a link to an existing slot", () => {
    const mark: BeltMark = {
      id: "norad-36516",
      name: "SES-1 (AMC-4R)",
      longitude: -100.98,
      operator: "SES S.A.",
      dispute: "tle",
      deltaDeg: 0.02,
      ucsLongitude: -101,
      epoch: "2026-09-21",
      slug: "101w",
      slotId: "101w",
      slotLabel: "101°W",
    };
    const disputed: BeltMark = {
      ...mark,
      id: "norad-39206",
      name: "MUOS-2",
      longitude: 171.5,
      operator: "DoD/US Navy",
      dispute: "disputed",
      deltaDeg: 88.4,
      ucsLongitude: -100.1,
      slug: "171-5e",
      slotId: "ucs-39206",
      slotLabel: "171.5°E",
    };
    const html = renderToStaticMarkup(
      createElement(GeoBeltMap, {
        marks: [mark, disputed],
        variant: "strip",
        epochFallback: "2026-09-21",
        mapHref: "/orbital/map",
        initialMarkId: "norad-39206",
      }),
    );
    assert.match(html, /href="\/orbital\/171-5e"/);
    assert.match(html, /href="\/orbital\/101w"/);
    assert.match(html, /data-dispute="disputed"/);
    assert.match(html, /data-dispute="tle"/);
    assert.match(html, /UCS disagrees/);
    assert.match(html, /not an ITU assignment/);
    assert.match(html, /Full belt/);
    assert.equal(html.includes(EM_DASH), false);
    assert.equal(html.includes(EN_DASH), false);
    const reader = beltReaderModel(disputed);
    assert.equal(reader.slotHref, "/orbital/171-5e");
    assert.match(reader.disputeDetail ?? "", /88\.40°/);
  });
});

describe("registry strip longitude window", () => {
  it("selects a tight cluster around a clicked mark and a 30° arc in empty longitude", () => {
    const cluster = beltFilterWindow([-103.2, -103.05, -102.4, -40], -103.1);
    assert.ok(cluster.min <= -103.2);
    assert.ok(cluster.max >= -102.4);
    assert.ok(cluster.max - cluster.min < 8);

    const arc = beltFilterWindow([-103, -40], 10);
    assert.equal(arc.min, 0);
    assert.equal(arc.max, 30);
  });
});

describe("belt ticks", () => {
  it("places degree ticks on the open interval and keeps 0", () => {
    const ticks = beltTicks(-180, 180);
    assert.ok(ticks.some((t) => t.lon === 0 && t.major));
    assert.ok(ticks.some((t) => t.lon === 180));
    assert.equal(ticks.some((t) => t.lon <= -180), false);
    assert.ok(ticks.length < 30);
  });

  it("drops degree labels that would collide", () => {
    const ticks = [
      { lon: -105, major: true },
      { lon: -104, major: false },
      { lon: -103, major: false },
      { lon: -100, major: true },
    ];
    const labeled = selectTickLabels(ticks, (lon) => (lon + 105) * 10, 48, true);
    assert.equal(labeled.has(-105), true);
    assert.equal(labeled.has(-100), true);
    assert.equal(labeled.has(-104), false);
  });
});
