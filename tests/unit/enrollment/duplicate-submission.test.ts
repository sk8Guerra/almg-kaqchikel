import { beforeEach, describe, expect, it } from "vitest";
import { submitEnrollment } from "@/modules/enrollment/application/use-cases/submit-enrollment";
import { templateByCode } from "@/modules/enrollment/domain/form-template";
import { AlreadyEnrolledError } from "@/modules/enrollment/domain/errors";
import {
  InMemoryFileStore,
  InMemoryOfferingRepository,
  InMemorySubmissionRepository,
  StubStudentRegistry,
  VALID_ANSWERS,
  documentKeys,
  fixedClock,
} from "./doubles";

const template = templateByCode("l1-principiante");
const clock = fixedClock("2026-02-05T12:00:00.000Z");

describe("inscripción duplicada (FR-035, FR-036, FR-039, FR-040)", () => {
  let offerings: InMemoryOfferingRepository;
  let submissions: InMemorySubmissionRepository;
  let students: StubStudentRegistry;
  let files: InMemoryFileStore;

  const submit = () => submitEnrollment({ offerings, submissions, students, files, clock });

  const inputFor = (offeringId: string, draftId: string) => {
    for (const { key } of documentKeys(draftId, template)) files.put(key);
    return {
      offeringId,
      draftId,
      answers: VALID_ANSWERS,
      documents: documentKeys(draftId, template),
    };
  };

  beforeEach(() => {
    offerings = new InMemoryOfferingRepository();
    submissions = new InMemorySubmissionRepository();
    students = new StubStudentRegistry();
    files = new InMemoryFileStore();
  });

  it("el segundo envío desde otro dispositivo se rechaza igual", async () => {
    const offering = offerings.seed({ templateCode: "l1-principiante" });

    await submit()(inputFor(offering.id, "draft-primer-envio"));

    await expect(submit()(inputFor(offering.id, "draft-otro-navegador"))).rejects.toThrow(
      AlreadyEnrolledError,
    );
    expect(submissions.rows).toHaveLength(1);
  });

  it("el mismo DPI se inscribe en la convocatoria del año siguiente", async () => {
    const thisYear = offerings.seed({ templateCode: "l1-principiante", year: 2026 });
    const nextYear = offerings.seed({
      templateCode: "l1-principiante",
      year: 2027,
      opensAt: new Date("2026-01-01T06:00:00.000Z"),
      closesAt: new Date("2026-12-31T06:00:00.000Z"),
    });

    const first = await submit()(inputFor(thisYear.id, "draft-anio-2026"));
    const second = await submit()(inputFor(nextYear.id, "draft-anio-2027"));

    expect(second.studentId).toBe(first.studentId);
    expect(submissions.rows).toHaveLength(2);
  });

  it("el mismo DPI se inscribe en otro curso de la misma temporada", async () => {
    const beginner = offerings.seed({ templateCode: "l1-principiante" });
    const otherCourse = offerings.seed({
      templateCode: "l1-principiante",
      municipalityCode: "0401",
    });

    await submit()(inputFor(beginner.id, "draft-curso-uno"));
    await expect(submit()(inputFor(otherCourse.id, "draft-curso-dos"))).resolves.toBeTruthy();
  });

  it("la restricción es por convocatoria, no por persona", async () => {
    const offering = offerings.seed({ templateCode: "l1-principiante" });
    await submit()(inputFor(offering.id, "draft-persona-uno"));

    const otherPerson = {
      ...inputFor(offering.id, "draft-persona-dos"),
      answers: { ...VALID_ANSWERS, document_id: "1122334455667" },
    };

    await expect(submit()(otherPerson)).resolves.toBeTruthy();
    expect(submissions.rows).toHaveLength(2);
  });
});
