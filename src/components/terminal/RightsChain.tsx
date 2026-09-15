import type { RightsLink } from "@/lib/rights-chain";
import { formatAsOfDate } from "@/lib/provenance";

const statusClass: Record<RightsLink["status"], string> = {
  recorded: "text-emerald-400 border-emerald-800/60 bg-emerald-950/30",
  inferred: "text-sky-400 border-sky-800/60 bg-sky-950/30",
  stub: "text-amber-400 border-amber-800/60 bg-amber-950/30",
  unknown: "text-zinc-500 border-zinc-700 bg-zinc-900/40",
};

export function RightsChain({ links }: { links: RightsLink[] }) {
  return (
    <ol className="space-y-0">
      {links.map((link, i) => (
        <li key={link.layer} className="relative pl-6 pb-5 last:pb-0">
          {i < links.length - 1 && <span className="absolute left-[7px] top-4 bottom-0 w-px bg-zinc-800" />}
          <span className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border border-zinc-600 bg-zinc-950" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{link.title}</div>
              <div className="text-white text-sm font-medium truncate">{link.holder}</div>
              <p className="text-zinc-500 text-xs leading-relaxed mt-1">{link.detail}</p>
              <div className="text-[10px] font-mono text-zinc-700 mt-1">
                {link.provenance.source} · {formatAsOfDate(link.provenance.asOf)}
                {link.provenance.note ? ` · ${link.provenance.note}` : ""}
              </div>
            </div>
            <span className={`shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded border ${statusClass[link.status]}`}>
              {link.status}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}
