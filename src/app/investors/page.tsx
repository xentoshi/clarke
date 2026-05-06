import { buildMeta } from "@/lib/metadata";
import { investors } from "@/data/investors";
import InvestorsClient from "./InvestorsClient";

export const metadata = buildMeta({
  title: "Investors",
  description: "The funds and individuals backing companies building the space industry.",
  tag: "Investors",
});

export default function InvestorsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-white mb-2">Investors</h1>
        <p className="text-zinc-500 text-sm">
          The funds and individuals backing companies building the space industry {investors.length} VCs, corporate arms, and influential angels.
        </p>
      </div>
      <InvestorsClient />
    </div>
  );
}
