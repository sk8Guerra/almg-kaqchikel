import { describe, expect, it } from "vitest";
import {
  ACTIONS,
  ALL_PERMISSION_KEYS,
  MODULES,
  isKnownPermission,
} from "@/modules/access/domain/modules";

describe("catálogo de áreas", () => {
  it("genera las cuatro operaciones por área", () => {
    const areas = Object.keys(MODULES);

    expect(ALL_PERMISSION_KEYS).toHaveLength(areas.length * ACTIONS.length);
    for (const area of areas) {
      expect(ALL_PERMISSION_KEYS).toEqual(
        expect.arrayContaining(ACTIONS.map((action) => `${area}:${action}`)),
      );
    }
  });

  it("hoy existen tres áreas", () => {
    expect(Object.keys(MODULES)).toEqual(["access", "enrollment", "students"]);
  });

  it("reconoce claves del catálogo y rechaza las demás", () => {
    expect(isKnownPermission("access:read")).toBe(true);
    expect(isKnownPermission("enrollment:update")).toBe(true);
    expect(isKnownPermission("students:read")).toBe(true);
    expect(isKnownPermission("forms:read")).toBe(false);
    expect(isKnownPermission("access:raed")).toBe(false);
  });
});
