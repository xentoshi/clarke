import Link from "next/link";
import { buildMeta } from "@/lib/metadata";
import { buildGeoBelt } from "@/lib/belt-data";
import { parseBeltWindow, type BeltMark } from "@/lib/geo-belt";
import { operatorDisplay } from "@/lib/operator-identity";
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

function knownOperator(raw: string | undefined, marks: BeltMark[]): string | null {
  if (!raw) return null;
  const canonical = operatorDisplay(raw);
  if (marks.some((mark) => mark.operator && operatorDisplay(mark.operator) === canonical)) return canonical;
  return null;
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

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-6 pb-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
        <div>
          <p className="text-muted text-[13px] mb-1">Registry</p>
          <h1 className="text-3xl font-semibold text-ink tracking-tight">GEO belt</h1>
        </div>
        <p className="max-w-xl text-[14px] leading-relaxed text-muted">
          Full belt, west to east. Each mark is one TLE occupancy. Click a mark for the slot dossier.
        </p>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px]">
        <Link href="/orbital" className="text-ink hover:text-muted transition-colors">
          Registry
        </Link>
        <Link href="/orbital/101w" className="text-muted hover:text-ink transition-colors">
          Sample Terminal
        </Link>
      </div>
      <GeoBeltView
        model={belt}
        initialDisputes={first(sp.disputes) === "1"}
        initialOperator={knownOperator(first(sp.operator), belt.marks)}
        initialWindow={parseBeltWindow(first(sp.min), first(sp.max))}
        initialMarkId={first(sp.mark) ?? null}
      />
    </div>
  );
}
