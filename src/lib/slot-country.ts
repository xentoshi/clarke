/**
 * Slot country is the occupant owner country when every occupancy row agrees.
 * A mixed window, or a window with no owner country, omits the field.
 * Curated labels and FCC licensing administrations are not copied in.
 */
export function countryFromOccupants(countries: Array<string | null | undefined>): string {
  const unique = [...new Set(countries.map((country) => (country ?? "").trim()).filter(Boolean))];
  return unique.length === 1 ? unique[0] : "";
}
