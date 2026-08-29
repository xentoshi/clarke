import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import https from "https";
import { recordIngest } from "./lib/ingest-meta";

const DB_PATH = path.join(process.cwd(), "data", "clarke.db");
const UCS_URL = "https://www.ucs.org/media/11493";

function fetch(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const get = (u: string) => {
      https.get(u, { headers: { "User-Agent": "Clarke/1.0 (research)" } }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          get(res.headers.location);
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        // Source file is Mac OS Roman, not UTF-8 — decoding as UTF-8 corrupts
        // every accented name (Société, Göktürk, etc.) into U+FFFD.
        res.on("end", () => resolve(new TextDecoder("macintosh").decode(Buffer.concat(chunks))));
        res.on("error", reject);
      }).on("error", reject);
    };
    get(url);
  });
}

function parseFloat2(v: string): number | null {
  const n = parseFloat(v.replace(/,/g, "").trim());
  return isNaN(n) ? null : n;
}

function clean(v: string | undefined): string | null {
  if (v === undefined) return null;
  const s = v.replace(/^"|"$/g, "").trim();
  return s === "" ? null : s;
}

async function main() {
  console.log("Downloading UCS Satellite Database...");
  const raw = await fetch(UCS_URL);
  const lines = raw.split(/\r?\n/);

  console.log(`Fetched ${lines.length} lines`);

  if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  }

  const db = new Database(DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS satellites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      official_name TEXT,
      country_un_registry TEXT,
      owner_country TEXT,
      operator TEXT,
      users TEXT,
      purpose TEXT,
      detailed_purpose TEXT,
      orbit_class TEXT NOT NULL,
      orbit_type TEXT,
      longitude_geo REAL,
      perigee_km REAL,
      apogee_km REAL,
      eccentricity REAL,
      inclination_deg REAL,
      period_min REAL,
      launch_mass_kg REAL,
      dry_mass_kg REAL,
      power_watts REAL,
      launch_date TEXT,
      expected_lifetime_years REAL,
      contractor TEXT,
      contractor_country TEXT,
      launch_site TEXT,
      launch_vehicle TEXT,
      cospar_id TEXT,
      norad_id TEXT,
      comments TEXT,
      source TEXT DEFAULT 'UCS',
      ingested_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_orbit_class ON satellites(orbit_class);
    CREATE INDEX IF NOT EXISTS idx_longitude ON satellites(longitude_geo);
  `);

  db.exec("DELETE FROM satellites WHERE source = 'UCS'");

  const insert = db.prepare(`
    INSERT INTO satellites (
      name, official_name, country_un_registry, owner_country, operator,
      users, purpose, detailed_purpose, orbit_class, orbit_type,
      longitude_geo, perigee_km, apogee_km, eccentricity, inclination_deg,
      period_min, launch_mass_kg, dry_mass_kg, power_watts, launch_date,
      expected_lifetime_years, contractor, contractor_country, launch_site,
      launch_vehicle, cospar_id, norad_id, comments, source
    ) VALUES (
      @name, @official_name, @country_un_registry, @owner_country, @operator,
      @users, @purpose, @detailed_purpose, @orbit_class, @orbit_type,
      @longitude_geo, @perigee_km, @apogee_km, @eccentricity, @inclination_deg,
      @period_min, @launch_mass_kg, @dry_mass_kg, @power_watts, @launch_date,
      @expected_lifetime_years, @contractor, @contractor_country, @launch_site,
      @launch_vehicle, @cospar_id, @norad_id, @comments, 'UCS'
    )
  `);

  const insertMany = db.transaction((rows: object[]) => {
    for (const row of rows) insert.run(row);
  });

  let total = 0;
  let geoCount = 0;
  let skipped = 0;
  let duplicateNorad = 0;
  const rows: object[] = [];
  const seenNorad = new Set<string>();

  // Skip header line (index 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split("\t");
    if (cols.length < 9) { skipped++; continue; }

    const name = clean(cols[0]);
    const orbitClass = clean(cols[8]);
    if (!name || !orbitClass) { skipped++; continue; }

    // The source occasionally lists the same NORAD ID twice (an exact
    // duplicate row, or two differently-named objects sharing an ID) — keep
    // the first occurrence and drop the rest rather than double-counting.
    const norad_id = clean(cols[26]);
    if (norad_id && seenNorad.has(norad_id)) { duplicateNorad++; continue; }
    if (norad_id) seenNorad.add(norad_id);

    // Ingest all regimes (GEO/LEO/MEO/Elliptical). GEO longitude only applies
    // to GEO rows; leave it null otherwise.
    const lonRaw = orbitClass === "GEO" ? parseFloat2(cols[10] ?? "") : null;
    const longitude_geo = lonRaw;

    rows.push({
      name,
      official_name: clean(cols[1]),
      country_un_registry: clean(cols[2]),
      owner_country: clean(cols[3]),
      operator: clean(cols[4]),
      users: clean(cols[5]),
      purpose: clean(cols[6]),
      detailed_purpose: clean(cols[7]),
      orbit_class: orbitClass,
      orbit_type: clean(cols[9]),
      longitude_geo,
      perigee_km: null,
      apogee_km: null,
      eccentricity: null,
      inclination_deg: null,
      period_min: null,
      launch_mass_kg: parseFloat2(cols[16] ?? ""),
      dry_mass_kg: parseFloat2(cols[17] ?? ""),
      power_watts: parseFloat2(cols[18] ?? ""),
      launch_date: clean(cols[19]),
      expected_lifetime_years: parseFloat2(cols[20] ?? ""),
      contractor: clean(cols[21]),
      contractor_country: clean(cols[22]),
      launch_site: clean(cols[23]),
      launch_vehicle: clean(cols[24]),
      cospar_id: clean(cols[25]),
      norad_id,
      comments: clean(cols[27]),
    });

    total++;
    if (orbitClass === "GEO") geoCount++;
  }

  insertMany(rows);
  recordIngest(db, "UCS", total, "UCS Satellite Database (all regimes)");
  db.exec("VACUUM");
  db.close();

  console.log(`Inserted ${total} satellites (${geoCount} GEO, ${skipped} skipped, ${duplicateNorad} duplicate NORAD IDs dropped)`);
  console.log(`Database written to ${DB_PATH}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
