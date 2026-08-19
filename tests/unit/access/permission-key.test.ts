import { describe, expect, it } from "vitest";
import { ALL_PERMISSION_KEYS, MODULES, isKnownPermission } from "@/modules/access/domain/modules";

describe("catálogo de áreas", () => {
  it("genera las cuatro operaciones por área", () => {
    expect(ALL_PERMISSION_KEYS).toEqual([
      "access:read",
      "access:create",
      "access:update",
      "access:delete",
    ]);
  });

  it("hoy existe exactamente un área", () => {
    expect(Object.keys(MODULES)).toEqual(["access"]);
  });

  it("reconoce claves del catálogo y rechaza las demás", () => {
    expect(isKnownPermission("access:read")).toBe(true);
    expect(isKnownPermission("forms:read")).toBe(false);
    expect(isKnownPermission("access:raed")).toBe(false);
  });
});
