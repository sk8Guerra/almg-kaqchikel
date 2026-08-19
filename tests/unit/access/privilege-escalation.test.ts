import { describe, expect, it } from "vitest";
import { changePermissions } from "@/modules/access/application/use-cases/change-permissions";
import { changeRole } from "@/modules/access/application/use-cases/change-role";
import { createPerson } from "@/modules/access/application/use-cases/create-person";
import { AdminRequiredError } from "@/modules/access/domain/errors";
import { ALL_PERMISSION_KEYS } from "@/modules/access/domain/modules";
import { userId } from "@/modules/access/domain/values";
import { InMemoryAuditLog, InMemoryUserRepository, StubIdentityProvider, aUser } from "./doubles";
import { fixedClock } from "./doubles";

const clock = fixedClock("2026-08-19T10:00:00Z");

/**
 * FR-019, SC-004. Un miembro con TODOS los permisos del catálogo sigue sin poder
 * alterar la autoridad de nadie. Si esto fallara, el modelo de dos roles no existe.
 */
const memberWithEverything = aUser({ id: userId("u_member"), role: "member" });

describe("escalada de privilegios — la autoridad no es concedible", () => {
  it("un miembro con todos los permisos no puede cambiar roles", async () => {
    const users = new InMemoryUserRepository();
    users.seed(memberWithEverything, [...ALL_PERMISSION_KEYS]);
    users.seed(aUser({ id: userId("u_target") }));

    const run = changeRole({ users, audit: new InMemoryAuditLog(), clock });

    await expect(
      run({
        targetId: userId("u_target"),
        role: "admin",
        permissionKeys: [],
        actor: memberWithEverything,
      }),
    ).rejects.toThrow(AdminRequiredError);
  });

  it("un miembro con todos los permisos no puede promoverse a sí mismo", async () => {
    const users = new InMemoryUserRepository();
    users.seed(memberWithEverything, [...ALL_PERMISSION_KEYS]);

    const run = changeRole({ users, audit: new InMemoryAuditLog(), clock });

    await expect(
      run({
        targetId: memberWithEverything.id,
        role: "admin",
        permissionKeys: [],
        actor: memberWithEverything,
      }),
    ).rejects.toThrow(AdminRequiredError);
  });

  it("un miembro con todos los permisos no puede conceder permisos", async () => {
    const users = new InMemoryUserRepository();
    users.seed(memberWithEverything, [...ALL_PERMISSION_KEYS]);
    users.seed(aUser({ id: userId("u_target") }));

    const run = changePermissions({ users, audit: new InMemoryAuditLog(), clock });

    await expect(
      run({
        targetId: userId("u_target"),
        grant: ["access:delete"],
        revoke: [],
        actor: memberWithEverything,
      }),
    ).rejects.toThrow(AdminRequiredError);
  });

  it("un miembro con todos los permisos no puede dar de alta a nadie", async () => {
    const users = new InMemoryUserRepository();
    users.seed(memberWithEverything, [...ALL_PERMISSION_KEYS]);
    const identity = new StubIdentityProvider();

    const run = createPerson({ identity, users, audit: new InMemoryAuditLog(), clock });

    await expect(
      run({
        email: "nueva@almg.gt",
        role: "admin",
        permissionKeys: [],
        actor: memberWithEverything,
      }),
    ).rejects.toThrow(AdminRequiredError);

    expect(identity.created).toHaveLength(0);
  });
});
