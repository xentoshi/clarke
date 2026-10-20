import { buildMeta } from "@/lib/metadata";
import PricingClient from "./PricingClient";

export const revalidate = false;

export const metadata = buildMeta({
  title: "Pricing",
  description: "Registry access is currently free. A paid Terminal seat is contact only.",
  tag: "Pricing",
  path: "/pricing",
  image: "/og/page/pricing.png",
});

export default function PricingPage() {
  return <PricingClient />;
}
