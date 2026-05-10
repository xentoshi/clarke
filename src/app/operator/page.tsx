import type { Metadata } from "next";
import OperatorClient from "./OperatorClient";
import { buildMeta } from "@/lib/metadata";

export const metadata: Metadata = buildMeta({
  title: "Operator",
  description: "Distribute transponder lease revenue to yield share holders on Solana.",
  tag: "Operator",
});

export default function OperatorPage() {
  return <OperatorClient />;
}
