import { beforeEach, describe, expect, it } from "vitest";
import { submitEnrollment } from "@/modules/enrollment/application/use-cases/submit-enrollment";
import { templateByCode } from "@/modules/enrollment/domain/form-template";
import {
  AlreadyEnrolledError,
  InvalidAnswersError,
  InvalidDocumentError,
  MissingDocumentError,
  ModalityCommitmentRefusedError,
  OfferingNotFoundError,
  OfferingNotOpenError,
} from "@/modules/enrollment/domain/errors";
import {
  InMemoryFileStore,
  InMemoryOfferingRepository,
  InMemorySubmissionRepository,
  StubStudentRegistry,
  VALID_ANSWERS,
  documentKeys,
  fixedClock,
} from "./doubles";

const DRAFT = "draft-0001-abcd";
const template = templateByCode("l2-avanzado");
const clock = fixedClock("2026-02-05T12:00:00.000Z");

describe("envío de la inscripción (FR-023, FR-032 a FR-043)", () => {
  let offerings: InMemoryOfferingRepository;
  let submissions: InMemorySubmissionRepository;
  let students: StubStudentRegistry;
  let files: InMemoryFileStore;
  let offeringId: string;

  const submit = () => submitEnrollment({ offerings, submissions, students, files, clock });

  const input = (overrides: Record<string, unknown> = {}) => ({
    offeringId,
    draftId: DRAFT,
    answers: VALID_ANSWERS,
    documents: documentKeys(DRAFT, template),
    ...overrides,
  });

  beforeEach(() => {
    offerings = new InMemoryOfferingRepository();
    submissions = new InMemorySubmissionRepository();
    students = new StubStudentRegistry();
    files = new InMemoryFileStore();
    offeringId = offerings.seed({ templateCode: "l2-avanzado" }).id;
    for (const { key } of documentKeys(DRAFT, template)) files.put(key);
  });

  it("registra la inscripción y crea al estudiante en el mismo momento", async () => {
    const result = await submit()(input());

    expect(result.submissionId).toBeTruthy();
    expect(result.studentId).toBeTruthy();
    expect(students.calls).toHaveLength(1);
    expect(students.calls[0]?.documentId).toBe("2547854120101");
    expect(submissions.rows[0]?.submittedAt).toEqual(new Date("2026-02-05T12:00:00.000Z"));
    expect(submissions.rows[0]?.ageRange).toBe("from_31_to_60");
    expect(submissions.rows[0]?.ethnicGroup).toBe("maya");
    expect(submissions.rows[0]?.documents).toHaveLength(5);
  });

  it("rechaza una convocatoria inexistente", async () => {
    await expect(submit()(input({ offeringId: "off-999" }))).rejects.toThrow(OfferingNotFoundError);
  });

  it("rechaza el envío fuera de la ventana", async () => {
    const late = fixedClock("2026-03-05T12:00:00.000Z");
    await expect(
      submitEnrollment({ offerings, submissions, students, files, clock: late })(input()),
    ).rejects.toThrow(OfferingNotOpenError);
    expect(submissions.rows).toHaveLength(0);
  });

  it("rechaza el envío de una convocatoria cerrada a mano", async () => {
    await offerings.setActive(offeringId, false);
    await expect(submit()(input())).rejects.toThrow(OfferingNotOpenError);
  });

  it("no acepta la inscripción si el compromiso de modalidad es 'no'", async () => {
    const answers = { ...VALID_ANSWERS, modality_commitment: "no" };
    await expect(submit()(input({ answers }))).rejects.toThrow(ModalityCommitmentRefusedError);
    expect(submissions.rows).toHaveLength(0);
  });

  it("devuelve todas las respuestas inválidas de una sola vez", async () => {
    const answers = { ...VALID_ANSWERS, first_names: "", phone: "", email: "roto" };

    await expect(submit()(input({ answers }))).rejects.toThrow(InvalidAnswersError);
    await submit()(input({ answers })).catch((error: unknown) => {
      expect(error).toBeInstanceOf(InvalidAnswersError);
      expect((error as InvalidAnswersError).problems).toHaveLength(3);
    });
    expect(students.calls).toHaveLength(0);
  });

  it("exige los cinco documentos del nivel avanzado", async () => {
    const documents = documentKeys(DRAFT, template).slice(0, 4);
    await expect(submit()(input({ documents }))).rejects.toThrow(MissingDocumentError);
  });

  it("rechaza un adjunto que no está en el almacenamiento", async () => {
    files.files.delete(documentKeys(DRAFT, template)[0]!.key);
    await expect(submit()(input())).rejects.toThrow(InvalidDocumentError);
  });

  it("rechaza un adjunto que no es PDF o pesa de más", async () => {
    const first = documentKeys(DRAFT, template)[0]!.key;

    files.put(first, { contentType: "image/png" });
    await expect(submit()(input())).rejects.toThrow(InvalidDocumentError);

    files.put(first, { sizeBytes: 11 * 1024 * 1024 });
    await expect(submit()(input())).rejects.toThrow(InvalidDocumentError);
  });

  it("rechaza una clave que no pertenece a este borrador", async () => {
    const documents = documentKeys(DRAFT, template).map((document, index) =>
      index === 0 ? { ...document, key: "drafts/otro-borrador/identity_card.pdf" } : document,
    );
    files.put("drafts/otro-borrador/identity_card.pdf");

    await expect(submit()(input({ documents }))).rejects.toThrow(InvalidDocumentError);
  });

  it("reutiliza el estudiante cuando el mismo DPI se inscribe en otra convocatoria", async () => {
    const first = await submit()(input());
    const other = offerings.seed({ templateCode: "l2-avanzado", year: 2027 }).id;

    const second = await submit()(input({ offeringId: other }));

    expect(second.studentId).toBe(first.studentId);
    expect(submissions.rows).toHaveLength(2);
  });

  it("rechaza el segundo envío del mismo DPI a la misma convocatoria", async () => {
    await submit()(input());
    await expect(submit()(input())).rejects.toThrow(AlreadyEnrolledError);
    expect(submissions.rows).toHaveLength(1);
  });
});
