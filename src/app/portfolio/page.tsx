import type { Metadata } from "next";
import PortfolioClient from "./PortfolioClient";
import { buildMeta } from "@/lib/metadata";
import { slots } from "@/data/orbital-slots";

export const metadata: Metadata = buildMeta({
  title: "Portfolio · Clarke",
  description: "Your orbital slot positions and claimable yield.",
});

export default function PortfolioPage() {
  return <PortfolioClient slots={slots} />;
}
