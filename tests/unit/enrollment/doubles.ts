import type { Clock } from "@/shared/clock";
import type { Answers } from "@/modules/enrollment/domain/answers";
import type {
  FormTemplateDefinition,
  TemplateCode,
} from "@/modules/enrollment/domain/form-template";
import { offeringStatus } from "@/modules/enrollment/domain/offering";
import type { Offering } from "@/modules/enrollment/domain/offering";
import { AlreadyEnrolledError } from "@/modules/enrollment/domain/errors";
import type { AgeRange, EthnicGroup, Modality, Sex } from "@/modules/enrollment/domain/values";
import type {
  NewOffering,
  OfferingFilter,
  OfferingPatch,
  OfferingRecord,
  OfferingRepository,
} from "@/modules/enrollment/application/ports/offering-repository";
import type { PlaceCatalog } from "@/modules/enrollment/application/ports/place-catalog";
import type { TemplateRepository } from "@/modules/enrollment/application/ports/template-repository";
import type {
  EnrollmentSummary,
  NewSubmission,
  SubmissionDetail,
  SubmissionFilter,
  SubmissionRepository,
  SubmissionSummary,
} from "@/modules/enrollment/application/ports/submission-repository";
import type {
  StudentIdentity,
  StudentRegistry,
} from "@/modules/enrollment/application/ports/student-registry";
import type {
  FileContent,
  FileStore,
  StoredFile,
  UploadTicket,
} from "@/modules/enrollment/application/ports/file-store";
import type { DocumentType } from "@/modules/enrollment/domain/values";

export const fixedClock = (iso: string): Clock => ({ now: () => new Date(iso) });

export const VALID_ANSWERS: Answers = {
  modality_commitment: "yes",
  email: "ixchel@example.com",
  first_names: "Ixchel María",
  last_names: "Sotz' Ajpop",
  document_id: "2547854120101",
  institution_name: "Escuela Oficial Rural Mixta",
  institution_address: "Cantón Xetonox",
  institution_department: "04",
  institution_municipality: "0406",
  residence_department: "04",
  residence_municipality: "0406",
  residence_zone: "",
  home_address: "Calle principal, Aldea El Tesoro",
  phone: "50801234",
  sex: "female",
  ethnic_group: "maya",
  nationality: "Guatemalteca",
  age_range: "from_31_to_60",
  disability: "no",
  occupation: "Docente",
  mother_tongue: "Kaqchikel",
  second_language: "Castellano",
  kaqchikel_proficiency: "speaks_reads",
};

type StoredOffering = Offering;

export const stubPlaces: PlaceCatalog = {
  find: (code) =>
    code === "0406"
      ? { municipalityName: "Tecpán Guatemala", departmentName: "Chimaltenango" }
      : null,
};

export class InMemoryOfferingRepository implements OfferingRepository {
  private offerings: StoredOffering[] = [];
  private statusClock = new Date("2026-02-05T12:00:00.000Z");
  private sequence = 0;
  private counts = new Map<string, number>();

  seed(offering: Partial<Offering> & { id?: string }): Offering {
    this.sequence += 1;
    const created: StoredOffering = {
      id: offering.id ?? `off-${this.sequence}`,
      templateCode: offering.templateCode ?? "l2-avanzado",
      year: offering.year ?? 2026,
      municipalityCode: offering.municipalityCode ?? "0406",
      modality: offering.modality ?? "virtual",
      opensAt: offering.opensAt ?? new Date("2026-02-01T06:00:00.000Z"),
      closesAt: offering.closesAt ?? new Date("2026-02-15T06:00:00.000Z"),
      classesStartOn: offering.classesStartOn ?? null,
      scheduleLabel: offering.scheduleLabel ?? "Martes de 14:00 a 16:30 horas",
      isActive: offering.isActive ?? true,
      createdById: offering.createdById ?? "user-1",
    };
    this.offerings.push(created);
    return created;
  }

  setSubmissionCount(id: string, count: number): void {
    this.counts.set(id, count);
  }

  private toRecord(offering: StoredOffering): OfferingRecord {
    return { ...offering, submissionCount: this.counts.get(offering.id) ?? 0 };
  }

  async create(input: NewOffering): Promise<Offering> {
    return this.seed({ ...input });
  }

  async update(id: string, patch: OfferingPatch): Promise<Offering> {
    const index = this.offerings.findIndex((o) => o.id === id);
    const current = this.offerings[index];
    const updated: StoredOffering = {
      ...current,
      opensAt: patch.opensAt ?? current.opensAt,
      closesAt: patch.closesAt ?? current.closesAt,
      classesStartOn:
        patch.classesStartOn === undefined ? current.classesStartOn : patch.classesStartOn,
      scheduleLabel:
        patch.scheduleLabel === undefined ? current.scheduleLabel : patch.scheduleLabel,
      modality: patch.modality ?? current.modality,
    };
    this.offerings[index] = updated;
    return updated;
  }

  async setActive(id: string, isActive: boolean): Promise<void> {
    const index = this.offerings.findIndex((o) => o.id === id);
    if (index >= 0) this.offerings[index] = { ...this.offerings[index], isActive };
  }

  async findById(id: string): Promise<Offering | null> {
    return this.offerings.find((o) => o.id === id) ?? null;
  }

  async findRecordById(id: string): Promise<OfferingRecord | null> {
    const found = this.offerings.find((o) => o.id === id);
    return found ? this.toRecord(found) : null;
  }

  async list(filter: OfferingFilter): Promise<OfferingRecord[]> {
    return this.offerings
      .filter((o) => (filter.year ? o.year === filter.year : true))
      .filter((o) => (filter.templateCode ? o.templateCode === filter.templateCode : true))
      .filter((o) => (filter.status ? offeringStatus(o, this.statusClock) === filter.status : true))
      .map((o) => this.toRecord(o));
  }

  async listOpen(now: Date): Promise<OfferingRecord[]> {
    return this.offerings
      .filter((o) => offeringStatus(o, now) === "open")
      .map((o) => this.toRecord(o));
  }

  async countSubmissions(id: string): Promise<number> {
    return this.counts.get(id) ?? 0;
  }

  async existsFor(input: {
    templateCode: TemplateCode;
    year: number;
    municipalityCode: string;
    modality: Modality;
  }): Promise<boolean> {
    return this.offerings.some(
      (o) =>
        o.templateCode === input.templateCode &&
        o.year === input.year &&
        o.municipalityCode === input.municipalityCode &&
        o.modality === input.modality,
    );
  }
}

export class InMemoryTemplateRepository implements TemplateRepository {
  readonly rows = new Map<string, FormTemplateDefinition>();

  async upsertByCode(definition: FormTemplateDefinition): Promise<void> {
    this.rows.set(definition.code, definition);
  }

  async idByCode(code: TemplateCode): Promise<string | null> {
    return this.rows.has(code) ? `tpl-${code}` : null;
  }
}

type StoredSubmission = NewSubmission & { readonly id: string };

export class InMemorySubmissionRepository implements SubmissionRepository {
  readonly rows: StoredSubmission[] = [];
  private sequence = 0;

  private toSummary(row: StoredSubmission): SubmissionSummary {
    return {
      id: row.id,
      offeringId: row.offeringId,
      templateCode: "l2-avanzado",
      templateName: "Kaqchikel L2 — Avanzado",
      year: 2026,
      modality: "virtual",
      municipalityCode: "0406",
      studentId: row.studentId,
      fullName: `${row.answers.first_names} ${row.answers.last_names}`,
      documentId: row.answers.document_id ?? "",
      submittedAt: row.submittedAt,
    };
  }

  async record(input: NewSubmission): Promise<SubmissionSummary> {
    const duplicate = this.rows.some(
      (row) => row.offeringId === input.offeringId && row.studentId === input.studentId,
    );
    if (duplicate) throw new AlreadyEnrolledError();

    this.sequence += 1;
    const created = { ...input, id: `sub-${this.sequence}` };
    this.rows.push(created);
    return this.toSummary(created);
  }

  async findById(id: string): Promise<SubmissionDetail | null> {
    const row = this.rows.find((r) => r.id === id);
    if (!row) return null;
    return {
      ...this.toSummary(row),
      answers: row.answers,
      documents: row.documents.map((d) => ({
        type: d.type,
        contentType: d.contentType,
        sizeBytes: d.sizeBytes,
      })),
    };
  }

  async findDocument(
    submissionId: string,
    type: DocumentType,
  ): Promise<{ storageKey: string; contentType: string } | null> {
    const row = this.rows.find((r) => r.id === submissionId);
    const document = row?.documents.find((d) => d.type === type);
    return document ? { storageKey: document.storageKey, contentType: document.contentType } : null;
  }

  private matching(filter: SubmissionFilter): StoredSubmission[] {
    return this.rows
      .filter((row) => (filter.offeringId ? row.offeringId === filter.offeringId : true))
      .filter((row) => (filter.studentId ? row.studentId === filter.studentId : true));
  }

  async list(filter: SubmissionFilter): Promise<SubmissionSummary[]> {
    return this.matching(filter).map((row) => this.toSummary(row));
  }

  async listDetailed(filter: SubmissionFilter): Promise<SubmissionDetail[]> {
    const details = await Promise.all(
      this.matching(filter).map((row) => this.findById(row.id) as Promise<SubmissionDetail>),
    );
    return details;
  }

  async summarize(filter: SubmissionFilter): Promise<EnrollmentSummary> {
    const rows = this.matching(filter);
    const count = <T extends string>(values: readonly T[], of: (row: StoredSubmission) => T) =>
      Object.fromEntries(
        values.map((value) => [value, rows.filter((row) => of(row) === value).length]),
      ) as Record<T, number>;

    return {
      total: rows.length,
      bySex: count<Sex>(["female", "male"], (row) => row.answers.sex as Sex),
      byAgeRange: count<AgeRange>(
        ["from_14_to_30", "from_31_to_60", "over_60"],
        (row) => row.ageRange,
      ),
      byEthnicGroup: count<EthnicGroup>(
        ["maya", "garifuna", "xinka", "ladino", "other"],
        (row) => row.ethnicGroup,
      ),
      byModality: count<Modality>(["virtual", "in_person"], () => "virtual"),
      byMunicipality: [{ code: "0406", count: rows.length }],
      byTemplate: [{ code: "l2-avanzado", name: "Kaqchikel L2 — Avanzado", count: rows.length }],
    };
  }
}

export class StubStudentRegistry implements StudentRegistry {
  readonly calls: StudentIdentity[] = [];
  private byDocument = new Map<string, string>();
  private sequence = 0;

  async ensure(identity: StudentIdentity): Promise<{ id: string }> {
    this.calls.push(identity);
    const existing = this.byDocument.get(identity.documentId);
    if (existing) return { id: existing };
    this.sequence += 1;
    const id = `stu-${this.sequence}`;
    this.byDocument.set(identity.documentId, id);
    return { id };
  }
}

export class InMemoryFileStore implements FileStore {
  readonly files = new Map<string, StoredFile>();
  readonly removed: string[] = [];

  put(key: string, file: Partial<StoredFile> = {}): void {
    this.files.set(key, {
      key,
      contentType: file.contentType ?? "application/pdf",
      sizeBytes: file.sizeBytes ?? 1024,
    });
  }

  async createUploadTicket(input: {
    key: string;
    contentType: string;
    maxBytes: number;
    expiresAt: Date;
  }): Promise<UploadTicket> {
    return {
      key: input.key,
      url: `https://storage.test/${input.key}`,
      method: "PUT",
      headers: { "content-type": input.contentType },
      expiresAt: input.expiresAt,
    };
  }

  async confirm(key: string): Promise<StoredFile | null> {
    return this.files.get(key) ?? null;
  }

  async read(key: string): Promise<FileContent | null> {
    const file = this.files.get(key);
    if (!file) return null;
    return {
      body: new ReadableStream<Uint8Array>(),
      contentType: file.contentType,
      sizeBytes: file.sizeBytes,
    };
  }

  async remove(key: string): Promise<void> {
    this.removed.push(key);
    this.files.delete(key);
  }
}

export const documentKeys = (
  draftId: string,
  template: FormTemplateDefinition,
): readonly { type: DocumentType; key: string }[] =>
  template.documents.map((type) => ({ type, key: `drafts/${draftId}/${type}-abc.pdf` }));
