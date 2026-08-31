import { beforeEach, describe, expect, it } from "vitest";
import { registerStudent } from "@/modules/students/application/use-cases/register-student";
import { InvalidDocumentIdError } from "@/modules/students/domain/errors";
import { InMemoryStudentRepository } from "./doubles";

const clock = { now: () => new Date("2026-02-05T12:00:00.000Z") };

const input = {
  documentId: "2547854120101",
  firstNames: "Ixchel María",
  lastNames: "Sotz' Ajpop",
  sex: "female" as const,
  municipalityCode: "0406",
};

describe("alta de estudiante (FR-037, FR-038)", () => {
  let students: InMemoryStudentRepository;

  beforeEach(() => {
    students = new InMemoryStudentRepository();
  });

  it("crea el estudiante la primera vez", async () => {
    const student = await registerStudent({ students, clock })(input);

    expect(student.documentId).toBe("2547854120101");
    expect(student.createdAt).toEqual(new Date("2026-02-05T12:00:00.000Z"));
    expect(students.rows).toHaveLength(1);
  });

  it("reutiliza el estudiante cuando el DPI ya existe", async () => {
    const first = await registerStudent({ students, clock })(input);
    const second = await registerStudent({ students, clock })(input);

    expect(second.id).toBe(first.id);
    expect(students.rows).toHaveLength(1);
  });

  it("no sobrescribe nombre ni municipio de un estudiante existente", async () => {
    await registerStudent({ students, clock })(input);
    const again = await registerStudent({ students, clock })({
      ...input,
      firstNames: "Otro Nombre",
      municipalityCode: "0101",
    });

    expect(again.firstNames).toBe("Ixchel María");
    expect(again.municipalityCode).toBe("0406");
  });

  it("normaliza el DPI escrito con espacios o guiones", async () => {
    const student = await registerStudent({ students, clock })({
      ...input,
      documentId: "2547 85412-0101",
    });

    expect(student.documentId).toBe("2547854120101");
  });

  it("rechaza un DPI que no tiene 13 dígitos", async () => {
    await expect(
      registerStudent({ students, clock })({ ...input, documentId: "12345" }),
    ).rejects.toThrow(InvalidDocumentIdError);
  });
});
