import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3001";

export function buildMeta({
  title,
  description,
  tag = "",
}: {
  title: string;
  description: string;
  tag?: string;
}): Metadata {
  const fullTitle = `${title} · Clarke`;
  const ogUrl = `${baseUrl}/api/og?title=${encodeURIComponent(title)}&sub=${encodeURIComponent(description)}&tag=${encodeURIComponent(tag)}`;

  return {
    title: fullTitle,
    description,
    openGraph: {
      title: fullTitle,
      description,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: title }],
      siteName: "Clarke",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogUrl],
    },
  };
}
