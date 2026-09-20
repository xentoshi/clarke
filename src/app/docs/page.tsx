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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20">
      <p className="text-muted text-[14px] mb-3">Docs</p>
      <h1 className="text-4xl sm:text-5xl font-semibold text-ink tracking-tight mb-6">Clarke Docs</h1>
      <p className="text-ink text-xl leading-relaxed mb-5">
        How to read occupancy, rights, freshness, and the labeled model.
      </p>
      <p className="text-muted text-lg leading-relaxed mb-10">
        Clarke is the registry for orbital infrastructure. These notes are the public methodology:
        what is verified from a named source, what is modeled, and what is quarantined behind
        Experimental on Slot Terminal.
      </p>

      <TrustLegend className="mb-14" />

      <div className="divide-y divide-line border-y border-line mb-14">
        {DOC_PAGES.map((doc) => (
          <Link
            key={doc.href}
            href={doc.href}
            className="group block py-8"
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
