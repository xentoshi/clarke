import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { slots as curatedSlots } from "@/data/orbital-slots";
import { buildAgentSlot } from "./agent-slot";
import { buildGeoBelt } from "./belt-data";
import { buildExplorerRows } from "./explorer";
import { formatRegistryCensus, formatRegistryCensusDetail, getRegistryCensus } from "./registry-census";
import { lonToSlug, mergeWithUcs } from "./satellites";
import { buildSlotTerminal } from "./slot-terminal";

describe("registry census", () => {
  const census = getRegistryCensus();

  it("uses one positions and on-station count for the table, the belt, and llms.txt", () => {
    const rows = buildExplorerRows();
    assert.equal(census.positions, rows.length);
    assert.equal(census.positions, mergeWithUcs(curatedSlots).length);
    assert.equal(census.onStation, rows.filter((row) => row.satCount > 0).length);
    assert.equal(census.tleOccupancyMarks, buildGeoBelt().marks.length);
    assert.ok(census.onStation < census.positions);
    const text = readFileSync(join(process.cwd(), "public/llms.txt"), "utf8");
    assert.ok(text.includes(formatRegistryCensus(census)));
    assert.ok(text.includes(formatRegistryCensusDetail(census)));
    const about = readFileSync(join(process.cwd(), "src/app/about/page.tsx"), "utf8");
    const pricing = readFileSync(join(process.cwd(), "src/app/pricing/PricingClient.tsx"), "utf8");
    assert.doesNotMatch(about, /orbital real estate/i);
    assert.doesNotMatch(about, /what it&apos;s worth|what it's worth/i);
    assert.doesNotMatch(pricing, /TODO/);
    assert.doesNotMatch(pricing, /STRIPE_/);
  });
});

describe("slot credibility", () => {
  it("labels 90-7e with its nominal longitude", () => {
    const page = buildSlotTerminal("90-7e");
    const agent = buildAgentSlot("90-7e");
    assert.ok(page);
    assert.ok(agent);
    assert.equal(page.label, "90.7°E");
    assert.equal(agent.label, "90.7°E");
    assert.equal(page.longitude, 90.7);
    assert.equal(agent.longitude, 90.7);
  });

  it("keeps STPSat-6 off a false catalog dispute and names the operator", () => {
    const rows = mergeWithUcs(curatedSlots);
    const stp = rows.find((row) => row.noradIds?.includes("49817"));
    assert.ok(stp);
    assert.equal(stp.operator, "US Space Force / DoD STP");
    assert.match(stp.description, /Hosted payload: NASA LCRD/);
    assert.match(stp.description, /UCS catalog note \(file vintage 2023-04-07\)/);
    const model = buildSlotTerminal(lonToSlug(stp.longitude));
    assert.equal(model?.operator, "US Space Force / DoD STP");
    const sat = model?.satellites.find((row) => row.noradId === "49817");
    assert.equal(sat?.positionDisputed, false);
    const mark = buildGeoBelt().marks.find((row) => row.id === "norad-49817");
    assert.equal(mark?.operator, "US Space Force / DoD STP");
    assert.equal(model?.positionTrust.disputedSatellites.some((row) => row.noradId === "49817"), false);
  });

  it("marks EDRS-C catalog comments as a vintage source note", () => {
    const rows = mergeWithUcs(curatedSlots);
    const edrs = rows.find((row) => /EDRS-C/.test(row.satellite ?? "") || /EDRS-C/.test(row.description));
    assert.ok(edrs);
    assert.match(edrs.description, /UCS catalog note \(file vintage 2023-04-07\): Second of four planned platforms/);
    assert.doesNotMatch(edrs.description, /Second of four planned platforms\.(?!$)/);
  });
});
