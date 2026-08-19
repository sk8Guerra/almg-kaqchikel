import type { IdentityId } from "../../domain/values";

export type ExternalIdentity = {
  readonly identityId: IdentityId;
  readonly email: string;
  readonly displayName: string | null;
  readonly isActive: boolean;
  readonly updatedAt: Date;
};

export interface IdentityProvider {
  getCurrentIdentity(): Promise<ExternalIdentity | null>;
  createIdentity(email: string): Promise<IdentityId>;
  deleteIdentity(identityId: IdentityId): Promise<void>;
  deactivateIdentity(identityId: IdentityId): Promise<void>;
  reactivateIdentity(identityId: IdentityId): Promise<void>;
}
