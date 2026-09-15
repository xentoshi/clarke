import { TRUST_CLASS_LABEL, type TrustClass } from "@/lib/terminal-default";

const tone: Record<TrustClass, string> = {
  V: "text-emerald-400/90 border-emerald-800/50",
  M: "text-sky-400/90 border-sky-800/50",
  S: "text-amber-400/90 border-amber-800/50",
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
      className={`inline-flex items-center text-[9px] font-mono tracking-widest uppercase px-1 py-0.5 rounded border ${tone[cls]} ${className}`}
    >
      {cls}
    </span>
  );
}
