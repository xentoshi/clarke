import path from "path";
import fs from "fs";
import { closeDb } from "../src/lib/db";
import { buildCurrentRegistryState, persistRegistrySnapshot } from "../src/lib/registry-snapshot";

process.chdir(path.resolve(__dirname, ".."));

const trigger = process.argv[2]?.trim() || "bootstrap";
if (!/^[a-z0-9_-]{1,40}$/.test(trigger)) {
  console.error(`Invalid snapshot trigger: ${trigger}`);
  process.exit(1);
}

const dbPath = path.join(process.cwd(), "data", "clarke.db");
if (!fs.existsSync(dbPath)) {
  console.error(`Database not found: ${dbPath}`);
  process.exit(1);
}

const state = buildCurrentRegistryState();
closeDb();
const result = persistRegistrySnapshot(state, trigger);
console.log(
  result.inserted
    ? `Recorded registry snapshot ${result.id} (${result.kind}, ${trigger}): ${result.registrySlotCount} slots, ${result.occupancyCount} occupancy memberships, ${result.disputeCount} disputes, ${result.fccRowCount} FCC call signs.`
    : `Registry snapshot unchanged (${result.kind} id ${result.id}).`,
);
