import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { OPERATOR_ALIAS_ENTRIES } from "@/data/operator-aliases";
import {
  normalizeOperatorKey,
  resolveOperator,
  operatorDisplay,
  operatorMatchesQuery,
  listedOperatorCanonicals,
} from "./operator-identity";
import { summarizeOperators, formatOperatorMix } from "./operator-mix";
import { ituPresence, ITU_RECORDED_DEFAULT } from "./itu-presence";
import { buildSlotTerminal } from "./slot-terminal";
import { getSlotDossier } from "./agents/operations";

describe("operator identity (curated alias map)", () => {
  it("canonicalizes the messy UCS/FCC strings called out for GEO", () => {
    const cases: [string, string][] = [
      ["DirecTV, Inc.", "DirecTV"],
      ["DIRECTV Enterprises, LLC", "DirecTV"],
      ["AT&T", "DirecTV"],
      ["LightSquared", "Ligado"],
      ["Ligado Networks Subsidiary, LLC, Debtor-in-Possession", "Ligado"],
      ["Mobile Satellite Ventures", "Ligado"],
      ["SES S.A.", "SES"],
      ["SES Americom, Inc.", "SES"],
      ["New Skies Satellites B.V.", "SES"],
      ["Intelsat S.A.", "Intelsat"],
      ["Intelsat License LLC", "Intelsat"],
      ["PanAmSat (Intelsat S.A.)", "Intelsat"],
      ["EUTELSAT S.A.", "Eutelsat"],
      ["EUTELSAT Americas", "Eutelsat"],
      ["ES 172 LLC", "Eutelsat"],
      ["Astranis Projects USA LLC", "Astranis"],
      ["Sky Perfect JSAT Corporation", "Sky Perfect JSAT"],
      ["DoD/US Navy", "US DoD"],
      ["US Air Force", "US DoD"],
      ["U.S. Space Force/Other Transaction Authority", "US DoD"],
      ["Federal Government (Reserved)", "US DoD"],
    ];
    for (const [raw, canonical] of cases) {
      const r = resolveOperator(raw);
      assert.equal(r.display, canonical, `${raw} -> ${canonical}`);
      assert.equal(r.mapped, true);
      assert.equal(r.raw, raw);
      assert.ok(r.aliases.length > 0);
    }
  });

  it("does not invent a joint-venture owner for slash strings unless listed", () => {
    const joint = resolveOperator("EUTELSAT S.A./Nilesat");
    assert.equal(joint.mapped, false);
    assert.equal(joint.display, "EUTELSAT S.A./Nilesat");
    const listedSlash = resolveOperator("DoD/US Navy");
    assert.equal(listedSlash.display, "US DoD");
  });

  it("keeps unmapped operators as the trimmed source string", () => {
    const r = resolveOperator("  Gazprom Space Systems  ");
    assert.equal(r.mapped, false);
    assert.equal(r.display, "Gazprom Space Systems");
    assert.equal(r.raw, "Gazprom Space Systems");
  });

  it("matches queries on canonical, alias, and raw", () => {
    assert.equal(operatorMatchesQuery("LightSquared", "ligado"), true);
    assert.equal(operatorMatchesQuery("DirecTV, Inc.", "directv"), true);
    assert.equal(operatorMatchesQuery("SES S.A.", "ses"), true);
    assert.equal(operatorMatchesQuery("Gazprom Space Systems", "intelsat"), false);
  });

  it("has unique normalized alias keys across the map", () => {
    const seen = new Map<string, string>();
    for (const entry of OPERATOR_ALIAS_ENTRIES) {
      for (const label of [entry.canonical, ...entry.aliases]) {
        const key = normalizeOperatorKey(label);
        const prev = seen.get(key);
        if (prev && prev !== entry.canonical) {
          assert.fail(`key "${key}" from "${label}" collides: ${prev} vs ${entry.canonical}`);
        }
        seen.set(key, entry.canonical);
      }
    }
    assert.ok(listedOperatorCanonicals().includes("SES"));
    assert.ok(listedOperatorCanonicals().includes("Ligado"));
    assert.equal(operatorDisplay("SES S.A."), "SES");
  });
});

describe("operator mix grouping", () => {
  it("rolls DirecTV / SES / Ligado variants into one calm mix", () => {
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
    assert.deepEqual(mix[0].operatorRaw, ["DirecTV, Inc."]);
    assert.equal(mix.find((m) => m.operator === "SES")?.count, 2);
    const ligado = mix.find((m) => m.operator === "Ligado");
    assert.equal(ligado?.count, 2);
    assert.ok(ligado?.operatorRaw.includes("LightSquared"));
    assert.ok(ligado?.operatorRaw.includes("Mobile Satellite Ventures"));
    assert.match(formatOperatorMix(mix, 7), /DirecTV 3\/7/);
    assert.match(formatOperatorMix(mix, 7), /SES 2\/7/);
    assert.match(formatOperatorMix(mix, 7), /Ligado 2\/7/);
  });
});

describe("ITU presence", () => {
  it("defaults every slot to not_in_product with honest copy", () => {
    const p = ituPresence();
    assert.equal(p.ituRecorded, ITU_RECORDED_DEFAULT);
    assert.equal(p.ituRecorded, "not_in_product");
    assert.match(p.label, /not recorded in Clarke/i);
    assert.match(p.chip, /Unrecorded in Clarke/);
    assert.doesNotMatch(p.detail, /brought into use as recorded/i);
    assert.doesNotMatch(p.detail, /network name/i);
  });
});

describe("live 101°W identity (clarke.db)", () => {
  it("shows a canonical operator mix and does not fill an ITU deed", () => {
    const model = buildSlotTerminal("101w");
    assert.ok(model);
    assert.equal(model.operator, "SES");
    assert.equal(model.ituRecorded, "not_in_product");
    const names = model.operatorMix.map((m) => m.operator);
    for (const banned of ["DirecTV, Inc.", "SES S.A.", "LightSquared"]) {
      assert.ok(!names.includes(banned), `mix still has raw string ${banned}`);
    }
    assert.ok(names.includes("SES") || names.includes("DirecTV") || names.includes("Ligado") || names.includes("Sky Perfect JSAT"));
    assert.ok(model.operatorMix.some((m) => m.operatorRaw.some((r) => r !== m.operator)));
    const itu = model.rightsChain.find((l) => l.layer === "itu");
    assert.equal(itu?.status, "stub");
    assert.equal(itu?.holder, "Not recorded in Clarke");
    assert.doesNotMatch(itu?.detail ?? "", /INTELSAT 10-02|network [A-Z]{3}/);

    const dossier = getSlotDossier("101w");
    assert.ok(dossier);
    assert.equal(dossier.ituRecorded, "not_in_product");
    assert.ok(dossier.fccAuthorizations.some((a) => a.licenseeCanonical && a.licenseeRaw && a.licenseeCanonical !== a.licenseeRaw));
  });
});
