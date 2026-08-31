import { BASE_QUESTIONS } from "../../domain/questions";
import { MODALITY_LABELS } from "../../domain/values";
import type { SubmissionFilter, SubmissionRepository } from "../ports/submission-repository";
import type { PlaceCatalog } from "../ports/place-catalog";

type Deps = { submissions: SubmissionRepository; places: PlaceCatalog };

export type SubmissionsExport = {
  readonly headers: string[];
  readonly rows: string[][];
};

const FIXED_HEADERS = [
  "Curso",
  "Año",
  "Modalidad",
  "Municipio de la convocatoria",
  "Fecha de envío",
  "Nombre completo",
  "DPI",
];

const answerLabel = (questionId: string, value: string): string => {
  const question = BASE_QUESTIONS.find((candidate) => candidate.id === questionId);
  const option = question?.options?.find((candidate) => candidate.value === value);
  return option ? option.labelSpanish : value;
};

export const exportSubmissions =
  ({ submissions, places }: Deps) =>
  async (filter: SubmissionFilter = {}): Promise<SubmissionsExport> => {
    const details = await submissions.listDetailed(filter);

    const headers = [...FIXED_HEADERS, ...BASE_QUESTIONS.map((question) => question.labelSpanish)];

    const rows = details.map((detail) => [
      detail.templateName,
      String(detail.year),
      MODALITY_LABELS[detail.modality],
      places.find(detail.municipalityCode)?.municipalityName ?? detail.municipalityCode,
      detail.submittedAt.toISOString(),
      detail.fullName,
      detail.documentId,
      ...BASE_QUESTIONS.map((question) =>
        answerLabel(question.id, detail.answers[question.id] ?? ""),
      ),
    ]);

    return { headers, rows };
  };
