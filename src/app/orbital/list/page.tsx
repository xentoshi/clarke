import { buildMeta } from "@/lib/metadata";
import ListSlotClient from "./ListSlotClient";

export const metadata = buildMeta({
  title: "List a Slot",
  description: "Satellite operator? List your geostationary orbital position for fractional investment on Clarke.",
  tag: "Operators",
});

export default function ListSlotPage() {
  return <ListSlotClient />;
}
