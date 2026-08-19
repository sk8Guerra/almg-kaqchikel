import type { User } from "../../domain/user";
import { grants } from "../../domain/authorization";
import type { PermissionKey } from "../../domain/modules";
import {
  NotAuthenticatedError,
  PermissionDeniedError,
  UserInactiveError,
  UserNotProvisionedError,
} from "../../domain/errors";
import type { IdentityProvider } from "../ports/identity-provider";
import type { UserRepository } from "../ports/user-repository";

type Deps = {
  identity: IdentityProvider;
  users: UserRepository;
};

export const authorize =
  ({ identity, users }: Deps) =>
  async (permission: PermissionKey): Promise<User> => {
    const current = await identity.getCurrentIdentity();
    if (current === null) throw new NotAuthenticatedError();

    const user = await users.findByIdentityId(current.identityId);
    if (user === null) throw new UserNotProvisionedError();
    if (user.status !== "active") throw new UserInactiveError();

    const granted = await users.listPermissions(user.id);
    if (!grants(user, granted, permission)) throw new PermissionDeniedError(permission);

    return user;
  };
