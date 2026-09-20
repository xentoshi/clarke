import { notFound } from "next/navigation";
import Link from "next/link";
import { getPost } from "@/data/posts";
import { buildMeta } from "@/lib/metadata";
import { TableOfContents } from "@/components/TableOfContents";
import FccPart100Post, { toc as fccPart100Toc } from "@/data/posts/content/fcc-part-100-space-modernization-order";
import IntelsatBankruptcyPost, { toc as intelsatBankruptcyToc } from "@/data/posts/content/intelsat-bankruptcy-orbital-real-estate";
import OrbitalDataCentersPost, { toc as orbitalDataCentersToc } from "@/data/posts/content/orbital-data-centers-engineering";
import DesigningForMarsPost, { toc as designingForMarsToc } from "@/data/posts/content/designing-for-mars";
import MultiplanetaryPost, { toc as multiplanetaryToc } from "@/data/posts/content/becoming-multiplanetary";
import type { TocItem } from "@/components/TableOfContents";

type ContentEntry = { Component: React.FC; toc: TocItem[] };

const contentMap: Record<string, ContentEntry> = {
  "fcc-part-100-space-modernization-order": { Component: FccPart100Post, toc: fccPart100Toc },
  "intelsat-bankruptcy-orbital-real-estate": { Component: IntelsatBankruptcyPost, toc: intelsatBankruptcyToc },
  "orbital-data-centers-engineering": { Component: OrbitalDataCentersPost, toc: orbitalDataCentersToc },
  "designing-for-mars": { Component: DesigningForMarsPost, toc: designingForMarsToc },
  "becoming-multiplanetary": { Component: MultiplanetaryPost, toc: multiplanetaryToc },
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
      <div className="mb-12">
        <Link href="/blog" className="text-muted text-[14px] hover:text-ink transition-colors">
          Blog
        </Link>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,40rem)_11rem] lg:gap-20 xl:gap-28">
        <div className="min-w-0">
          <header className="mb-14">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-[13px] text-faint">{post.tag}</span>
              <span className="text-faint text-[13px]">·</span>
              <span className="text-[13px] text-faint">{formatDate(post.date)}</span>
              <span className="text-faint text-[13px]">·</span>
              <span className="text-[13px] text-faint">{post.readingMinutes} min read</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold text-ink leading-[1.12] tracking-tight mb-5">{post.title}</h1>
            <p className="text-muted text-xl leading-relaxed">{post.subtitle}</p>
          </header>

          <article className="prose-clarke max-w-2xl">
            <Content />
          </article>
        </div>

        {toc.length > 0 && (
          <aside className="hidden lg:block">
            <div className="sticky top-10">
              <TableOfContents items={toc} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
