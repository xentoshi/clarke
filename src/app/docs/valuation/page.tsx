import { buildMeta } from "@/lib/metadata";
import { loadDoc } from "@/lib/docs";
import DocArticle from "@/components/docs/DocArticle";

const doc = loadDoc("valuation");

export const revalidate = false;

export const metadata = buildMeta({
  title: doc.title,
  description: doc.description,
  tag: "Docs",
  path: doc.href,
  image: `/og/page/docs-${doc.slug}.png`,
});

export default function ValuationDocsPage() {
  return <DocArticle doc={doc} />;
}
