import type { Clock } from "@/shared/clock";
import type { User } from "../../domain/user";
import { permissionsFor, requireAdmin } from "../../domain/authorization";
import type { PermissionKey, UserRole } from "../../domain/modules";
import {
  LastAdministratorError,
  SelfDemotionError,
  UserNotProvisionedError,
} from "../../domain/errors";
import type { UserId } from "../../domain/values";
import type { UserRepository } from "../ports/user-repository";
import { recordBestEffort } from "../ports/audit-log";
import type { AuditLog } from "../ports/audit-log";

type Deps = {
  users: UserRepository;
  audit: AuditLog;
  clock: Clock;
};

type Input = {
  targetId: UserId;
  role: UserRole;
  permissionKeys: PermissionKey[];
  actor: User;
};

export const changeRole =
  ({ users, audit, clock }: Deps) =>
  async ({ targetId, role, permissionKeys, actor }: Input): Promise<void> => {
    requireAdmin(actor);

    const target = await users.findById(targetId);
    if (target === null) throw new UserNotProvisionedError();

    const isDemotion = target.role === "admin" && role === "member";

    if (isDemotion && targetId === actor.id) throw new SelfDemotionError();

    if (isDemotion) {
      const remaining = await users.countActiveAdminsExcluding(targetId);
      if (remaining === 0) throw new LastAdministratorError();
    }

    const keys = permissionsFor(role, permissionKeys);
    const now = clock.now();

    await users.setRole(targetId, role, now);

    const current = await users.listPermissions(targetId);
    await users.revokePermissions(targetId, [...current]);
    await users.grantPermissions(targetId, keys);

    await recordBestEffort(audit, {
      type: "ROLE_CHANGED",
      actorId: actor.id,
      targetId,
      detail: role,
      at: now,
    });
  };
