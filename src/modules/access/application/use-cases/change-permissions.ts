import type { Clock } from "@/shared/clock";
import type { User } from "../../domain/user";
import { requireAdmin } from "../../domain/authorization";
import { isKnownPermission } from "../../domain/modules";
import type { PermissionKey } from "../../domain/modules";
import { UnknownPermissionError, UserNotProvisionedError } from "../../domain/errors";
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
  grant: PermissionKey[];
  revoke: PermissionKey[];
  actor: User;
};

export const changePermissions =
  ({ users, audit, clock }: Deps) =>
  async ({ targetId, grant, revoke, actor }: Input): Promise<void> => {
    requireAdmin(actor);

    for (const key of [...grant, ...revoke]) {
      if (!isKnownPermission(key)) throw new UnknownPermissionError(key);
    }

    const target = await users.findById(targetId);
    if (target === null) throw new UserNotProvisionedError();

    const now = clock.now();

    await users.grantPermissions(targetId, grant);
    await users.revokePermissions(targetId, revoke);

    for (const key of grant) {
      await recordBestEffort(audit, {
        type: "PERMISSION_GRANTED",
        actorId: actor.id,
        targetId,
        detail: key,
        at: now,
      });
    }
    for (const key of revoke) {
      await recordBestEffort(audit, {
        type: "PERMISSION_REVOKED",
        actorId: actor.id,
        targetId,
        detail: key,
        at: now,
      });
    }
  };
