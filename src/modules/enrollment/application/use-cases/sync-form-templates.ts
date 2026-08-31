import { TEMPLATES } from "../../domain/form-template";
import type { TemplateRepository } from "../ports/template-repository";

type Deps = { templates: TemplateRepository };

export type SyncFormTemplatesResult = { readonly synced: number };

export const syncFormTemplates =
  ({ templates }: Deps) =>
  async (): Promise<SyncFormTemplatesResult> => {
    for (const definition of TEMPLATES) {
      await templates.upsertByCode(definition);
    }
    return { synced: TEMPLATES.length };
  };
