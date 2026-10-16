"use client";

import Link from "next/link";
import type { ValuationSnapshot } from "@/lib/valuation-history";
import { ValuationChart } from "./ValuationChart";
import { useLiveEntitlements } from "./useLiveEntitlements";

export function ModelPath({
  history,
  source,
  unlocked,
}: {
  history: ValuationSnapshot[];
  source: "persisted" | "backfill";
  unlocked: boolean;
}) {
  const live = useLiveEntitlements();
  const showAll = unlocked || live.features.history;
  const series = showAll ? history : history.slice(-7);
  return (
    <>
      <ValuationChart series={series} source={source} />
      {!showAll && (
        <p className="text-[14px] text-faint mt-2">
          Free seats see a 7-day backfill. <Link href="/pricing" className="text-ink hover:text-muted underline">Pro unlocks 30-day persisted model path.</Link>
        </p>
      )}
    </>
  );
}
