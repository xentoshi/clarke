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
  const compact = kpi === "fair-value" || kpi === "congestion";
  const valueClass =
    tone === "emerald" ? "text-verified" :
    tone === "amber" ? "text-stale" :
    tone === "red" ? "text-danger" :
    tone === "sky" ? "text-ink" :
    "text-ink";
  const monoValue = kpi === "freshness";

  return (
    <div className={`bg-surface px-5 ${compact ? "py-4" : "py-5"} min-w-0 ${kpi === "fair-value" ? "" : "border border-line"}`} data-kpi={kpi}>
      <div className="flex items-center gap-1.5 min-w-0">
        <div className="text-sm text-muted truncate">{label}</div>
        {trust && <TrustMark cls={trust} />}
      </div>
      <div className={`${monoValue ? "font-mono" : ""} font-semibold ${compact ? "text-lg" : "text-2xl"} mt-1.5 tabular-nums leading-tight tracking-tight ${valueClass}`}>{value}</div>
      {sub && <div className="text-sm text-muted mt-1.5 leading-snug">{sub}</div>}
      <div className="text-xs font-mono text-faint mt-3 truncate" title={`${provenance.source} · ${provenance.asOf}`}>
        {provenance.source} · {formatAsOfDate(provenance.asOf)}
      </div>
    </div>
  );
}
