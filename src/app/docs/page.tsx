import { buildMeta } from "@/lib/metadata";
import Link from "next/link";
import { DOC_PAGES } from "@/lib/docs";
import { HowToUse } from "@/components/HowToUse";
import { TrustLegend } from "@/components/docs/TrustLegend";
import { CiteThis } from "@/components/CiteThis";
import { CLARKE_SITE, formatCitationVintage } from "@/lib/citation";
import { formatRegistryCountAsOf, getDataFreshness } from "@/lib/freshness";
import { formatRegistryCensusDetail, getRegistryCensus } from "@/lib/registry-census";

// Census copy is the committed registry. Rebuild on deploy only.
export const revalidate = false;

export const metadata = buildMeta({
  title: "Docs",
  description:
    "Clarke Docs: occupancy, the public agent record, FCC freshness, and the labeled models on Slot Terminal.",
  tag: "Docs",
  path: "/docs",
  image: "/og/page/docs.png",
});

export default function DocsHubPage() {
  const census = getRegistryCensus();
  const dataAsOf = formatRegistryCountAsOf();
  const freshness = getDataFreshness();
  const ucs = freshness.find((row) => row.source === "UCS");
  const fcc = freshness.find((row) => row.source === "FCC-SSAL");
  const tle = freshness.find((row) => row.source === "Space-Track TLE");
  const vintage = formatCitationVintage({
    ucsFileVintage: ucs?.fileVintage ?? ucs?.sourceAsOf ?? null,
    fccAsOf: fcc?.sourceAsOf ?? fcc?.fileVintage ?? null,
    tleEpochMin: tle?.tleEpochMin ?? null,
    tleEpochMax: tle?.tleEpochMax ?? null,
  });

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-12 pb-16">
      <p className="text-muted text-[13px] mb-2">Docs</p>
      <h1 className="text-3xl font-semibold text-ink tracking-tight mb-3">Clarke Docs</h1>
      <p className="text-muted text-[15px] leading-relaxed mb-4">
        Method notes for occupancy, rights, freshness, the public agent record, and the labeled models.
        The agent API returns occupancy, operator identity, FCC rows, disputes, and freshness.
        GET /api/v1/agents/deltas is the on-ingest change feed for those fields.
        Congestion and fair value are models on the human Slot Terminal. They are not in the agent payload or the delta feed.
        Machine index: <Link href="/llms.txt" className="text-ink underline">llms.txt</Link>.
      </p>
      <p className="text-muted text-[15px] leading-relaxed mb-2">{formatRegistryCensusDetail(census)}</p>
      {dataAsOf && <p className="text-faint text-[15px] font-mono leading-relaxed mb-8">{dataAsOf}</p>}

      <HowToUse className="mb-8" />

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

      <CiteThis
        title="Clarke documentation"
        url={`${CLARKE_SITE}/docs`}
        vintage={vintage}
      />
    </div>
  );
}
