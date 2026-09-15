import { slots as curatedSlots } from "../src/data/orbital-slots";
import {
  mergeWithUcs,
  getGeoSatellitesByLongitude,
  getFccAuthorizationsByLongitude,
  getCongestion,
  lonToSlug,
} from "../src/lib/satellites";
import { valuateSlot, MODEL_VERSION } from "../src/lib/valuation";
import { openTerminalDbWritable } from "../src/lib/terminal-db";
import { synthesizeHistory } from "../src/lib/valuation-history";
import { getLatestIngest } from "../src/lib/freshness";
import { ingestAsOf } from "../src/lib/provenance";

const DAYS = 30;

function main() {
  const merged = mergeWithUcs(curatedSlots);
  const latest = getLatestIngest();
  const asOf = new Date(ingestAsOf(latest?.lastRun ?? null));
  const asOfDay = asOf.toISOString().slice(0, 10);

  const db = openTerminalDbWritable();
  const insert = db.prepare(`
    INSERT OR REPLACE INTO valuation_snapshots
      (slug, as_of, point, low, high, confidence, non_commercial, drivers_json, model_version)
    VALUES
      (@slug, @asOf, @point, @low, @high, @confidence, @nonCommercial, @driversJson, @modelVersion)
  `);

  const run = db.transaction(() => {
    db.prepare("DELETE FROM valuation_snapshots").run();
    let n = 0;
    for (const slot of merged) {
      const slug = lonToSlug(slot.longitude);
      const congestion = getCongestion(slot.longitude);
      const sats = getGeoSatellitesByLongitude(slot.longitude, 0.4);
      const fcc = getFccAuthorizationsByLongitude(slot.longitude);
      const valuation = valuateSlot(slot, congestion, {
        satellites: sats,
        fccLicensed: fcc.length > 0,
        satCount: sats.length || congestion.factors.coLocated,
        asOf,
      });
      const history = synthesizeHistory(slug, valuation, DAYS, asOf);
      for (const snap of history) {
        insert.run({
          slug: snap.slug,
          asOf: snap.asOf,
          point: snap.point,
          low: snap.low,
          high: snap.high,
          confidence: snap.confidence,
          nonCommercial: snap.nonCommercial ? 1 : 0,
          driversJson: snap.asOf === asOfDay ? JSON.stringify(valuation.factors) : "[]",
          modelVersion: MODEL_VERSION,
        });
      }
      n++;
    }
    db.prepare(`
      INSERT INTO model_runs (model_version, as_of, slot_count, note)
      VALUES (?, ?, ?, ?)
    `).run(
      MODEL_VERSION,
      asOfDay,
      n,
      `Backfilled ${DAYS}-day model path (not transaction prints). Re-run after ingest or model changes.`,
    );
    return n;
  });

  const count = run();
  db.exec("VACUUM");
  db.close();
  console.log(`Seeded ${count} slots × ${DAYS} days into data/terminal.db (model ${MODEL_VERSION}, as-of ${asOfDay}).`);
}

main();
