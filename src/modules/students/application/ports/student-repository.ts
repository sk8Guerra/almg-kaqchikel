import type { Student, StudentRecord, StudentsFilter } from "../../domain/student";
import type { DocumentId, Sex } from "../../domain/values";

export type NewStudent = {
  readonly documentId: DocumentId;
  readonly firstNames: string;
  readonly lastNames: string;
  readonly sex: Sex;
  readonly municipalityCode: string;
  readonly now: Date;
};

export interface StudentRepository {
  findByDocumentId(documentId: DocumentId): Promise<Student | null>;
  findById(id: string): Promise<Student | null>;
  create(input: NewStudent): Promise<Student>;
  list(filter: StudentsFilter): Promise<StudentRecord[]>;
  recordById(id: string): Promise<StudentRecord | null>;
}
