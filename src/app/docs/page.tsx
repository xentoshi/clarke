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
      <p className="text-zinc-600 text-xs font-mono mb-3">{"// DOCS"}</p>
      <h1 className="text-3xl font-bold text-white mb-4">Clarke Docs</h1>
      <p className="text-zinc-400 text-sm leading-relaxed mb-4">
        How to read occupancy, rights, freshness, and the labeled model.
      </p>
      <p className="text-zinc-500 text-sm leading-relaxed mb-8">
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
            className="group block border border-white/[0.06] rounded-sm bg-white/[0.02] px-5 py-6 hover:bg-white/[0.04] transition-colors"
          >
            <div className="text-[10px] font-mono text-white/25 tracking-widest uppercase mb-2">
              {doc.kicker}
            </div>
            <h2 className="text-white font-bold text-lg mb-2 group-hover:text-white/80 transition-colors">
              {doc.title}
            </h2>
            <p className="text-zinc-500 text-sm leading-relaxed">{doc.summary}</p>
          </Link>
        ))}
      </div>

      <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <Link href="/orbital/101w" className="text-white hover:text-zinc-300">
          101°W Terminal →
        </Link>
        <Link href="/index" className="text-zinc-500 hover:text-zinc-300">
          GEO Slot Index →
        </Link>
        <Link href="/about#registry-methodology" className="text-zinc-500 hover:text-zinc-300">
          About: registry methodology →
        </Link>
      </nav>
    </div>
  );
}
