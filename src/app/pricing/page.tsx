import { buildMeta } from "@/lib/metadata";
import PricingClient from "./PricingClient";

export const revalidate = false;

export const metadata = buildMeta({
  title: "Pricing",
  description: "Free GEO registry. Pro Slot Terminal seats for valuation breakdown, compare, export+, and API.",
  tag: "Pricing",
  path: "/pricing",
  image: "/og/page/pricing.png",
});

export default function PricingPage() {
  return <PricingClient />;
}
