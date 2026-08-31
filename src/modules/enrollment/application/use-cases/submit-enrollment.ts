import type { Clock } from "@/shared/clock";
import { answerOf, commitmentAccepted, validateAnswers } from "../../domain/answers";
import type { Answers } from "../../domain/answers";
import { templateByCode } from "../../domain/form-template";
import { isOfferingOpen } from "../../domain/offering";
import {
  InvalidAnswersError,
  InvalidDocumentError,
  MissingDocumentError,
  ModalityCommitmentRefusedError,
  OfferingNotFoundError,
  OfferingNotOpenError,
} from "../../domain/errors";
import { DOCUMENT_CONTENT_TYPE, MAX_DOCUMENT_BYTES } from "../../domain/values";
import type { AgeRange, DocumentType, EthnicGroup, Sex } from "../../domain/values";
import type { OfferingRepository } from "../ports/offering-repository";
import type { SubmissionDocumentInput, SubmissionRepository } from "../ports/submission-repository";
import type { StudentRegistry } from "../ports/student-registry";
import type { FileStore } from "../ports/file-store";
import { draftKeyPrefix } from "./request-upload-ticket";

type Deps = {
  offerings: OfferingRepository;
  submissions: SubmissionRepository;
  students: StudentRegistry;
  files: FileStore;
  clock: Clock;
};

type Input = {
  offeringId: string;
  draftId: string;
  answers: Answers;
  documents: readonly { type: DocumentType; key: string }[];
};

export type SubmitEnrollmentResult = {
  readonly submissionId: string;
  readonly studentId: string;
};

export const submitEnrollment =
  ({ offerings, submissions, students, files, clock }: Deps) =>
  async (input: Input): Promise<SubmitEnrollmentResult> => {
    const now = clock.now();

    const offering = await offerings.findById(input.offeringId);
    if (!offering) throw new OfferingNotFoundError(input.offeringId);
    if (!isOfferingOpen(offering, now)) throw new OfferingNotOpenError(input.offeringId);

    if (!commitmentAccepted(input.answers)) throw new ModalityCommitmentRefusedError();

    const template = templateByCode(offering.templateCode);
    const problems = validateAnswers(template, input.answers);
    if (problems.length > 0) throw new InvalidAnswersError(problems);

    const prefix = draftKeyPrefix(input.draftId);
    const confirmed: SubmissionDocumentInput[] = [];

    for (const type of template.documents) {
      const declared = input.documents.find((document) => document.type === type);
      if (!declared) throw new MissingDocumentError(type);
      if (!declared.key.includes(prefix)) throw new InvalidDocumentError(type);

      const stored = await files.confirm(declared.key);
      if (!stored) throw new InvalidDocumentError(type);
      if (stored.contentType !== DOCUMENT_CONTENT_TYPE) throw new InvalidDocumentError(type);
      if (stored.sizeBytes > MAX_DOCUMENT_BYTES) throw new InvalidDocumentError(type);

      confirmed.push({
        type,
        storageKey: stored.key,
        contentType: stored.contentType,
        sizeBytes: stored.sizeBytes,
      });
    }

    const student = await students.ensure({
      documentId: answerOf(input.answers, "document_id"),
      firstNames: answerOf(input.answers, "first_names"),
      lastNames: answerOf(input.answers, "last_names"),
      sex: answerOf(input.answers, "sex") as Sex,
      municipalityCode: answerOf(input.answers, "residence_municipality"),
    });

    const submission = await submissions.record({
      offeringId: offering.id,
      studentId: student.id,
      answers: input.answers,
      ageRange: answerOf(input.answers, "age_range") as AgeRange,
      ethnicGroup: answerOf(input.answers, "ethnic_group") as EthnicGroup,
      submittedAt: now,
      documents: confirmed,
    });

    return { submissionId: submission.id, studentId: student.id };
  };
