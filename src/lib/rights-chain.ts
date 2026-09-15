import type { Provenance } from "./provenance";
import type { FccAuthorization } from "./satellites";

export type RightsLayer = "itu" | "administration" | "operator_license" | "sublease";
export type RightsStatus = "recorded" | "inferred" | "stub" | "unknown";

export interface RightsLink {
  layer: RightsLayer;
  title: string;
  holder: string;
  status: RightsStatus;
  detail: string;
  provenance: Provenance;
}

export function buildRightsChain(args: {
  operator: string;
  country: string;
  fccAuths: FccAuthorization[];
  asOf: string;
}): RightsLink[] {
  const { operator, country, fccAuths, asOf } = args;
  const primary = fccAuths[0];
  const admin = primary?.administration?.trim() || country || "Unknown administration";
  const licensees = [...new Set(fccAuths.map((a) => a.licensee?.trim()).filter((n): n is string => Boolean(n)))];
  const licensee =
    licensees.length === 0
      ? operator || "Unknown operator"
      : licensees.length === 1
        ? licensees[0]
        : `${licensees.length} FCC licensees`;
  const callSigns = fccAuths.map((a) => a.callSign).filter(Boolean).join(", ");
  const licenseeDetail =
    fccAuths.length > 0
      ? licensees.length > 1
        ? `${fccAuths.length} FCC authorization${fccAuths.length === 1 ? "" : "s"} · ${licensees.join("; ")}${callSigns ? ` · ${callSigns}` : ""}. Not a single-holder deed.`
        : `${fccAuths.length} FCC authorization${fccAuths.length === 1 ? "" : "s"}${callSigns ? ` · ${callSigns}` : ""}.`
      : operator
        ? `UCS operator ${operator}. No FCC market-access row at this longitude (expected for many non-US administrations and US government birds).`
        : "No operator or licensee on file.";

  return [
    {
      layer: "itu",
      title: "ITU filing",
      holder: "Not ingested — ITU SNS planned",
      status: "stub",
      detail: "Quarantined stub. ITU SNS bulk data is not ingested in v0. A filed ITU network is the closest thing to a deed; this row is not a live filing and must not be read as one.",
      provenance: { source: "Clarke stub (ITU SNS planned)", asOf, note: "Not a live ITU record" },
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
      provenance: { source: "Clarke stub", asOf, note: "Unknown — not mocked as a named lessee" },
    },
  ];
}
