import { buildMeta } from "@/lib/metadata";
import OrbitalClient from "./OrbitalClient";

export const metadata = buildMeta({
  title: "Orbital Slots",
  description: "Geostationary orbit — ~1,800 positions, each worth hundreds of millions. Browse the registry and invest in tokenized GEO slots on Solana.",
  tag: "GEO Registry",
});

export default function OrbitalPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <p className="text-zinc-600 text-xs font-mono mb-3">// GEO_ORBITAL_REGISTRY</p>
        <h1 className="text-2xl font-bold text-white mb-3">Orbital Slots</h1>
        <p className="text-zinc-500 text-sm max-w-2xl leading-relaxed">
          Geostationary orbit sits 35,786 km above the equator. ~1,800 positions exist.
          Each worth hundreds of millions. They trade in the dark, between a handful of operators,
          with no price discovery and no public market. Until now.
        </p>
      </div>
      <OrbitalClient />
    </div>
  );
}
