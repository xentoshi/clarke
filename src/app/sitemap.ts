import type { MetadataRoute } from "next";
import { slots as curatedSlots } from "@/data/orbital-slots";
import { posts } from "@/data/posts";
import { DOC_PAGES } from "@/lib/docs";
import { registryGeneratedAt } from "@/lib/process-cache";
import { getAllRegistrySlugs } from "@/lib/satellites";

export const runtime = "nodejs";
// Slug list is the committed registry. One static file per deploy.
// lastModified is the ingest clock, so a rebuild does not mark every URL as changed.
export const dynamic = "force-static";
export const revalidate = false;

const RESERVED_SLOT_PATHS = new Set(["map", "faq", "compare", "changes"]);

function siteOrigin(): string {
  return (process.env.NEXT_PUBLIC_URL ?? "https://www.clarkebelt.finance").replace(/\/$/, "");
}

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOrigin();
  const modified = new Date(registryGeneratedAt());
  const paths = [
    "/orbital",
    "/orbital/map",
    "/orbital/faq",
    "/orbital/changes",
    "/index",
    "/about",
    "/pricing",
    "/blog",
    "/docs",
    ...DOC_PAGES.map((doc) => doc.href),
    ...posts.map((post) => `/blog/${post.slug}`),
    ...getAllRegistrySlugs(curatedSlots)
      .filter((slug) => !RESERVED_SLOT_PATHS.has(slug))
      .map((slug) => `/orbital/${slug}`),
  ];
  return paths.map((path) => ({
    url: `${origin}${path}`,
    lastModified: modified,
    changeFrequency: "monthly" as const,
    priority: path === "/orbital" ? 1 : 0.6,
  }));
}
