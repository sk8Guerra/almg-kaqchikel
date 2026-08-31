import type { Sex } from "../../domain/values";

export type StudentIdentity = {
  readonly documentId: string;
  readonly firstNames: string;
  readonly lastNames: string;
  readonly sex: Sex;
  readonly municipalityCode: string;
};

export interface StudentRegistry {
  ensure(identity: StudentIdentity): Promise<{ readonly id: string }>;
}
