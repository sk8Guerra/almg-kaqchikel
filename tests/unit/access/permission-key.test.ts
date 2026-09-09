import { describe, expect, it } from "vitest";
import {
  ACTIONS,
  ALL_PERMISSION_KEYS,
  MODULES,
  actionsFor,
  isKnownPermission,
} from "@/modules/access/domain/modules";

describe("catálogo de áreas", () => {
  it("hoy existen tres áreas", () => {
    expect(Object.keys(MODULES)).toEqual(["access", "enrollment", "students"]);
  });

  it("las áreas operativas conceden las cuatro operaciones", () => {
    for (const area of ["enrollment", "students"] as const) {
      expect(actionsFor(area)).toEqual([...ACTIONS]);
      expect(ALL_PERMISSION_KEYS).toEqual(
        expect.arrayContaining(ACTIONS.map((action) => `${area}:${action}`)),
      );
    }
  });

  /**
   * FR-018, FR-019. Dar de alta, cambiar roles, conceder permisos y desactivar cuentas es
   * autoridad del rol de administración. Si estas claves fueran concedibles, la matriz
   * ofrecería permisos que se guardan y no habilitan nada.
   */
  it("personas solo concede ver: la autoridad sobre personas no es concedible", () => {
    expect(actionsFor("access")).toEqual(["read"]);
    expect(isKnownPermission("access:create")).toBe(false);
    expect(isKnownPermission("access:update")).toBe(false);
    expect(isKnownPermission("access:delete")).toBe(false);
  });

  it("no ofrece más claves que las concedibles", () => {
    expect(ALL_PERMISSION_KEYS).toHaveLength(1 + ACTIONS.length * 2);
  });

  it("reconoce claves del catálogo y rechaza las demás", () => {
    expect(isKnownPermission("access:read")).toBe(true);
    expect(isKnownPermission("enrollment:update")).toBe(true);
    expect(isKnownPermission("students:read")).toBe(true);
    expect(isKnownPermission("forms:read")).toBe(false);
    expect(isKnownPermission("access:raed")).toBe(false);
  });
});
