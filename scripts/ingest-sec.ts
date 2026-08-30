import Database from "better-sqlite3";
import path from "path";
import { recordIngest } from "./lib/ingest-meta";

const DB_PATH = path.join(process.cwd(), "data", "clarke.db");

// SEC's fair-access policy requires a descriptive User-Agent with contact
// info, unidentified/generic clients get blocked.
const USER_AGENT = "Clarke (orbital registry) contact@clarkebelt.finance";

// Only operators confirmed to actually file real financial disclosures with
// the SEC. Verified 2026-08-30 by querying EDGAR directly: Eutelsat has only
// an ADR registration (F-6) on file, no 10-K/20-F/6-K; Intelsat's main
// entity deregistered (Form 15-12B) after being absorbed into SES. Both are
// excluded rather than silently returning nothing.
interface OperatorConfig {
  name: string;
  cik: string;
  taxonomy: "ifrs-full" | "us-gaap";
  concepts: { key: string; xbrlTags: string[] }[];
}

const OPERATORS: OperatorConfig[] = [
  {
    name: "SES",
    cik: "1347408",
    taxonomy: "ifrs-full",
    concepts: [
      { key: "revenue", xbrlTags: ["Revenue"] },
      { key: "net_income", xbrlTags: ["ProfitLoss"] },
      { key: "operating_income", xbrlTags: ["ProfitLossFromOperatingActivities"] },
      { key: "total_assets", xbrlTags: ["Assets"] },
    ],
  },
  {
    name: "Telesat",
    cik: "1845842",
    taxonomy: "ifrs-full",
    concepts: [
      { key: "revenue", xbrlTags: ["Revenue"] },
      { key: "net_income", xbrlTags: ["ProfitLoss"] },
      { key: "operating_income", xbrlTags: ["ProfitLossFromOperatingActivities"] },
      { key: "total_assets", xbrlTags: ["Assets"] },
    ],
  },
  {
    name: "Viasat",
    cik: "797721",
    taxonomy: "us-gaap",
    concepts: [
      { key: "revenue", xbrlTags: ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues"] },
      { key: "net_income", xbrlTags: ["NetIncomeLoss", "ProfitLoss"] },
      { key: "operating_income", xbrlTags: ["OperatingIncomeLoss"] },
      { key: "total_assets", xbrlTags: ["Assets"] },
    ],
  },
];

interface XbrlFact {
  start?: string;
  end: string;
  val: number;
  fy: number;
  fp: string;
  form: string;
  filed: string;
  frame?: string;
}

interface CompanyFacts {
  facts?: Record<string, Record<string, { units: Record<string, XbrlFact[]> }>>;
}

async function fetchCompanyFacts(cik: string): Promise<CompanyFacts> {
  const padded = cik.padStart(10, "0");
  const res = await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${padded}.json`, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) throw new Error(`SEC EDGAR returned ${res.status} for CIK ${padded}`);
  return res.json();
}

interface FinancialRow {
  operator: string;
  cik: string;
  concept_key: string;
  xbrl_tag: string;
  taxonomy: string;
  unit: string;
  value: number;
  period_start: string | null;
  period_end: string;
  fiscal_year: number | null;
  fiscal_period: string | null;
  form: string;
  filed: string;
}

async function main() {
  const db = new Database(DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS sec_financials (
      operator TEXT NOT NULL,
      cik TEXT NOT NULL,
      concept_key TEXT NOT NULL,
      xbrl_tag TEXT NOT NULL,
      taxonomy TEXT NOT NULL,
      unit TEXT NOT NULL,
      value REAL NOT NULL,
      period_start TEXT,
      period_end TEXT NOT NULL,
      fiscal_year INTEGER,
      fiscal_period TEXT,
      form TEXT NOT NULL,
      filed TEXT NOT NULL,
      ingested_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (operator, concept_key, unit, period_start, period_end, form, filed)
    );
    CREATE INDEX IF NOT EXISTS idx_sec_operator ON sec_financials(operator);
    CREATE INDEX IF NOT EXISTS idx_sec_concept ON sec_financials(concept_key, period_end);
  `);

  const insert = db.prepare(`
    INSERT OR REPLACE INTO sec_financials (
      operator, cik, concept_key, xbrl_tag, taxonomy, unit, value,
      period_start, period_end, fiscal_year, fiscal_period, form, filed
    ) VALUES (
      @operator, @cik, @concept_key, @xbrl_tag, @taxonomy, @unit, @value,
      @period_start, @period_end, @fiscal_year, @fiscal_period, @form, @filed
    )
  `);
  const insertMany = db.transaction((rows: FinancialRow[]) => {
    for (const row of rows) insert.run(row);
  });

  let totalRows = 0;
  const skippedConcepts: string[] = [];

  for (const op of OPERATORS) {
    console.log(`Fetching SEC company facts for ${op.name} (CIK ${op.cik})...`);
    const facts = await fetchCompanyFacts(op.cik);
    const taxonomyFacts = facts.facts?.[op.taxonomy];
    if (!taxonomyFacts) {
      console.warn(`  No ${op.taxonomy} facts found for ${op.name}, skipping.`);
      continue;
    }

    const rows: FinancialRow[] = [];
    for (const concept of op.concepts) {
      const tag = concept.xbrlTags.find((t) => taxonomyFacts[t]);
      if (!tag) {
        skippedConcepts.push(`${op.name}/${concept.key}`);
        continue;
      }
      const units = taxonomyFacts[tag].units;
      for (const [unit, facts] of Object.entries(units)) {
        for (const f of facts) {
          rows.push({
            operator: op.name,
            cik: op.cik,
            concept_key: concept.key,
            xbrl_tag: tag,
            taxonomy: op.taxonomy,
            unit,
            value: f.val,
            period_start: f.start ?? null,
            period_end: f.end,
            fiscal_year: f.fy ?? null,
            fiscal_period: f.fp ?? null,
            form: f.form,
            filed: f.filed,
          });
        }
      }
    }

    insertMany(rows);
    totalRows += rows.length;
    console.log(`  Inserted ${rows.length} data points for ${op.name}.`);

    // SEC's fair-access policy asks for no more than ~10 req/s; one request
    // per operator here, so a short pause is generous, not load-bearing.
    await new Promise((r) => setTimeout(r, 300));
  }

  if (skippedConcepts.length > 0) {
    console.warn(`Concepts not found (tag not present for this filer): ${skippedConcepts.join(", ")}`);
  }

  recordIngest(db, "SEC EDGAR", totalRows, `XBRL company facts for ${OPERATORS.map((o) => o.name).join(", ")}`);

  db.exec("VACUUM");
  db.close();

  console.log(`Total: ${totalRows} financial data points across ${OPERATORS.length} operators.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
