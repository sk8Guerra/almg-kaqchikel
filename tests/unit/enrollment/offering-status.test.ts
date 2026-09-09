import { describe, expect, it } from "vitest";
import {
  assertValidWindow,
  assertValidYear,
  offeringStatus,
} from "@/modules/enrollment/domain/offering";
import {
  InvalidOfferingWindowError,
  InvalidOfferingYearError,
} from "@/modules/enrollment/domain/errors";

const window = {
  opensAt: new Date("2026-02-01T06:00:00.000Z"),
  closesAt: new Date("2026-02-15T06:00:00.000Z"),
  isActive: true,
};

describe("estado derivado de la convocatoria (FR-008, FR-012, FR-014)", () => {
  it("antes de la apertura está programada", () => {
    expect(offeringStatus(window, new Date("2026-01-20T12:00:00.000Z"))).toBe("scheduled");
  });

  it("dentro de la ventana está abierta", () => {
    expect(offeringStatus(window, new Date("2026-02-05T12:00:00.000Z"))).toBe("open");
  });

  it("al llegar el cierre queda cerrada", () => {
    expect(offeringStatus(window, new Date("2026-02-15T06:00:00.000Z"))).toBe("closed");
    expect(offeringStatus(window, new Date("2026-02-20T12:00:00.000Z"))).toBe("closed");
  });

  it("el cierre manual gana sobre el calendario", () => {
    expect(
      offeringStatus({ ...window, isActive: false }, new Date("2026-02-05T12:00:00.000Z")),
    ).toBe("closed");
  });

  it("rechaza una ventana que cierra antes de abrir", () => {
    expect(() => assertValidWindow(window.closesAt, window.opensAt)).toThrow(
      InvalidOfferingWindowError,
    );
    expect(() => assertValidWindow(window.opensAt, window.opensAt)).toThrow(
      InvalidOfferingWindowError,
    );
    expect(() => assertValidWindow(window.opensAt, window.closesAt)).not.toThrow();
  });

  /**
   * Una fecha inválida da NaN y toda comparación con NaN es falsa, así que sin esta guarda
   * la ventana pasaba entera y el fallo aparecía después, al escribir en la base de datos.
   */
  it("rechaza una ventana con fechas inválidas", () => {
    const invalid = new Date("");

    expect(() => assertValidWindow(invalid, invalid)).toThrow(InvalidOfferingWindowError);
    expect(() => assertValidWindow(invalid, window.closesAt)).toThrow(InvalidOfferingWindowError);
    expect(() => assertValidWindow(window.opensAt, invalid)).toThrow(InvalidOfferingWindowError);
  });

  it("rechaza años fuera de rango", () => {
    const now = new Date("2026-08-27T12:00:00.000Z");
    expect(() => assertValidYear(2019, now)).toThrow(InvalidOfferingYearError);
    expect(() => assertValidYear(2029, now)).toThrow(InvalidOfferingYearError);
    expect(() => assertValidYear(2026, now)).not.toThrow();
    expect(() => assertValidYear(2028, now)).not.toThrow();
  });
});
