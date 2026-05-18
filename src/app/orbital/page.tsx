import Link from "next/link";
import { buildMeta } from "@/lib/metadata";
import OrbitalClient from "./OrbitalClient";
import { slots as curatedSlots } from "@/data/orbital-slots";
import { mergeWithUcs, getAllCongestionScores } from "@/lib/satellites";

export const metadata = buildMeta({
  title: "Orbital Registry",
  description: "Browse orbital assets across GEO, LEO, and MEO. Slot positions, operators, estimated values, and on-chain offerings.",
  tag: "Registry",
});

export default function OrbitalPage() {
  const slots = mergeWithUcs(curatedSlots);
  const congestionScores = getAllCongestionScores();
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-zinc-600 text-xs font-mono mb-3">// ORBITAL_REGISTRY</p>
          <h1 className="text-2xl font-bold text-white mb-2">Orbital Registry</h1>
          <p className="text-zinc-500 text-sm leading-relaxed">Capital markets for orbit.</p>
        </div>
        <Link href="/docs" className="text-zinc-600 text-xs hover:text-zinc-300 transition-colors shrink-0 mt-1">
          Docs →
        </Link>
      </div>
      <OrbitalClient slots={slots} congestionScores={congestionScores} />
    </div>
  );
}
