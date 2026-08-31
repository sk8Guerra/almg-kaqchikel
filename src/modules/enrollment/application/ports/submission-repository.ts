import type { Answers } from "../../domain/answers";
import type { TemplateCode } from "../../domain/form-template";
import type { AgeRange, DocumentType, EthnicGroup, Modality, Sex } from "../../domain/values";

export type SubmissionFilter = {
  readonly offeringId?: string;
  readonly templateCode?: TemplateCode;
  readonly year?: number;
  readonly municipalityCode?: string;
  readonly studentId?: string;
  readonly search?: string;
};

export type SubmissionDocumentInput = {
  readonly type: DocumentType;
  readonly storageKey: string;
  readonly contentType: string;
  readonly sizeBytes: number;
};

export type NewSubmission = {
  readonly offeringId: string;
  readonly studentId: string;
  readonly answers: Answers;
  readonly ageRange: AgeRange;
  readonly ethnicGroup: EthnicGroup;
  readonly submittedAt: Date;
  readonly documents: readonly SubmissionDocumentInput[];
};

export type SubmissionSummary = {
  readonly id: string;
  readonly offeringId: string;
  readonly templateCode: TemplateCode;
  readonly templateName: string;
  readonly year: number;
  readonly modality: Modality;
  readonly municipalityCode: string;
  readonly studentId: string;
  readonly fullName: string;
  readonly documentId: string;
  readonly submittedAt: Date;
};

export type SubmissionDetail = SubmissionSummary & {
  readonly answers: Answers;
  readonly documents: readonly {
    readonly type: DocumentType;
    readonly contentType: string;
    readonly sizeBytes: number;
  }[];
};

export type EnrollmentSummary = {
  readonly total: number;
  readonly bySex: Record<Sex, number>;
  readonly byAgeRange: Record<AgeRange, number>;
  readonly byEthnicGroup: Record<EthnicGroup, number>;
  readonly byModality: Record<Modality, number>;
  readonly byMunicipality: readonly { readonly code: string; readonly count: number }[];
  readonly byTemplate: readonly {
    readonly code: TemplateCode;
    readonly name: string;
    readonly count: number;
  }[];
};

export interface SubmissionRepository {
  record(input: NewSubmission): Promise<SubmissionSummary>;
  findById(id: string): Promise<SubmissionDetail | null>;
  findDocument(
    submissionId: string,
    type: DocumentType,
  ): Promise<{ readonly storageKey: string; readonly contentType: string } | null>;
  list(filter: SubmissionFilter): Promise<SubmissionSummary[]>;
  listDetailed(filter: SubmissionFilter): Promise<SubmissionDetail[]>;
  summarize(filter: SubmissionFilter): Promise<EnrollmentSummary>;
}
