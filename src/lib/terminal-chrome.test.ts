import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { valuateSlot } from "./valuation";
import { simulatedCapacityBook } from "./capacity-book";
import { buildRightsChain } from "./rights-chain";
import { SlotTerminalView } from "@/components/terminal/SlotTerminalView";
import { TrustBar } from "@/components/terminal/TrustBar";
import SlotTable from "@/app/orbital/SlotTable";
import { isDataSurface } from "@/components/PageBackdrop";
import { defaultTerminalRendersItuStubAsPrimary, primaryTerminalRegion } from "./terminal-default";
import type { SlotTerminalModel } from "./slot-terminal";
import type { Entitlements } from "./auth";
import type { ExplorerRow } from "@/app/orbital/types";
import type { CongestionData } from "./satellites";
import type { OrbitalSlot } from "@/data/orbital-slots";
import type { SlotSourceVintage } from "./source-vintage";
import type { SlotPositionTrust } from "./position-authority";

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
  purpose: "Communications",
};

const emptyCongestion: CongestionData = {
  density: 2,
  score: 80,
  tier: "high",
  label: "Critical",
  factors: { coLocated: 5, neighborhood: 8, distinctOperators: 3, dominantOperator: "SES", dominantOperatorRaw: "SES S.A.", dominantShare: 0.4 },
};

const fccAuths = [
  {
    id: 1,
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

const vintage: SlotSourceVintage = {
  ucsFileVintage: "2023-04-07",
  ucsIngestAt: "2026-09-15",
  fccAsOf: "2026-04-30",
  fccIngestAt: "2026-09-15",
  fccStale: true,
  fccStaleAfterDays: 14,
  tleEpochMin: "2026-09-14",
  tleEpochMax: "2026-09-15",
  tleIngestAt: "2026-09-15",
};

const positionTrust: SlotPositionTrust = {
  occupancyAuthority: "tle-primary",
  windowDeg: 0.4,
  disputeThresholdDeg: 2,
  tlePrimaryCount: 4,
  ucsFallbackCount: 1,
  unknownCount: 0,
  disputedCount: 1,
  disputedSatellites: [],
  ucsGhosts: [{
    name: "DirecTV-8",
    noradId: "31862",
    ucsLongitude: -101,
    tleLongitude: -119,
    occupancyLongitude: -119,
    deltaDeg: 18,
    positionSource: "tle",
  }],
};

const asOf = "2026-09-15T00:00:00.000Z";
const provenance = { source: "test", asOf };

const free: Entitlements = {
  loggedIn: false,
  email: null,
  plan: "free",
  pro: false,
  demo: false,
  features: {
    valuationBreakdown: false,
    compare: false,
    exportPlus: false,
    api: false,
    history: false,
  },
};

function fixtureModel(): SlotTerminalModel {
  const v = valuateSlot(sample, emptyCongestion, { satCount: 5, fccLicensed: true, asOf: new Date(asOf) });
  const rights = buildRightsChain({ operator: "SES", country: "USA", asOf, fccAuths });
  return {
    slug: "101w",
    label: "101°W",
    longitude: -101,
    region: "North America",
    slot: sample,
    operator: "SES",
    operatorRaw: "SES",
    occupancyMajority: "DirecTV",
    operatorMix: [
      { operator: "DirecTV", count: 2, share: 0.4, operatorRaw: ["DirecTV, Inc."] },
      { operator: "SES", count: 1, share: 0.2, operatorRaw: ["SES S.A."] },
    ],
    ituRecorded: "not_in_product",
    country: "USA",
    purpose: "Communications",
    status: "active",
    satCount: 5,
    satellites: [],
    bands: ["C", "Ku"],
    coverage: ["North America"],
    congestion: emptyCongestion,
    fccAuthorizations: fccAuths,
    valuation: v,
    history: [],
    historySource: "backfill",
    rightsChain: rights,
    bidAsk: simulatedCapacityBook(v, emptyCongestion, asOf),
    comps: [],
    positionTrust,
    sourceVintage: vintage,
    provenance: {
      occupancy: provenance,
      license: provenance,
      fcc: provenance,
      congestion: provenance,
      fairValue: provenance,
      ucsCatalog: provenance,
    },
    asOf,
    modelRunAsOf: null,
  };
}

describe("product chrome — Fair value, Trust bar, Terminal fold", () => {
  it("hides Fair value on the registry table by default", () => {
    const row = {
      id: "101w",
      slug: "101w",
      longitude: -101,
      label: "101°W",
      operator: "SES",
      operatorRaw: "SES",
      country: "USA",
      purpose: "Communications",
      status: "active",
      satCount: 5,
      satelliteNames: [],
      positionDisputedCount: 0,
      ucsGhostCount: 0,
      congestionScore: 80,
      congestionTier: "high",
      region: "North America",
      fccLicensed: true,
      bands: ["C"],
      coverage: [],
      description: "",
      valuation: { nonCommercial: false, formatted: { point: "$198M" } },
    } as unknown as ExplorerRow;

    const hidden = renderToStaticMarkup(
      createElement(SlotTable, {
        rows: [row],
        sortKey: "longitude",
        sortDir: "asc",
        onSort: () => {},
        onSelect: () => {},
        selectedSlug: null,
        showFairValue: false,
      }),
    );
    assert.match(hidden, />Occ\.</);
    assert.match(hidden, />Status</);
    assert.match(hidden, />FCC</);
    assert.doesNotMatch(hidden, /Fair value/);
    assert.doesNotMatch(hidden, /\$198M/);

    const shown = renderToStaticMarkup(
      createElement(SlotTable, {
        rows: [row],
        sortKey: "longitude",
        sortDir: "asc",
        onSort: () => {},
        onSelect: () => {},
        selectedSlug: null,
        showFairValue: true,
      }),
    );
    assert.match(shown, /Fair value/);
    assert.match(shown, /\$198M/);
  });

  it("collapses FCC stale and position disagreement into one Trust bar", () => {
    const html = renderToStaticMarkup(
      createElement(TrustBar, { vintage, positionTrust }),
    );
    assert.match(html, /data-trust-bar/);
    assert.match(html, /FCC SSAL stale/);
    assert.match(html, /Position disagreement/);
    assert.match(html, />Details</);
    assert.doesNotMatch(html, /FCC workbook as-of is/);
    assert.doesNotMatch(html, /Occupancy clusters on Space-Track/);
    assert.doesNotMatch(html, /data-fcc-stale-banner/);
  });

  it("rebuilds Terminal fold: occupancy/rights/freshness first, no Unlock Pro or blur on occupancy", () => {
    const html = renderToStaticMarkup(
      createElement(SlotTerminalView, { model: fixtureModel(), entitlements: free }),
    );

    const kpis = [...html.matchAll(/data-kpi="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(kpis, ["occupancy", "rights", "freshness", "congestion", "fair-value"]);

    const header = html.match(/data-terminal-header[\s\S]*?<\/header>/i)?.[0] ?? "";
    assert.match(header, /101°W/);
    assert.doesNotMatch(header, /Unlock Pro/);

    const occIdx = html.indexOf('data-kpi="occupancy"');
    const blurIdx = html.indexOf("blur-[6px]");
    const unlockIdx = html.indexOf("Unlock Pro");
    assert.ok(occIdx >= 0);
    assert.ok(blurIdx < 0 || occIdx < blurIdx);
    assert.ok(unlockIdx > occIdx);
    assert.match(html, /data-unlock-pro/);

    const panel = html.match(/data-fair-value-panel[\s\S]*?<\/section>/i)?.[0] ?? "";
    assert.doesNotMatch(panel, /text-3xl/);
    assert.match(html, /data-trust-bar/);
    assert.match(html, /data-terminal-experimental="sim-book"/);
    assert.match(html, /data-itu-recorded="not_in_product"/);
    assert.match(html, /Unrecorded in Clarke/);
    assert.equal(defaultTerminalRendersItuStubAsPrimary(html), false);
    assert.doesNotMatch(primaryTerminalRegion(html), /data-rights-layer="itu"/);
    assert.match(html, /data-terminal-experimental="rights-stubs"/);
    assert.match(html, /data-rights-layer="itu"/);
  });

  it("treats registry, Terminal, and Docs routes as data surfaces (no Earth wallpaper)", () => {
    assert.equal(isDataSurface("/orbital"), true);
    assert.equal(isDataSurface("/orbital/101w"), true);
    assert.equal(isDataSurface("/orbital/compare"), true);
    assert.equal(isDataSurface("/docs"), true);
    assert.equal(isDataSurface("/docs/data-trust"), true);
    assert.equal(isDataSurface("/index"), false);
    assert.equal(isDataSurface("/about"), false);
    assert.equal(isDataSurface("/blog"), false);
  });
});
