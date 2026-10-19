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
      allow: ["/", "/api/v1/agents/slots", "/api/v1/mcp"],
      disallow: [
        "/api/og",
        "/api/pv",
        "/api/auth/",
        "/api/billing/",
        "/api/v1/keys",
        "/api/v1/terminal/",
        "/api/v1/agents/deltas",
        "/api/v1/agents/satellites",
        "/orbital/compare",
        "/account",
        "/login",
      ],
    },
    sitemap: `${siteOrigin()}/sitemap.xml`,
  };
}
