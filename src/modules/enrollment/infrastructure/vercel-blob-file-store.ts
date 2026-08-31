import { del, get, head, issueSignedToken, presignUrl } from "@vercel/blob";
import type {
  FileContent,
  FileStore,
  StoredFile,
  UploadTicket,
} from "../application/ports/file-store";

const ACCESS = "private" as const;

const isNotFound = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "name" in error &&
  String(error.name).includes("BlobNotFound");

export class VercelBlobFileStore implements FileStore {
  constructor(private readonly token: string) {}

  async createUploadTicket(input: {
    key: string;
    contentType: string;
    maxBytes: number;
    expiresAt: Date;
  }): Promise<UploadTicket> {
    const validUntil = input.expiresAt.getTime();

    const signedToken = await issueSignedToken({
      token: this.token,
      pathname: input.key,
      operations: ["put"],
      validUntil,
      allowedContentTypes: [input.contentType],
      maximumSizeInBytes: input.maxBytes,
    });

    const { presignedUrl } = await presignUrl(signedToken, {
      operation: "put",
      pathname: input.key,
      access: ACCESS,
      validUntil,
      allowedContentTypes: [input.contentType],
      maximumSizeInBytes: input.maxBytes,
      addRandomSuffix: true,
    });

    return {
      key: input.key,
      url: presignedUrl,
      method: "PUT",
      headers: {
        "content-type": input.contentType,
        "x-content-type": input.contentType,
        "x-vercel-blob-access": ACCESS,
        "x-add-random-suffix": "1",
      },
      expiresAt: input.expiresAt,
    };
  }

  async confirm(key: string): Promise<StoredFile | null> {
    try {
      const result = await head(key, { token: this.token });
      return {
        key: result.url,
        contentType: result.contentType,
        sizeBytes: result.size,
      };
    } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  }

  async read(key: string): Promise<FileContent | null> {
    try {
      const result = await get(key, { access: ACCESS, token: this.token });
      if (!result || result.statusCode !== 200) return null;
      return {
        body: result.stream,
        contentType: result.blob.contentType,
        sizeBytes: result.blob.size,
      };
    } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    await del(key, { token: this.token });
  }
}
