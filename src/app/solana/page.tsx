import Link from "next/link";
import { buildMeta } from "@/lib/metadata";
import { solanaHardwareProjects, categoryLabels, statusColors } from "@/data/solana-hardware";

export const metadata = buildMeta({
  title: "Solana × Hardware",
  description: "Companies and protocols building at the intersection of Solana blockchain and physical hardware infrastructure.",
  tag: "DePIN",
});

const SolanaLogo = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 397 311" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sol-a" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#9945FF" />
        <stop offset="100%" stopColor="#14F195" />
      </linearGradient>
    </defs>
    <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" fill="url(#sol-a)" />
    <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" fill="url(#sol-a)" />
    <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" fill="url(#sol-a)" />
  </svg>
);

const liveCount = solanaHardwareProjects.filter((p) => p.status === "live").length;
const categories = [...new Set(solanaHardwareProjects.map((p) => p.category))];

export default function SolanaHardwarePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-5">
          <SolanaLogo size={36} />
          <span className="text-zinc-600 text-2xl font-light">×</span>
          <span className="text-white text-2xl font-bold tracking-tight">Hardware</span>
        </div>
        <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl mb-6">
          Frontier tracks the physical companies building humanity's multiplanetary future. This page covers the adjacent layer: Decentralized Physical Infrastructure Networks (DePIN) on Solana — protocols that coordinate real-world hardware through token incentives, creating the economic rails for distributed sensor networks, compute, and connectivity that will underpin space-age infrastructure on Earth and beyond.
        </p>
        <div className="flex flex-wrap gap-3">
          <div className="border border-zinc-800 rounded-lg px-4 py-2 text-center">
            <div className="text-xl font-bold font-mono text-white">{solanaHardwareProjects.length}</div>
            <div className="text-zinc-600 text-xs">Projects</div>
          </div>
          <div className="border border-zinc-800 rounded-lg px-4 py-2 text-center">
            <div className="text-xl font-bold font-mono text-emerald-400">{liveCount}</div>
            <div className="text-zinc-600 text-xs">Live</div>
          </div>
          <div className="border border-zinc-800 rounded-lg px-4 py-2 text-center">
            <div className="text-xl font-bold font-mono text-white">{categories.length}</div>
            <div className="text-zinc-600 text-xs">Categories</div>
          </div>
        </div>
      </div>

      {/* What is DePIN */}
      <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/20 mb-10">
        <h2 className="text-white text-sm font-semibold mb-3">Why Solana + Hardware?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-zinc-500 leading-relaxed">
          <div>
            <div className="text-zinc-300 font-medium mb-1">Token incentives → hardware deployment</div>
            Operators buy physical devices and earn tokens for contributing useful work — wireless coverage, GPS correction, GPU compute, or map data.
          </div>
          <div>
            <div className="text-zinc-300 font-medium mb-1">Solana = settlement layer</div>
            Fast finality and low fees make per-device micropayments economically viable. Ethereum gas costs make the same model impractical.
          </div>
          <div>
            <div className="text-zinc-300 font-medium mb-1">Crowdsourced infrastructure</div>
            Thousands of individual operators build networks that would cost billions to deploy top-down — Helium's 1M+ hotspots vs. a telco tower rollout.
          </div>
        </div>
      </div>

      {/* Projects */}
      <div className="space-y-4">
        {solanaHardwareProjects.map((project) => (
          <div key={project.slug} className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/10 hover:border-zinc-700 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Title row */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <a href={project.website} target="_blank" rel="noopener noreferrer"
                    className="text-white font-bold text-base hover:text-zinc-300 transition-colors">
                    {project.name}
                  </a>
                  {project.token && (
                    <span className="font-mono text-xs text-purple-300 bg-purple-950 border border-purple-800 px-1.5 py-0.5 rounded">
                      ${project.token}
                    </span>
                  )}
                  <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${statusColors[project.status]}`}>
                    {project.status}
                  </span>
                  <span className="text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
                    {categoryLabels[project.category]}
                  </span>
                </div>

                <p className="text-zinc-400 text-sm leading-relaxed mb-3">{project.description}</p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-600">
                  <span>
                    <span className="text-zinc-500">Hardware: </span>
                    {project.hardwareType}
                  </span>
                  {project.hq && <span>{project.hq}</span>}
                </div>

                {project.notable && (
                  <div className="mt-3 flex items-start gap-2">
                    <span className="text-zinc-700 shrink-0">↳</span>
                    <p className="text-xs text-zinc-500">{project.notable}</p>
                  </div>
                )}
              </div>

              {/* Links */}
              <div className="flex items-center gap-2 shrink-0">
                <a href={project.website} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-zinc-500 border border-zinc-800 hover:border-zinc-600 hover:text-white px-3 py-1.5 rounded transition-colors">
                  Website →
                </a>
                {project.twitter && (
                  <a href={project.twitter} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-zinc-500 border border-zinc-800 hover:border-zinc-600 hover:text-white px-3 py-1.5 rounded transition-colors">
                    X
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-12 border border-zinc-800 rounded-xl p-6 text-center bg-zinc-900/20">
        <div className="flex items-center justify-center gap-2 mb-3">
          <SolanaLogo size={20} />
          <span className="text-white font-semibold text-sm">Know a project we're missing?</span>
        </div>
        <p className="text-zinc-500 text-xs mb-4">DePIN is moving fast. If a Solana-based hardware network isn't listed here, suggest it.</p>
        <Link href="/suggest" className="px-4 py-2 border border-zinc-700 rounded text-sm text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors">
          Suggest a Project →
        </Link>
      </div>
    </div>
  );
}
