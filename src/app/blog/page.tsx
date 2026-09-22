import type { Metadata } from "next";
import Link from "next/link";
import { posts } from "@/data/posts";
import { buildMeta } from "@/lib/metadata";

export const metadata: Metadata = buildMeta({
  title: "Blog",
  description: "Thinking on space infrastructure, orbital economics, and the companies building the multiplanetary stack.",
  tag: "Clarke Blog",
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function BlogPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20">
      <div className="mb-16">
        <div className="text-muted text-[14px] mb-3">Blog</div>
        <h1 className="text-4xl sm:text-5xl font-semibold text-ink tracking-tight leading-[1.12]">Thinking on space infrastructure.</h1>
      </div>

      <div className="divide-y divide-line border-y border-line">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group block bg-transparent px-0 py-8 hover:bg-surface/80 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs text-faint">{post.tag}</span>
              <span className="text-faint text-xs">·</span>
              <span className="text-xs text-faint">{formatDate(post.date)}</span>
              <span className="text-faint text-xs">·</span>
              <span className="text-xs text-faint">{post.readingMinutes} min read</span>
            </div>
            <h2 className="text-ink font-semibold text-lg mb-2 group-hover:text-muted transition-colors leading-snug">
              {post.title}
            </h2>
            <p className="text-muted text-sm leading-relaxed">{post.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
