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
      className="border-t border-line py-1"
    >
      <summary className="cursor-pointer list-none py-3 flex flex-wrap items-center gap-2 text-left">
        <span className="text-[12px] text-stale">Experimental</span>
        <span className="text-ink text-[14px]">{title}</span>
        <span className="text-[12px] text-faint ml-auto">Not default Terminal</span>
      </summary>
      <div className="pb-5">
        <p className="text-[14px] text-stale leading-relaxed mb-3">
          This block is quarantined from the default Slot Terminal. It is a labeled stub or simulation,
          not recorded public occupancy or FCC data, and it is not a market. ITU SNS is not ingested.
        </p>
        {children}
      </div>
    </details>
  );
}
