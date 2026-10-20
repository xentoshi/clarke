import fs from "fs";
import path from "path";
import React from "react";
import { ImageResponse } from "next/og";
import { slots as curatedSlots } from "../src/data/orbital-slots";
import { posts } from "../src/data/posts";
import { DOC_PAGES } from "../src/lib/docs";
import { getAllRegistrySlugs } from "../src/lib/satellites";
import { formatLon, slugToLon } from "../src/lib/slot-utils";
import { formatRegistryCensus, getRegistryCensus } from "../src/lib/registry-census";

const OUT = path.join(process.cwd(), "public", "og");

function card(title: string, tag: string, sub: string) {
  const children: React.ReactNode[] = [
    React.createElement(
      "div",
      { style: { display: "flex", color: "#f3f1eb", fontSize: 28, fontWeight: 600 } },
      "Clarke",
    ),
  ];
  if (tag) {
    children.push(
      React.createElement(
        "div",
        { style: { display: "flex", color: "#6e6c66", fontSize: 16, fontWeight: 500, marginTop: 24 } },
        tag.slice(0, 40),
      ),
    );
  }
  children.push(
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          color: "#f3f1eb",
          fontSize: 52,
          fontWeight: 600,
          lineHeight: 1.1,
          marginTop: tag ? 16 : 24,
        },
      },
      title.slice(0, 80),
    ),
  );
  if (sub) {
    children.push(
      React.createElement(
        "div",
        { style: { display: "flex", color: "#a8a59c", fontSize: 22, lineHeight: 1.4, marginTop: 20, maxWidth: 860 } },
        sub.slice(0, 140),
      ),
    );
  }
  return React.createElement(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: "60px",
        background: "#0b0c0e",
      },
    },
    ...children,
  );
}

async function png(title: string, tag: string, sub: string): Promise<Buffer> {
  const res = new ImageResponse(card(title, tag, sub), { width: 1200, height: 630 });
  return Buffer.from(await res.arrayBuffer());
}

async function write(rel: string, title: string, tag: string, sub: string) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, await png(title, tag, sub));
}

function slotLabel(slug: string): string {
  const lon = slugToLon(slug);
  if (lon === null) return slug;
  return formatLon(lon);
}

const censusLine = formatRegistryCensus(getRegistryCensus());

const PAGES: { file: string; title: string; tag: string; sub: string }[] = [
  { file: "default.png", title: "Clarke", tag: "Registry", sub: censusLine },
  { file: "page/orbital.png", title: "GEO registry", tag: "Registry", sub: censusLine },
  { file: "page/about.png", title: "About", tag: "Clarke", sub: censusLine },
  { file: "page/account.png", title: "Account", tag: "Account", sub: "Terminal seat and API key" },
  { file: "page/index.png", title: "GEO Slot Index", tag: "Index", sub: "Occupancy, FCC, and dispute changes" },
  { file: "page/login.png", title: "Sign in", tag: "Account", sub: "Free registry session" },
  { file: "page/changes.png", title: "What changed", tag: "Registry", sub: "FCC and relocation events" },
  { file: "page/compare.png", title: "Compare slots", tag: "Terminal", sub: "Up to four GEO positions" },
  { file: "page/faq.png", title: "Orbital Registry FAQ", tag: "FAQ", sub: "Sources, agents, and FCC records" },
  { file: "page/map.png", title: "GEO belt", tag: "Registry", sub: "TLE occupancy longitudes" },
  { file: "page/pricing.png", title: "Pricing", tag: "Pricing", sub: "Registry access is free. Paid seat by contact." },
  { file: "page/blog.png", title: "Blog", tag: "Clarke Blog", sub: "Space infrastructure notes" },
  { file: "page/docs.png", title: "Docs", tag: "Docs", sub: "Occupancy, agents, FCC, and models" },
];

async function main() {
  for (const page of PAGES) await write(page.file, page.title, page.tag, page.sub);
  for (const doc of DOC_PAGES) {
    await write(`page/docs-${doc.slug}.png`, doc.title, "Docs", doc.summary);
  }
  for (const post of posts) {
    await write(`blog/${post.slug}.png`, post.title, post.tag, post.excerpt);
  }
  const slugs = getAllRegistrySlugs(curatedSlots);
  for (const slug of slugs) {
    await write(`slot/${slug}.png`, slotLabel(slug), "Terminal", "GEO slot registry");
  }
  console.log(`wrote ${PAGES.length + DOC_PAGES.length + posts.length + slugs.length} OG images to public/og`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
