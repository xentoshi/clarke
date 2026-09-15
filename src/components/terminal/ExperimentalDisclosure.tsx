"use client";

import type { ReactNode } from "react";

/** Collapsed-by-default gate for stubs and simulations. Not the default Terminal. */
export function ExperimentalDisclosure({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <details
      data-terminal-experimental={id}
      className="border border-amber-900/40 rounded-xl bg-amber-950/10 overflow-hidden"
    >
      <summary className="cursor-pointer list-none px-4 py-3 flex flex-wrap items-center gap-2 text-left">
        <span className="text-[10px] font-mono text-amber-400/90 uppercase tracking-widest">Experimental</span>
        <span className="text-amber-100/80 text-xs">{title}</span>
        <span className="text-[10px] font-mono text-zinc-600 ml-auto">click to disclose · not default Terminal</span>
      </summary>
      <div className="px-4 py-3 border-t border-amber-900/30">
        <p className="text-[11px] text-amber-200/70 leading-relaxed mb-3">
          This block is quarantined from the default Slot Terminal. It is a labeled stub or simulation,
          not recorded public occupancy or FCC data, and it is not a market.
        </p>
        {children}
      </div>
    </details>
  );
}
