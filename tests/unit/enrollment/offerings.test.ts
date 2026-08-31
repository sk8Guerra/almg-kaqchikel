import { beforeEach, describe, expect, it } from "vitest";
import { createOffering } from "@/modules/enrollment/application/use-cases/create-offering";
import { updateOffering } from "@/modules/enrollment/application/use-cases/update-offering";
import { setOfferingActive } from "@/modules/enrollment/application/use-cases/set-offering-active";
import { listOfferings } from "@/modules/enrollment/application/use-cases/list-offerings";
import { listOpenOfferings } from "@/modules/enrollment/application/use-cases/list-open-offerings";
import {
  DuplicateOfferingError,
  InvalidOfferingWindowError,
  InvalidOfferingYearError,
  OfferingHasSubmissionsError,
  OfferingNotFoundError,
  UnknownTemplateError,
} from "@/modules/enrollment/domain/errors";
import { InMemoryOfferingRepository, fixedClock, stubPlaces } from "./doubles";

const clock = fixedClock("2026-02-05T12:00:00.000Z");

const input = {
  templateCode: "l1-principiante",
  year: 2026,
  municipalityCode: "0406",
  modality: "virtual" as const,
  opensAt: new Date("2026-02-01T06:00:00.000Z"),
  closesAt: new Date("2026-02-15T06:00:00.000Z"),
  scheduleLabel: "Martes de 14:00 a 16:30 horas",
  createdById: "user-1",
};

describe("administración de convocatorias (FR-007 a FR-016)", () => {
  let offerings: InMemoryOfferingRepository;

  beforeEach(() => {
    offerings = new InMemoryOfferingRepository();
  });

  it("crea una convocatoria para un año, municipio y modalidad", async () => {
    const offering = await createOffering({ offerings, clock })(input);

    expect(offering.templateCode).toBe("l1-principiante");
    expect(offering.isActive).toBe(true);
    expect(await listOpenOfferings({ offerings, places: stubPlaces, clock })()).toHaveLength(1);
  });

  it("rechaza una clave de plantilla desconocida", async () => {
    await expect(
      createOffering({ offerings, clock })({
        ...input,
        templateCode: "l3-experto",
      }),
    ).rejects.toThrow(UnknownTemplateError);
  });

  it("rechaza una ventana que cierra antes de abrir", async () => {
    await expect(
      createOffering({ offerings, clock })({
        ...input,
        opensAt: input.closesAt,
        closesAt: input.opensAt,
      }),
    ).rejects.toThrow(InvalidOfferingWindowError);
  });

  it("rechaza un año fuera de rango", async () => {
    await expect(createOffering({ offerings, clock })({ ...input, year: 2019 })).rejects.toThrow(
      InvalidOfferingYearError,
    );
  });

  it("rechaza duplicar el mismo grupo", async () => {
    await createOffering({ offerings, clock })(input);

    await expect(createOffering({ offerings, clock })(input)).rejects.toThrow(
      DuplicateOfferingError,
    );
  });

  it("permite el mismo curso en otra modalidad o municipio", async () => {
    await createOffering({ offerings, clock })(input);
    await createOffering({ offerings, clock })({
      ...input,
      modality: "in_person",
    });
    await createOffering({ offerings, clock })({
      ...input,
      municipalityCode: "0401",
    });

    expect(await listOfferings({ offerings, places: stubPlaces, clock })()).toHaveLength(3);
  });

  it("corrige la ventana de una convocatoria sin inscripciones", async () => {
    const offering = await createOffering({ offerings, clock })(input);

    const updated = await updateOffering({ offerings, clock })(offering.id, {
      closesAt: new Date("2026-02-20T06:00:00.000Z"),
    });

    expect(updated.closesAt).toEqual(new Date("2026-02-20T06:00:00.000Z"));
  });

  it("impide cambiar año, municipio o plantilla cuando ya hay inscripciones", async () => {
    const offering = await createOffering({ offerings, clock })(input);
    offerings.setSubmissionCount(offering.id, 3);

    await expect(updateOffering({ offerings, clock })(offering.id, { year: 2027 })).rejects.toThrow(
      OfferingHasSubmissionsError,
    );
    await expect(
      updateOffering({ offerings, clock })(offering.id, {
        municipalityCode: "0101",
      }),
    ).rejects.toThrow(OfferingHasSubmissionsError);
    await expect(
      updateOffering({ offerings, clock })(offering.id, {
        templateCode: "l2-avanzado",
      }),
    ).rejects.toThrow(OfferingHasSubmissionsError);
  });

  it("deja corregir la ventana aunque haya inscripciones", async () => {
    const offering = await createOffering({ offerings, clock })(input);
    offerings.setSubmissionCount(offering.id, 3);

    await expect(
      updateOffering({ offerings, clock })(offering.id, {
        closesAt: new Date("2026-02-25T06:00:00.000Z"),
      }),
    ).resolves.toBeTruthy();
  });

  it("el cierre manual saca la convocatoria de la cuadrícula pública al instante", async () => {
    const offering = await createOffering({ offerings, clock })(input);

    await setOfferingActive({ offerings })(offering.id, false);

    expect(await listOpenOfferings({ offerings, places: stubPlaces, clock })()).toEqual([]);
    const history = await listOfferings({ offerings, places: stubPlaces, clock })();
    expect(history).toHaveLength(1);
    expect(history[0]?.status).toBe("closed");
  });

  it("una convocatoria inexistente no se puede abrir ni cerrar", async () => {
    await expect(setOfferingActive({ offerings })("off-999", true)).rejects.toThrow(
      OfferingNotFoundError,
    );
  });

  it("el historial se puede filtrar por año, plantilla y estado", async () => {
    await createOffering({ offerings, clock })(input);
    await createOffering({ offerings, clock })({
      ...input,
      templateCode: "l2-avanzado",
      year: 2027,
      opensAt: new Date("2027-02-01T06:00:00.000Z"),
      closesAt: new Date("2027-02-15T06:00:00.000Z"),
    });

    expect(
      await listOfferings({ offerings, places: stubPlaces, clock })({ year: 2027 }),
    ).toHaveLength(1);
    expect(
      await listOfferings({ offerings, places: stubPlaces, clock })({
        templateCode: "l1-principiante",
      }),
    ).toHaveLength(1);
    expect(
      await listOfferings({ offerings, places: stubPlaces, clock })({ status: "open" }),
    ).toHaveLength(1);
    expect(
      await listOfferings({ offerings, places: stubPlaces, clock })({ status: "scheduled" }),
    ).toHaveLength(1);
  });
});
