import type { ReactNode } from "react";
import type { Provenance } from "@/lib/provenance";
import { formatAsOfDate } from "@/lib/provenance";
import type { TrustClass } from "@/lib/terminal-default";
import { TrustMark } from "./TrustMark";

export function Metric({
  label,
  value,
  sub,
  provenance,
  tone = "white",
  trust,
  kpi,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  provenance: Provenance;
  tone?: "white" | "emerald" | "amber" | "red" | "sky";
  trust?: TrustClass;
  kpi?: string;
}) {
  const valueClass =
    tone === "emerald" ? "text-verified" :
    tone === "amber" ? "text-stale" :
    tone === "red" ? "text-danger" :
    "text-ink";
  const monoValue = kpi === "freshness";

  return (
    <div className="min-w-0 py-1" data-kpi={kpi}>
      <div className="flex items-center gap-1.5 min-w-0">
        <div className="text-[13px] text-faint truncate">{label}</div>
        {trust && <TrustMark cls={trust} />}
      </div>
      <div className={`${monoValue ? "font-mono" : ""} font-medium text-xl mt-1 tabular-nums leading-tight tracking-tight ${valueClass}`}>{value}</div>
      {sub && <div className="text-[15px] text-muted mt-1.5 leading-snug">{sub}</div>}
      <div className="text-xs font-mono text-faint mt-2 truncate" title={`${provenance.source} · ${provenance.asOf}`}>
        {provenance.source} · {formatAsOfDate(provenance.asOf)}
      </div>
    </div>
  );
}
