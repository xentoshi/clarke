/** Canonical operator label with raw UCS/FCC strings on hover. */
export function OperatorName({
  display,
  raw,
  notes,
  className,
}: {
  display: string;
  raw?: string | string[] | null;
  notes?: string;
  className?: string;
}) {
  const raws = (Array.isArray(raw) ? raw : raw ? [raw] : []).map((s) => s.trim()).filter(Boolean);
  const extra = [...new Set(raws.filter((r) => r !== display))];
  const title = [extra.length ? `Source: ${extra.join("; ")}` : null, notes].filter(Boolean).join(" · ");
  return (
    <span
      className={className}
      title={title || undefined}
      data-operator={display}
      data-operator-raw={extra.join("|") || undefined}
    >
      {display}
    </span>
  );
}
