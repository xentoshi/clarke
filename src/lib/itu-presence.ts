// Thin ITU presence. SNS is not ingested. This is not a deed, network name, or BIU record.

export type ItuRecorded = "unknown" | "not_in_product";

/** Default for every slot: we do not record ITU filings in this product. */
export const ITU_RECORDED_DEFAULT: ItuRecorded = "not_in_product";

export const ITU_UNRECORDED_LABEL = "ITU filing: not recorded in Clarke";
export const ITU_UNRECORDED_CHIP = "Unrecorded in Clarke";
export const ITU_UNRECORDED_DETAIL =
  "ITU SNS is not ingested. This flag is not a network name, not brought-into-use evidence, and not a filled filing row.";

export interface ItuPresence {
  ituRecorded: ItuRecorded;
  label: string;
  chip: string;
  detail: string;
}

export function ituPresence(): ItuPresence {
  return {
    ituRecorded: ITU_RECORDED_DEFAULT,
    label: ITU_UNRECORDED_LABEL,
    chip: ITU_UNRECORDED_CHIP,
    detail: ITU_UNRECORDED_DETAIL,
  };
}
