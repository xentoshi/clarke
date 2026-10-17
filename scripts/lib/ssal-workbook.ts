import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import type { FccWorkbookFiling } from "../../src/lib/delta-feed";
import { lonToSlug } from "../../src/lib/slot-utils";

const DEFAULT_XLSX = path.join(process.cwd(), "data", "ssal.xlsx");

// "N/A" is a placeholder in the source, not a filing key. Several unrelated
// rows share it. See scripts/ingest-fcc.ts.
function isRealCallSign(callSign: string | null | undefined): callSign is string {
  return !!callSign && callSign !== "N/A";
}

function parseOrbitalLocation(raw: string): number | null {
  const match = raw.trim().match(/^([\d.]+)\s+(W|E)\.L\.$/i);
  if (!match) return null;
  const deg = parseFloat(match[1]);
  if (!Number.isFinite(deg)) return null;
  return match[2].toUpperCase() === "W" ? -deg : deg;
}

function parseDateField(raw: unknown): string | null {
  if (raw == null || raw === "" || raw === "N/A") return null;
  if (typeof raw === "number") {
    const d = XLSX.SSF.parse_date_code(raw);
    if (!d) return null;
    return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const text = String(raw).trim();
  if (!text || text === "N/A") return null;
  const match = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) return `${match[3]}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`;
  return text;
}

function cell(row: Record<string, unknown>, key: string): string | null {
  const text = String(row[key] ?? "").trim();
  return text ? text : null;
}

/**
 * GEO filings from the committed SSAL workbook. Null when the file is missing.
 * NGSO rows and rows without an N.N W.L. or E.L. location are omitted.
 * Call sign N/A is omitted. This is the same location rule as FCC ingest.
 */
export function readSsalWorkbookFilings(xlsxPath = DEFAULT_XLSX): FccWorkbookFiling[] | null {
  if (!fs.existsSync(xlsxPath)) return null;
  const fileBuf = fs.readFileSync(xlsxPath);
  if (fileBuf.length < 64) return null;
  const wb = XLSX.read(fileBuf, { cellDates: false, type: "buffer" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return null;
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName], { defval: "" });
  const filings: FccWorkbookFiling[] = [];
  for (const row of rows) {
    const orbitalLocation = cell(row, "Orbital Location");
    const longitude = parseOrbitalLocation(orbitalLocation ?? "");
    if (longitude == null) continue;
    const callSign = cell(row, "Call Sign");
    if (!isRealCallSign(callSign)) continue;
    filings.push({
      callSign,
      slug: lonToSlug(longitude),
      longitude,
      orbitalLocation,
      satelliteName: cell(row, "Satellite Name"),
      licensee: cell(row, "Licensee or Grantee"),
      administration: cell(row, "Administration"),
      service: cell(row, "Service"),
      frequencyRange: cell(row, "Frequency Range"),
      dateInOrbit: parseDateField(row["Date In-orbit and Operating"]),
      grantStatus: cell(row, "Grant"),
      notes: cell(row, "Notes"),
    });
  }
  return filings;
}
