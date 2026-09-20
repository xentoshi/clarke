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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <p className="text-muted text-sm mb-2">Docs</p>
      <h1 className="text-3xl sm:text-4xl font-semibold text-ink tracking-tight mb-4">Clarke Docs</h1>
      <p className="text-ink text-lg leading-relaxed mb-4">
        How to read occupancy, rights, freshness, and the labeled model.
      </p>
      <p className="text-muted text-base leading-relaxed mb-8">
        Clarke is the registry for orbital infrastructure. These notes are the public methodology:
        what is verified from a named source, what is modeled, and what is quarantined behind
        Experimental on Slot Terminal.
      </p>

      <TrustLegend className="mb-10" />

      <div className="flex flex-col gap-3 mb-12">
        {DOC_PAGES.map((doc) => (
          <Link
            key={doc.href}
            href={doc.href}
            className="group block border border-line bg-surface px-5 py-6 hover:border-line-strong transition-colors"
          >
            <h2 className="text-ink font-semibold text-lg mb-2 group-hover:text-muted transition-colors">
              {doc.title}
            </h2>
            <p className="text-muted text-sm leading-relaxed">{doc.summary}</p>
          </Link>
        ))}
      </div>

      <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <Link href="/orbital/101w" className="text-ink hover:text-muted">
          101°W Terminal →
        </Link>
        <Link href="/index" className="text-muted hover:text-ink">
          GEO Slot Index →
        </Link>
        <Link href="/about#registry-methodology" className="text-muted hover:text-ink">
          About: registry methodology →
        </Link>
      </nav>
    </div>
  );
}
