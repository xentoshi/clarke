import { buildMeta } from "@/lib/metadata";
import { companies, verticalLabels } from "@/data/companies";
import CompaniesClient from "./CompaniesClient";

export const metadata = buildMeta({
  title: "Companies",
  description: `${companies.length} companies across ${Object.keys(verticalLabels).length} verticals — every organization building the space industry.`,
  tag: "Directory",
});

export default function CompaniesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Companies</h1>
        <p className="text-zinc-500 text-sm">
          {companies.length} companies across {Object.keys(verticalLabels).length} verticals — every organization building the space industry.
        </p>
      </div>
      <CompaniesClient />
    </div>
  );
}
