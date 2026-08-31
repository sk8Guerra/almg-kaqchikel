import { beforeEach, describe, expect, it } from "vitest";
import { exportSubmissions } from "@/modules/enrollment/application/use-cases/export-submissions";
import { submitEnrollment } from "@/modules/enrollment/application/use-cases/submit-enrollment";
import { summarizeEnrollments } from "@/modules/enrollment/application/use-cases/summarize-enrollments";
import { templateByCode } from "@/modules/enrollment/domain/form-template";
import { BASE_QUESTIONS } from "@/modules/enrollment/domain/questions";
import {
  InMemoryFileStore,
  InMemoryOfferingRepository,
  InMemorySubmissionRepository,
  StubStudentRegistry,
  VALID_ANSWERS,
  documentKeys,
  fixedClock,
  stubPlaces,
} from "./doubles";

const template = templateByCode("l1-principiante");
const clock = fixedClock("2026-02-05T12:00:00.000Z");

describe("exportación y resumen (FR-050, FR-053, FR-054)", () => {
  let offerings: InMemoryOfferingRepository;
  let submissions: InMemorySubmissionRepository;
  let students: StubStudentRegistry;
  let files: InMemoryFileStore;
  let offeringId: string;

  const enroll = async (draftId: string, answers = VALID_ANSWERS) => {
    for (const { key } of documentKeys(draftId, template)) files.put(key);
    await submitEnrollment({ offerings, submissions, students, files, clock })({
      offeringId,
      draftId,
      answers,
      documents: documentKeys(draftId, template),
    });
  };

  beforeEach(async () => {
    offerings = new InMemoryOfferingRepository();
    submissions = new InMemorySubmissionRepository();
    students = new StubStudentRegistry();
    files = new InMemoryFileStore();
    offeringId = offerings.seed({ templateCode: "l1-principiante" }).id;

    await enroll("draft-uno");
    await enroll("draft-dos", {
      ...VALID_ANSWERS,
      document_id: "1122334455667",
      first_names: "B'alam",
      sex: "male",
      age_range: "over_60",
      ethnic_group: "ladino",
    });
  });

  it("el encabezado sale del orden de las preguntas de la plantilla", async () => {
    const result = await exportSubmissions({ submissions, places: stubPlaces })({});

    expect(result.headers).toHaveLength(7 + BASE_QUESTIONS.length);
    expect(result.headers.slice(0, 7)).toEqual([
      "Curso",
      "Año",
      "Modalidad",
      "Municipio de la convocatoria",
      "Fecha de envío",
      "Nombre completo",
      "DPI",
    ]);
    expect(result.headers[7]).toBe(BASE_QUESTIONS[0]?.labelSpanish);
  });

  it("cada fila alinea sus respuestas con el encabezado", async () => {
    const result = await exportSubmissions({ submissions, places: stubPlaces })({});

    expect(result.rows).toHaveLength(2);
    for (const row of result.rows) {
      expect(row).toHaveLength(result.headers.length);
    }
    const sexColumn = result.headers.indexOf("Sexo");
    expect(result.rows[0]?.[sexColumn]).toBe("Femenino");
    expect(result.rows[1]?.[sexColumn]).toBe("Masculino");
  });

  it("el resumen suma el total en cada desglose", async () => {
    const summary = await summarizeEnrollments({ submissions, places: stubPlaces })({});

    expect(summary.total).toBe(2);
    expect(summary.bySex.female + summary.bySex.male).toBe(summary.total);
    expect(Object.values(summary.byAgeRange).reduce((a, b) => a + b, 0)).toBe(summary.total);
    expect(Object.values(summary.byEthnicGroup).reduce((a, b) => a + b, 0)).toBe(summary.total);
    expect(summary.byAgeRange.over_60).toBe(1);
    expect(summary.byEthnicGroup.ladino).toBe(1);
  });

  it("acotar a una convocatoria vacía deja el resumen en cero", async () => {
    const other = offerings.seed({ templateCode: "l2-avanzado" }).id;

    const summary = await summarizeEnrollments({ submissions, places: stubPlaces })({
      offeringId: other,
    });

    expect(summary.total).toBe(0);
  });
});
