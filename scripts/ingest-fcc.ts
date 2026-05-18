import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";

const XLSX_PATH = path.join(process.cwd(), "data", "ssal.xlsx");
const DB_PATH = path.join(process.cwd(), "data", "clarke.db");

// "1 W.L." → -1   "100.85 W.L." → -100.85   "100 E.L." → 100
function parseOrbitalLocation(raw: string): number | null {
  const m = (raw ?? "").trim().match(/^([\d.]+)\s+(W|E)\.L\.$/i);
  if (!m) return null;
  const deg = parseFloat(m[1]);
  return m[2].toUpperCase() === "W" ? -deg : deg;
}

// Excel serial number or "8/20/2015 (launch)" string → "YYYY-MM-DD"
function parseDateField(raw: unknown): string | null {
  if (!raw || raw === "N/A") return null;
  if (typeof raw === "number") {
    const d = XLSX.SSF.parse_date_code(raw);
    if (!d) return null;
    return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const s = String(raw);
  const m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  return s.trim() || null;
}

function main() {
  if (!fs.existsSync(XLSX_PATH)) {
    console.error(`File not found: ${XLSX_PATH}\nCopy ssal.xlsx to data/ssal.xlsx and re-run.`);
    process.exit(1);
  }

  console.log("Parsing FCC Approved Space Station List...");
  const wb = XLSX.readFile(XLSX_PATH, { cellDates: false });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
  console.log(`Parsed ${rawRows.length} rows, columns: ${Object.keys(rawRows[0] ?? {}).join(" | ")}`);

  const db = new Database(DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS fcc_authorizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orbital_location TEXT,
      longitude_geo REAL,
      satellite_name TEXT,
      call_sign TEXT,
      licensee TEXT,
      administration TEXT,
      service TEXT,
      frequency_range TEXT,
      date_in_orbit TEXT,
      grant_status TEXT,
      notes TEXT,
      source TEXT DEFAULT 'FCC-SSAL',
      ingested_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_fcc_lon ON fcc_authorizations(longitude_geo);
    CREATE INDEX IF NOT EXISTS idx_fcc_callsign ON fcc_authorizations(call_sign);
  `);

  db.exec("DELETE FROM fcc_authorizations WHERE source = 'FCC-SSAL'");

  const insert = db.prepare(`
    INSERT INTO fcc_authorizations (
      orbital_location, longitude_geo, satellite_name, call_sign,
      licensee, administration, service, frequency_range,
      date_in_orbit, grant_status, notes
    ) VALUES (
      @orbital_location, @longitude_geo, @satellite_name, @call_sign,
      @licensee, @administration, @service, @frequency_range,
      @date_in_orbit, @grant_status, @notes
    )
  `);

  const insertMany = db.transaction((records: object[]) => {
    for (const rec of records) insert.run(rec);
  });

  let inserted = 0;
  let skipped = 0;
  const records: object[] = [];

  for (const row of rawRows) {
    const locRaw = String(row["Orbital Location"] ?? "");
    const lon = parseOrbitalLocation(locRaw);
    if (lon === null) { skipped++; continue; }

    records.push({
      orbital_location: locRaw.trim() || null,
      longitude_geo: lon,
      satellite_name: String(row["Satellite Name"] ?? "").trim() || null,
      call_sign: String(row["Call Sign"] ?? "").trim() || null,
      licensee: String(row["Licensee or Grantee"] ?? "").trim() || null,
      administration: String(row["Administration"] ?? "").trim() || null,
      service: String(row["Service"] ?? "").trim() || null,
      frequency_range: String(row["Frequency Range"] ?? "").trim() || null,
      date_in_orbit: parseDateField(row["Date In-orbit and Operating"]),
      grant_status: String(row["Grant"] ?? "").trim() || null,
      notes: String(row["Notes"] ?? "").trim() || null,
    });
    inserted++;
  }

  insertMany(records);
  db.exec("VACUUM");
  db.close();

  console.log(`Inserted: ${inserted} GEO authorizations | Skipped (no GEO location): ${skipped}`);
  const sample = records.slice(0, 2);
  console.log("Sample records:", JSON.stringify(sample, null, 2));
}

main();
