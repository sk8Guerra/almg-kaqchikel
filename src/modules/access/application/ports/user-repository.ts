import type { User, UserStatus } from "../../domain/user";
import type { PermissionKey, UserRole } from "../../domain/modules";
import type { Email, IdentityId, UserId } from "../../domain/values";
import type { ExternalIdentity } from "./identity-provider";

export type PeopleFilter = {
  readonly search?: string;
  readonly status?: UserStatus;
};

export type PersonSummary = {
  readonly id: UserId;
  readonly email: Email;
  readonly displayName: string | null;
  readonly role: UserRole;
  readonly status: UserStatus;
  readonly permissionKeys: PermissionKey[];
  readonly hasSignedIn: boolean;
};

export type NewPersonInput = {
  readonly identityId: IdentityId;
  readonly email: Email;
  readonly role: UserRole;
  readonly permissionKeys: PermissionKey[];
  readonly now: Date;
};

export interface UserRepository {
  findByIdentityId(identityId: IdentityId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findById(id: UserId): Promise<User | null>;
  upsertFromIdentity(identity: ExternalIdentity, now: Date): Promise<User>;

  list(filter: PeopleFilter): Promise<PersonSummary[]>;
  createWithRole(input: NewPersonInput): Promise<User>;
  markFirstSignIn(userId: UserId, now: Date): Promise<void>;
  setStatus(userId: UserId, status: UserStatus, now: Date): Promise<void>;

  listPermissions(userId: UserId): Promise<Set<PermissionKey>>;
  grantPermissions(userId: UserId, keys: PermissionKey[]): Promise<void>;
  revokePermissions(userId: UserId, keys: PermissionKey[]): Promise<void>;
  setRole(userId: UserId, role: UserRole, now: Date): Promise<void>;
  countActiveAdminsExcluding(excluded: UserId): Promise<number>;
}
