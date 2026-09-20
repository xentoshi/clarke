import type { RightsLink } from "@/lib/rights-chain";
import { formatAsOfDate } from "@/lib/provenance";
import { TrustMark } from "./TrustMark";
import type { TrustClass } from "@/lib/terminal-default";

const statusClass: Record<RightsLink["status"], string> = {
  recorded: "text-verified border-verified/30 bg-verified/8",
  inferred: "text-ink border-line bg-canvas",
  stub: "text-stale border-stale/35 bg-stale/8",
  unknown: "text-faint border-line bg-canvas",
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
      <p className="text-sm text-faint">
        {variant === "stubs" ? "No quarantined stub layers." : "No recorded FCC / administration layers."}
      </p>
    );
  }

  return (
    <div>
      {variant === "recorded" ? (
        <p className="text-sm text-muted mb-4 leading-relaxed">
          Recorded public layers only. FCC SSAL when present; otherwise inferred administration/operator.
          Unrecorded ITU SNS and sub-lease layers are not ingested and are not shown here.
        </p>
      ) : (
        <p className="text-sm text-stale mb-4 leading-relaxed">
          Quarantined stubs. These rows exist so the rights-chain shape is reserved; they are not live filings or named lessees.
        </p>
      )}
      <ol className="space-y-0">
        {links.map((link, i) => (
          <li
            key={link.layer}
            data-rights-layer={link.layer}
            data-rights-status={link.status}
            className={`relative pl-6 pb-5 last:pb-0 ${variant === "stubs" ? "opacity-90" : ""}`}
          >
            {i < links.length - 1 && <span className="absolute left-[7px] top-4 bottom-0 w-px bg-line" />}
            <span className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border border-line-strong bg-surface" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <div className="text-sm text-muted">{link.title}</div>
                  <TrustMark cls={trustFor(link)} />
                </div>
                <div className={`text-base font-medium truncate ${variant === "stubs" ? "text-muted" : "text-ink"}`}>
                  {link.holder}
                </div>
                <p className="text-muted text-sm leading-relaxed mt-1">{link.detail}</p>
                <div className="text-xs font-mono text-faint mt-1">
                  {link.provenance.source} · {formatAsOfDate(link.provenance.asOf)}
                  {link.provenance.note ? ` · ${link.provenance.note}` : ""}
                </div>
              </div>
              <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded-sm border ${statusClass[link.status]}`}>
                {link.status}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
