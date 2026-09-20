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
        className="text-muted text-sm hover:text-ink transition-colors"
      >
        ← Docs
      </Link>

      <div className="mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_13rem] lg:gap-16 xl:gap-24">
        <article className="min-w-0">
          <h1 className="text-3xl sm:text-4xl font-semibold text-ink tracking-tight mb-4">{doc.title}</h1>
          <div className="border border-line bg-surface px-4 py-4 mb-10">
            <div className="text-xs text-faint mb-2">Summary</div>
            <p className="text-muted text-sm leading-relaxed">{doc.tldr}</p>
          </div>
          {showLegend && <TrustLegend className="mb-10" />}
          <MarkdownBody html={doc.html} />

          <nav className="mt-14 pt-8 border-t border-line flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link href="/orbital/101w" className="text-ink hover:text-muted">
              101°W Terminal →
            </Link>
            <Link href="/index" className="text-muted hover:text-ink">
              GEO Slot Index →
            </Link>
            <Link href="/about#registry-methodology" className="text-muted hover:text-ink">
              About: registry methodology →
            </Link>
            {others.map((d) => (
              <Link key={d.href} href={d.href} className="text-muted hover:text-ink">
                {d.title} →
              </Link>
            ))}
          </nav>
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-10">
            {doc.toc.length > 0 && <TableOfContents items={doc.toc} />}
            <nav className="space-y-0.5">
              <div className="text-xs text-faint mb-4">Docs</div>
              {DOC_PAGES.map((d) => (
                <Link
                  key={d.href}
                  href={d.href}
                  className={`block py-1 text-sm leading-snug transition-colors ${
                    d.slug === doc.slug ? "text-ink" : "text-faint hover:text-ink"
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
