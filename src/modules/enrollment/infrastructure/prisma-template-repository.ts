import type { PrismaClient } from "@generated/client/client";
import type { FormTemplateDefinition, TemplateCode } from "../domain/form-template";
import type { TemplateRepository } from "../application/ports/template-repository";
import { levelToRow, trackToRow } from "./prisma-enums";

export class PrismaTemplateRepository implements TemplateRepository {
  constructor(private readonly db: PrismaClient) {}

  async upsertByCode(definition: FormTemplateDefinition): Promise<void> {
    const data = {
      name: definition.nameSpanish,
      track: trackToRow(definition.track),
      level: levelToRow(definition.level),
    };

    await this.db.formTemplate.upsert({
      where: { code: definition.code },
      update: data,
      create: { code: definition.code, ...data },
    });
  }

  async idByCode(code: TemplateCode): Promise<string | null> {
    const row = await this.db.formTemplate.findUnique({ where: { code } });
    return row?.id ?? null;
  }
}
