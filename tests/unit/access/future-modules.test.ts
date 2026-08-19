import { describe, expect, it } from "vitest";
import { grants } from "@/modules/access/domain/authorization";
import type { PermissionKey } from "@/modules/access/domain/modules";

/**
 * FR-007, SC-002. Un área que aún no existe en el catálogo se simula con una clave
 * que hoy no es válida. El administrador debe poder operarla igualmente, porque su
 * autoridad no consulta ninguna lista.
 */
const futureKey = "forms:create" as PermissionKey;

describe("áreas futuras (FR-007, SC-002)", () => {
  it("un administrador opera un área que no existía al crearlo, sin permisos concedidos", () => {
    expect(grants({ role: "admin" }, new Set(), futureKey)).toBe(true);
  });

  it("un miembro no gana nada al aparecer un área nueva", () => {
    const granted = new Set<PermissionKey>(["access:read"]);
    expect(grants({ role: "member" }, granted, futureKey)).toBe(false);
  });
});
