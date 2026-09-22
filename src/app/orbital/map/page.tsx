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
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14">
      <div className="mb-12 max-w-2xl">
        <p className="text-muted text-[14px] mb-3">Registry</p>
        <h1 className="text-4xl sm:text-5xl font-semibold text-ink tracking-tight mb-5">GEO belt</h1>
        <p className="text-muted text-lg leading-relaxed">
          Flat longitude of TLE-primary occupancy. Each mark is one satellite at its TLE epoch.
          Open a mark for the registry slot within 0.4°.
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-6 text-[14px]">
          <Link href="/orbital" className="text-ink hover:text-muted transition-colors">
            Registry
          </Link>
          <Link href="/orbital/101w" className="text-muted hover:text-ink transition-colors">
            Sample Terminal
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
