import type { StudentSummary, StudentsFilter } from "../../domain/student";
import type { StudentRepository } from "../ports/student-repository";
import type { PlaceCatalog } from "../ports/place-catalog";
import { toSummary } from "./student-view";

type Deps = { students: StudentRepository; places: PlaceCatalog };

export const listStudents =
  ({ students, places }: Deps) =>
  async (filter: StudentsFilter): Promise<StudentSummary[]> => {
    const records = await students.list(filter);
    return records.map((record) => toSummary(record, places));
  };
