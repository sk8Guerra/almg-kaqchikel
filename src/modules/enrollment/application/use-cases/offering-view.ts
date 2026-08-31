import { templateByCode } from "../../domain/form-template";
import { buildOfferingView } from "../../domain/offering";
import type { OfferingRecord } from "../ports/offering-repository";
import type { PlaceCatalog } from "../ports/place-catalog";

export { buildOfferingView };

export const templateViewInput = (
  record: OfferingRecord,
  places: PlaceCatalog,
  now: Date,
): Parameters<typeof buildOfferingView>[0] => {
  const place = places.find(record.municipalityCode);

  return {
    offering: record,
    submissionCount: record.submissionCount,
    template: templateByCode(record.templateCode),
    municipalityName: place?.municipalityName ?? record.municipalityCode,
    departmentName: place?.departmentName ?? "",
    now,
  };
};
