import type { NextConfig } from "next";

const DATABASE_FILES = ["./data/clarke.db", "./data/terminal.db"];

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  serverExternalPackages: ["better-sqlite3", "satellite.js"],
  outputFileTracingIncludes: {
    "/docs": ["./docs/*.md"],
    "/docs/**": ["./docs/*.md"],
  },
  // Large files that runtime routes do not read.
  // clarke.db stays on the agent, MCP, and terminal functions, which open it.
  // HTML for slots, blog, and docs is baked at build. Unknown URLs 404, so the
  // database is not traced into those functions. ssal.xlsx is an ingest input.
  outputFileTracingExcludes: {
    "*": [
      "./data/ssal.xlsx",
      "./public/og/**/*",
      "./public/data/**/*",
    ],
    "/api/v1/agents/**": ["./data/terminal.db"],
    "/api/v1/mcp": ["./data/terminal.db"],
    "/api/v1/openapi": ["./data/terminal.db", "./data/clarke.db"],
    "/api/v1/keys": DATABASE_FILES,
    "/api/auth/**": DATABASE_FILES,
    "/api/billing/**": DATABASE_FILES,
    "/account": DATABASE_FILES,
    "/login": DATABASE_FILES,
    "/about": DATABASE_FILES,
    "/pricing": DATABASE_FILES,
    "/index": DATABASE_FILES,
    "/blog": DATABASE_FILES,
    "/blog/**": DATABASE_FILES,
    "/docs": DATABASE_FILES,
    "/docs/**": DATABASE_FILES,
    "/orbital": DATABASE_FILES,
    "/orbital/**": DATABASE_FILES,
    "/sitemap.xml": DATABASE_FILES,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.nasa.gov" },
      { protocol: "https", hostname: "www.nasa.gov" },
      { protocol: "https", hostname: "live.staticflickr.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "www.esa.int" },
    ],
  },
  async redirects() {
    return [
      { source: "/", destination: "/orbital", permanent: true },
      // Alias used to prerender one redirect page per slot, each with the full layout body.
      { source: "/slot/:slug", destination: "/orbital/:slug", permanent: true },
      { source: "/research", destination: "/index", permanent: false },
      { source: "/data", destination: "/about", permanent: true },
      { source: "/api/og", destination: "/og/default.png", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/robots.txt",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        source: "/sitemap.xml",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        source: "/data/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=31536000" },
        ],
      },
      {
        source: "/llms.txt",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        source: "/og/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, s-maxage=604800" },
        ],
      },
      {
        source: "/search-index.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },
};

export default nextConfig;
