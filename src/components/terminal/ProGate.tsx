import type { ReactNode } from "react";
import Link from "next/link";

export function ProGate({
  entitled,
  title = "Pro Terminal",
  children,
}: {
  entitled: boolean;
  title?: string;
  children: ReactNode;
}) {
  if (entitled) return <>{children}</>;
  return (
    <div className="relative">
      <div className="blur-[6px] pointer-events-none select-none max-h-56 overflow-hidden">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/55">
        <div className="text-center px-4">
          <div className="text-white text-sm font-semibold mb-1">{title}</div>
          <p className="text-zinc-400 text-xs mb-3">Full driver breakdown, compare, export+, and API sit behind a Terminal seat.</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/pricing" className="bg-white text-black rounded px-3 py-1.5 text-xs font-bold hover:bg-zinc-200">
              Unlock Pro
            </Link>
            <Link href="/login" className="text-zinc-400 hover:text-white text-xs">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
