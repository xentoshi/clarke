import { notFound } from "next/navigation";
import Link from "next/link";
import { investors, typeLabels, typeColors } from "@/data/investors";
import { companies } from "@/data/companies";
import { buildMeta } from "@/lib/metadata";

export function generateStaticParams() {
  return investors.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const inv = investors.find((i) => i.slug === slug);
  if (!inv) return {};
  return buildMeta({ title: inv.name, description: inv.thesis, tag: typeLabels[inv.type] });
}

export default async function InvestorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const inv = investors.find((i) => i.slug === slug);
  if (!inv) notFound();

  const otherInvestors = investors.filter((i) => i.slug !== inv.slug).slice(0, 4);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <Link href="/investors" className="text-xs text-zinc-600 hover:text-white transition-colors mb-8 inline-block">
        ← Investors
      </Link>

      <div className="border border-zinc-800 rounded-xl p-8 bg-zinc-900/20 mb-6">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-3">{inv.name}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded border font-medium ${typeColors[inv.type]}`}>
                {typeLabels[inv.type]}
              </span>
              {inv.aum && <span className="text-zinc-500 text-xs font-mono">{inv.aum} AUM</span>}
              <a href={inv.website} target="_blank" rel="noopener noreferrer"
                className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors">
                {inv.website.replace("https://", "")} →
              </a>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="text-zinc-600 text-xs uppercase tracking-wider mb-2 font-medium">Focus Areas</div>
          <div className="flex flex-wrap gap-2">
            {inv.focus.map((f) => (
              <span key={f} className="text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded">{f}</span>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="text-zinc-600 text-xs uppercase tracking-wider mb-2 font-medium">Thesis</div>
          <p className="text-zinc-300 text-sm leading-relaxed">{inv.thesis}</p>
        </div>

        {inv.partners && (
          <div className="pt-6 border-t border-zinc-800">
            <div className="text-zinc-600 text-xs uppercase tracking-wider mb-2 font-medium">Key Partners</div>
            <div className="flex flex-wrap gap-3">
              {inv.partners.map((p) => (
                <span key={p} className="text-zinc-300 text-sm">{p}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4 font-medium">Portfolio Bets</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {inv.notableBets.map((bet) => {
            const linked = companies.find(
              (c) => c.name.toLowerCase() === bet.company.toLowerCase() ||
                bet.company.toLowerCase().includes(c.name.toLowerCase())
            );
            return (
              <div key={bet.company} className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/10 hover:border-zinc-600 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  {linked
                    ? <Link href={`/companies/${linked.slug}`} className="font-semibold text-white text-sm hover:text-zinc-300 transition-colors">{bet.company}</Link>
                    : <span className="font-semibold text-white text-sm">{bet.company}</span>}
                  <span className="text-zinc-500 text-xs font-mono">{bet.round}</span>
                </div>
                <span className="text-xs text-zinc-600 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">{bet.vertical}</span>
                {linked && (
                  <div className="mt-3">
                    <p className="text-zinc-500 text-xs leading-relaxed">{linked.description}</p>
                    <Link href={`/companies/${linked.slug}`} className="text-xs text-zinc-600 hover:text-zinc-400 mt-2 block transition-colors">
                      View profile →
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4 font-medium">More Investors</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {otherInvestors.map((other) => (
            <Link key={other.slug} href={`/investors/${other.slug}`}
              className="border border-zinc-800 rounded-lg p-4 hover:border-zinc-600 transition-colors group">
              <div className="font-semibold text-white text-sm mb-1 group-hover:text-zinc-200">{other.name}</div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-1.5 py-0.5 rounded border ${typeColors[other.type]}`}>{typeLabels[other.type]}</span>
                {other.aum && <span className="text-zinc-600 text-xs">{other.aum}</span>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
