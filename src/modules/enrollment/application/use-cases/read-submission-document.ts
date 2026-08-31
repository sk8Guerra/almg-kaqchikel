import { InvalidDocumentError, SubmissionNotFoundError } from "../../domain/errors";
import type { DocumentType } from "../../domain/values";
import type { SubmissionRepository } from "../ports/submission-repository";
import type { FileContent, FileStore } from "../ports/file-store";

type Deps = { submissions: SubmissionRepository; files: FileStore };

type Input = { submissionId: string; type: DocumentType };

export const readSubmissionDocument =
  ({ submissions, files }: Deps) =>
  async (input: Input): Promise<FileContent> => {
    const document = await submissions.findDocument(input.submissionId, input.type);
    if (!document) throw new SubmissionNotFoundError(input.submissionId);

    const content = await files.read(document.storageKey);
    if (!content) throw new InvalidDocumentError(input.type);
    return content;
  };
