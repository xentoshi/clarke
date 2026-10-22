import { cache } from "react";
import { notFound } from "next/navigation";
import { buildMeta } from "@/lib/metadata";
import { getAllRegistrySlugs } from "@/lib/satellites";
import { slots as curatedSlots } from "@/data/orbital-slots";
import { slugToLon } from "@/lib/slot-utils";
import { buildSlotTerminal } from "@/lib/slot-terminal";
import { freeEntitlements } from "@/lib/entitlements";
import { SlotTerminalView } from "@/components/terminal/SlotTerminalView";

type Params = { slot: string };

// Slot HTML is baked from committed data/clarke.db. Rebuild on deploy only.
// Unknown slugs 404 from the static shell. Rendering them on demand writes an ISR entry per bot URL.
export const revalidate = false;
export const dynamicParams = false;

const loadSlotTerminal = cache((slot: string) => buildSlotTerminal(slot));

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slot } = await params;
  const model = loadSlotTerminal(slot);
  if (!model) return {};
  const fv = model.valuation.nonCommercial ? "not commercially valued" : `implied ${model.valuation.formatted.range}`;
  return buildMeta({
    title: `${model.label} · Slot Terminal`,
    description: `${model.operator || "GEO position"} at ${model.label}. ${model.satCount} satellites. ${fv}. Model v0, not a live market price.`,
    tag: "Terminal",
    path: `/orbital/${slot}`,
    image: `/og/slot/${slot}.png`,
  });
}

export async function generateStaticParams() {
  return getAllRegistrySlugs(curatedSlots).map((slot) => ({ slot }));
}

export default async function SlotPage({ params }: { params: Promise<Params> }) {
  const { slot } = await params;
  if (slugToLon(slot) === null) notFound();
  const model = loadSlotTerminal(slot);
  if (!model) notFound();
  return <SlotTerminalView model={model} entitlements={freeEntitlements()} />;
}
