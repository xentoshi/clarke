export const CLARKE_SITE = "https://www.clarkebelt.finance";

export interface CitationVintage {
  ucsFileVintage: string | null;
  fccAsOf: string | null;
  tleEpochMin: string | null;
  tleEpochMax: string | null;
}

export function formatCitationVintage(vintage: CitationVintage): string {
  const ucs = vintage.ucsFileVintage ?? "unknown";
  const fcc = vintage.fccAsOf ?? "unknown";
  let tle = "none";
  if (vintage.tleEpochMin && vintage.tleEpochMax) {
    tle = vintage.tleEpochMin === vintage.tleEpochMax
      ? vintage.tleEpochMax
      : `${vintage.tleEpochMin} to ${vintage.tleEpochMax}`;
  } else if (vintage.tleEpochMax) {
    tle = vintage.tleEpochMax;
  } else if (vintage.tleEpochMin) {
    tle = vintage.tleEpochMin;
  }
  return `UCS file vintage ${ucs}, FCC as-of ${fcc}, TLE epoch ${tle}`;
}

export function correctionIssueUrl(input: {
  slug: string;
  registryRowId?: string | null;
  longitude: number;
  label: string;
  operator: string;
  status: string;
  satellites: string[];
  fccRows: number;
}): string {
  const title = `Correction: ${input.slug}`;
  const lines = [
    `Slot id: ${input.slug}`,
    ...(input.registryRowId && input.registryRowId !== input.slug ? [`Registry row: ${input.registryRowId}`] : []),
    `Longitude: ${input.label} (${input.longitude})`,
    `URL: ${CLARKE_SITE}/orbital/${input.slug}`,
    "",
    "Current values:",
    `- Operator: ${input.operator || "unknown"}`,
    `- Status: ${input.status}`,
    `- Satellites: ${input.satellites.length ? input.satellites.join(", ") : "none"}`,
    `- FCC rows: ${input.fccRows}`,
    "",
    "What is wrong:",
    "",
    "Source:",
    "",
  ];
  const body = lines.join("\n");
  const params = new URLSearchParams({ title, body });
  return `https://github.com/xentoshi/clarke/issues/new?${params.toString()}`;
}
