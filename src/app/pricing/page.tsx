import { buildMeta } from "@/lib/metadata";
import PricingClient from "./PricingClient";

export const revalidate = false;

export const metadata = buildMeta({
  title: "Pricing",
  description: "Registry access is currently free. For the paid seat, message @ClarkeBeltFi on X.",
  tag: "Pricing",
  path: "/pricing",
  image: "/og/page/pricing.png",
});

export default function PricingPage() {
  return <PricingClient />;
}
