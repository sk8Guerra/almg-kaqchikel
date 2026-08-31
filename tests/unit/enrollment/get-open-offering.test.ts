import { beforeEach, describe, expect, it } from "vitest";
import { getOpenOffering } from "@/modules/enrollment/application/use-cases/get-open-offering";
import { listOpenOfferings } from "@/modules/enrollment/application/use-cases/list-open-offerings";
import { OfferingNotFoundError, OfferingNotOpenError } from "@/modules/enrollment/domain/errors";
import { InMemoryOfferingRepository, fixedClock, stubPlaces } from "./doubles";

const clock = fixedClock("2026-02-05T12:00:00.000Z");

describe("convocatorias visibles al público (FR-015, FR-043)", () => {
  let offerings: InMemoryOfferingRepository;

  beforeEach(() => {
    offerings = new InMemoryOfferingRepository();
  });

  it("la cuadrícula solo muestra las abiertas hoy", async () => {
    const open = offerings.seed({ templateCode: "l1-principiante" });
    offerings.seed({
      templateCode: "l2-intermedio",
      opensAt: new Date("2026-06-01T06:00:00.000Z"),
      closesAt: new Date("2026-06-15T06:00:00.000Z"),
    });
    offerings.seed({ templateCode: "l2-avanzado", isActive: false });

    const visible = await listOpenOfferings({ offerings, places: stubPlaces, clock })();

    expect(visible.map((o) => o.id)).toEqual([open.id]);
    expect(visible[0]?.templateNameSpanish).toBe("Kaqchikel L1 — Principiante");
    expect(visible[0]?.scheduleLabel).toBe("Martes de 14:00 a 16:30 horas");
  });

  it("sin convocatorias abiertas la cuadrícula queda vacía", async () => {
    offerings.seed({ isActive: false });

    expect(await listOpenOfferings({ offerings, places: stubPlaces, clock })()).toEqual([]);
  });

  it("servir el formulario de una convocatoria inexistente falla", async () => {
    await expect(
      getOpenOffering({ offerings, places: stubPlaces, clock })("off-999"),
    ).rejects.toThrow(OfferingNotFoundError);
  });

  it("servir el formulario de una convocatoria programada o cerrada falla", async () => {
    const scheduled = offerings.seed({
      opensAt: new Date("2026-06-01T06:00:00.000Z"),
      closesAt: new Date("2026-06-15T06:00:00.000Z"),
    });
    const closed = offerings.seed({ isActive: false });

    await expect(
      getOpenOffering({ offerings, places: stubPlaces, clock })(scheduled.id),
    ).rejects.toThrow(OfferingNotOpenError);
    await expect(
      getOpenOffering({ offerings, places: stubPlaces, clock })(closed.id),
    ).rejects.toThrow(OfferingNotOpenError);
  });

  it("una convocatoria abierta entrega su plantilla completa", async () => {
    const offering = offerings.seed({ templateCode: "l2-intermedio" });

    const result = await getOpenOffering({ offerings, places: stubPlaces, clock })(offering.id);

    expect(result.template.code).toBe("l2-intermedio");
    expect(result.template.documents).toHaveLength(4);
    expect(result.offering.status).toBe("open");
  });
});
