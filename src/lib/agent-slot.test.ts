import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { agentPayloadViolations, buildAgentSlot, listAgentSlots } from "./agent-slot";
import { buildSlotTerminal } from "./slot-terminal";
import SlotDrawer from "@/app/orbital/SlotDrawer";
import type { ExplorerRow } from "@/app/orbital/types";
import {
  CLARKE_GET_SLOT_DESCRIPTION,
  CLARKE_GET_TERMINAL_DESCRIPTION,
  CLARKE_LIST_DELTAS_DESCRIPTION,
  CLARKE_LIST_SATELLITES_DESCRIPTION,
  CLARKE_LIST_SLOTS_DESCRIPTION,
} from "../mcp/server";

const TOOL_DESCRIPTIONS = [
  CLARKE_LIST_SLOTS_DESCRIPTION,
  CLARKE_GET_SLOT_DESCRIPTION,
  CLARKE_GET_TERMINAL_DESCRIPTION,
  CLARKE_LIST_DELTAS_DESCRIPTION,
  CLARKE_LIST_SATELLITES_DESCRIPTION,
];

describe("agent slot payload", () => {
  it("returns occupancy, FCC, disputes, and vintage without valuation or congestion", () => {
    const agent = buildAgentSlot("101w");
    const terminal = buildSlotTerminal("101w");
    assert.ok(agent);
    assert.ok(terminal);

    assert.equal(agent.slug, "101w");
    assert.equal(agent.label, terminal.label);
    assert.equal(agent.longitude, terminal.longitude);
    assert.equal(agent.region, terminal.region);
    assert.equal(terminal.operator, "SES");
    assert.equal("operator" in agent, false);
    assert.equal("operatorRaw" in agent, false);
    assert.equal(agent.operatorIdentity, "split");
    assert.deepEqual(agent.operatorMix, terminal.operatorMix);
    assert.ok(agent.operatorMix.length > 1);
    assert.ok(agent.operatorMix.every((share) => share.operatorRaw.length > 0));
    const names = agent.operatorMix.map((share) => share.operator);
    assert.equal(new Set(names).size, names.length);
    assert.ok(names.every((name) => name.length > 0));
    assert.equal(agent.country, terminal.country);
    assert.equal(agent.status, terminal.status);
    assert.equal(agent.ituRecorded, "not_in_product");
    assert.match(agent.ituDetail, /SNS is not ingested/i);
    assert.equal(agent.satCount, terminal.satCount);
    assert.equal(agent.occupancyAuthority, "tle-primary");
    assert.equal(agent.fccAuthorizations.length, terminal.fccAuthorizations.length);
    assert.ok(agent.fccAuthorizations.some((row) => row.licenseeCanonical && row.licenseeRaw));
    assert.equal(agent.occupancy.length, terminal.satellites.length);
    assert.deepEqual(agent.provenance.occupancy, terminal.provenance.occupancy);
    assert.deepEqual(agent.provenance.ucsCatalog, terminal.provenance.ucsCatalog);
    assert.deepEqual(agent.provenance.fcc, terminal.provenance.fcc);
    assert.deepEqual(agent.provenance.license, terminal.provenance.license);
    assert.deepEqual(agent.provenance.rights, terminal.provenance.rights);
    assert.deepEqual(agent.sourceVintage, terminal.sourceVintage);
    assert.equal(typeof agent.sourceVintage.fccStale, "boolean");
    assert.equal(agent.sourceVintage.fccStaleAfterDays, 14);

    const sat = terminal.satellites[0];
    const obs = agent.occupancy.find((row) => row.id === sat.id);
    assert.ok(obs);
    assert.equal(obs.tleLongitude, sat.longitudeTle);
    assert.equal(obs.tleEpoch, sat.tleEpoch);
    assert.equal(obs.ucsLongitude, sat.longitudeUcs);
    assert.equal(obs.deltaDeg, sat.positionDeltaDeg);
    assert.equal(obs.disputed, sat.positionDisputed);
    assert.equal(obs.occupancyAuthority, sat.positionSource);
    assert.ok(["tle", "ucs", "none"].includes(obs.occupancyAuthority));

    assert.equal(
      agent.disputes.filter((row) => row.kind === "tle_ucs_disagreement").length,
      terminal.positionTrust.disputedSatellites.length,
    );
    assert.equal(
      agent.disputes.filter((row) => row.kind === "ucs_ghost").length,
      terminal.positionTrust.ucsGhosts.length,
    );
    const skyterra = agent.disputes.find((row) => row.noradId === "37218");
    assert.equal(skyterra, undefined);
    const ghosts = agent.disputes.filter((row) => row.kind === "ucs_ghost");
    assert.ok(ghosts.length > 0);
    for (const ghost of ghosts) {
      assert.ok(ghost.deltaDeg == null || ghost.deltaDeg > 2, `${ghost.name} delta ${ghost.deltaDeg}`);
    }
    assert.ok(ghosts.some((ghost) => (ghost.deltaDeg ?? 0) > 10));

    assert.ok(terminal.valuation);
    assert.ok(terminal.congestion);
    assert.ok(terminal.bidAsk);
    assert.ok(Array.isArray(terminal.comps));

    const violations = agentPayloadViolations(agent);
    assert.deepEqual(violations, []);
    assert.equal(JSON.stringify(agent).includes("$350"), false);
    assert.equal("valuation" in agent, false);
    assert.equal("congestion" in agent, false);
    assert.equal("bidAsk" in agent, false);
    assert.equal("comps" in agent, false);
    assert.equal("valueEstimate" in agent, false);
  });

  it("keeps forbidden keys out of every listed slot", () => {
    const slots = listAgentSlots();
    assert.ok(slots.length > 10);
    const detail = buildAgentSlot("101w");
    const listed = slots.find((slot) => slot.slug === "101w");
    assert.ok(detail);
    assert.ok(listed);
    assert.deepEqual(listed, detail);
    assert.ok(slots.some((slot) => slot.operatorIdentity === "single" && slot.operatorMix.length === 1));
    assert.ok(slots.some((slot) => slot.operatorIdentity === "none" && slot.operatorMix.length === 0));
    for (const slot of slots) {
      assert.equal("operator" in slot, false, slot.slug);
      assert.equal("operatorRaw" in slot, false, slot.slug);
      if (slot.operatorIdentity === "split") assert.ok(slot.operatorMix.length > 1, slot.slug);
      if (slot.operatorIdentity === "single") assert.equal(slot.operatorMix.length, 1, slot.slug);
      if (slot.operatorIdentity === "none") assert.equal(slot.operatorMix.length, 0, slot.slug);
    }

    const violations = slots.flatMap((slot) => agentPayloadViolations(slot).map((item) => `${slot.slug}: ${item}`));
    assert.deepEqual(violations, []);
  });

  it("keeps registry drawer congestion on the explorer row", () => {
    const row = {
      id: "101w",
      slug: "101w",
      longitude: -101,
      label: "101°W",
      operator: "SES",
      operatorRaw: "SES",
      country: "USA",
      purpose: null,
      status: "active",
      satCount: 5,
      satelliteNames: ["SES-1"],
      positionDisputedCount: 1,
      ucsGhostCount: 3,
      congestionScore: 80,
      congestionTier: "high",
      congestionFactors: {
        coLocated: 5,
        neighborhood: 12,
        distinctOperators: 4,
        dominantOperator: "SES",
        dominantOperatorRaw: "SES",
        dominantShare: 0.4,
      },
      region: "North America",
      fccLicensed: true,
      bands: [],
      coverage: [],
      description: "",
      valuation: {
        nonCommercial: false,
        formatted: { range: "$155-242M" },
        curatedEstimate: "$350M+",
        confidence: "medium",
      },
    } as unknown as ExplorerRow;

    const html = renderToStaticMarkup(createElement(SlotDrawer, { row, onClose: () => {} }));
    assert.match(html, /Congestion/);
    assert.match(html, /Co-located \(±0\.4°\)/);
    assert.match(html, />5</);
    assert.match(html, /Neighborhood \(±2°\)/);
    assert.match(html, />12</);
    assert.match(html, /Hand estimate/);
    assert.match(html, /\$350M\+/);
  });

  it("does not advertise congestion or valuation in MCP slot tool descriptions", () => {
    for (const text of TOOL_DESCRIPTIONS) {
      assert.equal(text.includes("\u2014"), false);
      assert.doesNotMatch(text, /congestion/i);
      assert.doesNotMatch(text, /valuation/i);
      assert.doesNotMatch(text, /\$\s*\d/);
      assert.doesNotMatch(text, /bid\/ask|bidAsk/i);
    }
    assert.match(CLARKE_GET_SLOT_DESCRIPTION, /ituRecorded is not_in_product/);
    assert.match(CLARKE_LIST_SLOTS_DESCRIPTION, /occupancy observations/i);
    assert.match(CLARKE_LIST_SLOTS_DESCRIPTION, /operatorIdentity/);
    assert.match(CLARKE_GET_SLOT_DESCRIPTION, /operatorMix/);
    assert.doesNotMatch(CLARKE_GET_SLOT_DESCRIPTION, /operator and operatorRaw/);
    assert.match(CLARKE_GET_TERMINAL_DESCRIPTION, /same payload as clarke_get_slot/i);
  });
});
