export { registerStudent } from "./application/use-cases/register-student";
export { listStudents } from "./application/use-cases/list-students";
export { getStudent } from "./application/use-cases/get-student";

export { documentId, DOCUMENT_ID_LENGTH } from "./domain/values";
export { fullNameOf } from "./domain/student";

export type { Student, StudentRecord, StudentSummary, StudentsFilter } from "./domain/student";
export type { DocumentId, Sex } from "./domain/values";
export type { PlaceCatalog, PlaceInfo } from "./application/ports/place-catalog";

export { InvalidDocumentIdError, StudentNotFoundError } from "./domain/errors";
