import Link from "next/link";
import { TableOfContents } from "@/components/TableOfContents";
import { DOC_PAGES, type LoadedDoc } from "@/lib/docs";
import { TrustLegend } from "@/components/docs/TrustLegend";

function MarkdownBody({ html }: { html: string }) {
  return <div className="prose-docs" dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function DocArticle({ doc, showLegend = false }: { doc: LoadedDoc; showLegend?: boolean }) {
  const others = DOC_PAGES.filter((d) => d.slug !== doc.slug);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <Link
        href="/docs"
        className="text-white/30 text-xs font-mono hover:text-white/60 transition-colors"
      >
        ← Docs
      </Link>

      <div className="mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_13rem] lg:gap-16 xl:gap-24">
        <article className="min-w-0">
          <p className="text-zinc-600 text-xs font-mono mb-3">{`// ${doc.kicker}`}</p>
          <h1 className="text-3xl font-bold text-white mb-4">{doc.title}</h1>
          <div className="border border-white/[0.06] rounded-sm bg-white/[0.02] px-4 py-3 mb-10">
            <div className="text-[10px] font-mono text-white/30 tracking-[0.2em] uppercase mb-2">TL;DR</div>
            <p className="text-zinc-400 text-sm leading-relaxed">{doc.tldr}</p>
          </div>
          {showLegend && <TrustLegend className="mb-10" />}
          <MarkdownBody html={doc.html} />

          <nav className="mt-14 pt-8 border-t border-white/[0.06] flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link href="/orbital/101w" className="text-white hover:text-zinc-300">
              101°W Terminal →
            </Link>
            <Link href="/index" className="text-zinc-500 hover:text-zinc-300">
              GEO Slot Index →
            </Link>
            <Link href="/about#registry-methodology" className="text-zinc-500 hover:text-zinc-300">
              About: registry methodology →
            </Link>
            {others.map((d) => (
              <Link key={d.href} href={d.href} className="text-zinc-500 hover:text-zinc-300">
                {d.title} →
              </Link>
            ))}
          </nav>
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-10">
            {doc.toc.length > 0 && <TableOfContents items={doc.toc} />}
            <nav className="space-y-0.5">
              <div className="text-[10px] font-mono text-white/20 tracking-[0.2em] uppercase mb-4">Docs</div>
              {DOC_PAGES.map((d) => (
                <Link
                  key={d.href}
                  href={d.href}
                  className={`block py-1 text-xs leading-snug transition-colors ${
                    d.slug === doc.slug ? "text-white" : "text-white/25 hover:text-white/60"
                  }`}
                >
                  {d.title}
                </Link>
              ))}
            </nav>
          </div>
        </aside>
      </div>
    </div>
  );
}
