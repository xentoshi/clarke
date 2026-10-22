import { slots as curatedSlots } from "@/data/orbital-slots";
import { getAllRegistrySlugs, lonToSlug, mergeWithUcs } from "@/lib/satellites";

// Fields the command palette matches and displays. Descriptions, ids, and
// bands stay out of the file so opening search does not download a slot page.
export interface SearchIndexEntry {
  slug: string;
  label: string;
  operator: string;
  operatorRaw?: string;
  country: string;
  valueEstimate?: string;
}

export function buildSearchIndex(): SearchIndexEntry[] {
  const built = new Set(getAllRegistrySlugs(curatedSlots));
  const seen = new Set<string>();
  const entries: SearchIndexEntry[] = [];
  for (const slot of mergeWithUcs(curatedSlots)) {
    const slug = lonToSlug(slot.longitude);
    if (!built.has(slug) || seen.has(slug)) continue;
    seen.add(slug);
    const entry: SearchIndexEntry = {
      slug,
      label: slot.label,
      operator: slot.operator,
      country: slot.country,
    };
    if (slot.operatorRaw) entry.operatorRaw = slot.operatorRaw;
    if (slot.valueEstimate) entry.valueEstimate = slot.valueEstimate;
    entries.push(entry);
  }
  return entries;
}
