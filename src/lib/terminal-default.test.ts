import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildRightsChain } from "./rights-chain";
import { valuateSlot } from "./valuation";
import {
  TERMINAL_DEFAULT,
  defaultTerminalPrimaryMarkup,
  defaultTerminalRendersItuStubAsPrimary,
  defaultTerminalRendersSimBookAsPrimary,
  defaultTerminalRendersSubleaseStubAsPrimary,
  primaryTerminalRegion,
  recordedRightsLayers,
  stubRightsLayers,
} from "./terminal-default";
import { RightsChain } from "@/components/terminal/RightsChain";
import { ExperimentalDisclosure } from "@/components/terminal/ExperimentalDisclosure";
import { BidAskStrip } from "@/components/terminal/BidAskStrip";
import { simulatedCapacityBook } from "./capacity-book";
import type { CongestionData } from "./satellites";
import type { OrbitalSlot } from "@/data/orbital-slots";

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

const emptyCongestion: CongestionData = {
  density: 2,
  score: 40,
  tier: "moderate",
  label: "Moderate",
  factors: { coLocated: 2, neighborhood: 4, distinctOperators: 2, dominantOperator: "SES", dominantOperatorRaw: "SES", dominantShare: 0.5 },
};

const fccAuths = [
  {
    id: 1,
    orbitalLocation: "101.3 W.L.",
    longitudeGeo: -101.3,
    satelliteName: "SKYTERRA-1",
    callSign: "S2358",
    licensee: "Ligado Networks Subsidiary, LLC, Debtor-in-Possession",
    administration: "U.S.A.",
    service: "MSS",
    frequencyRange: null,
    dateInOrbit: null,
    grantStatus: "Grant",
    notes: null,
  },
  {
    id: 2,
    orbitalLocation: "101 W.L.",
    longitudeGeo: -101,
    satelliteName: "SES-1",
    callSign: "S2807",
    licensee: "SES Americom, Inc.",
    administration: "U.S.A.",
    service: "FSS",
    frequencyRange: null,
    dateInOrbit: null,
    grantStatus: "Grant",
    notes: null,
  },
];

describe("default Terminal quarantine", () => {
  it("keeps simulated book, ITU stub, and sparkline out of the default policy", () => {
    assert.equal(TERMINAL_DEFAULT.showSimulatedBook, false);
    assert.equal(TERMINAL_DEFAULT.showRightsStubs, false);
    assert.equal(TERMINAL_DEFAULT.showValuationSparkline, false);
  });

  it("does not render sim book / ITU stub as primary markup", () => {
    const chain = buildRightsChain({
      operator: "SES",
      country: "USA",
      asOf: "2026-09-15T00:00:00.000Z",
      fccAuths,
    });
    const v = valuateSlot(sample, emptyCongestion, { satCount: 5, fccLicensed: true });
    const html = defaultTerminalPrimaryMarkup({
      occupancy: "5 sats TLE-primary",
      fccCount: fccAuths.length,
      modelPoint: v.formatted.point,
      modelRange: v.formatted.range,
      curatedEstimate: v.curatedEstimate,
      rights: chain,
    });

    assert.equal(defaultTerminalRendersSimBookAsPrimary(html), false);
    assert.equal(defaultTerminalRendersItuStubAsPrimary(html), false);
    assert.equal(defaultTerminalRendersSubleaseStubAsPrimary(html), false);
    assert.match(html, /Occupancy/);
    assert.match(html, /FCC ×2/);
    assert.match(html, /Fair value \(v0\)/);
    assert.match(html, /Hand estimate \/ curated opinion/);
    assert.match(html, /\$350M\+/);
    assert.doesNotMatch(primaryTerminalRegion(html), /Simulated capacity book/i);
    assert.doesNotMatch(primaryTerminalRegion(html), /data-rights-layer="itu"/);
  });

  it("splits recorded FCC layers from ITU / sub-lease stubs", () => {
    const chain = buildRightsChain({
      operator: "SES",
      country: "USA",
      asOf: "2026-09-15T00:00:00.000Z",
      fccAuths,
    });
    const recorded = recordedRightsLayers(chain);
    const stubs = stubRightsLayers(chain);
    assert.ok(recorded.every((l) => l.layer !== "itu" && l.layer !== "sublease"));
    assert.ok(recorded.some((l) => l.status === "recorded"));
    assert.ok(stubs.some((l) => l.layer === "itu"));
    assert.ok(stubs.some((l) => l.layer === "sublease"));
    assert.ok(stubs.every((l) => l.status === "stub"));
  });

  it("renders recorded RightsChain without ITU/sub-lease copy, and keeps sim book behind Experimental", () => {
    const chain = buildRightsChain({
      operator: "SES",
      country: "USA",
      asOf: "2026-09-15T00:00:00.000Z",
      fccAuths,
    });
    const recordedHtml = renderToStaticMarkup(
      createElement(RightsChain, { links: recordedRightsLayers(chain), variant: "recorded" }),
    );
    assert.doesNotMatch(recordedHtml, /data-rights-layer="itu"/);
    assert.doesNotMatch(recordedHtml, /data-rights-layer="sublease"/);
    assert.doesNotMatch(recordedHtml, /Not recorded in Clarke/);
    assert.doesNotMatch(recordedHtml, /No public sub-lease registry/);
    assert.match(recordedHtml, /FCC/);
    assert.match(recordedHtml, /SES/);

    const v = valuateSlot(sample, emptyCongestion, { satCount: 5, fccLicensed: true });
    const book = simulatedCapacityBook(v, emptyCongestion, "2026-09-15T00:00:00.000Z");
    const experimentalHtml = renderToStaticMarkup(
      createElement(
        ExperimentalDisclosure,
        { id: "sim-book", title: "Simulated capacity book (not a market)" },
        createElement(BidAskStrip, { book }),
      ),
    );
    assert.match(experimentalHtml, /data-terminal-experimental="sim-book"/);
    assert.match(experimentalHtml, /Simulated capacity book/);
    assert.equal(defaultTerminalRendersSimBookAsPrimary(`<div data-terminal-primary>occupancy fcc</div>${experimentalHtml}`), false);
  });

  it("keeps curated overlay as a secondary hand estimate, not the valuation basis", () => {
    const v = valuateSlot(sample, emptyCongestion, { satCount: 5, fccLicensed: true });
    assert.equal(v.basis, "model");
    assert.equal(v.curatedEstimate, "$350M+");
    assert.notEqual(v.formatted.point, "$350M+");
  });
});
