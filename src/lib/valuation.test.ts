import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { coverageProxy } from "./coverage-proxy";
import { occupancyQuality } from "./occupancy-quality";
import { valuateSlot, formatMoney, licenseSignal } from "./valuation";
import { synthesizeHistory } from "./valuation-history";
import type { OrbitalSlot } from "@/data/orbital-slots";
import type { CongestionData } from "./satellites";

const emptyCongestion: CongestionData = {
  density: 2,
  score: 40,
  tier: "moderate",
  label: "Moderate",
  factors: { coLocated: 2, neighborhood: 4, distinctOperators: 2, dominantOperator: "SES", dominantShare: 0.5 },
};

const sample: OrbitalSlot = {
  id: "101w",
  longitude: -101,
  label: "101°W",
  operator: "SES",
  country: "USA",
  bands: ["C", "Ku"],
  status: "active",
  coverage: ["North America"],
  valueEstimate: "$350M+",
  description: "test",
  source: "curated",
  users: "Commercial",
};

describe("coverageProxy", () => {
  it("maps 101W into the North America band with a high GDP index", () => {
    const c = coverageProxy(-101);
    assert.equal(c.band.id, "n-am");
    assert.ok(c.gdpIndex > 1.4);
    assert.ok(c.multiplier > 1);
  });

  it("maps a Pacific longitude to a thin-demand band", () => {
    const c = coverageProxy(170);
    assert.equal(c.band.id, "pacific");
    assert.ok(c.multiplier < 1);
  });
});

describe("occupancyQuality", () => {
  it("treats missing lifetime as a 1.0 multiplier", () => {
    const q = occupancyQuality([{ launchDate: "1/1/2010", expectedLifetimeYears: null }]);
    assert.equal(q.multiplier, 1);
    assert.equal(q.meanYearsRemaining, null);
  });

  it("discounts a fleet past UCS expected life", () => {
    const q = occupancyQuality(
      [{ launchDate: "1/1/2000", expectedLifetimeYears: 15 }],
      new Date("2026-01-01T00:00:00Z"),
    );
    assert.ok(q.meanYearsRemaining !== null && q.meanYearsRemaining < 0);
    assert.ok(q.multiplier < 1);
  });
});

describe("licenseSignal", () => {
  it("flags paper filings when FCC exists without satellites", () => {
    const s = licenseSignal({ status: "filed", fccLicensed: true, satCount: 0 });
    assert.equal(s.biuHint, "paper_filing");
    assert.ok(s.multiplier < 1);
  });

  it("flags brought-into-use when FCC + sats coincide", () => {
    const s = licenseSignal({ status: "active", fccLicensed: true, satCount: 3 });
    assert.equal(s.biuHint, "brought_into_use");
    assert.ok(s.multiplier > 1);
  });
});

describe("valuateSlot v0", () => {
  it("returns a range, confidence, model version, and additive drivers", () => {
    const v = valuateSlot(sample, emptyCongestion, {
      satellites: [{ launchDate: "6/1/2010", expectedLifetimeYears: 15 }],
      fccLicensed: true,
      satCount: 2,
      asOf: new Date("2026-01-01T00:00:00Z"),
    });
    assert.ok(v.point > 0);
    assert.ok(v.low < v.point && v.high > v.point);
    assert.equal(v.modelVersion, "v0");
    assert.equal(v.confidence, "high");
    assert.ok(v.factors.some((f) => f.label === "Coverage (GDP/pop)"));
    assert.ok(v.factors.some((f) => f.label === "License / BIU"));
    assert.match(v.disclaimer, /not a live market price/);
  });

  it("does not present commercial confidence for government-only users", () => {
    const v = valuateSlot({ ...sample, users: "Military", source: "ucs" }, emptyCongestion, { satCount: 2 });
    assert.equal(v.nonCommercial, true);
    assert.equal(v.confidence, "low");
  });

  it("formats money in compact USD", () => {
    assert.equal(formatMoney(30_000_000), "$30M");
  });
});

describe("synthesizeHistory", () => {
  it("emits a dated series ending at as-of and labels it backfill", () => {
    const v = valuateSlot(sample, emptyCongestion, { satCount: 2, fccLicensed: true });
    const hist = synthesizeHistory("101w", v, 10, new Date("2026-09-15T00:00:00Z"));
    assert.equal(hist.length, 10);
    assert.equal(hist[hist.length - 1].asOf, "2026-09-15");
    assert.equal(hist[hist.length - 1].point, v.point);
    assert.equal(hist[0].source, "backfill");
  });
});
