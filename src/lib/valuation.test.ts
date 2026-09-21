import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { coverageProxy } from "./coverage-proxy";
import { occupancyQuality, parseUcsLaunchYear } from "./occupancy-quality";
import { valuateSlot, formatMoney, licenseSignal } from "./valuation";
import { synthesizeHistory } from "./valuation-history";
import { summarizeOperators, formatOperatorMix } from "./operator-mix";
import { buildRightsChain } from "./rights-chain";
import type { OrbitalSlot } from "@/data/orbital-slots";
import type { CongestionData } from "./satellites";

const emptyCongestion: CongestionData = {
  density: 2,
  score: 40,
  tier: "moderate",
  label: "Moderate",
  factors: {
    coLocated: 2,
    neighborhood: 4,
    distinctOperators: 2,
    dominantOperator: "SES",
    dominantOperatorRaw: "SES",
    dominantShare: 0.5,
  },
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

  it("parses UCS two-digit launch years instead of dropping remaining life", () => {
    const q = occupancyQuality(
      [
        { launchDate: "11/14/10", expectedLifetimeYears: 15 },
        { launchDate: "4/7/95", expectedLifetimeYears: 10 },
        { launchDate: "6/20/19", expectedLifetimeYears: 15 },
      ],
      new Date("2026-09-15T00:00:00Z"),
    );
    assert.equal(q.sampleSize, 3);
    assert.ok(q.meanYearsRemaining !== null);
    assert.equal(q.oldestLaunchYear, 1995);
    assert.equal(q.newestLaunchYear, 2019);
    assert.doesNotMatch(q.detail, /no usable lifetime data/);
  });
});

describe("parseUcsLaunchYear", () => {
  it("expands UCS M/D/YY dates into four-digit years", () => {
    assert.equal(parseUcsLaunchYear("11/14/10"), 2010);
    assert.equal(parseUcsLaunchYear("4/7/95"), 1995);
    assert.equal(parseUcsLaunchYear("3/17/23"), 2023);
    assert.equal(parseUcsLaunchYear("6/1/2010"), 2010);
    assert.equal(parseUcsLaunchYear("2010-04-24"), 2010);
    assert.equal(parseUcsLaunchYear(null), null);
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

  it("does not call a US operator without an FCC row a non-US admin", () => {
    const s = licenseSignal({ status: "active", fccLicensed: false, satCount: 1 });
    assert.equal(s.biuHint, "foreign_operating");
    assert.match(s.biuLabel, /no FCC market-access row/i);
    assert.doesNotMatch(s.biuLabel, /non-US admin/i);
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
    assert.equal(v.basis, "model");
    assert.equal(v.curatedEstimate, "$350M+");
    assert.equal(v.confidence, "high");
    assert.ok(v.factors.some((f) => f.label === "Coverage (GDP/pop)"));
    assert.ok(v.factors.some((f) => f.label === "License / BIU"));
    assert.match(v.disclaimer, /not a live market price/);
    const life = v.factors.find((f) => f.label === "Remaining life");
    assert.ok(life);
    assert.doesNotMatch(life.detail, /no usable lifetime data/);
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

describe("operator mix", () => {
  it("groups occupancy-window strings by canonical operator", () => {
    const mix = summarizeOperators([
      { operator: "DirecTV, Inc." },
      { operator: "DirecTV, Inc." },
      { operator: "DirecTV, Inc." },
      { operator: "SES S.A." },
      { operator: "SES S.A." },
      { operator: "LightSquared" },
      { operator: "Mobile Satellite Ventures" },
    ]);
    assert.equal(mix[0].operator, "DirecTV");
    assert.equal(mix[0].count, 3);
    assert.equal(mix.find((m) => m.operator === "SES")?.count, 2);
    assert.match(formatOperatorMix(mix, 7), /DirecTV 3\/7/);
    assert.match(formatOperatorMix(mix, 7), /SES 2\/7/);
  });
});

describe("rights chain", () => {
  it("quarantines the ITU row and does not pick the first FCC licensee as the sole holder", () => {
    const chain = buildRightsChain({
      operator: "SES",
      country: "USA",
      asOf: "2026-09-15T00:00:00.000Z",
      fccAuths: [
        { id: 1, orbitalLocation: "101.3 W.L.", longitudeGeo: -101.3, satelliteName: "SKYTERRA-1", callSign: "S2358", licensee: "Ligado Networks Subsidiary, LLC, Debtor-in-Possession", administration: "U.S.A.", service: "MSS", frequencyRange: null, dateInOrbit: null, grantStatus: "Grant", notes: null },
        { id: 2, orbitalLocation: "101 W.L.", longitudeGeo: -101, satelliteName: "SES-1", callSign: "S2807", licensee: "SES Americom, Inc.", administration: "U.S.A.", service: "FSS", frequencyRange: null, dateInOrbit: null, grantStatus: "Grant", notes: null },
        { id: 3, orbitalLocation: "101 W.L.", longitudeGeo: -101, satelliteName: "DIRECTV D9S", callSign: "S2669", licensee: "DIRECTV Enterprises, LLC", administration: "U.S.A.", service: "BSS", frequencyRange: null, dateInOrbit: null, grantStatus: "Grant", notes: null },
      ],
    });
    const itu = chain.find((l) => l.layer === "itu");
    const license = chain.find((l) => l.layer === "operator_license");
    assert.equal(itu?.status, "stub");
    assert.match(itu?.holder ?? "", /Not recorded in Clarke/i);
    assert.doesNotMatch(itu?.detail ?? "", /network name/i);
    assert.equal(license?.holder, "3 FCC licensees");
    assert.match(license?.detail ?? "", /SES/);
    assert.match(license?.detail ?? "", /Ligado/);
    assert.match(license?.detail ?? "", /DirecTV/);
    assert.match(license?.detail ?? "", /Ligado Networks/);
    assert.doesNotMatch(license?.holder ?? "", /Ligado/);
  });
});
