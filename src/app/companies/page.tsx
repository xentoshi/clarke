import type { Metadata } from "next";
import { buildMeta } from "@/lib/metadata";
import { companies, sectors } from "@/data/companies";
import CompaniesClient from "./CompaniesClient";

export const metadata: Metadata = buildMeta({
  title: "Companies",
  description: "The companies building the space economy, from launch to planetary engineering.",
  tag: "Directory",
});

export default function CompaniesPage() {
  return <CompaniesClient companies={companies} sectors={sectors} />;
}
