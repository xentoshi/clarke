import Link from "next/link";
import { buildMeta } from "@/lib/metadata";
import { buildGeoBelt } from "@/lib/belt-data";
import { parseBeltWindow } from "@/lib/geo-belt";
import { GeoBeltView } from "@/components/belt/GeoBeltView";

export const metadata = buildMeta({
  title: "GEO belt",
  description: "Flat GEO belt of Space-Track TLE occupancy longitudes. Catalog names from UCS. Not an ITU assignment or an FCC filing.",
  tag: "Registry",
  path: "/orbital/map",
});

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function GeoBeltPage({
  searchParams,
}: {
  searchParams: Promise<{
    disputes?: string | string[];
    min?: string | string[];
    max?: string | string[];
    mark?: string | string[];
    operator?: string | string[];
  }>;
}) {
  const sp = await searchParams;
  const belt = buildGeoBelt();
  const operator = first(sp.operator);
  const knownOperator = operator && belt.marks.some((mark) => mark.operator === operator) ? operator : null;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-zinc-600 text-xs font-mono mb-3">{"// GEO_BELT"}</p>
          <h1 className="text-2xl font-bold text-white mb-2">GEO belt</h1>
          <p className="text-zinc-500 text-sm leading-relaxed max-w-2xl">
            Flat longitude of TLE-primary occupancy. Each mark is one satellite at its TLE epoch.
            Open a mark for the registry slot within 0.4°.
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0 mt-1">
          <Link href="/orbital" className="text-zinc-300 text-xs hover:text-white transition-colors">
            Registry →
          </Link>
          <Link href="/orbital/101w" className="text-zinc-600 text-xs hover:text-zinc-300 transition-colors">
            Sample Terminal →
          </Link>
        </div>
      </div>
      <GeoBeltView
        model={belt}
        initialDisputes={first(sp.disputes) === "1"}
        initialOperator={knownOperator}
        initialWindow={parseBeltWindow(first(sp.min), first(sp.max))}
        initialMarkId={first(sp.mark) ?? null}
      />
    </div>
  );
}
