import type { StudentSummary } from "../../domain/student";
import { StudentNotFoundError } from "../../domain/errors";
import type { StudentRepository } from "../ports/student-repository";
import type { PlaceCatalog } from "../ports/place-catalog";
import { toSummary } from "./student-view";

type Deps = { students: StudentRepository; places: PlaceCatalog };

export const getStudent =
  ({ students, places }: Deps) =>
  async (id: string): Promise<StudentSummary> => {
    const record = await students.recordById(id);
    if (!record) throw new StudentNotFoundError(id);
    return toSummary(record, places);
  };
