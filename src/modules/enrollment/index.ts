export { syncFormTemplates } from "./application/use-cases/sync-form-templates";
export { createOffering } from "./application/use-cases/create-offering";
export { updateOffering } from "./application/use-cases/update-offering";
export { setOfferingActive } from "./application/use-cases/set-offering-active";
export { listOfferings } from "./application/use-cases/list-offerings";
export { listOpenOfferings } from "./application/use-cases/list-open-offerings";
export { getOpenOffering } from "./application/use-cases/get-open-offering";
export { requestUploadTicket } from "./application/use-cases/request-upload-ticket";
export { submitEnrollment } from "./application/use-cases/submit-enrollment";
export { listSubmissions } from "./application/use-cases/list-submissions";
export { listSubmissionsByStudent } from "./application/use-cases/list-submissions-by-student";
export { getSubmission } from "./application/use-cases/get-submission";
export { readSubmissionDocument } from "./application/use-cases/read-submission-document";
export { exportSubmissions } from "./application/use-cases/export-submissions";
export { summarizeEnrollments } from "./application/use-cases/summarize-enrollments";

export { TEMPLATES, templateByCode, isTemplateCode } from "./domain/form-template";
export { BASE_QUESTIONS, COMMITMENT_QUESTION_ID } from "./domain/questions";
export { validateAnswers, commitmentAccepted, answerOf } from "./domain/answers";
export { offeringStatus, isOfferingOpen } from "./domain/offering";
export {
  AGE_RANGE_LABELS,
  DOCUMENT_CONTENT_TYPE,
  DOCUMENT_LABELS,
  ETHNIC_GROUP_LABELS,
  LEVEL_LABELS,
  MAX_DOCUMENT_BYTES,
  MODALITY_LABELS,
  SEX_LABELS,
  TRACK_LABELS,
} from "./domain/values";

export type { FormTemplateDefinition, TemplateCode } from "./domain/form-template";
export type { Question, QuestionId, QuestionKind, QuestionOption } from "./domain/questions";
export type { Answers, AnswerProblem } from "./domain/answers";
export type { Offering, OfferingStatus, OfferingView } from "./domain/offering";
export type {
  AgeRange,
  CourseLevel,
  DocumentType,
  EthnicGroup,
  LanguageTrack,
  Modality,
  Sex,
} from "./domain/values";
export type { OfferingFilter } from "./application/ports/offering-repository";
export type {
  EnrollmentSummary,
  SubmissionDetail,
  SubmissionFilter,
  SubmissionSummary,
} from "./application/ports/submission-repository";
export type {
  SubmissionDetailView,
  SubmissionSummaryView,
} from "./application/use-cases/submission-view";
export type { EnrollmentSummaryView } from "./application/use-cases/summarize-enrollments";
export type { PlaceCatalog, PlaceInfo } from "./application/ports/place-catalog";
export type { FileContent, UploadTicket } from "./application/ports/file-store";
export type { OpenOffering } from "./application/use-cases/get-open-offering";
export type { SubmissionsExport } from "./application/use-cases/export-submissions";

export {
  AlreadyEnrolledError,
  DuplicateOfferingError,
  InvalidAnswersError,
  InvalidDocumentError,
  InvalidOfferingWindowError,
  InvalidOfferingYearError,
  MissingDocumentError,
  ModalityCommitmentRefusedError,
  OfferingHasSubmissionsError,
  OfferingNotFoundError,
  OfferingNotOpenError,
  SubmissionNotFoundError,
  UnknownTemplateError,
} from "./domain/errors";
