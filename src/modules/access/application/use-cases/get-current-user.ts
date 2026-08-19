import type { User } from "../../domain/user";
import type { IdentityProvider } from "../ports/identity-provider";
import type { UserRepository } from "../ports/user-repository";

type Deps = {
  identity: IdentityProvider;
  users: UserRepository;
};

export const getCurrentUser =
  ({ identity, users }: Deps) =>
  async (): Promise<User | null> => {
    const current = await identity.getCurrentIdentity();
    if (current === null) return null;
    return users.findByIdentityId(current.identityId);
  };
