export function TrustLegend({ className = "" }: { className?: string }) {
  return (
    <p className={`text-zinc-500 text-sm leading-relaxed ${className}`}>
      Legend:{" "}
      <span className="font-mono text-emerald-400">V</span> verified from a named public source ·{" "}
      <span className="font-mono text-sky-400">M</span> modeled / heuristic, labeled ·{" "}
      <span className="font-mono text-amber-400">S</span> stub or simulated.
      Curated dollar overlays are class M hand estimates, secondary to the model range.
    </p>
  );
}
