import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

// Runs after an ingest closes its SQLite connection. The child process builds
// the same agent occupancy state the delta feed diffs, then appends a
// registry_snapshots row when that state changed.
export function captureRegistrySnapshot(triggerSource: string): void {
  const cli = path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
  const script = path.join(process.cwd(), "scripts", "record-registry-snapshot.ts");
  if (!fs.existsSync(cli)) {
    throw new Error(`tsx not found at ${cli}`);
  }
  const result = spawnSync(process.execPath, [cli, script, triggerSource], {
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error(`registry snapshot capture failed for ${triggerSource} (exit ${result.status ?? "null"})`);
  }
}
