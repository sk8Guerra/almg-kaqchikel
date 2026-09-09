import { fromCalendarDate, toCalendarDate } from "@/shared/calendar-date";
import type { PrismaClient } from "@generated/client/client";
import { isTemplateCode } from "../domain/form-template";
import type { TemplateCode } from "../domain/form-template";
import { UnknownTemplateError } from "../domain/errors";
import type { Offering } from "../domain/offering";
import type { Modality } from "../domain/values";
import type {
  NewOffering,
  OfferingFilter,
  OfferingPatch,
  OfferingRecord,
  OfferingRepository,
} from "../application/ports/offering-repository";
import { modalityToDomain, modalityToRow } from "./prisma-enums";

type OfferingRow = {
  id: string;
  year: number;
  municipalityCode: string;
  modality: "VIRTUAL" | "IN_PERSON";
  opensAt: Date;
  closesAt: Date;
  classesStartOn: Date | null;
  scheduleLabel: string | null;
  isActive: boolean;
  createdById: string;
  formTemplate: { code: string };
};

type RecordRow = OfferingRow & { _count: { submissions: number } };

const recordInclude = {
  formTemplate: { select: { code: true } },
  _count: { select: { submissions: true } },
} as const;

const codeOf = (row: OfferingRow): TemplateCode => {
  if (!isTemplateCode(row.formTemplate.code)) throw new UnknownTemplateError(row.formTemplate.code);
  return row.formTemplate.code;
};

const toDomain = (row: OfferingRow): Offering => ({
  id: row.id,
  templateCode: codeOf(row),
  year: row.year,
  municipalityCode: row.municipalityCode,
  modality: modalityToDomain(row.modality),
  opensAt: row.opensAt,
  closesAt: row.closesAt,
  classesStartOn: row.classesStartOn === null ? null : toCalendarDate(row.classesStartOn),
  scheduleLabel: row.scheduleLabel,
  isActive: row.isActive,
  createdById: row.createdById,
});

const toRecord = (row: RecordRow): OfferingRecord => ({
  ...toDomain(row),
  submissionCount: row._count.submissions,
});

export class PrismaOfferingRepository implements OfferingRepository {
  constructor(private readonly db: PrismaClient) {}

  private async templateId(code: TemplateCode): Promise<string> {
    const row = await this.db.formTemplate.findUnique({ where: { code } });
    if (!row) throw new UnknownTemplateError(code);
    return row.id;
  }

  async create(input: NewOffering): Promise<Offering> {
    const row = await this.db.formOffering.create({
      data: {
        formTemplateId: await this.templateId(input.templateCode),
        year: input.year,
        municipalityCode: input.municipalityCode,
        modality: modalityToRow(input.modality),
        opensAt: input.opensAt,
        closesAt: input.closesAt,
        classesStartOn:
          input.classesStartOn === null ? null : fromCalendarDate(input.classesStartOn),
        scheduleLabel: input.scheduleLabel,
        createdById: input.createdById,
      },
      include: { formTemplate: { select: { code: true } } },
    });
    return toDomain(row);
  }

  async update(id: string, patch: OfferingPatch): Promise<Offering> {
    const row = await this.db.formOffering.update({
      where: { id },
      data: {
        formTemplateId: patch.templateCode ? await this.templateId(patch.templateCode) : undefined,
        year: patch.year,
        municipalityCode: patch.municipalityCode,
        modality: patch.modality ? modalityToRow(patch.modality) : undefined,
        opensAt: patch.opensAt,
        closesAt: patch.closesAt,
        classesStartOn:
          patch.classesStartOn == null
            ? patch.classesStartOn
            : fromCalendarDate(patch.classesStartOn),
        scheduleLabel: patch.scheduleLabel,
      },
      include: { formTemplate: { select: { code: true } } },
    });
    return toDomain(row);
  }

  async setActive(id: string, isActive: boolean): Promise<void> {
    await this.db.formOffering.update({ where: { id }, data: { isActive } });
  }

  async findById(id: string): Promise<Offering | null> {
    const row = await this.db.formOffering.findUnique({
      where: { id },
      include: { formTemplate: { select: { code: true } } },
    });
    return row ? toDomain(row) : null;
  }

  async findRecordById(id: string): Promise<OfferingRecord | null> {
    const row = await this.db.formOffering.findUnique({ where: { id }, include: recordInclude });
    return row ? toRecord(row) : null;
  }

  async list(filter: OfferingFilter): Promise<OfferingRecord[]> {
    const rows = await this.db.formOffering.findMany({
      where: {
        year: filter.year,
        formTemplate: filter.templateCode ? { code: filter.templateCode } : undefined,
      },
      orderBy: [{ year: "desc" }, { opensAt: "desc" }],
      include: recordInclude,
    });
    return rows.map(toRecord);
  }

  async listOpen(now: Date): Promise<OfferingRecord[]> {
    const rows = await this.db.formOffering.findMany({
      where: { isActive: true, opensAt: { lte: now }, closesAt: { gt: now } },
      orderBy: [{ closesAt: "asc" }],
      include: recordInclude,
    });
    return rows.map(toRecord);
  }

  async countSubmissions(id: string): Promise<number> {
    return this.db.formSubmission.count({ where: { formOfferingId: id } });
  }

  async existsFor(input: {
    templateCode: TemplateCode;
    year: number;
    municipalityCode: string;
    modality: Modality;
  }): Promise<boolean> {
    const found = await this.db.formOffering.findFirst({
      where: {
        formTemplate: { code: input.templateCode },
        year: input.year,
        municipalityCode: input.municipalityCode,
        modality: modalityToRow(input.modality),
      },
      select: { id: true },
    });
    return found !== null;
  }
}
