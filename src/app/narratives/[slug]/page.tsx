import { notFound } from "next/navigation";
import Link from "next/link";
import { buildMeta } from "@/lib/metadata";
import {
  narratives,
  convictionColors,
  convictionLabels,
  horizonColors,
  horizonLabels,
} from "@/data/narratives";
import { companies } from "@/data/companies";
import { format } from "date-fns";

export function generateStaticParams() {
  return narratives.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const n = narratives.find((n) => n.slug === slug);
  if (!n) return {};
  return buildMeta({ title: n.title, description: n.tagline, tag: "Narratives" });
}

export default async function NarrativePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const n = narratives.find((n) => n.slug === slug);
  if (!n) notFound();

  const idx = narratives.findIndex((x) => x.slug === slug);
  const prev = narratives[idx - 1];
  const next = narratives[idx + 1];

  const linkedCompanies = companies.filter((c) =>
    n.keyPrivate.some((p) => c.name.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(c.name.toLowerCase()))
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-zinc-600 mb-8 font-mono">
        <Link href="/narratives" className="hover:text-zinc-400 transition-colors">Narratives</Link>
        <span>/</span>
        <span className="text-zinc-500">N{String(idx + 1).padStart(2, "0")}</span>
      </div>

      {/* Header */}
      <div className="mb-10">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${convictionColors[n.conviction]}`}>
            {convictionLabels[n.conviction]}
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${horizonColors[n.horizon]}`}>
            {horizonLabels[n.horizon]}
          </span>
          {n.verticals.map((v) => (
            <span key={v} className="text-xs text-zinc-600 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
              {v}
            </span>
          ))}
        </div>
        <h1 className="text-3xl font-bold text-white mb-3 leading-tight">{n.title}</h1>
        <p className="text-zinc-400 text-lg leading-relaxed">{n.tagline}</p>
      </div>

      {/* Thesis */}
      <div className="mb-10">
        <div className="text-zinc-600 text-xs font-mono mb-4">// THESIS</div>
        <p className="text-zinc-300 text-sm leading-relaxed border-l-2 border-zinc-800 pl-5">
          {n.thesis}
        </p>
      </div>

      {/* Catalysts + Risks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        <div>
          <div className="text-zinc-600 text-xs font-mono mb-4">// CATALYSTS</div>
          <div className="space-y-2">
            {n.catalysts.map((c, i) => (
              <div key={i} className="flex items-start gap-3 border border-zinc-800/50 rounded-lg p-3 bg-zinc-900/10">
                <span className="text-emerald-500 text-xs font-mono mt-0.5 shrink-0">↑</span>
                <p className="text-zinc-400 text-xs leading-relaxed">{c}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-zinc-600 text-xs font-mono mb-4">// RISKS</div>
          <div className="space-y-2">
            {n.risks.map((r, i) => (
              <div key={i} className="flex items-start gap-3 border border-zinc-800/50 rounded-lg p-3 bg-zinc-900/10">
                <span className="text-red-500 text-xs font-mono mt-0.5 shrink-0">↓</span>
                <p className="text-zinc-400 text-xs leading-relaxed">{r}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key companies */}
      <div className="mb-10">
        <div className="text-zinc-600 text-xs font-mono mb-4">// KEY_POSITIONS</div>

        {n.keyTickers.length > 0 && (
          <div className="mb-4">
            <div className="text-zinc-600 text-xs mb-2">Public</div>
            <div className="flex flex-wrap gap-2">
              {n.keyTickers.map((t) => (
                <a
                  key={t}
                  href={`https://www.tradingview.com/symbols/${t}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-white bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded hover:border-zinc-500 transition-colors"
                >
                  {t}
                </a>
              ))}
            </div>
          </div>
        )}

        {n.keyPrivate.length > 0 && (
          <div>
            <div className="text-zinc-600 text-xs mb-2">Private</div>
            <div className="flex flex-wrap gap-2">
              {n.keyPrivate.map((p) => {
                const linked = linkedCompanies.find((c) =>
                  c.name.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(c.name.toLowerCase())
                );
                return linked ? (
                  <Link
                    key={p}
                    href={`/companies/${linked.slug}`}
                    className="text-sm text-zinc-300 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded hover:border-zinc-600 hover:text-white transition-colors"
                  >
                    {p}
                  </Link>
                ) : (
                  <span key={p} className="text-sm text-zinc-500 bg-zinc-900/50 border border-zinc-800/50 px-3 py-1.5 rounded">
                    {p}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer meta */}
      <div className="border-t border-zinc-800 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-zinc-700 text-xs">
          Last updated {format(new Date(n.updatedAt), "MMMM d, yyyy")} · Not financial advice
        </p>
        <div className="flex items-center gap-4">
          {prev && (
            <Link href={`/narratives/${prev.slug}`} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
              ← {prev.title}
            </Link>
          )}
          {next && (
            <Link href={`/narratives/${next.slug}`} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
              {next.title} →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
