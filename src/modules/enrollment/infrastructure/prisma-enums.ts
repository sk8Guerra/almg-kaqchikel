import type {
  AgeRange,
  CourseLevel,
  DocumentType,
  EthnicGroup,
  LanguageTrack,
  Modality,
  Sex,
} from "../domain/values";

export const trackToRow = (track: LanguageTrack): "L1" | "L2" => (track === "l1" ? "L1" : "L2");

export const trackToDomain = (row: "L1" | "L2"): LanguageTrack => (row === "L1" ? "l1" : "l2");

export const levelToRow = (level: CourseLevel): "BEGINNER" | "INTERMEDIATE" | "ADVANCED" =>
  level === "beginner" ? "BEGINNER" : level === "intermediate" ? "INTERMEDIATE" : "ADVANCED";

export const levelToDomain = (row: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"): CourseLevel =>
  row === "BEGINNER" ? "beginner" : row === "INTERMEDIATE" ? "intermediate" : "advanced";

export const modalityToRow = (modality: Modality): "VIRTUAL" | "IN_PERSON" =>
  modality === "virtual" ? "VIRTUAL" : "IN_PERSON";

export const modalityToDomain = (row: "VIRTUAL" | "IN_PERSON"): Modality =>
  row === "VIRTUAL" ? "virtual" : "in_person";

export const sexToRow = (sex: Sex): "FEMALE" | "MALE" => (sex === "female" ? "FEMALE" : "MALE");

export const sexToDomain = (row: "FEMALE" | "MALE"): Sex => (row === "FEMALE" ? "female" : "male");

const AGE_RANGE_ROWS = {
  from_14_to_30: "FROM_14_TO_30",
  from_31_to_60: "FROM_31_TO_60",
  over_60: "OVER_60",
} as const;

export const ageRangeToRow = (range: AgeRange): (typeof AGE_RANGE_ROWS)[AgeRange] =>
  AGE_RANGE_ROWS[range];

export const ageRangeToDomain = (row: (typeof AGE_RANGE_ROWS)[AgeRange]): AgeRange =>
  (Object.keys(AGE_RANGE_ROWS) as AgeRange[]).find((key) => AGE_RANGE_ROWS[key] === row) ??
  "from_14_to_30";

const ETHNIC_GROUP_ROWS = {
  maya: "MAYA",
  garifuna: "GARIFUNA",
  xinka: "XINKA",
  ladino: "LADINO",
  other: "OTHER",
} as const;

export const ethnicGroupToRow = (group: EthnicGroup): (typeof ETHNIC_GROUP_ROWS)[EthnicGroup] =>
  ETHNIC_GROUP_ROWS[group];

export const ethnicGroupToDomain = (row: (typeof ETHNIC_GROUP_ROWS)[EthnicGroup]): EthnicGroup =>
  (Object.keys(ETHNIC_GROUP_ROWS) as EthnicGroup[]).find((key) => ETHNIC_GROUP_ROWS[key] === row) ??
  "other";

const DOCUMENT_TYPE_ROWS = {
  identity_card: "IDENTITY_CARD",
  commitment_letter: "COMMITMENT_LETTER",
  enrollment_sheet: "ENROLLMENT_SHEET",
  beginner_certificate: "BEGINNER_CERTIFICATE",
  intermediate_certificate: "INTERMEDIATE_CERTIFICATE",
} as const;

export const documentTypeToRow = (type: DocumentType): (typeof DOCUMENT_TYPE_ROWS)[DocumentType] =>
  DOCUMENT_TYPE_ROWS[type];

export const documentTypeToDomain = (
  row: (typeof DOCUMENT_TYPE_ROWS)[DocumentType],
): DocumentType =>
  (Object.keys(DOCUMENT_TYPE_ROWS) as DocumentType[]).find(
    (key) => DOCUMENT_TYPE_ROWS[key] === row,
  ) ?? "identity_card";
