import type { Clock } from "@/shared/clock";
import type { User } from "../../domain/user";
import { NotAuthenticatedError, UserInactiveError } from "../../domain/errors";
import type { IdentityProvider } from "../ports/identity-provider";
import type { UserRepository } from "../ports/user-repository";

type Deps = {
  identity: IdentityProvider;
  users: UserRepository;
  clock: Clock;
};

export const syncSignedInUser =
  ({ identity, users, clock }: Deps) =>
  async (): Promise<User> => {
    const current = await identity.getCurrentIdentity();
    if (current === null) throw new NotAuthenticatedError();
    if (!current.isActive) throw new UserInactiveError();

    const now = clock.now();
    const user = await users.upsertFromIdentity(current, now);

    if (user.firstSignInAt === null) {
      await users.markFirstSignIn(user.id, now);
      return { ...user, firstSignInAt: now };
    }

    return user;
  };
