import Link from "next/link";
import { findCompany } from "@/data/companies";

export function CompanyTag({ name }: { name: string }) {
  const company = findCompany(name);
  if (company) {
    return (
      <Link href={`/companies/${company.slug}`} className="company-tag hover:border-white/20 hover:text-white/60 transition-colors">
        {name}
      </Link>
    );
  }
  return <span className="company-tag">{name}</span>;
}
