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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
      <Link
        href="/docs"
        className="text-muted text-[14px] hover:text-ink transition-colors"
      >
        Docs
      </Link>

      <div className="mt-10 lg:grid lg:grid-cols-[minmax(0,40rem)_11rem] lg:gap-20 xl:gap-28">
        <article className="min-w-0">
          <h1 className="text-4xl sm:text-5xl font-semibold text-ink tracking-tight mb-6 leading-[1.12]">{doc.title}</h1>
          <p className="text-muted text-lg leading-relaxed mb-12">{doc.tldr}</p>
          {showLegend && <TrustLegend className="mb-12" />}
          <MarkdownBody html={doc.html} />

          <nav className="mt-16 pt-8 border-t border-line flex flex-wrap gap-x-5 gap-y-2 text-[14px]">
            <Link href="/orbital/101w" className="text-ink hover:text-muted">
              101°W Terminal
            </Link>
            <Link href="/index" className="text-muted hover:text-ink">
              GEO Slot Index
            </Link>
            <Link href="/about#registry-methodology" className="text-muted hover:text-ink">
              About: registry methodology
            </Link>
            {others.map((d) => (
              <Link key={d.href} href={d.href} className="text-muted hover:text-ink">
                {d.title}
              </Link>
            ))}
          </nav>
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-10 space-y-10">
            {doc.toc.length > 0 && <TableOfContents items={doc.toc} />}
            <nav className="space-y-0.5">
              <div className="text-[12px] text-faint mb-4">Docs</div>
              {DOC_PAGES.map((d) => (
                <Link
                  key={d.href}
                  href={d.href}
                  className={`block py-1 text-[14px] leading-snug transition-colors ${
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
