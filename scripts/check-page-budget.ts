import fs from "fs";
import path from "path";
import { measureSlotPages, pageBudgetViolations, SLOT_HTML_BUDGET, SLOT_RSC_BUDGET } from "../src/lib/page-budget";

function fileSize(rel: string): string {
  const file = path.join(process.cwd(), rel);
  if (!fs.existsSync(file)) return "missing";
  return String(fs.statSync(file).size);
}

const pages = measureSlotPages();
const worstHtml = pages.reduce((a, b) => (a.html > b.html ? a : b));
const worstRsc = pages.reduce((a, b) => (a.rsc > b.rsc ? a : b));
const sample = pages.find((page) => page.slug === "101w");
console.log(`slot pages: ${pages.length}`);
console.log(`budget: html ${SLOT_HTML_BUDGET} bytes, rsc ${SLOT_RSC_BUDGET} bytes`);
console.log(`max html: ${worstHtml.html} (/orbital/${worstHtml.slug})`);
console.log(`max rsc: ${worstRsc.rsc} (/orbital/${worstRsc.slug})`);
console.log(`101w html: ${sample?.html ?? "missing"} rsc: ${sample?.rsc ?? "missing"}`);
console.log(`orbital html: ${fileSize(".next/server/app/orbital.html")} rsc: ${fileSize(".next/server/app/orbital.rsc")}`);
console.log(`not-found html: ${fileSize(".next/server/app/_not-found.html")} rsc: ${fileSize(".next/server/app/_not-found.rsc")}`);

const violations = pageBudgetViolations();
if (violations.length > 0) {
  for (const line of violations) console.error(line);
  process.exit(1);
}
console.log("page budget ok");
