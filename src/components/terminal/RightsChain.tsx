import type { RightsLink } from "@/lib/rights-chain";
import { formatAsOfDate } from "@/lib/provenance";
import { TrustMark } from "./TrustMark";
import type { TrustClass } from "@/lib/terminal-default";

const statusClass: Record<RightsLink["status"], string> = {
  recorded: "text-emerald-400 border-emerald-800/60 bg-emerald-950/30",
  inferred: "text-sky-400 border-sky-800/60 bg-sky-950/30",
  stub: "text-amber-400 border-amber-800/60 bg-amber-950/30",
  unknown: "text-zinc-500 border-zinc-700 bg-zinc-900/40",
};

function trustFor(link: RightsLink): TrustClass {
  if (link.status === "stub") return "S";
  if (link.status === "recorded") return "V";
  return "M";
}

export function RightsChain({
  links,
  variant = "recorded",
}: {
  links: RightsLink[];
  variant?: "recorded" | "stubs";
}) {
  if (links.length === 0) {
    return (
      <p className="text-[11px] text-zinc-600">
        {variant === "stubs" ? "No quarantined stub layers." : "No recorded FCC / administration layers."}
      </p>
    );
  }

  return (
    <div>
      {variant === "recorded" ? (
        <p className="text-[11px] text-zinc-500 mb-3 leading-relaxed">
          Recorded public layers only. FCC SSAL when present; otherwise inferred administration/operator.
          ITU filing and sub-lease are not ingested and are not shown here.
        </p>
      ) : (
        <p className="text-[11px] text-amber-200/70 mb-3 leading-relaxed">
          Quarantined stubs — not Bloomberg-style filled panels. These rows exist so the rights-chain
          shape is reserved; they are not live filings or named lessees.
        </p>
      )}
      <ol className="space-y-0">
        {links.map((link, i) => (
          <li
            key={link.layer}
            data-rights-layer={link.layer}
            data-rights-status={link.status}
            className={`relative pl-6 pb-5 last:pb-0 ${variant === "stubs" ? "opacity-80" : ""}`}
          >
            {i < links.length - 1 && <span className="absolute left-[7px] top-4 bottom-0 w-px bg-zinc-800" />}
            <span className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border border-zinc-600 bg-zinc-950" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{link.title}</div>
                  <TrustMark cls={trustFor(link)} />
                </div>
                <div className={`text-sm font-medium truncate ${variant === "stubs" ? "text-zinc-400" : "text-white"}`}>
                  {link.holder}
                </div>
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
    </div>
  );
}
