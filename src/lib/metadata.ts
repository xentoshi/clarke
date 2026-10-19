import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3001";

export function buildMeta({
  title,
  description,
  tag = "",
  path,
  image = "/og/default.png",
}: {
  title: string;
  description: string;
  tag?: string;
  path?: string;
  /** Static file under public/. Built by scripts/build-og.tsx. */
  image?: string;
}): Metadata {
  const fullTitle = `${title} · Clarke`;
  const ogUrl = image.startsWith("http") ? image : `${baseUrl}${image}`;

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: path ? `${baseUrl}${path}` : baseUrl,
    },
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
