import {
  AdminRequiredError,
  MemberWithoutPermissionsError,
  UnknownPermissionError,
} from "./errors";
import { isKnownPermission } from "./modules";
import type { PermissionKey, UserRole } from "./modules";

export const grants = (
  person: { role: UserRole },
  granted: ReadonlySet<PermissionKey>,
  permission: PermissionKey,
): boolean => (person.role === "admin" ? true : granted.has(permission));

export const requireAdmin = (actor: { role: UserRole }): void => {
  if (actor.role !== "admin") throw new AdminRequiredError();
};

export const permissionsFor = (role: UserRole, keys: PermissionKey[]): PermissionKey[] => {
  if (role === "admin") return [];
  if (keys.length === 0) throw new MemberWithoutPermissionsError();
  for (const key of keys) {
    if (!isKnownPermission(key)) throw new UnknownPermissionError(key);
  }
  return [...new Set(keys)];
};
