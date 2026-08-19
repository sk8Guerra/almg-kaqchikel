import type { Clock } from "@/shared/clock";
import { UserNotProvisionedError } from "../../domain/errors";
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
  actor: UserId;
};

export const reactivatePerson =
  ({ identity, users, audit, clock }: Deps) =>
  async ({ targetId, actor }: Input): Promise<void> => {
    const target = await users.findById(targetId);
    if (target === null) throw new UserNotProvisionedError();

    const now = clock.now();
    await identity.reactivateIdentity(target.identityId);
    await users.setStatus(targetId, "active", now);
    await recordBestEffort(audit, { type: "USER_REACTIVATED", actorId: actor, targetId, at: now });
  };
