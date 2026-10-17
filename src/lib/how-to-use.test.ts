import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { HOW_TO_STEPS, HOW_TO_TITLE, howToStepText } from "./how-to-use";

const root = process.cwd();

describe("How to use Clarke", () => {
  const steps = HOW_TO_STEPS.map(howToStepText);
  const copy = `${HOW_TO_TITLE}\n${steps.join("\n")}`;

  it("is four one-sentence steps", () => {
    assert.equal(HOW_TO_TITLE, "How to use Clarke");
    assert.equal(steps.length, 4);
    for (const step of steps) {
      assert.equal(step.endsWith("."), true);
      assert.equal(/[!?]/.test(step), false);
      assert.equal(step.split(/\. (?=[A-Z])/).length, 1);
      assert.equal(step.includes("\u2014"), false);
      assert.equal(step.includes("\u2013"), false);
    }
  });

  it("names the registry, slot, export, and agent controls that exist", () => {
    assert.match(steps[0], /\/orbital/);
    assert.match(steps[0], /longitude window on the belt/);
    assert.match(steps[0], /operator chip under More/);
    assert.match(steps[0], /country in the search box/);
    assert.match(steps[1], /101°W/);
    assert.match(steps[1], /Slot Terminal/);
    assert.match(steps[1], /registry operator/);
    assert.match(steps[1], /FCC rows/);
    assert.match(steps[1], /Position disagreement/);
    assert.match(steps[2], /Download CSV/);
    assert.match(steps[2], /FCC licensed/);
    assert.match(steps[2], /Belt/);
    assert.match(steps[2], /operator chip/);
    assert.match(steps[3], /https:\/\/www\.clarkebelt\.finance\/api\/v1\/mcp/);
    assert.match(steps[3], /reads are open/);
    assert.match(steps[3], /\/llms\.txt/);
  });

  it("stays in plain language without slogan constructions", () => {
    assert.equal(copy.includes("\u2014"), false);
    assert.equal(copy.includes("\u2013"), false);
    assert.doesNotMatch(copy, /Bloomberg/i);
    assert.doesNotMatch(copy, /no API key/i);
    assert.doesNotMatch(copy, /does not need a key/i);
    assert.doesNotMatch(copy, /no fees/i);
    assert.doesNotMatch(copy, /lock-in/i);
    assert.doesNotMatch(copy, /FCC flags/i);
    assert.doesNotMatch(copy, /company map layer/i);
  });

  it("stays on the docs hub and off the registry hero", () => {
    const orbital = readFileSync(join(root, "src/app/orbital/page.tsx"), "utf8");
    const docs = readFileSync(join(root, "src/app/docs/page.tsx"), "utf8");
    const shell = readFileSync(join(root, "src/components/AppShell.tsx"), "utf8");
    const component = readFileSync(join(root, "src/components/HowToUse.tsx"), "utf8");
    assert.doesNotMatch(orbital, /HowToUse/);
    assert.match(docs, /HowToUse/);
    assert.match(shell, /How it works/);
    assert.match(shell, /\/docs#how-to-use-clarke/);
    assert.match(component, /HOW_TO_TITLE/);
    assert.match(component, /id="how-to-use-clarke"/);
  });
});
