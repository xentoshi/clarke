// Maps UCS operator names to Clarke company slugs.
// Only includes operators that have a matching company page.
export const OPERATOR_TO_SLUG: Record<string, string> = {
  "SES S.A.": "ses",
  "Intelsat S.A.": "intelsat",
  "PanAmSat (Intelsat S.A.)": "intelsat",
  "EUTELSAT S.A.": "eutelsat",
  "Telesat Canada Ltd. (BCE, Inc.)": "telesat",
  "Russian Satellite Communications Company": "rscc",
  "RSCC": "rscc",
  "Arab Satellite Communications Org. (ASCO)": "arabsat",
  "Arabsat": "arabsat",
  "Hispasat": "hispasat",
  "Hispamar (subsidiary of Hispasat - Spain)": "hispasat",
  "MEASAT": "measat",
  "Measat Broadcast Network Systems": "measat",
};

export function operatorToSlug(operator: string | null): string | null {
  if (!operator) return null;
  return OPERATOR_TO_SLUG[operator] ?? null;
}

// Returns all UCS operator name variants for a given company slug.
export function slugToOperators(slug: string): string[] {
  return Object.entries(OPERATOR_TO_SLUG)
    .filter(([, s]) => s === slug)
    .map(([op]) => op);
}
