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
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-zinc-600 text-xs font-mono mb-3">// ORBITAL_REGISTRY</p>
          <h1 className="text-2xl font-bold text-white mb-2">Orbital Registry</h1>
          <p className="text-zinc-500 text-sm leading-relaxed">Capital markets for orbit.</p>
        </div>
        <div className="flex items-center gap-4 shrink-0 mt-1">
          <Link href="/orbital/faq" className="text-zinc-600 text-xs hover:text-zinc-300 transition-colors">
            FAQ →
          </Link>
          <Link href="/docs" className="text-zinc-600 text-xs hover:text-zinc-300 transition-colors">
            Docs →
          </Link>
        </div>
      </div>
      <OrbitalClient slots={slots} congestionScores={congestionScores} />
    </div>
  );
}
