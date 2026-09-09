import { describe, expect, it } from "vitest";
import { changeRole } from "@/modules/access/application/use-cases/change-role";
import {
  LastAdministratorError,
  MemberWithoutPermissionsError,
  SelfDemotionError,
} from "@/modules/access/domain/errors";
import { email, userId } from "@/modules/access/domain/values";
import type { PermissionKey } from "@/modules/access/domain/modules";
import { InMemoryAuditLog, InMemoryUserRepository, aUser, anAdmin, fixedClock } from "./doubles";

const clock = fixedClock("2026-08-19T10:00:00Z");
const actor = anAdmin();
const other = userId("u_other");

const withUsers = (extraAdmins = 0) => {
  const users = new InMemoryUserRepository();
  users.seed(actor);
  users.seed(aUser({ id: other, email: email("otra@almg.gt") }), ["access:read"]);
  for (let i = 0; i < extraAdmins; i++) {
    users.seed(aUser({ id: userId(`u_admin${i}`), email: email(`a${i}@almg.gt`), role: "admin" }));
  }
  return { users, audit: new InMemoryAuditLog(), clock };
};

describe("changeRole — promoción (US4, FR-017)", () => {
  it("promover da autoridad total sin pedir permisos", async () => {
    const d = withUsers();
    await changeRole(d)({ targetId: other, role: "admin", permissionKeys: [], actor });

    expect((await d.users.findById(other))?.role).toBe("admin");
  });

  it("promover descarta los permisos que tenía", async () => {
    const d = withUsers();
    await changeRole(d)({ targetId: other, role: "admin", permissionKeys: [], actor });

    expect(await d.users.listPermissions(other)).toEqual(new Set());
  });
});

describe("changeRole — degradación (FR-016)", () => {
  it("degradar exige permisos explícitos", async () => {
    const d = withUsers(1);
    await changeRole(d)({ targetId: other, role: "admin", permissionKeys: [], actor });

    await expect(
      changeRole(d)({ targetId: other, role: "member", permissionKeys: [], actor }),
    ).rejects.toThrow(MemberWithoutPermissionsError);
  });

  it("degradar aplica exactamente los permisos indicados, sin restaurar los antiguos", async () => {
    const d = withUsers(1);
    await changeRole(d)({ targetId: other, role: "admin", permissionKeys: [], actor });
    await changeRole(d)({
      targetId: other,
      role: "member",
      permissionKeys: ["offering:create"] as PermissionKey[],
      actor,
    });

    expect(await d.users.listPermissions(other)).toEqual(new Set(["offering:create"]));
  });
});

describe("changeRole — las dos guardas de bloqueo (FR-020, FR-021)", () => {
  it("impide degradar al último administrador", async () => {
    const d = withUsers();
    const someoneElse = anAdmin({ id: userId("u_other_admin") });
    d.users.seed(someoneElse);

    await expect(
      changeRole(d)({
        targetId: actor.id,
        role: "member",
        permissionKeys: ["access:read"] as PermissionKey[],
        actor: someoneElse,
      }),
    ).resolves.toBeUndefined();
  });

  it("lanza LastAdministratorError si no queda ningún otro administrador", async () => {
    const users = new InMemoryUserRepository();
    users.seed(actor);
    const target = anAdmin({ id: userId("u_solo"), email: email("solo@almg.gt") });
    users.seed(target);
    const d = { users, audit: new InMemoryAuditLog(), clock };

    await users.setStatus(actor.id, "inactive", clock.now());

    await expect(
      changeRole(d)({
        targetId: target.id,
        role: "member",
        permissionKeys: ["access:read"] as PermissionKey[],
        actor,
      }),
    ).rejects.toThrow(LastAdministratorError);
  });

  it("impide degradarse a sí mismo AUNQUE quede otro administrador (FR-021)", async () => {
    const d = withUsers(1);

    await expect(
      changeRole(d)({
        targetId: actor.id,
        role: "member",
        permissionKeys: ["access:read"] as PermissionKey[],
        actor,
      }),
    ).rejects.toThrow(SelfDemotionError);
  });
});
