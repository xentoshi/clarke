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
    slug: "orbital-data-centers-engineering",
    title: "Orbital Data Centers: The Engineering Reality",
    subtitle: "Whoever controls this frontier will have sovereignty over the next generation of computing resources and intelligence.",
    date: "2026-05-14",
    readingMinutes: 16,
    excerpt: "Starcloud flew an H100 in November 2025. NVIDIA released a space chip in March 2026. China has been running orbital AI compute for over 1,000 days. The race is underway. This report assesses the engineering, economics, and geopolitics behind it — from thermodynamics and radiation hardening to the $100/kg threshold where orbital facilities reach cost parity with ground data centers.",
    tag: "Orbital Infrastructure",
  },
  {
    slug: "designing-for-mars",
    title: "How to Design for Mars",
    subtitle: "Mars gives architects a set of constraints unlike anything on Earth. Here is what those constraints actually demand.",
    date: "2026-05-13",
    readingMinutes: 10,
    excerpt:
      "Radiation, pressure differentials, toxic dust, temperature swings of 100 degrees in a day, and years of isolation with no evacuation option. Mars hands architects a brief that Earth-trained intuitions handle badly. Understanding the constraints is understanding what the building must do.",
    tag: "Design",
  },
  {
    slug: "becoming-multiplanetary",
    title: "Becoming a Multiplanetary Species: First Principles",
    subtitle: "The constraint chain from launch to civilization, and the companies building each layer.",
    date: "2026-05-13",
    readingMinutes: 20,
    excerpt:
      "Earth is one planet orbiting one star. Every extinction risk has a single point of failure. A species on two planets has a backup. On many planets, it is nearly indestructible. Here is the constraint chain that gets us there, and what is actually being built today.",
    tag: "Space Infrastructure",
  },
];

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}
