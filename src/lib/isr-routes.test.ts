import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";

function source(rel: string): string {
  return fs.readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("ISR write guards", () => {
  it("keeps bundled registry pages and metadata routes fully static", () => {
    for (const file of [
      "src/app/orbital/page.tsx",
      "src/app/orbital/[slot]/page.tsx",
      "src/app/orbital/map/page.tsx",
      "src/app/orbital/compare/page.tsx",
      "src/app/orbital/changes/page.tsx",
      "src/app/pricing/page.tsx",
      "src/app/robots.ts",
      "src/app/sitemap.ts",
    ]) {
      const text = source(file);
      assert.match(text, /export const revalidate = false/, file);
      assert.doesNotMatch(text, /export const revalidate = \d+/, file);
    }
  });

  it("does not opt public agent reads into route-level ISR", () => {
    for (const file of [
      "src/app/api/v1/agents/slots/route.ts",
      "src/app/api/v1/agents/slots/[slug]/route.ts",
      "src/app/api/v1/agents/satellites/route.ts",
      "src/app/api/v1/agents/deltas/route.ts",
    ]) {
      const text = source(file);
      assert.match(text, /export const dynamic = "force-dynamic"/, file);
      assert.doesNotMatch(text, /export const revalidate/, file);
    }
  });

  it("has no route-level fetch revalidate and leaves llms.txt as a static file", () => {
    const root = process.cwd();
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === "node_modules" || entry.name === ".next") continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) files.push(full);
      }
    };
    walk(path.join(root, "src"));
    for (const file of files) {
      const text = fs.readFileSync(file, "utf8");
      assert.doesNotMatch(text, /next:\s*\{[^}]*revalidate/, path.relative(root, file));
    }
    assert.equal(fs.existsSync(path.join(root, "public/llms.txt")), true);
    assert.equal(fs.existsSync(path.join(root, "src/app/llms.txt/route.ts")), false);
  });

  it("does not run a global proxy and does not trace bulky static files into functions", () => {
    for (const file of ["src/proxy.ts", "src/middleware.ts", "proxy.ts", "middleware.ts", "src/app/api/og/route.tsx", "src/app/api/pv/route.ts"]) {
      assert.equal(fs.existsSync(path.join(process.cwd(), file)), false, file);
    }
    const config = source("next.config.ts");
    assert.match(config, /\/api\/og/);
    assert.match(config, /ssal\.xlsx/);
    assert.match(config, /terminal\.db/);
    assert.equal(fs.existsSync(path.join(process.cwd(), "public/clarke.db")), false);
    assert.equal(fs.existsSync(path.join(process.cwd(), "public/ssal.xlsx")), false);
    assert.doesNotMatch(source("src/lib/metadata.ts"), /\/api\/og/);
    assert.doesNotMatch(source("src/app/layout.tsx"), /\/api\/pv/);
    const robots = source("src/app/robots.ts");
    assert.match(robots, /\/api\/v1\/agents\/slots/);
    assert.match(robots, /\/api\/v1\/mcp/);
    assert.match(robots, /\/orbital\/compare/);
    assert.match(robots, /\/api\/v1\/agents\/deltas/);
  });
});
