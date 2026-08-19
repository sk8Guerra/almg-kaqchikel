import type { Clock } from "@/shared/clock";
import type { User } from "../../domain/user";
import { permissionsFor, requireAdmin } from "../../domain/authorization";
import type { PermissionKey, UserRole } from "../../domain/modules";
import { email as toEmail } from "../../domain/values";

import { EmailAlreadyRegisteredError, IdentityCreationFailedError } from "../../domain/errors";
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
  email: string;
  role: UserRole;
  permissionKeys: PermissionKey[];
  actor: User;
};

export const createPerson =
  ({ identity, users, audit, clock }: Deps) =>
  async ({ email, role, permissionKeys, actor }: Input): Promise<User> => {
    requireAdmin(actor);

    const address = toEmail(email);
    const keys = permissionsFor(role, permissionKeys);

    const existing = await users.findByEmail(address);
    if (existing !== null) throw new EmailAlreadyRegisteredError(address);

    let identityId;
    try {
      identityId = await identity.createIdentity(address);
    } catch (cause) {
      throw new IdentityCreationFailedError(cause);
    }

    const now = clock.now();

    let person: User;
    try {
      person = await users.createWithRole({
        identityId,
        email: address,
        role,
        permissionKeys: keys,
        now,
      });
    } catch (cause) {
      await identity.deleteIdentity(identityId);
      throw cause;
    }

    await recordBestEffort(audit, {
      type: "USER_CREATED",
      actorId: actor.id,
      targetId: person.id,
      detail: role,
      at: now,
    });

    return person;
  };
