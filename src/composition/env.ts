const required = (name: string): string => {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env and fill it in.`,
    );
  }
  return value;
};

export type Env = {
  readonly databaseUrl: string;
  readonly clerkSecretKey: string;
  readonly blobReadWriteToken: string;
};

let cached: Env | null = null;

export const env = (): Env => {
  if (cached) return cached;
  cached = {
    databaseUrl: required("DATABASE_URL"),
    clerkSecretKey: required("CLERK_SECRET_KEY"),
    blobReadWriteToken: required("BLOB_READ_WRITE_TOKEN"),
  };
  return cached;
};
