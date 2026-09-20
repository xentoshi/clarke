import { TRUST_CLASS_LABEL, type TrustClass } from "@/lib/terminal-default";

const tone: Record<TrustClass, string> = {
  V: "text-verified border-verified/30 bg-verified/8",
  M: "text-ink border-line bg-canvas",
  S: "text-stale border-stale/35 bg-stale/8",
};

export function TrustMark({
  cls,
  className = "",
}: {
  cls: TrustClass;
  className?: string;
}) {
  return (
    <span
      title={TRUST_CLASS_LABEL[cls]}
      className={`inline-flex items-center text-[11px] px-1 py-0.5 rounded-sm border ${tone[cls]} ${className}`}
    >
      {cls}
    </span>
  );
}
