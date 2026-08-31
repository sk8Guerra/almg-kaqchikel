export type LanguageTrack = "l1" | "l2";

export type CourseLevel = "beginner" | "intermediate" | "advanced";

export type Modality = "virtual" | "in_person";

export type Sex = "female" | "male";

export type AgeRange = "from_14_to_30" | "from_31_to_60" | "over_60";

export type EthnicGroup = "maya" | "garifuna" | "xinka" | "ladino" | "other";

export type DocumentType =
  | "identity_card"
  | "commitment_letter"
  | "enrollment_sheet"
  | "beginner_certificate"
  | "intermediate_certificate";

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export const DOCUMENT_CONTENT_TYPE = "application/pdf";

export const TRACK_LABELS: Record<LanguageTrack, string> = {
  l1: "L1",
  l2: "L2",
};

export const LEVEL_LABELS: Record<CourseLevel, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

export const MODALITY_LABELS: Record<Modality, string> = {
  virtual: "Virtual",
  in_person: "Presencial",
};

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  identity_card: "Copia del DPI",
  commitment_letter: "Carta de compromisos",
  enrollment_sheet: "Ficha de inscripción",
  beginner_certificate: "Constancia del nivel principiante aprobado",
  intermediate_certificate: "Constancia del nivel intermedio aprobado",
};

export const AGE_RANGE_LABELS: Record<AgeRange, string> = {
  from_14_to_30: "14 a 30 años",
  from_31_to_60: "31 a 60 años",
  over_60: "Más de 60 años",
};

export const SEX_LABELS: Record<Sex, string> = {
  female: "Femenino",
  male: "Masculino",
};

export const ETHNIC_GROUP_LABELS: Record<EthnicGroup, string> = {
  maya: "Maya",
  garifuna: "Garífuna",
  xinka: "Xinka",
  ladino: "Ladino",
  other: "Otro",
};
