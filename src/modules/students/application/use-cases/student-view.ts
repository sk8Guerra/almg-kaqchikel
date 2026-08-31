import { fullNameOf } from "../../domain/student";
import type { StudentRecord, StudentSummary } from "../../domain/student";
import type { PlaceCatalog } from "../ports/place-catalog";

export const toSummary = (record: StudentRecord, places: PlaceCatalog): StudentSummary => {
  const place = places.find(record.municipalityCode);

  return {
    id: record.id,
    documentId: record.documentId,
    fullName: fullNameOf(record),
    sex: record.sex,
    municipalityCode: record.municipalityCode,
    municipalityName: place?.municipalityName ?? record.municipalityCode,
    departmentName: place?.departmentName ?? "",
    submissionCount: record.submissionCount,
  };
};
