import type { FormTemplateDefinition, TemplateCode } from "../../domain/form-template";

export interface TemplateRepository {
  upsertByCode(definition: FormTemplateDefinition): Promise<void>;
  idByCode(code: TemplateCode): Promise<string | null>;
}
