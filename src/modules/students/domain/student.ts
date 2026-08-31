import type { DocumentId, Sex } from "./values";

export type Student = {
  readonly id: string;
  readonly documentId: DocumentId;
  readonly firstNames: string;
  readonly lastNames: string;
  readonly sex: Sex;
  readonly municipalityCode: string;
  readonly createdAt: Date;
};

export type StudentRecord = {
  readonly id: string;
  readonly documentId: string;
  readonly firstNames: string;
  readonly lastNames: string;
  readonly sex: Sex;
  readonly municipalityCode: string;
  readonly submissionCount: number;
};

export type StudentSummary = {
  readonly id: string;
  readonly documentId: string;
  readonly fullName: string;
  readonly sex: Sex;
  readonly municipalityCode: string;
  readonly municipalityName: string;
  readonly departmentName: string;
  readonly submissionCount: number;
};

export type StudentsFilter = {
  readonly search?: string;
};

export const fullNameOf = (student: Pick<Student, "firstNames" | "lastNames">): string =>
  `${student.firstNames} ${student.lastNames}`.trim();
