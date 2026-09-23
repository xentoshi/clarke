import { OPERATOR_ALIAS_ENTRIES, type OperatorAliasEntry } from "@/data/operator-aliases";

export type { OperatorAliasEntry };

export interface ResolvedOperator {
  /** Canonical display name when mapped; otherwise the trimmed source string. Class M when mapped. */
  display: string;
  /** Original UCS / FCC / curated string. Class V. */
  raw: string;
  mapped: boolean;
  aliases: string[];
  notes?: string;
}

const LOOKUP = buildLookup();

function buildLookup(): Map<string, OperatorAliasEntry> {
  const map = new Map<string, OperatorAliasEntry>();
  const set = (key: string, entry: OperatorAliasEntry) => {
    if (!key) return;
    const prev = map.get(key);
    if (prev && prev.canonical !== entry.canonical) {
      throw new Error(`Operator alias key collision: "${key}" maps to ${prev.canonical} and ${entry.canonical}`);
    }
    map.set(key, entry);
  };
  for (const entry of OPERATOR_ALIAS_ENTRIES) {
    set(normalizeOperatorKey(entry.canonical), entry);
    set(fold(entry.canonical), entry);
    for (const alias of entry.aliases) {
      set(normalizeOperatorKey(alias), entry);
      set(fold(alias), entry);
    }
  }
  return map;
}

function fold(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Collapse legal suffixes and punctuation so "SES S.A." and "SES Americom, Inc." share a key with listed aliases. */
export function normalizeOperatorKey(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/['’`]/g, "")
    .replace(/&/g, " and ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\bdebtor(?:[-\s]+in[-\s]+possession)?\b/g, " ")
    .replace(/\b(inc|incorporated|llc|ltd|limited|corp|corporation|company|holdings|group|plc|gmbh|nv|bv|ag|lp|llp|sa)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function lookupCandidates(raw: string): string[] {
  const trimmed = raw.trim();
  const firstLine = trimmed.split(/\r?\n/)[0]?.trim() ?? trimmed;
  return [...new Set([trimmed, firstLine].filter(Boolean))];
}

function findEntry(raw: string): OperatorAliasEntry | undefined {
  for (const candidate of lookupCandidates(raw)) {
    const hit = LOOKUP.get(fold(candidate)) ?? LOOKUP.get(normalizeOperatorKey(candidate));
    if (hit) return hit;
  }
  return undefined;
}

function looksJoint(raw: string): boolean {
  const compact = raw.replace(/\bL\.L\.C\./gi, "LLC").replace(/\bL\.C\.C\./gi, "LCC");
  return compact.includes("/");
}

export function resolveOperator(raw: string | null | undefined): ResolvedOperator {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) {
    return { display: "", raw: "", mapped: false, aliases: [] };
  }
  const entry = findEntry(trimmed);
  if (entry) {
    return {
      display: entry.canonical,
      raw: trimmed,
      mapped: true,
      aliases: [entry.canonical, ...entry.aliases],
      notes: entry.notes,
    };
  }
  if (looksJoint(trimmed)) {
    return { display: trimmed, raw: trimmed, mapped: false, aliases: [] };
  }
  return { display: trimmed, raw: trimmed, mapped: false, aliases: [] };
}

export function operatorDisplay(raw: string | null | undefined): string {
  return resolveOperator(raw).display;
}

/**
 * UCS sometimes stores the launch vehicle in the operator column (Atlas 5 on
 * STPSat-6). That string is not a GEO operator. Equality with this row's
 * launch vehicle is the whole test: no guessed owner is filled in.
 */
export function isLaunchVehicleOperator(
  operator: string | null | undefined,
  launchVehicle: string | null | undefined,
): boolean {
  const op = (operator ?? "").trim();
  const vehicle = (launchVehicle ?? "").trim();
  if (!op || !vehicle) return false;
  return normalizeOperatorKey(op) === normalizeOperatorKey(vehicle);
}

export function operatorMatchesQuery(raw: string | null | undefined, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const resolved = resolveOperator(raw);
  if ((raw ?? "").toLowerCase().includes(q)) return true;
  if (resolved.display.toLowerCase().includes(q)) return true;
  return resolved.aliases.some((a) => a.toLowerCase().includes(q));
}

export function listedOperatorCanonicals(): string[] {
  return OPERATOR_ALIAS_ENTRIES.map((e) => e.canonical);
}
