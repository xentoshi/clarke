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
      className="border border-stale/30 bg-stale/5 overflow-hidden"
    >
      <summary className="cursor-pointer list-none px-4 py-3 flex flex-wrap items-center gap-2 text-left">
        <span className="text-xs text-stale">Experimental</span>
        <span className="text-ink text-sm">{title}</span>
        <span className="text-xs text-faint ml-auto">Not default Terminal</span>
      </summary>
      <div className="px-4 py-3 border-t border-stale/25">
        <p className="text-sm text-stale leading-relaxed mb-3">
          This block is quarantined from the default Slot Terminal. It is a labeled stub or simulation,
          not recorded public occupancy or FCC data, and it is not a market.
        </p>
        {children}
      </div>
    </details>
  );
}
