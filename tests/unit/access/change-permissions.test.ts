import { describe, expect, it } from "vitest";
import { changePermissions } from "@/modules/access/application/use-cases/change-permissions";
import { UnknownPermissionError } from "@/modules/access/domain/errors";
import { email, userId } from "@/modules/access/domain/values";
import type { PermissionKey } from "@/modules/access/domain/modules";
import { InMemoryAuditLog, InMemoryUserRepository, aUser, anAdmin, fixedClock } from "./doubles";

const clock = fixedClock("2026-08-19T10:00:00Z");
const actor = anAdmin();
const target = userId("u_target");

const setup = () => {
  const users = new InMemoryUserRepository();
  users.seed(actor);
  users.seed(aUser({ id: target, email: email("otra@almg.gt") }), ["access:read"]);
  return { users, audit: new InMemoryAuditLog(), clock };
};

describe("changePermissions (US3, FR-011…FR-013)", () => {
  it("concede un permiso nuevo", async () => {
    const d = setup();
    await changePermissions(d)({
      targetId: target,
      grant: ["enrollment:create"] as PermissionKey[],
      revoke: [],
      actor,
    });

    expect(await d.users.listPermissions(target)).toEqual(
      new Set(["access:read", "enrollment:create"]),
    );
  });

  it("retira un permiso y conserva los demás", async () => {
    const d = setup();
    await changePermissions(d)({
      targetId: target,
      grant: ["enrollment:create"] as PermissionKey[],
      revoke: ["access:read"] as PermissionKey[],
      actor,
    });

    expect(await d.users.listPermissions(target)).toEqual(new Set(["enrollment:create"]));
  });

  it("conceder dos veces no duplica (FR-012)", async () => {
    const d = setup();
    await changePermissions(d)({
      targetId: target,
      grant: ["access:read"] as PermissionKey[],
      revoke: [],
      actor,
    });

    expect([...(await d.users.listPermissions(target))]).toHaveLength(1);
  });

  it("retirar todo conserva la cuenta (FR-013)", async () => {
    const d = setup();
    await changePermissions(d)({
      targetId: target,
      grant: [],
      revoke: ["access:read"] as PermissionKey[],
      actor,
    });

    expect(await d.users.listPermissions(target)).toEqual(new Set());
    expect(await d.users.findById(target)).not.toBeNull();
  });

  it("rechaza claves fuera del catálogo", async () => {
    const d = setup();
    await expect(
      changePermissions(d)({
        targetId: target,
        grant: ["forms:read"] as unknown as PermissionKey[],
        revoke: [],
        actor,
      }),
    ).rejects.toThrow(UnknownPermissionError);
  });
});
