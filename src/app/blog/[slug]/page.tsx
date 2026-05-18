import { notFound } from "next/navigation";
import Link from "next/link";
import { getPost } from "@/data/posts";
import { buildMeta } from "@/lib/metadata";
import { TableOfContents } from "@/components/TableOfContents";
import IntelsatBankruptcyPost, { toc as intelsatBankruptcyToc } from "@/data/posts/content/intelsat-bankruptcy-orbital-real-estate";
import type { TocItem } from "@/components/TableOfContents";

type ContentEntry = { Component: React.FC; toc: TocItem[] };

const contentMap: Record<string, ContentEntry> = {
  "intelsat-bankruptcy-orbital-real-estate": { Component: IntelsatBankruptcyPost, toc: intelsatBankruptcyToc },
};

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return buildMeta({ title: post.title, description: post.excerpt, tag: post.tag });
}

export async function generateStaticParams() {
  const { posts } = await import("@/data/posts");
  return posts.map((p) => ({ slug: p.slug }));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const entry = contentMap[slug];
  if (!entry) notFound();

  const { Component: Content, toc } = entry;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-12">
        <Link href="/blog" className="text-white/30 text-xs font-mono hover:text-white/60 transition-colors">
          ← Blog
        </Link>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_200px] lg:gap-16 xl:gap-24">
        <div className="min-w-0">
          <header className="mb-12 max-w-2xl">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-[10px] font-mono text-white/25 tracking-widest uppercase">{post.tag}</span>
              <span className="text-white/10 text-xs">·</span>
              <span className="text-[10px] font-mono text-white/25">{formatDate(post.date)}</span>
              <span className="text-white/10 text-xs">·</span>
              <span className="text-[10px] font-mono text-white/25">{post.readingMinutes} min read</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">{post.title}</h1>
            <p className="text-zinc-400 text-lg leading-relaxed">{post.subtitle}</p>
          </header>

          <article className="prose-clarke max-w-2xl">
            <Content />
          </article>
        </div>

        {toc.length > 0 && (
          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <TableOfContents items={toc} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
