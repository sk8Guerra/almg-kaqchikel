import { describe, expect, it } from "vitest";
import {
  localDate,
  localDateField,
  localDateTime,
  localDateTimeFields,
} from "@/app/panel/inscripciones/convocatorias/local-time";

/**
 * El formulario de convocatorias habla en hora de Guatemala y el dominio en instantes.
 * Las horas de los extremos son las que delatan una implementación que lee con los getters
 * locales: 23:59 en Guatemala ya es el día siguiente en UTC.
 */
describe("hora local de Guatemala", () => {
  it("interpreta fecha y hora como hora de Guatemala", () => {
    expect(localDateTime("2026-03-01", "08:00").toISOString()).toBe("2026-03-01T14:00:00.000Z");
    expect(localDate("2026-03-01")?.toISOString()).toBe("2026-03-01T06:00:00.000Z");
    expect(localDate(null)).toBeNull();
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

  it("traduce la ausencia de fecha al vacío que entiende el input", () => {
    expect(localDateField(null)).toBe("");
    expect(localDateField(localDate("2026-04-20"))).toBe("2026-04-20");
  });
});
