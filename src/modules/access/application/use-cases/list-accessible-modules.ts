import { grants } from "../../domain/authorization";
import { MODULES } from "../../domain/modules";
import type { ModuleKey } from "../../domain/modules";
import type { IdentityProvider } from "../ports/identity-provider";
import type { UserRepository } from "../ports/user-repository";

export type AccessibleModule = {
  readonly key: ModuleKey;
  readonly label: string;
};

type Deps = {
  identity: IdentityProvider;
  users: UserRepository;
};

export const listAccessibleModules =
  ({ identity, users }: Deps) =>
  async (): Promise<AccessibleModule[]> => {
    const current = await identity.getCurrentIdentity();
    if (current === null) return [];

    const user = await users.findByIdentityId(current.identityId);
    if (user === null || user.status !== "active") return [];

    const granted = await users.listPermissions(user.id);
    const moduleKeys = Object.keys(MODULES) as ModuleKey[];

    return moduleKeys
      .filter((key) => grants(user, granted, `${key}:read`))
      .map((key) => ({ key, label: MODULES[key].label }));
  };
