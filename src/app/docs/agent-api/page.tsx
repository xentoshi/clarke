import { buildMeta } from "@/lib/metadata";
import { loadDoc } from "@/lib/docs";
import DocArticle from "@/components/docs/DocArticle";

const doc = loadDoc("agent-api");

export const metadata = buildMeta({
  title: doc.title,
  description: doc.description,
  tag: "Docs",
  path: doc.href,
});

export default function AgentApiDocsPage() {
  return <DocArticle doc={doc} showLegend />;
}
