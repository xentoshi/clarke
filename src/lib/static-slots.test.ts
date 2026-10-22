import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { slots as curatedSlots } from "@/data/orbital-slots";
import ChangesPage from "@/app/orbital/changes/page";
import { buildGeoBelt } from "./belt-data";
import { getRecentSlotEvents } from "./events";
import { buildExplorerRows } from "./explorer";
import { buildGeoSlotIndex } from "./geo-slot-index";
import { buildSearchIndex } from "./search-index";
import { getAllRegistrySlugs } from "./satellites";
import { formatLon, lonToSlug, registryOrbitalHref } from "./slot-utils";

describe("static slot pages", () => {
  const built = new Set(getAllRegistrySlugs(curatedSlots));

  it("prerenders every explorer row, belt mark, and index dossier", () => {
    for (const row of buildExplorerRows()) assert.ok(built.has(row.slug), row.slug);
    for (const mark of buildGeoBelt().marks) {
      assert.ok(built.has(mark.slug), mark.slug);
      assert.equal(mark.slotHref, `/orbital/${mark.slug}`);
    }
    for (const dossier of buildGeoSlotIndex().dossiers) assert.ok(built.has(dossier.slug), dossier.slug);
    assert.ok(built.size > 500);
  });

  it("ships a slim search index of built slugs only", () => {
    const index = buildSearchIndex();
    assert.ok(index.length >= 450);
    const allowed = new Set(["slug", "label", "operator", "operatorRaw", "country", "valueEstimate"]);
    for (const entry of index) {
      assert.ok(built.has(entry.slug), entry.slug);
      for (const key of Object.keys(entry)) assert.ok(allowed.has(key), key);
    }
    assert.ok(index.some((entry) => entry.slug === "101w"));
    assert.equal(JSON.stringify(index).includes("cosparIds"), false);
    assert.equal(JSON.stringify(index).includes("noradIds"), false);
  });

  it("does not link a changes longitude that has no static page", () => {
    assert.equal(registryOrbitalHref("101w", built), "/orbital/101w");
    assert.equal(registryOrbitalHref("not-a-slot", built), null);
    assert.equal(registryOrbitalHref(null, built), null);

    const html = renderToStaticMarkup(createElement(ChangesPage));
    const reserved = new Set(["/orbital", "/orbital/map", "/orbital/faq", "/orbital/changes", "/orbital/compare"]);
    for (const match of html.matchAll(/href="(\/orbital\/[^"#?]*)"/g)) {
      const href = match[1];
      if (reserved.has(href)) continue;
      assert.ok(built.has(href.slice("/orbital/".length)), href);
    }

    const missing = getRecentSlotEvents(100).find(
      (event) => event.longitudeGeo != null && !built.has(lonToSlug(event.longitudeGeo)),
    );
    assert.ok(missing?.longitudeGeo != null);
    const slug = lonToSlug(missing.longitudeGeo);
    assert.equal(html.includes(`href="/orbital/${slug}"`), false);
    assert.ok(html.includes(formatLon(missing.longitudeGeo)));
  });
});
