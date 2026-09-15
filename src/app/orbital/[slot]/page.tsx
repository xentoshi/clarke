import { notFound } from "next/navigation";
import { buildMeta } from "@/lib/metadata";
import { getAllRegistrySlugs } from "@/lib/satellites";
import { slots as curatedSlots } from "@/data/orbital-slots";
import { slugToLon } from "@/lib/slot-utils";
import { buildSlotTerminal } from "@/lib/slot-terminal";
import { getEntitlements } from "@/lib/auth";
import { SlotTerminalView } from "@/components/terminal/SlotTerminalView";

type Params = { slot: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slot } = await params;
  const model = buildSlotTerminal(slot);
  if (!model) return {};
  const fv = model.valuation.nonCommercial ? "not commercially valued" : `implied ${model.valuation.formatted.range}`;
  return buildMeta({
    title: `${model.label} · Slot Terminal`,
    description: `${model.operator || "GEO position"} at ${model.label}. ${model.satCount} satellites. ${fv}. Model v0, not a live market price.`,
    tag: "Terminal",
    path: `/orbital/${slot}`,
  });
}

export async function generateStaticParams() {
  return getAllRegistrySlugs(curatedSlots).map((slot) => ({ slot }));
}

export default async function SlotPage({ params }: { params: Promise<Params> }) {
  const { slot } = await params;
  if (slugToLon(slot) === null) notFound();
  const model = buildSlotTerminal(slot);
  if (!model) notFound();
  const entitlements = await getEntitlements();
  return <SlotTerminalView model={model} entitlements={entitlements} />;
}
