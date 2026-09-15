import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import * as XLSX from "xlsx";
import { ensureIngestMeta, recordSourceVintage } from "./lib/ingest-meta";
import { parseFccSheetVintage } from "./lib/fcc-vintage";

const DB_PATH = path.join(process.cwd(), "data", "clarke.db");
const XLSX_PATH = path.join(process.cwd(), "data", "ssal.xlsx");

function ucsLaunchToIso(raw: string): string | null {
  const iso = raw.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const m = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  let year = parseInt(m[3], 10);
  if (m[3].length <= 2) year = year >= 57 ? 1900 + year : 2000 + year;
  if (year < 1957 || year > 2100) return null;
  return `${year}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
}

function main() {
  const db = new Database(DB_PATH);
  ensureIngestMeta(db);

  const launches = db.prepare(
    "SELECT launch_date as launchDate FROM satellites WHERE orbit_class = 'GEO' AND launch_date IS NOT NULL",
  ).all() as { launchDate: string }[];
  let ucsVintage: string | null = null;
  for (const row of launches) {
    const iso = ucsLaunchToIso(row.launchDate);
    if (iso && (!ucsVintage || iso > ucsVintage)) ucsVintage = iso;
  }
  recordSourceVintage(db, "UCS", { fileVintage: ucsVintage, sourceAsOf: ucsVintage });
  console.log(`UCS file vintage (latest GEO launch in snapshot): ${ucsVintage}`);

  if (fs.existsSync(XLSX_PATH)) {
    const buf = fs.readFileSync(XLSX_PATH);
    const sha = crypto.createHash("sha256").update(buf).digest("hex");
    const wb = XLSX.read(buf, { type: "buffer", cellDates: false });
    const sheetName = wb.SheetNames[0];
    const vintage = parseFccSheetVintage(sheetName);
    recordSourceVintage(db, "FCC-SSAL", { fileVintage: vintage, sourceAsOf: vintage, fileSha256: sha });
    console.log(`FCC-SSAL workbook "${sheetName}" as-of ${vintage} sha256=${sha.slice(0, 12)}…`);
  } else {
    console.warn("data/ssal.xlsx missing — FCC vintage not recorded.");
  }

  const tle = db.prepare("SELECT MIN(epoch) as min, MAX(epoch) as max FROM spacetrack_tles WHERE epoch IS NOT NULL").get() as
    | { min: string | null; max: string | null }
    | undefined;
  recordSourceVintage(db, "Space-Track TLE", {
    fileVintage: tle?.max ?? null,
    sourceAsOf: tle?.max ?? null,
    tleEpochMin: tle?.min ?? null,
    tleEpochMax: tle?.max ?? null,
  });
  console.log(`Space-Track TLE epoch range: ${tle?.min ?? "—"} … ${tle?.max ?? "—"}`);

  db.close();
}

main();
