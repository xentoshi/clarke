import { buildMeta } from "@/lib/metadata";
import { getEntitlements } from "@/lib/auth";
import PricingClient from "./PricingClient";

export const metadata = buildMeta({
  title: "Pricing",
  description: "Free GEO registry. Pro Slot Terminal seats for valuation breakdown, compare, export+, and API.",
  tag: "Pricing",
  path: "/pricing",
});

export default async function PricingPage() {
  const e = await getEntitlements();
  return <PricingClient loggedIn={e.loggedIn} pro={e.pro} email={e.email} />;
}
