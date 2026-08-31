import type { Clock } from "@/shared/clock";
import { templateByCode } from "../../domain/form-template";
import { isOfferingOpen } from "../../domain/offering";
import {
  InvalidDocumentError,
  OfferingNotFoundError,
  OfferingNotOpenError,
} from "../../domain/errors";
import { DOCUMENT_CONTENT_TYPE, MAX_DOCUMENT_BYTES } from "../../domain/values";
import type { DocumentType } from "../../domain/values";
import type { OfferingRepository } from "../ports/offering-repository";
import type { FileStore, UploadTicket } from "../ports/file-store";

type Deps = { offerings: OfferingRepository; files: FileStore; clock: Clock };

type Input = {
  offeringId: string;
  draftId: string;
  type: DocumentType;
  contentType: string;
};

const TICKET_MINUTES = 15;

const DRAFT_ID_SHAPE = /^[a-z0-9-]{8,64}$/;

export const draftKeyPrefix = (draftId: string): string => `drafts/${draftId}/`;

export const requestUploadTicket =
  ({ offerings, files, clock }: Deps) =>
  async (input: Input): Promise<UploadTicket> => {
    const now = clock.now();

    const offering = await offerings.findById(input.offeringId);
    if (!offering) throw new OfferingNotFoundError(input.offeringId);
    if (!isOfferingOpen(offering, now)) throw new OfferingNotOpenError(input.offeringId);

    const template = templateByCode(offering.templateCode);
    if (!template.documents.includes(input.type)) throw new InvalidDocumentError(input.type);
    if (input.contentType !== DOCUMENT_CONTENT_TYPE) throw new InvalidDocumentError(input.type);
    if (!DRAFT_ID_SHAPE.test(input.draftId)) throw new InvalidDocumentError(input.type);

    return files.createUploadTicket({
      key: `${draftKeyPrefix(input.draftId)}${input.type}.pdf`,
      contentType: DOCUMENT_CONTENT_TYPE,
      maxBytes: MAX_DOCUMENT_BYTES,
      expiresAt: new Date(now.getTime() + TICKET_MINUTES * 60 * 1000),
    });
  };
