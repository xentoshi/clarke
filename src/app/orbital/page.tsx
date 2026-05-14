import { buildMeta } from "@/lib/metadata";
import OrbitalClient from "./OrbitalClient";

export const metadata = buildMeta({
  title: "Orbital Registry",
  description: "Browse orbital assets across GEO, LEO, and MEO. Slot positions, operators, estimated values, and on-chain offerings.",
  tag: "Registry",
});

export default function OrbitalPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <p className="text-zinc-600 text-xs font-mono mb-3">// ORBITAL_REGISTRY</p>
        <h1 className="text-2xl font-bold text-white mb-3">Orbital Registry</h1>
        <p className="text-zinc-500 text-sm max-w-2xl leading-relaxed">
          27,000+ tracked objects across GEO, LEO, and MEO. Hundreds of billions in orbital assets
          priced through information asymmetry, with no public market and no canonical data layer.
          Clarke is building that layer.
        </p>
      </div>
      <OrbitalClient />
    </div>
  );
}
