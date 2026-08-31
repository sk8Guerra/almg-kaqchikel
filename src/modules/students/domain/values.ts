import { InvalidDocumentIdError } from "./errors";

declare const brand: unique symbol;
type Brand<T, B> = T & { readonly [brand]: B };

export type DocumentId = Brand<string, "DocumentId">;

export type Sex = "female" | "male";

export const DOCUMENT_ID_LENGTH = 13;

export const documentId = (raw: string): DocumentId => {
  const normalized = raw.replace(/[\s-]/g, "");
  if (!/^\d+$/.test(normalized) || normalized.length !== DOCUMENT_ID_LENGTH) {
    throw new InvalidDocumentIdError(raw);
  }
  return normalized as DocumentId;
};
