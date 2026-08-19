import type { PermissionKey } from "../../domain/modules";
import type { IdentityProvider } from "../ports/identity-provider";
import type { UserRepository } from "../ports/user-repository";
import { authorize } from "./authorize";

type Deps = {
  identity: IdentityProvider;
  users: UserRepository;
};

export const can =
  (deps: Deps) =>
  async (permission: PermissionKey): Promise<boolean> => {
    try {
      await authorize(deps)(permission);
      return true;
    } catch {
      return false;
    }
  };
