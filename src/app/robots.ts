import type { MetadataRoute } from "next";

export const revalidate = 3600;

function siteOrigin(): string {
  return (process.env.NEXT_PUBLIC_URL ?? "https://www.clarkebelt.finance").replace(/\/$/, "");
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteOrigin()}/sitemap.xml`,
  };
}
