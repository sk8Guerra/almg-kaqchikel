import { municipalities } from "../../domain/lookup";
import type { Municipality } from "../../domain/place";

export const listMunicipalities =
  () =>
  async (departmentCode?: string): Promise<Municipality[]> =>
    municipalities(departmentCode);
