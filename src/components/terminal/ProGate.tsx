"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useLiveEntitlements } from "./useLiveEntitlements";

export function ProGate({
  entitled,
  title = "Pro Terminal",
  children,
}: {
  entitled: boolean;
  title?: string;
  children: ReactNode;
}) {
  const live = useLiveEntitlements();
  if (entitled || live.features.valuationBreakdown) return <>{children}</>;
  return (
    <div className="relative">
      <div className="blur-[6px] pointer-events-none select-none max-h-56 overflow-hidden">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-canvas/70">
        <div className="text-center px-4">
          <div className="text-ink text-sm font-semibold mb-1">{title}</div>
          <p className="text-muted text-sm mb-3">Driver breakdown, compare, and export sit on a paid seat. Registry access is free.</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/pricing" data-unlock-pro className="bg-ink text-canvas rounded px-3 py-1.5 text-xs font-semibold hover:bg-ink/85">
              Pricing
            </Link>
            <Link href="/login" className="text-muted hover:text-ink text-xs">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
