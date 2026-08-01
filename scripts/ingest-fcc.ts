import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";
import { recordIngest } from "./lib/ingest-meta";
import { ensureEventTables, recordSlotEvent } from "./lib/events";

const XLSX_PATH = path.join(process.cwd(), "data", "ssal.xlsx");
const DB_PATH = path.join(process.cwd(), "data", "clarke.db");

// "N/A" is a common literal placeholder in the source for a missing call
// sign, not a real identifier — 21 of 174 current rows share it. Treating it
// as a key would produce nonsense new/lapsed noise between unrelated rows.
function isRealCallSign(cs: string | null | undefined): cs is string {
  return !!cs && cs !== "N/A";
}

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
  ensureEventTables(db);

  // Snapshot before the delete+reinsert so new/lapsed/changed authorizations
  // can be told apart from a no-op re-run against the same source file.
  const prevByCallSign = new Map<string, { licensee: string | null; grantStatus: string | null; longitudeGeo: number | null; orbitalLocation: string | null }>(
    (db.prepare(
      "SELECT call_sign, licensee, grant_status, longitude_geo, orbital_location FROM fcc_authorizations WHERE source = 'FCC-SSAL' AND call_sign IS NOT NULL"
    ).all() as { call_sign: string; licensee: string | null; grant_status: string | null; longitude_geo: number | null; orbital_location: string | null }[])
      .filter((r) => isRealCallSign(r.call_sign))
      .map((r) => [r.call_sign, { licensee: r.licensee, grantStatus: r.grant_status, longitudeGeo: r.longitude_geo, orbitalLocation: r.orbital_location }]),
  );

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

  interface FccRecord {
    orbital_location: string | null;
    longitude_geo: number;
    satellite_name: string | null;
    call_sign: string | null;
    licensee: string | null;
    administration: string | null;
    service: string | null;
    frequency_range: string | null;
    date_in_orbit: string | null;
    grant_status: string | null;
    notes: string | null;
  }

  const insertMany = db.transaction((records: FccRecord[]) => {
    for (const rec of records) insert.run(rec);
  });

  let inserted = 0;
  let skipped = 0;
  const records: FccRecord[] = [];

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
  recordIngest(db, "FCC-SSAL", inserted, "FCC Space Station Authorization List (GEO)");

  const newByCallSign = new Map<string, FccRecord>(
    records.filter((r) => isRealCallSign(r.call_sign)).map((r) => [r.call_sign as string, r]),
  );

  let newAuthEvents = 0, lapsedEvents = 0, licenseeChangeEvents = 0, statusChangeEvents = 0;

  for (const [callSign, rec] of newByCallSign) {
    const prev = prevByCallSign.get(callSign);
    if (!prev) {
      recordSlotEvent(db, {
        source: "fcc",
        eventType: "new_authorization",
        longitudeGeo: rec.longitude_geo,
        callSign,
        summary: `New FCC authorization: ${callSign} (${rec.licensee ?? "unknown licensee"}) at ${rec.orbital_location ?? rec.longitude_geo + "°"}.`,
        detail: { callSign, licensee: rec.licensee, orbitalLocation: rec.orbital_location, grantStatus: rec.grant_status },
      });
      newAuthEvents++;
      continue;
    }
    if (rec.licensee && rec.licensee !== prev.licensee) {
      recordSlotEvent(db, {
        source: "fcc",
        eventType: "licensee_change",
        longitudeGeo: rec.longitude_geo,
        callSign,
        summary: `${callSign} licensee changed from "${prev.licensee ?? "unknown"}" to "${rec.licensee}".`,
        detail: { callSign, oldLicensee: prev.licensee, newLicensee: rec.licensee },
      });
      licenseeChangeEvents++;
    }
    if (rec.grant_status !== prev.grantStatus) {
      recordSlotEvent(db, {
        source: "fcc",
        eventType: "grant_status_change",
        longitudeGeo: rec.longitude_geo,
        callSign,
        summary: `${callSign} grant status changed from "${prev.grantStatus ?? "unknown"}" to "${rec.grant_status ?? "unknown"}".`,
        detail: { callSign, oldStatus: prev.grantStatus, newStatus: rec.grant_status },
      });
      statusChangeEvents++;
    }
  }

  for (const [callSign, prev] of prevByCallSign) {
    if (!newByCallSign.has(callSign)) {
      recordSlotEvent(db, {
        source: "fcc",
        eventType: "authorization_lapsed",
        longitudeGeo: prev.longitudeGeo,
        callSign,
        summary: `FCC authorization ${callSign} (${prev.licensee ?? "unknown licensee"}) no longer appears in the FCC list.`,
        detail: { callSign, licensee: prev.licensee },
      });
      lapsedEvents++;
    }
  }

  if (newAuthEvents || lapsedEvents || licenseeChangeEvents || statusChangeEvents) {
    console.log(`Recorded events: ${newAuthEvents} new, ${lapsedEvents} lapsed, ${licenseeChangeEvents} licensee changes, ${statusChangeEvents} status changes.`);
  }

  db.exec("VACUUM");
  db.close();

  console.log(`Inserted: ${inserted} GEO authorizations | Skipped (no GEO location): ${skipped}`);
  const sample = records.slice(0, 2);
  console.log("Sample records:", JSON.stringify(sample, null, 2));
}

main();
