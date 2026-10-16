import Link from "next/link";
import { HOW_TO_STEPS, HOW_TO_TITLE, type HowToPiece } from "@/lib/how-to-use";

function Piece({ piece }: { piece: HowToPiece }) {
  if (piece.type === "text") return piece.text;
  const className = "text-ink underline underline-offset-2 decoration-line-strong hover:text-muted";
  if (piece.href.startsWith("/")) {
    return (
      <Link href={piece.href} className={className}>
        {piece.text}
      </Link>
    );
  }
  return (
    <a href={piece.href} className={className}>
      {piece.text}
    </a>
  );
}

export function HowToUse({ className = "" }: { className?: string }) {
  return (
    <section aria-labelledby="how-to-use-clarke" className={className}>
      <h2 id="how-to-use-clarke" className="text-xl font-semibold text-ink tracking-tight mb-3">
        {HOW_TO_TITLE}
      </h2>
      <ol className="border-t border-line">
        {HOW_TO_STEPS.map((step, index) => (
          <li
            key={howToKey(step)}
            className="flex gap-3 border-b border-line py-3 text-[15px] leading-relaxed text-muted"
          >
            <span className="font-mono text-[13px] text-faint tabular-nums pt-0.5">{index + 1}</span>
            <span>
              {step.map((piece, pieceIndex) => (
                <Piece key={`${piece.type}-${pieceIndex}`} piece={piece} />
              ))}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function howToKey(step: HowToPiece[]): string {
  return step.map((piece) => piece.text).join("");
}
