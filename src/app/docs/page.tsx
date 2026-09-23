import { buildMeta } from "@/lib/metadata";
import Link from "next/link";
import { DOC_PAGES } from "@/lib/docs";
import { TrustLegend } from "@/components/docs/TrustLegend";

export const metadata = buildMeta({
  title: "Docs",
  description:
    "Clarke Docs: how to read occupancy, rights, freshness, and the labeled model on Slot Terminal.",
  tag: "Docs",
  path: "/docs",
});

export default function DocsHubPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-12 pb-16">
      <p className="text-muted text-[13px] mb-2">Docs</p>
      <h1 className="text-3xl font-semibold text-ink tracking-tight mb-3">Clarke Docs</h1>
      <p className="text-muted text-[15px] leading-relaxed mb-4">
        Method notes for occupancy, rights, freshness, and the labeled model.
        Verified sources, modeled dollars, and what stays off the default Terminal.
      </p>

      <TrustLegend className="mb-5" />

      <div className="divide-y divide-line border-y border-line mb-10">
        {DOC_PAGES.map((doc) => (
          <Link
            key={doc.href}
            href={doc.href}
            className="group block py-4"
          >
            <h2 className="text-ink font-semibold text-xl tracking-tight mb-2 group-hover:text-muted transition-colors">
              {doc.title}
            </h2>
            <p className="text-muted text-[16px] leading-relaxed">{doc.summary}</p>
          </Link>
        ))}
      </div>

      <nav className="flex flex-wrap gap-x-5 gap-y-2 text-[14px]">
        <Link href="/orbital/101w" className="text-ink hover:text-muted">
          101°W Terminal
        </Link>
        <Link href="/index" className="text-muted hover:text-ink">
          GEO Slot Index
        </Link>
        <Link href="/about#registry-methodology" className="text-muted hover:text-ink">
          About: registry methodology
        </Link>
      </nav>
    </div>
  );
}
