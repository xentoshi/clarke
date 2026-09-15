import Database from "better-sqlite3";
import path from "path";
import { applyPositionAuthority, formatPositionApplyStats } from "./lib/apply-position-authority";

const DB_PATH = path.join(process.cwd(), "data", "clarke.db");

const db = new Database(DB_PATH);
const stats = applyPositionAuthority(db);
console.log(`Applied TLE-primary occupancy authority: ${formatPositionApplyStats(stats)}`);
db.close();
