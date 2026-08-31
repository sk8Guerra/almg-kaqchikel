import { BASE_QUESTIONS } from "./questions";
import type { Question } from "./questions";
import { UnknownTemplateError } from "./errors";
import type { CourseLevel, DocumentType, LanguageTrack } from "./values";

export type TemplateCode =
  | "l1-principiante"
  | "l1-intermedio"
  | "l1-avanzado"
  | "l2-principiante"
  | "l2-intermedio"
  | "l2-avanzado";

export type FormTemplateDefinition = {
  readonly code: TemplateCode;
  readonly nameKaqchikel: string;
  readonly nameSpanish: string;
  readonly track: LanguageTrack;
  readonly level: CourseLevel;
  readonly questions: readonly Question[];
  readonly documents: readonly DocumentType[];
};

const LEVEL_NAMES: Record<CourseLevel, { kaqchikel: string; spanish: string }> = {
  beginner: { kaqchikel: "Nab'ey xak tijonïk", spanish: "Principiante" },
  intermediate: { kaqchikel: "Ruka'n xak tijonïk", spanish: "Intermedio" },
  advanced: { kaqchikel: "Rox xak tijonïk", spanish: "Avanzado" },
};

const BASE_DOCUMENTS: readonly DocumentType[] = [
  "identity_card",
  "commitment_letter",
  "enrollment_sheet",
];

const LEVEL_DOCUMENTS: Record<CourseLevel, readonly DocumentType[]> = {
  beginner: [],
  intermediate: ["beginner_certificate"],
  advanced: ["beginner_certificate", "intermediate_certificate"],
};

const define = (
  code: TemplateCode,
  track: LanguageTrack,
  level: CourseLevel,
): FormTemplateDefinition => ({
  code,
  nameKaqchikel: `${LEVEL_NAMES[level].kaqchikel} ${track.toUpperCase()}`,
  nameSpanish: `Kaqchikel ${track.toUpperCase()} — ${LEVEL_NAMES[level].spanish}`,
  track,
  level,
  questions: BASE_QUESTIONS,
  documents: [...BASE_DOCUMENTS, ...LEVEL_DOCUMENTS[level]],
});

export const TEMPLATES: readonly FormTemplateDefinition[] = [
  define("l1-principiante", "l1", "beginner"),
  define("l1-intermedio", "l1", "intermediate"),
  define("l1-avanzado", "l1", "advanced"),
  define("l2-principiante", "l2", "beginner"),
  define("l2-intermedio", "l2", "intermediate"),
  define("l2-avanzado", "l2", "advanced"),
];

export const isTemplateCode = (code: string): code is TemplateCode =>
  TEMPLATES.some((template) => template.code === code);

export const templateByCode = (code: string): FormTemplateDefinition => {
  const found = TEMPLATES.find((template) => template.code === code);
  if (!found) throw new UnknownTemplateError(code);
  return found;
};
