import { zones } from "../../domain/lookup";

export const listZones =
  () =>
  async (municipalityCode: string): Promise<string[]> =>
    zones(municipalityCode);
