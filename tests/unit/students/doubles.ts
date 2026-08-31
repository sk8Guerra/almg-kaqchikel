import type {
  NewStudent,
  StudentRepository,
} from "@/modules/students/application/ports/student-repository";
import type { Student, StudentRecord, StudentsFilter } from "@/modules/students/domain/student";
import { fullNameOf } from "@/modules/students/domain/student";
import type { PlaceCatalog } from "@/modules/students/application/ports/place-catalog";
import type { DocumentId } from "@/modules/students/domain/values";

export class InMemoryStudentRepository implements StudentRepository {
  readonly rows: Student[] = [];
  private sequence = 0;
  private submissionCounts = new Map<string, number>();

  setSubmissionCount(id: string, count: number): void {
    this.submissionCounts.set(id, count);
  }

  private toRecord(student: Student): StudentRecord {
    return {
      id: student.id,
      documentId: student.documentId,
      firstNames: student.firstNames,
      lastNames: student.lastNames,
      sex: student.sex,
      municipalityCode: student.municipalityCode,
      submissionCount: this.submissionCounts.get(student.id) ?? 0,
    };
  }

  async findByDocumentId(id: DocumentId): Promise<Student | null> {
    return this.rows.find((row) => row.documentId === id) ?? null;
  }

  async findById(id: string): Promise<Student | null> {
    return this.rows.find((row) => row.id === id) ?? null;
  }

  async create(input: NewStudent): Promise<Student> {
    this.sequence += 1;
    const created: Student = {
      id: `stu-${this.sequence}`,
      documentId: input.documentId,
      firstNames: input.firstNames,
      lastNames: input.lastNames,
      sex: input.sex,
      municipalityCode: input.municipalityCode,
      createdAt: input.now,
    };
    this.rows.push(created);
    return created;
  }

  async list(filter: StudentsFilter): Promise<StudentRecord[]> {
    const search = filter.search?.trim().toLowerCase();
    return this.rows
      .filter((row) =>
        search
          ? fullNameOf(row).toLowerCase().includes(search) || row.documentId.includes(search)
          : true,
      )
      .sort((a, b) => a.lastNames.localeCompare(b.lastNames))
      .map((row) => this.toRecord(row));
  }

  async recordById(id: string): Promise<StudentRecord | null> {
    const found = this.rows.find((row) => row.id === id);
    return found ? this.toRecord(found) : null;
  }
}

export const stubPlaces: PlaceCatalog = {
  find: (code) =>
    code === "0406"
      ? { municipalityName: "Tecpán Guatemala", departmentName: "Chimaltenango" }
      : null,
};
