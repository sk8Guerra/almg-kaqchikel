import { describe, expect, it } from "vitest";
import {
  ALL_PERMISSION_KEYS,
  GRANTABLE_ACTIONS,
  MODULES,
  actionsFor,
  isKnownPermission,
} from "@/modules/access/domain/modules";

describe("catálogo de áreas", () => {
  it("hoy existen cuatro áreas", () => {
    expect(Object.keys(MODULES)).toEqual(["access", "offering", "enrollment", "students"]);
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
   * Una inscripción la crea el formulario público y nadie la edita después, así que crear,
   * editar y borrar no son de nadie. Ver el listado y descargar el DPI de alguien sí son
   * cosas distintas, y por eso `download` existe aparte.
   */
  it("inscripciones solo se ve y se descarga", () => {
    expect(actionsFor("enrollment")).toEqual(["read", "download"]);
    expect(isKnownPermission("enrollment:create")).toBe(false);
    expect(isKnownPermission("enrollment:update")).toBe(false);
    expect(isKnownPermission("enrollment:delete")).toBe(false);
  });

  /**
   * Aquí el motivo es otro: la operación no existe todavía. Vuelve al catálogo el día que
   * llegue la pantalla que protege, y no antes.
   */
  it("solo declara las operaciones que el sistema sabe hacer", () => {
    expect(actionsFor("offering")).toEqual(["read", "create", "update"]);
    expect(actionsFor("students")).toEqual(["read"]);
    expect(isKnownPermission("offering:delete")).toBe(false);
    expect(isKnownPermission("students:create")).toBe(false);
    expect(isKnownPermission("students:update")).toBe(false);
    expect(isKnownPermission("students:delete")).toBe(false);
  });

  /** Ninguna área ofrece borrar, así que la matriz no dibuja esa columna. */
  it("no ofrece columnas que nadie usa", () => {
    expect(GRANTABLE_ACTIONS).toEqual(["read", "create", "update", "download"]);
  });

  it("no ofrece más claves que las concedibles", () => {
    expect([...ALL_PERMISSION_KEYS]).toEqual([
      "access:read",
      "offering:read",
      "offering:create",
      "offering:update",
      "enrollment:read",
      "enrollment:download",
      "students:read",
    ]);
  });

  it("reconoce claves del catálogo y rechaza las demás", () => {
    expect(isKnownPermission("access:read")).toBe(true);
    expect(isKnownPermission("offering:update")).toBe(true);
    expect(isKnownPermission("enrollment:download")).toBe(true);
    expect(isKnownPermission("students:read")).toBe(true);
    expect(isKnownPermission("forms:read")).toBe(false);
    expect(isKnownPermission("access:raed")).toBe(false);
  });
});
