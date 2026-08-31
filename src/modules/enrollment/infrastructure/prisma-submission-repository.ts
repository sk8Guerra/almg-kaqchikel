import type { PrismaClient } from "@generated/client/client";
import type { Answers } from "../domain/answers";
import { isTemplateCode } from "../domain/form-template";
import type { TemplateCode } from "../domain/form-template";
import { AlreadyEnrolledError, UnknownTemplateError } from "../domain/errors";
import type { AgeRange, DocumentType, EthnicGroup, Modality, Sex } from "../domain/values";
import type {
  EnrollmentSummary,
  NewSubmission,
  SubmissionDetail,
  SubmissionFilter,
  SubmissionRepository,
  SubmissionSummary,
} from "../application/ports/submission-repository";
import {
  ageRangeToDomain,
  ageRangeToRow,
  documentTypeToDomain,
  documentTypeToRow,
  ethnicGroupToDomain,
  ethnicGroupToRow,
  modalityToDomain,
} from "./prisma-enums";

type SubmissionRow = {
  id: string;
  formOfferingId: string;
  studentId: string;
  answers: unknown;
  ageRange: "FROM_14_TO_30" | "FROM_31_TO_60" | "OVER_60";
  ethnicGroup: "MAYA" | "GARIFUNA" | "XINKA" | "LADINO" | "OTHER";
  submittedAt: Date;
  formOffering: {
    year: number;
    modality: "VIRTUAL" | "IN_PERSON";
    formTemplate: { code: string; name: string };
    municipalityCode: string;
  };
  student: { firstNames: string; lastNames: string; documentId: string; sex: "FEMALE" | "MALE" };
};

type DetailRow = SubmissionRow & {
  documents: {
    type:
      | "IDENTITY_CARD"
      | "COMMITMENT_LETTER"
      | "ENROLLMENT_SHEET"
      | "BEGINNER_CERTIFICATE"
      | "INTERMEDIATE_CERTIFICATE";
    contentType: string;
    sizeBytes: number;
  }[];
};

const summaryInclude = {
  formOffering: {
    select: {
      year: true,
      modality: true,
      formTemplate: { select: { code: true, name: true } },
      municipalityCode: true,
    },
  },
  student: {
    select: { firstNames: true, lastNames: true, documentId: true, sex: true },
  },
} as const;

const detailInclude = {
  ...summaryInclude,
  documents: { select: { type: true, contentType: true, sizeBytes: true } },
} as const;

const codeOf = (row: SubmissionRow): TemplateCode => {
  const code = row.formOffering.formTemplate.code;
  if (!isTemplateCode(code)) throw new UnknownTemplateError(code);
  return code;
};

const toSummary = (row: SubmissionRow): SubmissionSummary => ({
  id: row.id,
  offeringId: row.formOfferingId,
  templateCode: codeOf(row),
  templateName: row.formOffering.formTemplate.name,
  year: row.formOffering.year,
  modality: modalityToDomain(row.formOffering.modality),
  municipalityCode: row.formOffering.municipalityCode,
  studentId: row.studentId,
  fullName: `${row.student.firstNames} ${row.student.lastNames}`,
  documentId: row.student.documentId,
  submittedAt: row.submittedAt,
});

const toDetail = (row: DetailRow): SubmissionDetail => ({
  ...toSummary(row),
  answers: (row.answers ?? {}) as Answers,
  documents: row.documents.map((document) => ({
    type: documentTypeToDomain(document.type),
    contentType: document.contentType,
    sizeBytes: document.sizeBytes,
  })),
});

const isUniqueViolation = (error: unknown): boolean =>
  typeof error === "object" && error !== null && "code" in error && error.code === "P2002";

export class PrismaSubmissionRepository implements SubmissionRepository {
  constructor(private readonly db: PrismaClient) {}

  private where(filter: SubmissionFilter) {
    const search = filter.search?.trim();
    return {
      formOfferingId: filter.offeringId,
      studentId: filter.studentId,
      formOffering: {
        year: filter.year,
        municipalityCode: filter.municipalityCode,
        formTemplate: filter.templateCode ? { code: filter.templateCode } : undefined,
      },
      student: search
        ? {
            OR: [
              { firstNames: { contains: search, mode: "insensitive" as const } },
              { lastNames: { contains: search, mode: "insensitive" as const } },
              { documentId: { contains: search } },
            ],
          }
        : undefined,
    };
  }

  async record(input: NewSubmission): Promise<SubmissionSummary> {
    try {
      const row = await this.db.formSubmission.create({
        data: {
          formOfferingId: input.offeringId,
          studentId: input.studentId,
          answers: input.answers,
          ageRange: ageRangeToRow(input.ageRange),
          ethnicGroup: ethnicGroupToRow(input.ethnicGroup),
          submittedAt: input.submittedAt,
          documents: {
            create: input.documents.map((document) => ({
              type: documentTypeToRow(document.type),
              storageKey: document.storageKey,
              contentType: document.contentType,
              sizeBytes: document.sizeBytes,
              uploadedAt: input.submittedAt,
            })),
          },
        },
        include: summaryInclude,
      });
      return toSummary(row);
    } catch (error) {
      if (isUniqueViolation(error)) throw new AlreadyEnrolledError();
      throw error;
    }
  }

  async findById(id: string): Promise<SubmissionDetail | null> {
    const row = await this.db.formSubmission.findUnique({ where: { id }, include: detailInclude });
    return row ? toDetail(row) : null;
  }

  async findDocument(
    submissionId: string,
    type: DocumentType,
  ): Promise<{ storageKey: string; contentType: string } | null> {
    const row = await this.db.submissionDocument.findUnique({
      where: {
        submissionId_type: { submissionId, type: documentTypeToRow(type) },
      },
      select: { storageKey: true, contentType: true },
    });
    return row ?? null;
  }

  async list(filter: SubmissionFilter): Promise<SubmissionSummary[]> {
    const rows = await this.db.formSubmission.findMany({
      where: this.where(filter),
      orderBy: { submittedAt: "desc" },
      include: summaryInclude,
    });
    return rows.map(toSummary);
  }

  async listDetailed(filter: SubmissionFilter): Promise<SubmissionDetail[]> {
    const rows = await this.db.formSubmission.findMany({
      where: this.where(filter),
      orderBy: { submittedAt: "asc" },
      include: detailInclude,
    });
    return rows.map(toDetail);
  }

  async summarize(filter: SubmissionFilter): Promise<EnrollmentSummary> {
    const rows = await this.db.formSubmission.findMany({
      where: this.where(filter),
      include: summaryInclude,
    });

    const tally = <T extends string>(values: readonly T[], of: (row: SubmissionRow) => T) =>
      Object.fromEntries(
        values.map((value) => [value, rows.filter((row) => of(row) === value).length]),
      ) as Record<T, number>;

    const group = <K extends string>(key: (row: SubmissionRow) => K) => {
      const counts = new Map<K, number>();
      for (const row of rows) counts.set(key(row), (counts.get(key(row)) ?? 0) + 1);
      return counts;
    };

    const municipalities = group((row) => row.formOffering.municipalityCode);
    const templates = group((row) => codeOf(row));

    return {
      total: rows.length,
      bySex: tally<Sex>(["female", "male"], (row) =>
        row.student.sex === "FEMALE" ? "female" : "male",
      ),
      byAgeRange: tally<AgeRange>(["from_14_to_30", "from_31_to_60", "over_60"], (row) =>
        ageRangeToDomain(row.ageRange),
      ),
      byEthnicGroup: tally<EthnicGroup>(["maya", "garifuna", "xinka", "ladino", "other"], (row) =>
        ethnicGroupToDomain(row.ethnicGroup),
      ),
      byModality: tally<Modality>(["virtual", "in_person"], (row) =>
        modalityToDomain(row.formOffering.modality),
      ),
      byMunicipality: [...municipalities.entries()]
        .map(([code, count]) => ({ code, count }))
        .sort((a, b) => b.count - a.count),
      byTemplate: [...templates.entries()]
        .map(([code, count]) => ({
          code,
          name: rows.find((row) => codeOf(row) === code)?.formOffering.formTemplate.name ?? code,
          count,
        }))
        .sort((a, b) => b.count - a.count),
    };
  }
}
