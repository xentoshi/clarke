import { Suspense } from "react";
import { buildMeta } from "@/lib/metadata";
import CompareClient from "./CompareClient";

export const revalidate = false;

export const metadata = buildMeta({
  title: "Compare slots",
  description: "Side-by-side Slot Terminal metrics for up to four GEO positions.",
  tag: "Terminal",
  path: "/orbital/compare",
  image: "/og/page/compare.png",
});

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="max-w-xl mx-auto px-4 py-20 text-center text-muted text-sm">Loading compare</div>}>
      <CompareClient />
    </Suspense>
  );
}
