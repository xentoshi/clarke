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
    tone === "emerald" ? "text-emerald-400" :
    tone === "amber" ? "text-amber-400" :
    tone === "red" ? "text-red-400" :
    tone === "sky" ? "text-sky-400" :
    "text-white";

  return (
    <div className="bg-[#060608] px-4 py-4 min-w-0" data-kpi={kpi}>
      <div className="flex items-center gap-1.5 min-w-0">
        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest truncate">{label}</div>
        {trust && <TrustMark cls={trust} />}
      </div>
      <div className={`font-mono font-bold text-xl mt-1 tabular-nums leading-tight ${valueClass}`}>{value}</div>
      {sub && <div className="text-[11px] text-zinc-500 mt-1 leading-snug">{sub}</div>}
      <div className="text-[10px] font-mono text-zinc-700 mt-2 truncate" title={`${provenance.source} · ${provenance.asOf}`}>
        {provenance.source} · {formatAsOfDate(provenance.asOf)}
      </div>
    </div>
  );
}
