import type { Clock } from "@/shared/clock";
import type { Student } from "../../domain/student";
import { documentId as toDocumentId } from "../../domain/values";
import type { Sex } from "../../domain/values";
import type { StudentRepository } from "../ports/student-repository";

type Deps = { students: StudentRepository; clock: Clock };

type Input = {
  documentId: string;
  firstNames: string;
  lastNames: string;
  sex: Sex;
  municipalityCode: string;
};

export const registerStudent =
  ({ students, clock }: Deps) =>
  async (input: Input): Promise<Student> => {
    const identifier = toDocumentId(input.documentId);

    const existing = await students.findByDocumentId(identifier);
    if (existing) return existing;

    return students.create({
      documentId: identifier,
      firstNames: input.firstNames.trim(),
      lastNames: input.lastNames.trim(),
      sex: input.sex,
      municipalityCode: input.municipalityCode,
      now: clock.now(),
    });
  };
