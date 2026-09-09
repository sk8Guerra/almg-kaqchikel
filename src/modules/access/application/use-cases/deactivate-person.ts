import type { Clock } from "@/shared/clock";
import type { User } from "../../domain/user";
import { requireAdmin } from "../../domain/authorization";
import {
  LastAdministratorError,
  SelfDeactivationError,
  UserNotProvisionedError,
} from "../../domain/errors";
import type { UserId } from "../../domain/values";
import type { IdentityProvider } from "../ports/identity-provider";
import type { UserRepository } from "../ports/user-repository";
import { recordBestEffort } from "../ports/audit-log";
import type { AuditLog } from "../ports/audit-log";

type Deps = {
  identity: IdentityProvider;
  users: UserRepository;
  audit: AuditLog;
  clock: Clock;
};

type Input = {
  targetId: UserId;
  actor: User;
};

export const deactivatePerson =
  ({ identity, users, audit, clock }: Deps) =>
  async ({ targetId, actor }: Input): Promise<void> => {
    requireAdmin(actor);

    if (targetId === actor.id) throw new SelfDeactivationError();

    const target = await users.findById(targetId);
    if (target === null) throw new UserNotProvisionedError();

    if (target.role === "admin") {
      const remaining = await users.countActiveAdminsExcluding(targetId);
      if (remaining === 0) throw new LastAdministratorError();
    }

    const now = clock.now();
    await identity.deactivateIdentity(target.identityId);
    await users.setStatus(targetId, "inactive", now);
    await recordBestEffort(audit, {
      type: "USER_DEACTIVATED",
      actorId: actor.id,
      targetId,
      at: now,
    });
  };
