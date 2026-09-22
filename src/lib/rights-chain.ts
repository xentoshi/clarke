import type { Provenance } from "./provenance";
import type { FccAuthorization } from "./satellites";
import { resolveOperator } from "./operator-identity";
import { ituPresence } from "./itu-presence";

export type RightsLayer = "itu" | "administration" | "operator_license" | "sublease";
export type RightsStatus = "recorded" | "inferred" | "stub" | "unknown";

export interface RightsLink {
  layer: RightsLayer;
  title: string;
  holder: string;
  status: RightsStatus;
  detail: string;
  provenance: Provenance;
  /** Canonical FCC licensee display names when this is the operator_license layer. */
  holderCanonical?: string[];
  /** Raw FCC licensee / UCS operator strings. */
  holderRaw?: string[];
}

function groupLicensees(raws: string[]): { display: string; raws: string[]; notes?: string }[] {
  const groups: { display: string; raws: string[]; notes?: string }[] = [];
  for (const raw of raws) {
    const resolved = resolveOperator(raw);
    const existing = groups.find((g) => g.display === resolved.display);
    if (existing) {
      if (!existing.raws.includes(raw)) existing.raws.push(raw);
    } else {
      groups.push({ display: resolved.display, raws: [raw], notes: resolved.notes });
    }
  }
  return groups;
}

function formatLicenseeGroup(g: { display: string; raws: string[] }): string {
  const extra = g.raws.filter((r) => r !== g.display);
  return extra.length ? `${g.display} (${extra.join("; ")})` : g.display;
}

export function buildRightsChain(args: {
  operator: string;
  country: string;
  fccAuths: FccAuthorization[];
  asOf: string;
}): RightsLink[] {
  const { operator, country, fccAuths, asOf } = args;
  const itu = ituPresence();
  const primary = fccAuths[0];
  const admin = primary?.administration?.trim() || country || "Unknown administration";
  const rawLicensees = [...new Set(fccAuths.map((a) => a.licensee?.trim()).filter((n): n is string => Boolean(n)))];
  const licenseeGroups = groupLicensees(rawLicensees);
  const operatorResolved = resolveOperator(operator);
  const licensee =
    licenseeGroups.length === 0
      ? operatorResolved.display || "Unknown operator"
      : licenseeGroups.length === 1
        ? licenseeGroups[0].display
        : `${licenseeGroups.length} FCC licensees`;
  const callSigns = fccAuths.map((a) => a.callSign).filter(Boolean).join(", ");
  const groupedDetail = licenseeGroups.map(formatLicenseeGroup).join("; ");
  const licenseeDetail =
    fccAuths.length > 0
      ? licenseeGroups.length > 1
        ? `${fccAuths.length} FCC authorization${fccAuths.length === 1 ? "" : "s"} · ${groupedDetail}${callSigns ? ` · ${callSigns}` : ""}. Not a single-holder deed.`
        : `${fccAuths.length} FCC authorization${fccAuths.length === 1 ? "" : "s"}${callSigns ? ` · ${callSigns}` : ""}${
            licenseeGroups[0] ? ` · ${formatLicenseeGroup(licenseeGroups[0])}` : ""
          }.`
      : operator
        ? `UCS operator ${operatorResolved.display}${
            operatorResolved.raw && operatorResolved.raw !== operatorResolved.display ? ` (source: ${operatorResolved.raw})` : ""
          }. No FCC market-access row at this longitude (expected for many non-US administrations and US government birds).`
        : "No operator or licensee on file.";

  return [
    {
      layer: "itu",
      title: "ITU filing",
      holder: "Not recorded in Clarke",
      status: "stub",
      detail: `${itu.detail} Quarantined stub. A filled ITU network panel would look like a deed; this row is not one.`,
      provenance: { source: "Clarke stub (ITU SNS not ingested)", asOf, note: itu.label },
    },
    {
      layer: "administration",
      title: "National administration",
      holder: admin,
      status: primary?.administration ? "recorded" : country ? "inferred" : "unknown",
      detail: primary?.administration
        ? `FCC lists administration as ${primary.administration}.`
        : country
          ? `Inferred from operator country (${country}); not an ITU notifying administration record.`
          : "No administration on file.",
      provenance: {
        source: primary?.administration ? "FCC Approved Space Station List" : "UCS operator country",
        asOf,
      },
    },
    {
      layer: "operator_license",
      title: "Operator license",
      holder: licensee,
      status: fccAuths.length > 0 ? "recorded" : operator ? "inferred" : "unknown",
      detail: licenseeDetail,
      holderCanonical: licenseeGroups.length ? licenseeGroups.map((g) => g.display) : operatorResolved.display ? [operatorResolved.display] : [],
      holderRaw: rawLicensees.length ? rawLicensees : operatorResolved.raw ? [operatorResolved.raw] : [],
      provenance: {
        source: fccAuths.length > 0 ? "FCC Approved Space Station List" : "UCS Satellite Database",
        asOf,
      },
    },
    {
      layer: "sublease",
      title: "Sub-lease / capacity lease",
      holder: "No public sub-lease registry",
      status: "stub",
      detail: "Quarantined stub. There is no public feed of transponder or payload sub-leases. This layer is reserved for operator-disclosed or future marketplace filings and is not a named lessee.",
      provenance: { source: "Clarke stub", asOf, note: "Unknown. Not mocked as a named lessee" },
    },
  ];
}
