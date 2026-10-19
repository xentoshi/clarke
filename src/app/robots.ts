import type { MetadataRoute } from "next";

// Allow rules do not change between deploys.
export const revalidate = false;

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
