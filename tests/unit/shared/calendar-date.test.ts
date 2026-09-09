import { describe, expect, it } from "vitest";
import { formatCalendarDate, fromCalendarDate, toCalendarDate } from "@/shared/calendar-date";

/**
 * El día 20 tiene que seguir siendo el 20 en la base, en el formulario y en pantalla. La
 * regresión que motivó este tipo: Prisma devolvía `@db.Date` a medianoche UTC y el
 * formateador lo llevaba a America/Guatemala, seis horas atrás, o sea el día 19.
 */
describe("fecha de calendario", () => {
  it("lee el día de una columna @db.Date sin moverlo", () => {
    expect(toCalendarDate(new Date("2026-09-20T00:00:00.000Z"))).toBe("2026-09-20");
  });

  it("guarda el día a medianoche UTC", () => {
    expect(fromCalendarDate("2026-09-20").toISOString()).toBe("2026-09-20T00:00:00.000Z");
  });

  it("da la vuelta completa sin perder el día", () => {
    for (const day of ["2026-01-01", "2026-09-20", "2026-12-31", "2028-02-29"]) {
      expect(toCalendarDate(fromCalendarDate(day))).toBe(day);
    }
  });

  it("muestra el mismo día que guarda", () => {
    expect(formatCalendarDate("2026-09-20")).toBe("20 de septiembre de 2026");
    expect(formatCalendarDate("2026-01-01")).toBe("1 de enero de 2026");
  });
});
