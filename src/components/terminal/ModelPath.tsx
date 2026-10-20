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
          This chart shows 7 days of the model path. <Link href="/pricing" className="text-ink hover:text-muted underline">Pricing</Link>
        </p>
      )}
    </>
  );
}
