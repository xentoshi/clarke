import fs from "fs";
import path from "path";
import { buildSearchIndex } from "../src/lib/search-index";

const out = path.join(process.cwd(), "public", "search-index.json");
const index = buildSearchIndex();
fs.writeFileSync(out, JSON.stringify(index));
console.log(`wrote ${index.length} search rows (${fs.statSync(out).size} bytes) to public/search-index.json`);
