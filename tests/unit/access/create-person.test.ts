import { describe, expect, it } from "vitest";
import { createPerson } from "@/modules/access/application/use-cases/create-person";
import {
  EmailAlreadyRegisteredError,
  MemberWithoutPermissionsError,
  UnknownPermissionError,
} from "@/modules/access/domain/errors";
import { email, userId } from "@/modules/access/domain/values";
import type { PermissionKey } from "@/modules/access/domain/modules";
import {
  InMemoryAuditLog,
  InMemoryUserRepository,
  StubIdentityProvider,
  aUser,
  anAdmin,
  fixedClock,
} from "./doubles";

const clock = fixedClock("2026-08-19T10:00:00Z");
const actor = anAdmin();

const deps = () => {
  const users = new InMemoryUserRepository();
  users.seed(actor);
  return {
    identity: new StubIdentityProvider(),
    users,
    audit: new InMemoryAuditLog(),
    clock,
  };
};

describe("createPerson — administrador (US1, FR-006, FR-015)", () => {
  it("crea al administrador sin ningún permiso concedido", async () => {
    const d = deps();
    const person = await createPerson(d)({
      email: "jefa@almg.gt",
      role: "admin",
      permissionKeys: [],
      actor,
    });

    expect(person.role).toBe("admin");
    expect(await d.users.listPermissions(person.id)).toEqual(new Set());
  });

  it("ignora permisos enviados junto al rol de administración", async () => {
    const d = deps();
    const person = await createPerson(d)({
      email: "jefa@almg.gt",
      role: "admin",
      permissionKeys: ["access:read"] as PermissionKey[],
      actor,
    });

    expect(await d.users.listPermissions(person.id)).toEqual(new Set());
  });

  it("queda sin ingresar todavía", async () => {
    const d = deps();
    const person = await createPerson(d)({
      email: "jefa@almg.gt",
      role: "admin",
      permissionKeys: [],
      actor,
    });

    expect(person.firstSignInAt).toBeNull();
  });
});

describe("createPerson — miembro (US2, FR-008, FR-010)", () => {
  it("concede exactamente los permisos indicados", async () => {
    const d = deps();
    const person = await createPerson(d)({
      email: "nueva@almg.gt",
      role: "member",
      permissionKeys: ["access:read"] as PermissionKey[],
      actor,
    });

    expect(await d.users.listPermissions(person.id)).toEqual(new Set(["access:read"]));
  });

  it("rechaza un miembro sin ningún permiso (FR-010)", async () => {
    const d = deps();
    await expect(
      createPerson(d)({ email: "nueva@almg.gt", role: "member", permissionKeys: [], actor }),
    ).rejects.toThrow(MemberWithoutPermissionsError);

    expect(d.identity.created).toHaveLength(0);
  });

  it("rechaza claves fuera del catálogo", async () => {
    const d = deps();
    await expect(
      createPerson(d)({
        email: "nueva@almg.gt",
        role: "member",
        permissionKeys: ["forms:read"] as unknown as PermissionKey[],
        actor,
      }),
    ).rejects.toThrow(UnknownPermissionError);
  });

  it("no duplica permisos repetidos (FR-012)", async () => {
    const d = deps();
    const person = await createPerson(d)({
      email: "nueva@almg.gt",
      role: "member",
      permissionKeys: ["access:read", "access:read"] as PermissionKey[],
      actor,
    });

    expect([...(await d.users.listPermissions(person.id))]).toHaveLength(1);
  });
});

describe("createPerson — guardas comunes", () => {
  it("rechaza un correo ya registrado, en cualquier capitalización (FR-004, FR-006)", async () => {
    const d = deps();
    d.users.seed(aUser({ id: userId("u_x"), email: email("ocupado@almg.gt") }));

    await expect(
      createPerson(d)({
        email: "OCUPADO@ALMG.GT",
        role: "member",
        permissionKeys: ["access:read"] as PermissionKey[],
        actor,
      }),
    ).rejects.toThrow(EmailAlreadyRegisteredError);
  });

  it("compensa borrando la identidad si falla la escritura local (FR-007)", async () => {
    const d = deps();
    d.users.failOnCreate = true;

    await expect(
      createPerson(d)({ email: "nueva@almg.gt", role: "admin", permissionKeys: [], actor }),
    ).rejects.toThrow();

    expect(d.identity.deleted).toHaveLength(1);
  });
});
