import { describe, expect, it } from "vitest";
import {
  ALL_PERMISSION_KEYS,
  MODULES,
  actionsFor,
  isKnownPermission,
} from "@/modules/access/domain/modules";

describe("catálogo de áreas", () => {
  it("hoy existen tres áreas", () => {
    expect(Object.keys(MODULES)).toEqual(["access", "enrollment", "students"]);
  });

  /**
   * FR-018, FR-019. Dar de alta, cambiar roles, conceder permisos y desactivar cuentas es
   * autoridad del rol de administración. Si estas claves fueran concedibles, la matriz
   * ofrecería permisos que se guardan y no habilitan nada.
   */
  it("personas solo concede ver: esa autoridad no es concedible", () => {
    expect(actionsFor("access")).toEqual(["read"]);
    expect(isKnownPermission("access:create")).toBe(false);
    expect(isKnownPermission("access:update")).toBe(false);
    expect(isKnownPermission("access:delete")).toBe(false);
  });

  /**
   * Aquí el motivo es otro: la operación no existe todavía. Vuelve al catálogo el día que
   * llegue la pantalla que protege, y no antes.
   */
  it("solo declara las operaciones que el sistema sabe hacer", () => {
    expect(actionsFor("enrollment")).toEqual(["read", "create", "update"]);
    expect(actionsFor("students")).toEqual(["read"]);
    expect(isKnownPermission("enrollment:delete")).toBe(false);
    expect(isKnownPermission("students:create")).toBe(false);
    expect(isKnownPermission("students:update")).toBe(false);
    expect(isKnownPermission("students:delete")).toBe(false);
  });

  it("no ofrece más claves que las concedibles", () => {
    expect([...ALL_PERMISSION_KEYS]).toEqual([
      "access:read",
      "enrollment:read",
      "enrollment:create",
      "enrollment:update",
      "students:read",
    ]);
  });

  it("reconoce claves del catálogo y rechaza las demás", () => {
    expect(isKnownPermission("access:read")).toBe(true);
    expect(isKnownPermission("enrollment:update")).toBe(true);
    expect(isKnownPermission("students:read")).toBe(true);
    expect(isKnownPermission("forms:read")).toBe(false);
    expect(isKnownPermission("access:raed")).toBe(false);
  });
});
