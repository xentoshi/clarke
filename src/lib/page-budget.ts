import fs from "fs";
import path from "path";

// Pre-change /orbital/101w was 410081 bytes of HTML and 332251 bytes of RSC,
// because the root layout embedded all 463 registry rows. After that payload
// left the shell, the busiest slot page was about 116 KB HTML and 64 KB RSC.
// Headroom covers a fuller terminal. It still fails if the registry comes back.
export const SLOT_HTML_BUDGET = 160_000;
export const SLOT_RSC_BUDGET = 96_000;
const SLOT_FILE = /^(\d+(?:-\d)?[ew])\.(html|rsc)$/;
const REGISTRY_MARKER = "Most heavily loaded orbital";
const COSPAR_LIMIT = 40;

export interface SlotPageSize {
  slug: string;
  html: number;
  rsc: number;
  cosparIds: number;
  embedsRegistry: boolean;
}

export function slotPageDir(root = process.cwd()): string {
  return path.join(root, ".next", "server", "app", "orbital");
}

export function measureSlotPages(root = process.cwd()): SlotPageSize[] {
  const dir = slotPageDir(root);
  const slugs = new Set<string>();
  for (const name of fs.readdirSync(dir)) {
    const match = name.match(SLOT_FILE);
    if (match) slugs.add(match[1]);
  }
  return [...slugs].sort().map((slug) => {
    const htmlPath = path.join(dir, `${slug}.html`);
    const rscPath = path.join(dir, `${slug}.rsc`);
    const html = fs.readFileSync(htmlPath, "utf8");
    return {
      slug,
      html: Buffer.byteLength(html),
      rsc: fs.statSync(rscPath).size,
      cosparIds: html.split("cosparIds").length - 1,
      embedsRegistry: html.includes(REGISTRY_MARKER),
    };
  });
}

export function pageBudgetViolations(root = process.cwd()): string[] {
  const dir = slotPageDir(root);
  if (!fs.existsSync(dir)) {
    return ["next build output is missing (.next/server/app/orbital). Run next build first."];
  }
  const pages = measureSlotPages(root);
  const violations: string[] = [];
  if (pages.length < 400) {
    violations.push(`expected at least 400 prerendered slot pages, found ${pages.length}`);
  }
  for (const page of pages) {
    if (page.html > SLOT_HTML_BUDGET) {
      violations.push(`/orbital/${page.slug} HTML is ${page.html} bytes (budget ${SLOT_HTML_BUDGET})`);
    }
    if (page.rsc > SLOT_RSC_BUDGET) {
      violations.push(`/orbital/${page.slug} RSC is ${page.rsc} bytes (budget ${SLOT_RSC_BUDGET})`);
    }
    if (page.cosparIds > COSPAR_LIMIT) {
      violations.push(`/orbital/${page.slug} HTML contains cosparIds ${page.cosparIds} times`);
    }
    if (page.embedsRegistry) {
      violations.push(`/orbital/${page.slug} HTML embeds the full registry marker`);
    }
  }
  const manifestPath = path.join(root, ".next", "prerender-manifest.json");
  if (!fs.existsSync(manifestPath)) {
    violations.push("prerender-manifest.json is missing");
  } else {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
      dynamicRoutes?: Record<string, { fallback?: unknown }>;
    };
    const dynamicRoutes = manifest.dynamicRoutes ?? {};
    if (dynamicRoutes["/orbital/[slot]"]?.fallback !== false) {
      violations.push("/orbital/[slot] is not fallback:false, so unknown slugs can render on demand");
    }
    if (dynamicRoutes["/blog/[slug]"]?.fallback !== false) {
      violations.push("/blog/[slug] is not fallback:false, so unknown slugs can render on demand");
    }
    if (dynamicRoutes["/slot/[slug]"]) {
      violations.push("/slot/[slug] is still a prerendered route");
    }
  }
  const indexPath = path.join(root, "public", "search-index.json");
  if (!fs.existsSync(indexPath)) {
    violations.push("public/search-index.json is missing. Run scripts/build-search-index.ts before next build.");
  } else {
    const raw = fs.readFileSync(indexPath, "utf8");
    if (raw.length > 200_000) violations.push(`search-index.json is ${raw.length} bytes`);
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length < 400) {
      violations.push("search-index.json is not a list of registry rows");
    } else if (parsed.some((row) => row && typeof row === "object" && ("description" in row || "cosparIds" in row || "noradIds" in row))) {
      violations.push("search-index.json includes full slot records");
    }
  }
  return violations;
}
