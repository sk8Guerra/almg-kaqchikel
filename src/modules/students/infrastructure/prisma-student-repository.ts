import type { PrismaClient } from "@generated/client/client";
import type { Student, StudentRecord, StudentsFilter } from "../domain/student";
import { documentId } from "../domain/values";
import type { DocumentId } from "../domain/values";
import type { NewStudent, StudentRepository } from "../application/ports/student-repository";

type StudentRow = {
  id: string;
  documentId: string;
  firstNames: string;
  lastNames: string;
  sex: "FEMALE" | "MALE";
  municipalityCode: string;
  createdAt: Date;
};

type RecordRow = StudentRow & { _count: { submissions: number } };

const toDomain = (row: StudentRow): Student => ({
  id: row.id,
  documentId: documentId(row.documentId),
  firstNames: row.firstNames,
  lastNames: row.lastNames,
  sex: row.sex === "FEMALE" ? "female" : "male",
  municipalityCode: row.municipalityCode,
  createdAt: row.createdAt,
});

const toRecord = (row: RecordRow): StudentRecord => ({
  id: row.id,
  documentId: row.documentId,
  firstNames: row.firstNames,
  lastNames: row.lastNames,
  sex: row.sex === "FEMALE" ? "female" : "male",
  municipalityCode: row.municipalityCode,
  submissionCount: row._count.submissions,
});

const recordInclude = { _count: { select: { submissions: true } } } as const;

export class PrismaStudentRepository implements StudentRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByDocumentId(id: DocumentId): Promise<Student | null> {
    const row = await this.db.student.findUnique({ where: { documentId: id } });
    return row ? toDomain(row) : null;
  }

  async findById(id: string): Promise<Student | null> {
    const row = await this.db.student.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async create(input: NewStudent): Promise<Student> {
    const row = await this.db.student.create({
      data: {
        documentId: input.documentId,
        firstNames: input.firstNames,
        lastNames: input.lastNames,
        sex: input.sex === "female" ? "FEMALE" : "MALE",
        municipalityCode: input.municipalityCode,
        createdAt: input.now,
        updatedAt: input.now,
      },
    });
    return toDomain(row);
  }

  async list(filter: StudentsFilter): Promise<StudentRecord[]> {
    const search = filter.search?.trim();
    const rows = await this.db.student.findMany({
      where: search
        ? {
            OR: [
              { firstNames: { contains: search, mode: "insensitive" } },
              { lastNames: { contains: search, mode: "insensitive" } },
              { documentId: { contains: search } },
            ],
          }
        : undefined,
      orderBy: [{ lastNames: "asc" }, { firstNames: "asc" }],
      include: recordInclude,
    });
    return rows.map(toRecord);
  }

  async recordById(id: string): Promise<StudentRecord | null> {
    const row = await this.db.student.findUnique({ where: { id }, include: recordInclude });
    return row ? toRecord(row) : null;
  }
}
