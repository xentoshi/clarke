import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { login, query, PATHS } from "./lib/spacetrack";
import { recordIngest } from "./lib/ingest-meta";
import { ensureEventTables, recordSlotEvent } from "./lib/events";
import { subSatelliteLongitudeDeg, circularDiffDeg, normalizeLonDeg } from "./lib/orbit";

const DB_PATH = path.join(process.cwd(), "data", "clarke.db");

// Two independent TLE fits of the same tracked object, weeks apart, for a
// genuinely station-kept GEO satellite normally differ by well under half a
// degree (fit noise, not movement) — verified against real data before this
// threshold was picked. A real relocation is typically many degrees.
const RELOCATION_THRESHOLD_DEG = 1.0;

function formatLonShort(lon: number): string {
  const r = Math.round(lon * 10) / 10;
  return `${Math.abs(r)}°${r >= 0 ? "E" : "W"}`;
}

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
  ensureEventTables(db);

  // --- Satcat ---
  console.log("Fetching satcat...");
  const satcatRaw = await query(cookie, PATHS.satcat);
  const satcatData: SatcatRow[] = JSON.parse(satcatRaw);
  console.log(`Parsed ${satcatData.length} satcat records.`);

  // Snapshot decay status before the upsert overwrites it, so a newly-set
  // decay_date can be told apart from one that was already there.
  const prevDecayByNorad = new Map<string, string | null>(
    (db.prepare("SELECT norad_id, decay_date FROM spacetrack_satcat").all() as { norad_id: string; decay_date: string | null }[])
      .map((r) => [r.norad_id, r.decay_date]),
  );

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

  let decayEvents = 0;
  for (const r of satcatData) {
    const noradId = r.NORAD_CAT_ID.trim();
    const newDecay = nullStr(r.DECAY);
    const prevDecay = prevDecayByNorad.get(noradId);
    if (newDecay && !prevDecay) {
      recordSlotEvent(db, {
        source: "spacetrack",
        eventType: "satellite_decayed",
        noradId,
        summary: `${nullStr(r.OBJECT_NAME) ?? noradId} (NORAD ${noradId}) decayed/reentered (${newDecay}).`,
        detail: { noradId, decayDate: newDecay },
      });
      decayEvents++;
    }
  }
  if (decayEvents > 0) console.log(`Recorded ${decayEvents} decay event(s).`);

  // --- TLEs ---
  console.log("Fetching TLEs...");
  const tleRaw = await query(cookie, PATHS.tles);
  const tleLines = tleRaw.split(/\r?\n/).map((l) => l.trimEnd());

  // Snapshot prior TLEs before the upsert overwrites them, so a relocation
  // can be measured old-vs-new rather than only ever seeing the latest fit.
  const prevTleByNorad = new Map<string, { tle1: string; tle2: string }>(
    (db.prepare("SELECT norad_id, tle1, tle2 FROM spacetrack_tles").all() as { norad_id: string; tle1: string; tle2: string }[])
      .map((r) => [r.norad_id, r]),
  );

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

  // PATHS.tles requests format/tle — Space-Track's bare two-line format,
  // which never includes a name line. Chunking blindly in fixed groups of 3
  // (as if every record were name + line1 + line2) desyncs against every
  // single two-line record: each one's own line1 gets rejected as a "name"
  // candidate, its line2 gets misattributed as the NEXT record's name, and
  // roughly half of all objects were silently dropped entirely. Scan line by
  // line instead, and only ever emit a block from a genuine line1/line2 pair
  // (matching catalog numbers on both) — this also leaves room for a real
  // name line if the query format ever changes upstream.
  const looksLikeTleLine = (s: string) => /^[12] \d/.test(s);

  const tleBlocks: { norad_id: string; name: string | null; tle1: string; tle2: string; epoch: string | null }[] = [];
  let pendingName: string | null = null;
  let i = 0;
  while (i < tleLines.length) {
    const line = tleLines[i];
    if (!line || line.trim() === "") { i++; continue; }

    const next = tleLines[i + 1];
    if (line.startsWith("1 ") && next && next.startsWith("2 ")) {
      const norad_id = line.slice(2, 7).trim();
      if (next.slice(2, 7).trim() === norad_id) {
        const epochRaw = line.slice(18, 32).trim();
        tleBlocks.push({ norad_id, name: pendingName, tle1: line, tle2: next, epoch: parseEpoch(epochRaw) });
        pendingName = null;
        i += 2;
        continue;
      }
    }

    // Not a valid line1/line2 pair starting here. A line that itself looks
    // like orphaned TLE data can't be a real satellite name — clear any
    // pending name so it doesn't get attached to an unrelated object.
    pendingName = looksLikeTleLine(line) ? null : (line.trim() || null);
    i++;
  }

  console.log(`Parsed ${tleBlocks.length} TLE blocks.`);
  insertTlesMany(tleBlocks);
  console.log(`Upserted ${tleBlocks.length} TLE rows.`);

  let relocationEvents = 0;
  for (const b of tleBlocks) {
    const prev = prevTleByNorad.get(b.norad_id);
    if (!prev) continue; // first time seeing this object — nothing to compare against
    const oldLon = subSatelliteLongitudeDeg(prev.tle1, prev.tle2);
    const newLon = subSatelliteLongitudeDeg(b.tle1, b.tle2);
    if (oldLon === null || newLon === null) continue;
    const delta = circularDiffDeg(oldLon, newLon);
    if (Math.abs(delta) >= RELOCATION_THRESHOLD_DEG) {
      // Space-Track's TLE feed (format/tle) never carries a name line, so
      // b.name is always null in practice — fall back to a plain NORAD ID
      // label rather than printing it redundantly twice ("X (NORAD X)").
      const label = b.name ? `${b.name} (NORAD ${b.norad_id})` : `NORAD ${b.norad_id}`;
      recordSlotEvent(db, {
        source: "spacetrack",
        eventType: "satellite_relocated",
        noradId: b.norad_id,
        longitudeGeo: newLon,
        summary: `${label} moved from ${formatLonShort(oldLon)} to ${formatLonShort(newLon)}.`,
        detail: { noradId: b.norad_id, oldLongitudeDeg: oldLon, newLongitudeDeg: newLon, deltaDeg: delta },
      });
      relocationEvents++;
    }
  }
  if (relocationEvents > 0) console.log(`Recorded ${relocationEvents} relocation event(s).`);

  // --- Fix up UCS longitude data using Space-Track as a cross-reference ---
  //
  // UCS occasionally reports a GEO longitude in the 0..360 convention (e.g.
  // 359 instead of -1) rather than Clarke's -180..180, which sorts and
  // groups it wrong against everything else. More commonly, UCS records
  // longitude_geo as the literal value 0 for GEO satellites whose real
  // position isn't publicly disclosed (mostly classified military assets)
  // rather than leaving it blank, which piles unrelated satellites onto a
  // single position and makes it look artificially congested. Fix both,
  // using this ingest's own TLE data as ground truth where available.
  console.log("Cross-checking UCS longitude data...");

  const updateLon = db.prepare("UPDATE satellites SET longitude_geo = ? WHERE id = ?");

  const outOfRange = db.prepare(
    "SELECT id, longitude_geo FROM satellites WHERE orbit_class = 'GEO' AND longitude_geo IS NOT NULL AND (longitude_geo > 180 OR longitude_geo <= -180)",
  ).all() as { id: number; longitude_geo: number }[];
  for (const row of outOfRange) updateLon.run(normalizeLonDeg(row.longitude_geo), row.id);
  if (outOfRange.length > 0) console.log(`Normalized ${outOfRange.length} out-of-range longitude value(s).`);

  const zeroLon = db.prepare(
    "SELECT id, norad_id FROM satellites WHERE orbit_class = 'GEO' AND longitude_geo = 0",
  ).all() as { id: number; norad_id: string | null }[];
  const tleForNorad = db.prepare("SELECT tle1, tle2 FROM spacetrack_tles WHERE norad_id = ?");

  let zeroCorrected = 0;
  let zeroNulled = 0;
  for (const row of zeroLon) {
    const tle = row.norad_id ? (tleForNorad.get(row.norad_id) as { tle1: string; tle2: string } | undefined) : undefined;
    const realLon = tle ? subSatelliteLongitudeDeg(tle.tle1, tle.tle2) : null;
    if (realLon !== null) {
      updateLon.run(realLon, row.id);
      zeroCorrected++;
    } else {
      updateLon.run(null, row.id);
      zeroNulled++;
    }
  }
  if (zeroCorrected > 0) console.log(`Corrected ${zeroCorrected} satellite(s) misfiled at 0° using TLE data.`);
  if (zeroNulled > 0) console.log(`Marked ${zeroNulled} satellite(s) with unknown GEO position (no public tracking data) as unknown instead of 0°.`);

  recordIngest(db, "Space-Track satcat", satcatData.length, "Space-Track satellite catalog");
  recordIngest(db, "Space-Track TLE", tleBlocks.length, "Space-Track two-line element sets");

  db.close();
  console.log("Done.");
}

main().catch((err) => { console.error(err); process.exit(1); });
