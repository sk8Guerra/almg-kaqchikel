import { describe, expect, it } from "vitest";
import { localDateTime, localDateTimeFields } from "@/app/panel/convocatorias/local-time";

/**
 * Apertura y cierre sí son instantes: el formulario los escribe en hora de Guatemala y el
 * dominio los guarda como un punto en el tiempo. Las horas de los extremos delatan una
 * implementación que lee con los getters locales: 23:59 en Guatemala ya es otro día en UTC.
 */
describe("hora local de Guatemala", () => {
  it("interpreta fecha y hora como hora de Guatemala", () => {
    expect(localDateTime("2026-03-01", "08:00").toISOString()).toBe("2026-03-01T14:00:00.000Z");
  });

  it("devuelve los mismos campos que recibió", () => {
    for (const [day, time] of [
      ["2026-03-01", "08:00"],
      ["2026-12-31", "23:59"],
      ["2026-01-01", "00:00"],
      ["2026-07-15", "14:30"],
    ]) {
      expect(localDateTimeFields(localDateTime(day, time))).toEqual({ day, time });
    }
  });

  it("no adelanta el día al cruzar la medianoche en UTC", () => {
    const lateNight = localDateTime("2026-12-31", "23:59");

    expect(lateNight.toISOString()).toBe("2027-01-01T05:59:00.000Z");
    expect(localDateTimeFields(lateNight).day).toBe("2026-12-31");
  });
});
