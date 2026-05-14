import type { Metadata } from "next";
import Link from "next/link";
import { buildMeta } from "@/lib/metadata";
import { companies, sectors } from "@/data/companies";

export const metadata: Metadata = buildMeta({
  title: "Companies",
  description: "The companies building the space infrastructure stack, from launch to manufacturing.",
  tag: "Directory",
});

export default function CompaniesPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-16">
        <div className="text-white/30 text-[11px] font-mono tracking-[0.3em] uppercase mb-4">Directory</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Companies</h1>
        <p className="text-zinc-400 text-sm leading-relaxed max-w-xl">
          {companies.length} companies across {sectors.length} sectors building the space infrastructure stack.
        </p>
      </div>

      {sectors.map((sector) => {
        const sectorCompanies = companies.filter((c) => c.sector === sector);
        return (
          <div key={sector} className="mb-12">
            <div className="text-white/30 text-[10px] font-mono tracking-[0.3em] uppercase mb-3">
              {sector}
            </div>
            <div className="space-y-px bg-white/[0.03]">
              {sectorCompanies.map((company) => (
                <Link
                  key={company.slug}
                  href={`/companies/${company.slug}`}
                  className="group flex items-start justify-between gap-4 bg-zinc-950 px-5 py-4 hover:bg-zinc-900/60 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-white text-sm font-semibold group-hover:text-white/80 transition-colors mb-0.5">
                      {company.name}
                    </div>
                    <p className="text-zinc-500 text-xs leading-relaxed line-clamp-1">
                      {company.description}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-3 pt-0.5">
                    {company.hq && (
                      <span className="text-white/20 text-[10px] font-mono hidden sm:block">{company.hq}</span>
                    )}
                    {company.founded && (
                      <span className="text-white/20 text-[10px] font-mono">{company.founded}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
