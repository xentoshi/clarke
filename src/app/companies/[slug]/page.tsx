import { notFound } from "next/navigation";
import Link from "next/link";
import { buildMeta } from "@/lib/metadata";
import { companiesBySlug, companies } from "@/data/companies";
import { getOperatorGeoPositions } from "@/lib/satellites";
import { slugToOperators } from "@/lib/operator-map";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const company = companiesBySlug[slug];
  if (!company) return {};
  return buildMeta({
    title: company.name,
    description: company.description,
    tag: company.sector,
  });
}

export async function generateStaticParams() {
  return companies.map((c) => ({ slug: c.slug }));
}

export default async function CompanyPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const company = companiesBySlug[slug];
  if (!company) notFound();

  const related = companies.filter(
    (c) => c.sector === company.sector && c.slug !== company.slug
  ).slice(0, 4);

  const operatorNames = slugToOperators(slug);
  const geoPositions = getOperatorGeoPositions(operatorNames);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-12">
        <Link href="/companies" className="text-white/30 text-xs font-mono hover:text-white/60 transition-colors">
          ← Companies
        </Link>
      </div>

      <div className="mb-2">
        <span className="text-[10px] font-mono text-white/25 tracking-widest uppercase">{company.sector}</span>
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8">{company.name}</h1>

      <p className="text-zinc-300 text-base leading-relaxed mb-12">{company.description}</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-white/[0.04] mb-16">
        {company.founded && (
          <div className="bg-zinc-950 px-5 py-5">
            <div className="text-white font-bold font-mono text-xl mb-1">{company.founded}</div>
            <div className="text-white/25 text-[10px] font-mono tracking-widest uppercase">Founded</div>
          </div>
        )}
        {company.hq && (
          <div className="bg-zinc-950 px-5 py-5">
            <div className="text-white font-bold text-sm mb-1">{company.hq}</div>
            <div className="text-white/25 text-[10px] font-mono tracking-widest uppercase">HQ</div>
          </div>
        )}
        <div className="bg-zinc-950 px-5 py-5">
          <div className="text-white font-bold text-sm mb-1">{company.sector}</div>
          <div className="text-white/25 text-[10px] font-mono tracking-widest uppercase">Sector</div>
        </div>
      </div>

      {geoPositions.length > 0 && (
        <div className="mb-16">
          <div className="text-white/25 text-[10px] font-mono tracking-widest uppercase mb-4">
            GEO Orbital Positions ({geoPositions.length})
          </div>
          <div className="space-y-px bg-white/[0.03] rounded-xl overflow-hidden">
            {geoPositions.map((pos) => (
              <Link
                key={pos.slug}
                href={`/orbital/${pos.slug}`}
                className="group flex items-center justify-between bg-zinc-950 px-5 py-3 hover:bg-zinc-900/60 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-white font-mono text-sm group-hover:text-white/70 transition-colors">{pos.label}</span>
                  <span className="text-zinc-600 text-xs hidden sm:block truncate max-w-[240px]">
                    {pos.names.join(" · ")}
                  </span>
                </div>
                <span className="text-zinc-600 text-xs font-mono shrink-0">
                  {pos.satelliteCount} sat{pos.satelliteCount !== 1 ? "s" : ""} →
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {related.length > 0 && (
        <div>
          <div className="text-white/25 text-[10px] font-mono tracking-widest uppercase mb-4">
            Also in {company.sector}
          </div>
          <div className="space-y-px bg-white/[0.03]">
            {related.map((c) => (
              <Link
                key={c.slug}
                href={`/companies/${c.slug}`}
                className="group flex items-center justify-between bg-zinc-950 px-5 py-3 hover:bg-zinc-900/60 transition-colors"
              >
                <span className="text-white text-sm group-hover:text-white/70 transition-colors">{c.name}</span>
                {c.hq && <span className="text-white/20 text-xs font-mono hidden sm:block">{c.hq}</span>}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
