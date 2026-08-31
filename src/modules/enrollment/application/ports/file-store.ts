export type UploadTicket = {
  readonly key: string;
  readonly url: string;
  readonly method: "PUT";
  readonly headers: Readonly<Record<string, string>>;
  readonly expiresAt: Date;
};

export type StoredFile = {
  readonly key: string;
  readonly contentType: string;
  readonly sizeBytes: number;
};

export type FileContent = {
  readonly body: ReadableStream<Uint8Array>;
  readonly contentType: string;
  readonly sizeBytes: number;
};

export interface FileStore {
  createUploadTicket(input: {
    key: string;
    contentType: string;
    maxBytes: number;
    expiresAt: Date;
  }): Promise<UploadTicket>;
  confirm(key: string): Promise<StoredFile | null>;
  read(key: string): Promise<FileContent | null>;
  remove(key: string): Promise<void>;
}
