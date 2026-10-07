import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { agentPayloadViolations } from "./agent-slot";
import { lonToSlug } from "./slot-utils";
import {
  CLARKE_LIST_DELTAS_DESCRIPTION,
} from "../mcp/server";
import {
  assembleDeltaFeed,
  canonicalStateJson,
  diffRegistryStates,
  emptyVintage,
  selectDeltaChanges,
  DeltaQueryError,
  type DeltaVintage,
  type DisputeFact,
  type FccEventRow,
  type FccFact,
  type OccupancyFact,
  type RegistrySnapshotRecord,
  type RegistryState,
} from "./delta-feed";
import { buildCurrentRegistryState, buildDeltaFeedFromDb } from "./registry-snapshot";

const V1: DeltaVintage = {
  ucsFileVintage: "2023-04-07",
  fccAsOf: "2026-04-30",
  tleEpochMin: "2026-09-03T00:00:00.000Z",
  tleEpochMax: "2026-09-15T00:00:00.000Z",
};

const V2: DeltaVintage = { ...V1, fccAsOf: "2026-09-27", tleEpochMax: "2026-09-30T00:00:00.000Z" };

function occ(over: Partial<OccupancyFact> = {}): OccupancyFact {
  return {
    slug: "101w",
    longitude: -101,
    noradId: "36516",
    name: "SES-1",
    occupancyAuthority: "tle",
    occupancyLongitude: -100.98,
    tleLongitude: -100.98,
    ucsLongitude: -101,
    tleEpoch: "2026-09-15T00:00:00.000Z",
    ...over,
  };
}

function dispute(over: Partial<DisputeFact> = {}): DisputeFact {
  return {
    slug: "101w",
    longitude: -101,
    noradId: "39206",
    name: "MUOS-2",
    kind: "ucs_ghost",
    deltaDeg: 87.8,
    positionSource: "tle",
    ucsLongitude: -100.1,
    tleLongitude: 172.04,
    occupancyLongitude: 172.04,
    ...over,
  };
}

function fcc(over: Partial<FccFact> = {}): FccFact {
  return {
    slug: "101w",
    longitude: -101,
    callSign: "S2669",
    satelliteName: "DIRECTV",
    licensee: "DIRECTV Enterprises, LLC",
    grantStatus: "Grant",
    ...over,
  };
}

function state(over: Partial<RegistryState> = {}): RegistryState {
  return {
    vintage: V1,
    registrySlotCount: 1,
    occupancy: [],
    disputes: [],
    fcc: [],
    ...over,
  };
}

function snap(id: number, capturedAt: string, registry: RegistryState, kind = "ingest"): RegistrySnapshotRecord {
  return { id, capturedAt, kind, triggerSource: "test", state: registry };
}

const META = { fromSnapshotId: 1, toSnapshotId: 2, detectedAt: "2026-10-02T04:36:21.000Z" };

describe("registry state diff", () => {
  it("emits occupancy enter, leave, and authority flip", () => {
    const stayed = occ({ noradId: "1", name: "Stayed" });
    const flipped = occ({ noradId: "2", name: "Flipped", occupancyAuthority: "tle" });
    const left = occ({ noradId: "3", name: "Left", slug: "19-2e", longitude: 19.2 });
    const entered = occ({ noradId: "4", name: "Entered", slug: "13e", longitude: 13, occupancyAuthority: "ucs" });
    const moved = occ({ noradId: "5", name: "Moved", occupancyAuthority: "tle" });
    const movedNext = occ({
      noradId: "5",
      name: "Moved",
      slug: "172e",
      longitude: 172,
      occupancyAuthority: "ucs",
      occupancyLongitude: 172,
      tleLongitude: null,
      ucsLongitude: 172,
    });

    const changes = diffRegistryStates(
      state({ occupancy: [stayed, flipped, left, moved] }),
      state({
        occupancy: [
          stayed,
          { ...flipped, occupancyAuthority: "ucs", occupancyLongitude: -101, tleLongitude: null },
          entered,
          movedNext,
        ],
      }),
      META,
    );

    const enter = changes.find((row) => row.kind === "enter" && row.subject.name === "Entered");
    const leave = changes.find((row) => row.kind === "leave" && row.subject.name === "Left");
    const flip = changes.find((row) => row.kind === "authority_flip");
    const movedLeave = changes.find((row) => row.kind === "leave" && row.subject.noradId === "5");
    const movedEnter = changes.find((row) => row.kind === "enter" && row.subject.noradId === "5");
    assert.ok(enter);
    assert.equal(enter.slug, "13e");
    assert.equal(enter.longitude, 13);
    assert.equal(enter.domain, "occupancy");
    assert.equal(enter.before, null);
    assert.equal(enter.after?.occupancyAuthority, "ucs");
    assert.equal(enter.provenance.rule, "tle-primary");
    assert.equal(enter.provenance.store, "registry_snapshots");
    assert.deepEqual(enter.provenance.sources, ["Space-Track TLE", "UCS Satellite Database"]);
    assert.equal(enter.vintage.fccAsOf, V1.fccAsOf);
    assert.ok(leave);
    assert.equal(leave.slug, "19-2e");
    assert.equal(leave.after, null);
    assert.ok(flip);
    assert.equal(flip.slug, "101w");
    assert.equal(flip.before?.occupancyAuthority, "tle");
    assert.equal(flip.after?.occupancyAuthority, "ucs");
    assert.equal(changes.filter((row) => row.kind === "authority_flip").length, 1);
    assert.ok(movedLeave);
    assert.ok(movedEnter);
    assert.equal(movedLeave.slug, "101w");
    assert.equal(movedEnter.slug, "172e");
    assert.equal(movedEnter.after?.occupancyAuthority, "ucs");
    assert.equal(changes.some((row) => row.subject.name === "Stayed"), false);
    assert.equal(changes.some((row) => row.kind === "tle_epoch"), false);
  });

  it("emits tle_epoch when a used TLE epoch or its 14 day stale flag changes", () => {
    const epochShift = diffRegistryStates(
      state({ occupancy: [occ({ tleEpoch: "2026-09-01T00:00:00.000Z" })] }),
      state({ occupancy: [occ({ tleEpoch: "2026-09-18T00:00:00.000Z" })] }),
      { fromSnapshotId: 1, toSnapshotId: 2, detectedAt: "2026-09-20T00:00:00.000Z", fromCapturedAt: "2026-09-10T00:00:00.000Z" },
    );
    const shifted = epochShift.find((row) => row.kind === "tle_epoch");
    assert.ok(shifted);
    assert.equal(shifted.domain, "occupancy");
    assert.equal(shifted.before?.tleEpoch, "2026-09-01T00:00:00.000Z");
    assert.equal(shifted.before?.tleStale, false);
    assert.equal(shifted.after?.tleEpoch, "2026-09-18T00:00:00.000Z");
    assert.equal(shifted.after?.tleStale, false);
    assert.match(shifted.provenance.note, /14 days/);
    assert.equal(epochShift.some((row) => row.kind === "authority_flip"), false);

    const aged = diffRegistryStates(
      state({ occupancy: [occ({ tleEpoch: "2026-09-01T00:00:00.000Z" })] }),
      state({ occupancy: [occ({ tleEpoch: "2026-09-01T00:00:00.000Z" })] }),
      { fromSnapshotId: 1, toSnapshotId: 2, detectedAt: "2026-09-20T00:00:00.000Z", fromCapturedAt: "2026-09-10T00:00:00.000Z" },
    );
    assert.equal(aged.length, 1);
    assert.equal(aged[0].kind, "tle_epoch");
    assert.equal(aged[0].before?.tleEpoch, aged[0].after?.tleEpoch);
    assert.equal(aged[0].before?.tleStale, false);
    assert.equal(aged[0].after?.tleStale, true);
  });

  it("does not invent a TLE epoch change for UCS fallback or during bootstrap", () => {
    const ucs = diffRegistryStates(
      state({ occupancy: [occ({ occupancyAuthority: "ucs", tleEpoch: "2020-01-01T00:00:00.000Z" })] }),
      state({ occupancy: [occ({ occupancyAuthority: "ucs", tleEpoch: "2021-06-01T00:00:00.000Z" })] }),
      { fromSnapshotId: 1, toSnapshotId: 2, detectedAt: "2026-09-20T00:00:00.000Z", fromCapturedAt: "2026-09-10T00:00:00.000Z" },
    );
    assert.deepEqual(ucs, []);

    const feed = assembleDeltaFeed({
      snapshots: [snap(1, "2026-09-20T00:00:00.000Z", state({ occupancy: [occ({ tleEpoch: "2026-08-01T00:00:00.000Z" })] }))],
      fccEvents: [],
      observed: { vintage: V1, ucsIngestAt: null, fccIngestAt: null, tleIngestAt: null },
    });
    assert.equal(feed.coverage, "bootstrap");
    assert.equal(feed.changes.some((row) => row.domain === "occupancy"), false);
    assert.equal(feed.changes.some((row) => row.kind === "tle_epoch"), false);
  });

  it("emits dispute appear, clear, and kind", () => {
    const ghost = dispute();
    const cleared = dispute({ noradId: "2", name: "Gone", kind: "tle_ucs_disagreement" });
    const flipped = dispute({ noradId: "3", name: "Kind", kind: "ucs_ghost" });
    const changes = diffRegistryStates(
      state({ disputes: [cleared, flipped] }),
      state({
        disputes: [ghost, { ...flipped, kind: "tle_ucs_disagreement", deltaDeg: 3.2 }],
      }),
      META,
    );
    assert.equal(changes.filter((row) => row.domain === "dispute").length, 3);
    const appear = changes.find((row) => row.kind === "appear");
    const clear = changes.find((row) => row.kind === "clear");
    const kind = changes.find((row) => row.kind === "kind");
    assert.equal(appear?.subject.noradId, "39206");
    assert.equal(appear?.after?.kind, "ucs_ghost");
    assert.equal(appear?.slug, "101w");
    assert.equal(clear?.subject.name, "Gone");
    assert.equal(clear?.after, null);
    assert.equal(kind?.before?.kind, "ucs_ghost");
    assert.equal(kind?.after?.kind, "tle_ucs_disagreement");
    assert.equal(kind?.after?.deltaDeg, 3.2);
  });

  it("emits FCC new, lapsed, licensee, status, and as-of", () => {
    const kept = fcc({ callSign: "KEEP" });
    const lapsed = fcc({ callSign: "LAPSE", slug: "72w", longitude: -72 });
    const licensee = fcc({ callSign: "LIC" });
    const status = fcc({ callSign: "STAT", grantStatus: "Grant" });
    const changes = diffRegistryStates(
      state({
        vintage: V1,
        fcc: [kept, lapsed, licensee, status],
      }),
      state({
        vintage: V2,
        fcc: [
          kept,
          fcc({ callSign: "NEW", slug: "134e", longitude: 134, licensee: "Hawaii Teleport Holdings, LLC" }),
          { ...licensee, licensee: "SES Americom, Inc." },
          { ...status, grantStatus: "Surrendered" },
        ],
      }),
      META,
    );
    const kinds = changes.filter((row) => row.domain === "fcc").map((row) => row.kind).sort();
    assert.deepEqual(kinds, ["as_of", "lapsed", "licensee", "new", "status"]);
    const asOf = changes.find((row) => row.kind === "as_of");
    assert.equal(asOf?.slug, null);
    assert.equal(asOf?.longitude, null);
    assert.equal(asOf?.before?.fccAsOf, "2026-04-30");
    assert.equal(asOf?.after?.fccAsOf, "2026-09-27");
    assert.equal(asOf?.provenance.rule, "ingest-meta-file-vintage");
    const created = changes.find((row) => row.kind === "new");
    assert.equal(created?.slug, "134e");
    assert.equal(created?.longitude, 134);
    assert.equal(created?.before, null);
    assert.equal(created?.subject.callSign, "NEW");
    const gone = changes.find((row) => row.kind === "lapsed");
    assert.equal(gone?.slug, "72w");
    assert.equal(gone?.after, null);
    assert.equal(changes.find((row) => row.kind === "licensee")?.after?.licensee, "SES Americom, Inc.");
    assert.equal(changes.find((row) => row.kind === "status")?.after?.grantStatus, "Surrendered");
  });

  it("does not treat a longitude-only FCC row or an unchanged vintage as a change", () => {
    const before = fcc({ longitude: -101, slug: "101w" });
    const after = fcc({ longitude: -101.2, slug: "101-2w" });
    const changes = diffRegistryStates(
      state({ fcc: [before, fcc({ callSign: "N/A", satelliteName: "skip" })] }),
      state({ fcc: [after, fcc({ callSign: "N/A", satelliteName: "skip", longitude: 10, slug: "10e" })] }),
      META,
    );
    assert.deepEqual(changes, []);
  });

  it("canonical json is stable", () => {
    const a = state({ occupancy: [occ({ noradId: "2" }), occ({ noradId: "1" })], fcc: [fcc({ callSign: "B" }), fcc({ callSign: "A" })] });
    const b = state({ occupancy: [occ({ noradId: "1" }), occ({ noradId: "2" })], fcc: [fcc({ callSign: "A" }), fcc({ callSign: "B" })] });
    assert.equal(canonicalStateJson(a), canonicalStateJson(b));
  });
});

describe("delta feed assembly", () => {
  const observed = {
    vintage: V2,
    ucsIngestAt: "2026-09-30 12:40:55",
    fccIngestAt: "2026-10-02 04:36:21",
    tleIngestAt: "2026-09-30 12:46:23",
  };

  function event(over: Partial<FccEventRow>): FccEventRow {
    return {
      id: 1,
      detectedAt: "2026-10-02 04:36:21",
      eventType: "new_authorization",
      longitudeGeo: 134,
      callSign: "KA279",
      detail: JSON.stringify({
        callSign: "KA279",
        licensee: "Hawaii Teleport Holdings, LLC",
        orbitalLocation: "134 E.L.",
        grantStatus: "Grant",
      }),
      ...over,
    };
  }

  it("bootstraps from one snapshot plus earlier FCC slot events", () => {
    const feed = assembleDeltaFeed({
      snapshots: [snap(1, "2026-10-02T06:00:00.000Z", state({ vintage: V2, registrySlotCount: 12, occupancy: [occ()], fcc: [fcc({ callSign: "KA279", slug: "134e", longitude: 134 })] }), "bootstrap")],
      fccEvents: [
        event({}),
        event({
          id: 2,
          eventType: "satellite_relocated",
          callSign: null,
          detail: JSON.stringify({ noradId: "1" }),
        }),
        event({
          id: 3,
          eventType: "authorization_lapsed",
          longitudeGeo: -101.2,
          callSign: "S2669",
          detail: JSON.stringify({ callSign: "S2669", licensee: "DIRECTV Enterprises, LLC" }),
        }),
      ],
      observed,
      fccByCallSign: new Map([["KA279", fcc({ callSign: "KA279", slug: "134e", longitude: 134, satelliteName: "HUL" })]]),
    });

    assert.equal(feed.coverage, "bootstrap");
    assert.equal(feed.edition, 2);
    assert.equal(feed.occupancyAuthority, "tle-primary");
    assert.equal(feed.baseline?.kind, "bootstrap");
    assert.equal(feed.baseline?.occupancyCount, 1);
    assert.equal(feed.vintage.fccAsOf, "2026-09-27");
    assert.equal(feed.vintage.fccIngestAt, "2026-10-02T04:36:21.000Z");
    assert.deepEqual(feed.changes.map((row) => row.kind), ["lapsed", "new"]);
    assert.equal(feed.changes.every((row) => row.domain === "fcc"), true);
    assert.equal(feed.changes.every((row) => row.provenance.store === "slot_events"), true);
    assert.equal(feed.changes[1].subject.satelliteName, "HUL");
    assert.equal(feed.changes[0].slug, "101-2w");
    assert.equal(feed.changes.some((row) => row.kind === "as_of"), false);
    assert.match(feed.coverageNote, /not a reconstructed weekly history/);
    assert.ok(feed.limitations.some((line) => /satellite_relocated/.test(line)));
    assert.deepEqual(agentPayloadViolations(feed), []);
  });

  it("does not repeat FCC slot events that the next snapshot already diffs", () => {
    const before = state({ vintage: V1, fcc: [] });
    const after = state({
      vintage: V2,
      fcc: [fcc({ callSign: "KA279", slug: "134e", longitude: 134, licensee: "Hawaii Teleport Holdings, LLC" })],
    });
    const feed = assembleDeltaFeed({
      snapshots: [
        snap(1, "2026-10-02T06:00:00.000Z", before, "bootstrap"),
        snap(2, "2026-10-09T06:00:00.000Z", after),
      ],
      fccEvents: [
        event({ id: 9, detectedAt: "2026-10-02 04:36:21", eventType: "authorization_lapsed", callSign: "OLD", longitudeGeo: -72 }),
        event({ id: 10, detectedAt: "2026-10-09 06:00:00", callSign: "KA279", longitudeGeo: 134 }),
      ],
      observed,
    });
    assert.equal(feed.coverage, "ingest_deltas");
    const ids = feed.changes.map((row) => row.id);
    assert.ok(ids.some((id) => id.startsWith("fcc:slot_event:9")));
    assert.equal(ids.some((id) => id.startsWith("fcc:slot_event:10")), false);
    assert.ok(ids.some((id) => id === "fcc:new:KA279:2"));
    assert.ok(ids.some((id) => id === "fcc:as_of:2"));
    const filtered = selectDeltaChanges(feed, { slug: "134e" });
    assert.equal(filtered.appliedFilter.slug, "134e");
    assert.equal(filtered.changes.some((row) => row.kind === "as_of"), false);
    assert.equal(filtered.baseline?.fccRowCount, 1);
    const since = selectDeltaChanges(feed, { since: "2026-10-09T06:00:00.000Z" });
    assert.deepEqual(since.changes, []);
    assert.throws(() => selectDeltaChanges(feed, { domain: "price" }), DeltaQueryError);
    assert.throws(() => selectDeltaChanges(feed, { since: "not-a-date" }), DeltaQueryError);
  });
});

describe("live delta feed", () => {
  const fresh = buildCurrentRegistryState();
  const feed = buildDeltaFeedFromDb();

  it("diffs the committed snapshots and keeps the earlier FCC workbook events", () => {
    assert.equal(feed.coverage, "ingest_deltas");
    assert.equal(feed.baseline?.kind, "ingest");
    assert.equal(feed.vintage.fccAsOf, "2026-09-27");
    assert.equal(feed.baseline?.fccRowCount, fresh.fcc.length);
    assert.equal(feed.baseline?.occupancyCount, fresh.occupancy.length);
    assert.equal(feed.baseline?.disputeCount, fresh.disputes.length);
    assert.equal(feed.baseline?.registrySlotCount, fresh.registrySlotCount);
    assert.ok((feed.baseline?.occupancyCount ?? 0) > 0);
    assert.ok((feed.baseline?.fccRowCount ?? 0) > 0);
    assert.ok(feed.changes.some((row) => row.domain === "occupancy"));
    assert.equal(feed.changes.some((row) => row.kind === "as_of"), false);
    assert.ok(feed.changes.some((row) => row.kind === "new" && row.subject.callSign === "KA279"));
    const lapsed = feed.changes.find((row) => row.kind === "lapsed" && row.subject.callSign === "S2669");
    assert.ok(lapsed);
    assert.equal(lapsed.longitude, -101.2);
    assert.equal(lapsed.slug, "101-2w");
    assert.equal(lapsed.provenance.eventId != null, true);
    assert.match(lapsed.id, /^fcc:slot_event:\d+$/);
    const epochs = feed.changes.filter((row) => row.kind === "tle_epoch");
    assert.ok(epochs.length > 0);
    for (const row of epochs) {
      assert.equal(row.domain, "occupancy");
      assert.ok(row.before);
      assert.ok(row.after);
      assert.equal(typeof row.before.tleStale, "boolean");
      assert.equal(typeof row.after.tleStale, "boolean");
      assert.ok(row.before.occupancyAuthority === "tle" || row.after.occupancyAuthority === "tle");
      const epochMoved = row.before.tleEpoch !== row.after.tleEpoch;
      const staleMoved = row.before.tleStale !== row.after.tleStale;
      assert.equal(epochMoved || staleMoved, true);
    }
    for (const change of feed.changes) {
      assert.ok(change.detectedAt.endsWith("Z"));
      assert.equal(change.vintage.fccAsOf, "2026-09-27");
      if (change.longitude != null) assert.equal(change.slug, lonToSlug(change.longitude));
      if (change.domain === "fcc") assert.equal(change.provenance.sources.includes("FCC-SSAL"), true);
    }
    assert.match(feed.limitations.join("\n"), /tle_epoch/);
    assert.equal(JSON.stringify(feed).includes("satellite_relocated"), true);
    assert.equal(feed.changes.some((row) => /relocated/i.test(row.id)), false);
    assert.equal("ituRecorded" in feed, false);
    assert.deepEqual(agentPayloadViolations(feed), []);
    assert.equal(JSON.stringify(feed).includes("$350"), false);
  });

  it("keeps occupancy and dispute membership keys unique", () => {
    const occKeys = fresh.occupancy.map((row) => `${row.slug}|${row.noradId ?? row.name}`);
    const disputeKeys = fresh.disputes.map((row) => `${row.slug}|${row.noradId ?? row.name}`);
    assert.equal(new Set(occKeys).size, occKeys.length);
    assert.equal(new Set(disputeKeys).size, disputeKeys.length);
    assert.equal(fresh.vintage.fccAsOf, "2026-09-27");
  });

  it("keeps the MCP delta tool on the registry record, not labeled models", () => {
    assert.equal(CLARKE_LIST_DELTAS_DESCRIPTION.includes("\u2014"), false);
    assert.equal(CLARKE_LIST_DELTAS_DESCRIPTION.includes("\u2013"), false);
    assert.match(CLARKE_LIST_DELTAS_DESCRIPTION, /coverage is bootstrap/);
    assert.match(CLARKE_LIST_DELTAS_DESCRIPTION, /tle_epoch/);
    assert.match(CLARKE_LIST_DELTAS_DESCRIPTION, /14 day/);
    assert.match(CLARKE_LIST_DELTAS_DESCRIPTION, /ITU SNS is not ingested/);
    assert.doesNotMatch(CLARKE_LIST_DELTAS_DESCRIPTION, /congestion|valuation|bid\/ask|\$\s*\d/i);
  });
});

describe("delta feed copy", () => {
  it("does not use em or en dashes in feed text", () => {
    const feed = buildDeltaFeedFromDb();
    const text = [feed.coverageNote, ...feed.limitations, ...feed.changes.map((row) => row.provenance.note)].join("\n");
    assert.equal(text.includes("\u2014"), false);
    assert.equal(text.includes("\u2013"), false);
  });
});
