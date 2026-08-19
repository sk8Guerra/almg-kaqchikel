import { describe, expect, it } from "vitest";
import { grants, requireAdmin } from "@/modules/access/domain/authorization";
import { AdminRequiredError } from "@/modules/access/domain/errors";
import type { PermissionKey } from "@/modules/access/domain/modules";

const admin = { role: "admin" as const };
const member = { role: "member" as const };
const none = new Set<PermissionKey>();

describe("grants — la autoridad del administrador no se enumera (FR-005, FR-006)", () => {
  it("un admin obtiene true sin tener ningún permiso concedido", () => {
    expect(grants(admin, none, "access:read")).toBe(true);
    expect(grants(admin, none, "access:delete")).toBe(true);
  });

  it("un member sin permisos obtiene false siempre (FR-008)", () => {
    expect(grants(member, none, "access:read")).toBe(false);
    expect(grants(member, none, "access:create")).toBe(false);
  });

  it("un member obtiene true solo para lo concedido", () => {
    const granted = new Set<PermissionKey>(["access:read"]);
    expect(grants(member, granted, "access:read")).toBe(true);
    expect(grants(member, granted, "access:update")).toBe(false);
  });
});

describe("requireAdmin — la capacidad de administrar no es un permiso (FR-018, FR-019)", () => {
  it("deja pasar a un admin", () => {
    expect(() => requireAdmin(admin)).not.toThrow();
  });

  it("rechaza a un member aunque tenga permisos", () => {
    expect(() => requireAdmin(member)).toThrow(AdminRequiredError);
  });
});
