import { beforeEach, describe, expect, it } from "vitest";
import { getStudent } from "@/modules/students/application/use-cases/get-student";
import { listStudents } from "@/modules/students/application/use-cases/list-students";
import { registerStudent } from "@/modules/students/application/use-cases/register-student";
import { StudentNotFoundError } from "@/modules/students/domain/errors";
import { InMemoryStudentRepository, stubPlaces } from "./doubles";

const clock = { now: () => new Date("2026-02-05T12:00:00.000Z") };

describe("padrón de estudiantes (FR-051, FR-052)", () => {
  let students: InMemoryStudentRepository;

  beforeEach(async () => {
    students = new InMemoryStudentRepository();
    await registerStudent({ students, clock })({
      documentId: "2547854120101",
      firstNames: "Ixchel María",
      lastNames: "Sotz' Ajpop",
      sex: "female",
      municipalityCode: "0406",
    });
    await registerStudent({ students, clock })({
      documentId: "1122334455667",
      firstNames: "B'alam",
      lastNames: "Chumil",
      sex: "male",
      municipalityCode: "0406",
    });
  });

  it("una persona inscrita dos veces aparece una sola vez", async () => {
    await registerStudent({ students, clock })({
      documentId: "2547854120101",
      firstNames: "Ixchel María",
      lastNames: "Sotz' Ajpop",
      sex: "female",
      municipalityCode: "0406",
    });

    const padron = await listStudents({ students, places: stubPlaces })({});

    expect(padron).toHaveLength(2);
  });

  it("el padrón se ordena por apellido y trae el conteo de inscripciones", async () => {
    const [first] = await listStudents({ students, places: stubPlaces })({});
    students.setSubmissionCount(first!.id, 2);

    const padron = await listStudents({ students, places: stubPlaces })({});

    expect(padron[0]?.fullName).toBe("B'alam Chumil");
    expect(padron[0]?.submissionCount).toBe(2);
  });

  it("busca por nombre y por documento", async () => {
    expect(await listStudents({ students, places: stubPlaces })({ search: "Chumil" })).toHaveLength(
      1,
    );
    expect(
      await listStudents({ students, places: stubPlaces })({ search: "2547854120101" }),
    ).toHaveLength(1);
    expect(await listStudents({ students, places: stubPlaces })({ search: "nadie" })).toHaveLength(
      0,
    );
  });

  it("un expediente inexistente no se puede abrir", async () => {
    await expect(getStudent({ students, places: stubPlaces })("stu-999")).rejects.toThrow(
      StudentNotFoundError,
    );
  });
});
