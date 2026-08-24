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
    slug: "fcc-part-100-space-modernization-order",
    title: "The FCC's Part 100 Order: The Reform's Biggest Test Case Is Exempt From the Reform",
    subtitle: "The FCC just made satellite licensing dramatically faster for almost everyone, while quietly confirming that the largest application in its history stays in the slow lane, and that the agency's authority to regulate orbital safety at all is now an open fight with Congress.",
    date: "2026-07-28",
    readingMinutes: 8,
    excerpt: "The FCC's new Part 100 rules replace decades-old satellite licensing with a faster, presumption-based process, but the megaconstellation filings that most justify the reform, including SpaceX's million-satellite orbital data center application, are excluded from its faster timelines. For the 522 GEO positions Clarke tracks, the order also creates the first mandatory cross-operator tracking-data regime, on legal authority Congress is actively contesting.",
    tag: "Regulatory",
  },
  {
    slug: "orbital-data-centers-engineering",
    title: "Orbital Data Centers: The Engineering Case",
    subtitle: "Hardware is already in orbit. NVIDIA released a dedicated space chip in March 2026. The question now is economics.",
    date: "2026-05-27",
    readingMinutes: 12,
    excerpt: "Terrestrial data centers face hard physical limits: power constraints, cooling water depletion, grid instability. Orbital data centers offer continuous solar at 95%+ capacity factor and radiative cooling with a PUE near 1.01. This report examines the technical, economic, and strategic case for when the math works.",
    tag: "Infrastructure",
  },
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
