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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-16">
        <div className="text-white/30 text-[11px] font-mono tracking-[0.3em] uppercase mb-4">Clarke Blog</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white">Thinking on space infrastructure.</h1>
      </div>

      <div className="space-y-px bg-white/[0.04]">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group block bg-zinc-950 px-6 py-7 hover:bg-zinc-900/60 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[10px] font-mono text-white/25 tracking-widest uppercase">{post.tag}</span>
              <span className="text-white/10 text-xs">·</span>
              <span className="text-[10px] font-mono text-white/25">{formatDate(post.date)}</span>
              <span className="text-white/10 text-xs">·</span>
              <span className="text-[10px] font-mono text-white/25">{post.readingMinutes} min read</span>
            </div>
            <h2 className="text-white font-bold text-lg mb-2 group-hover:text-white/80 transition-colors leading-snug">
              {post.title}
            </h2>
            <p className="text-zinc-500 text-sm leading-relaxed">{post.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
