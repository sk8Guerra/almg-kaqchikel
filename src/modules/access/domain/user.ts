import type { Email, IdentityId, UserId } from "./values";
import type { UserRole } from "./modules";

export type UserStatus = "active" | "inactive";

export type User = {
  readonly id: UserId;
  readonly identityId: IdentityId;
  readonly email: Email;
  readonly displayName: string | null;
  readonly role: UserRole;
  readonly status: UserStatus;
  readonly firstSignInAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export const isActive = (user: User): boolean => user.status === "active";

export const hasSignedIn = (user: User): boolean => user.firstSignInAt !== null;
