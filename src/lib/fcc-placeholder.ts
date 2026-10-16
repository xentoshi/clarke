/** SSAL rows that reserve a longitude for the US government and name no spacecraft. */
export function isDodPlaceholderAuthorization(row: {
  licensee?: string | null;
  satelliteName?: string | null;
  callSign?: string | null;
}): boolean {
  const licensee = (row.licensee ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  return licensee === "federal government (reserved)";
}
