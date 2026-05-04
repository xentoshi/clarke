import { buildMeta } from "@/lib/metadata";
import { companies, verticalLabels } from "@/data/companies";
import Link from "next/link";

export const metadata = buildMeta({
  title: "About",
  description: "Frontier — the directory of companies building the multiplanetary future.",
  tag: "About",
});

const verticalCount = Object.keys(verticalLabels).length;

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-16">
        <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
          Companies building the multiplanetary future.
        </h1>
        <p className="text-zinc-400 text-lg leading-relaxed">
          Frontier is a directory of the companies, technologies, and verticals required for humanity to become a multiplanetary species — from launch vehicles to life support, from ISRU to suits.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-16">
        {[
          { value: `${companies.length}+`, label: "Companies" },
          { value: `${verticalCount}`, label: "Verticals" },
          { value: "Primary", label: "Sources only" },
        ].map((s) => (
          <div key={s.label} className="border border-zinc-800 rounded-lg p-4 text-center bg-zinc-900/20">
            <div className="text-2xl font-bold text-white mb-1">{s.value}</div>
            <div className="text-zinc-600 text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-16">
        <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-6 font-medium">What&apos;s here</h2>
        <div className="space-y-3">
          {[
            { href: "/companies", title: "Companies", desc: `${companies.length}+ companies across ${verticalCount} verticals — launch, lunar, habitation, propulsion, power, ISRU, manufacturing, food, robotics, comms, observation, suits, mining.` },
            { href: "/stocks", title: "Stocks", desc: "Live prices for every publicly traded company in the directory." },
            { href: "/narratives", title: "Narratives", desc: "Investment theses for the verticals — what the opportunity is, why now, what needs to happen." },
            { href: "/investors", title: "Investors", desc: "The funds and people backing these companies." },
            { href: "/events", title: "Events", desc: "Conferences, launches, and milestones to track." },
            { href: "/solana", title: "Solana × Hardware", desc: "The intersection of decentralized networks and physical hardware." },
            { href: "/api-docs", title: "API", desc: "Machine-readable company data." },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className="block border border-zinc-800 rounded-lg p-4 hover:border-zinc-600 transition-colors group">
              <div className="font-semibold text-white text-sm mb-1 group-hover:text-zinc-200">{item.title} →</div>
              <p className="text-zinc-500 text-xs leading-relaxed">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="border-l-2 border-zinc-700 pl-6">
        <p className="text-zinc-300 text-base leading-relaxed italic">
          &ldquo;The goal is for Frontier to be the most accurate, primary-source directory of companies building the infrastructure for life beyond Earth.&rdquo;
        </p>
      </div>
    </div>
  );
}
