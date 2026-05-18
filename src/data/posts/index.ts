export interface Post {
  slug: string;
  title: string;
  subtitle: string;
  date: string;
  readingMinutes: number;
  excerpt: string;
  tag: string;
}

export const posts: Post[] = [
  {
    slug: "intelsat-bankruptcy-orbital-real-estate",
    title: "What the Intelsat Bankruptcy Revealed About Orbital Real Estate",
    subtitle: "A company filed for Chapter 11 with $14.8 billion in debt. Its orbital slot portfolio survived intact and sold for $3.1 billion three years later.",
    date: "2026-05-19",
    readingMinutes: 7,
    excerpt: "On May 13, 2020, Intelsat filed for Chapter 11 with $14.8 billion in debt. Through two years of restructuring, its orbital slot portfolio emerged intact. SES acquired it for $3.1 billion in 2025. The sequence reveals something fundamental about what makes these positions valuable, and what Clarke is built to price.",
    tag: "Market Intelligence",
  },
];

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}
