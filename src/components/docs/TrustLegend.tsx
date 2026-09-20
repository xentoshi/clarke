export function TrustLegend({ className = "" }: { className?: string }) {
  return (
    <p className={`text-muted text-sm leading-relaxed ${className}`}>
      Legend:{" "}
      <span className="font-mono text-verified">V</span> verified from a named public source ·{" "}
      <span className="font-mono text-ink">M</span> modeled / heuristic, labeled ·{" "}
      <span className="font-mono text-stale">S</span> stub or simulated.
      Curated dollar overlays are class M hand estimates, secondary to the model range.
    </p>
  );
}
