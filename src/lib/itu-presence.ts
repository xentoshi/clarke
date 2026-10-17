// Thin ITU presence. ITU filings are not in this product.

export type ItuRecorded = "unknown" | "not_in_product";

/** Default for every slot: we do not record ITU filings in this product. */
export const ITU_RECORDED_DEFAULT: ItuRecorded = "not_in_product";

export const ITU_UNRECORDED_LABEL = "ITU filing: not recorded in Clarke";
export const ITU_UNRECORDED_CHIP = "Unrecorded in Clarke";
export const ITU_UNRECORDED_DETAIL =
  "ITU filings are not in this product. ITU Space Explorer is the current ITU source. SNS Online shut down in January 2025.";

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
