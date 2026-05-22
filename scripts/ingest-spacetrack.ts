import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { login, query, PATHS } from "./lib/spacetrack";

const DB_PATH = path.join(process.cwd(), "data", "clarke.db");

function nullStr(v: string | null | undefined): string | null {
  if (v === undefined || v === null) return null;
  const s = v.trim();
  return s === "" ? null : s;
}

function nullNum(v: string | null | undefined): number | null {
  if (v === undefined || v === null) return null;
  const s = v.trim();
  if (s === "") return null;
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

// Parse TLE epoch "YYDDD.DDDDDDDD" to "YYYY-MM-DD"
function parseEpoch(epoch: string): string | null {
  const raw = epoch.trim();
  if (!raw) return null;
  const yy = parseInt(raw.slice(0, 2), 10);
  const year = yy >= 57 ? 1900 + yy : 2000 + yy;
  const doyFull = parseFloat(raw.slice(2));
  const doy = Math.floor(doyFull);
  const date = new Date(year, 0, 1);
  date.setDate(date.getDate() + doy - 1);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
}

interface SatcatRow {
  NORAD_CAT_ID: string;
  INTLDES: string | null;
  OBJECT_NAME: string | null;
  OBJECT_TYPE: string | null;
  COUNTRY: string | null;
  LAUNCH: string | null;
  SITE: string | null;
  DECAY: string | null;
  PERIOD: string | null;
  INCLINATION: string | null;
  APOGEE: string | null;
  PERIGEE: string | null;
  RCS_SIZE: string | null;
  CURRENT: string | null;
}

async function main() {
  const username = process.env.SPACETRACK_USERNAME;
  const password = process.env.SPACETRACK_PASSWORD;

  if (!username || !password) {
    console.error("ERROR: SPACETRACK_USERNAME and SPACETRACK_PASSWORD must be set in the environment.");
    process.exit(1);
  }

  console.log("Authenticating with Space-Track...");
  const cookie = await login(username, password);
  console.log("Authenticated.");

  if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  }

  const db = new Database(DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS spacetrack_satcat (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      norad_id        TEXT UNIQUE NOT NULL,
      intldes         TEXT,
      object_name     TEXT,
      object_type     TEXT,
      country         TEXT,
      launch_date     TEXT,
      launch_site     TEXT,
      decay_date      TEXT,
      period_min      REAL,
      inclination_deg REAL,
      apogee_km       REAL,
      perigee_km      REAL,
      rcs_size        TEXT,
      current         TEXT,
      ingested_at     TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_satcat_norad ON spacetrack_satcat(norad_id);
    CREATE INDEX IF NOT EXISTS idx_satcat_country ON spacetrack_satcat(country);

    CREATE TABLE IF NOT EXISTS spacetrack_tles (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      norad_id    TEXT UNIQUE NOT NULL,
      name        TEXT,
      tle1        TEXT NOT NULL,
      tle2        TEXT NOT NULL,
      epoch       TEXT,
      ingested_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_tles_norad ON spacetrack_tles(norad_id);
    CREATE INDEX IF NOT EXISTS idx_tles_epoch ON spacetrack_tles(epoch);
  `);

  // --- Satcat ---
  console.log("Fetching satcat...");
  const satcatRaw = await query(cookie, PATHS.satcat);
  const satcatData: SatcatRow[] = JSON.parse(satcatRaw);
  console.log(`Parsed ${satcatData.length} satcat records.`);

  const upsertSatcat = db.prepare(`
    INSERT OR REPLACE INTO spacetrack_satcat (
      norad_id, intldes, object_name, object_type, country,
      launch_date, launch_site, decay_date,
      period_min, inclination_deg, apogee_km, perigee_km,
      rcs_size, current
    ) VALUES (
      @norad_id, @intldes, @object_name, @object_type, @country,
      @launch_date, @launch_site, @decay_date,
      @period_min, @inclination_deg, @apogee_km, @perigee_km,
      @rcs_size, @current
    )
  `);

  const insertSatcatMany = db.transaction((rows: SatcatRow[]) => {
    for (const r of rows) {
      upsertSatcat.run({
        norad_id: r.NORAD_CAT_ID.trim(),
        intldes: nullStr(r.INTLDES),
        object_name: nullStr(r.OBJECT_NAME),
        object_type: nullStr(r.OBJECT_TYPE),
        country: nullStr(r.COUNTRY),
        launch_date: nullStr(r.LAUNCH),
        launch_site: nullStr(r.SITE),
        decay_date: nullStr(r.DECAY),
        period_min: nullNum(r.PERIOD),
        inclination_deg: nullNum(r.INCLINATION),
        apogee_km: nullNum(r.APOGEE),
        perigee_km: nullNum(r.PERIGEE),
        rcs_size: nullStr(r.RCS_SIZE),
        current: nullStr(r.CURRENT),
      });
    }
  });

  insertSatcatMany(satcatData);
  console.log(`Upserted ${satcatData.length} satcat rows.`);

  // --- TLEs ---
  console.log("Fetching TLEs...");
  const tleRaw = await query(cookie, PATHS.tles);
  const tleLines = tleRaw.split(/\r?\n/).map((l) => l.trimEnd());

  const upsertTle = db.prepare(`
    INSERT OR REPLACE INTO spacetrack_tles (
      norad_id, name, tle1, tle2, epoch
    ) VALUES (
      @norad_id, @name, @tle1, @tle2, @epoch
    )
  `);

  const insertTlesMany = db.transaction((blocks: { norad_id: string; name: string | null; tle1: string; tle2: string; epoch: string | null }[]) => {
    for (const b of blocks) upsertTle.run(b);
  });

  const tleBlocks: { norad_id: string; name: string | null; tle1: string; tle2: string; epoch: string | null }[] = [];
  let i = 0;
  while (i < tleLines.length) {
    // Skip blank lines
    if (!tleLines[i] || tleLines[i].trim() === "") { i++; continue; }

    const nameLine = tleLines[i];
    const line1 = tleLines[i + 1];
    const line2 = tleLines[i + 2];

    if (!line1 || !line2 || !line1.startsWith("1 ") || !line2.startsWith("2 ")) {
      i++;
      continue;
    }

    const norad_id = line1.slice(2, 7).trim();
    const epochRaw = line1.slice(18, 32).trim();
    const epoch = parseEpoch(epochRaw);

    tleBlocks.push({
      norad_id,
      name: nameLine.trim() || null,
      tle1: line1,
      tle2: line2,
      epoch,
    });

    i += 3;
  }

  console.log(`Parsed ${tleBlocks.length} TLE blocks.`);
  insertTlesMany(tleBlocks);
  console.log(`Upserted ${tleBlocks.length} TLE rows.`);

  db.close();
  console.log("Done.");
}

main().catch((err) => { console.error(err); process.exit(1); });
