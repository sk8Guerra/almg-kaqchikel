import { describe, expect, it } from "vitest";
import { listDepartments } from "@/modules/geography/application/use-cases/list-departments";
import { listMunicipalities } from "@/modules/geography/application/use-cases/list-municipalities";
import { listZones } from "@/modules/geography/application/use-cases/list-zones";
import { findPlace, isKnownMunicipality } from "@/modules/geography/domain/lookup";

describe("catálogo geográfico estático (FR-056, FR-057, FR-058)", () => {
  it("tiene los 22 departamentos y los 340 municipios de Guatemala", async () => {
    expect(await listDepartments()()).toHaveLength(22);
    expect(await listMunicipalities()()).toHaveLength(340);
  });

  it("los códigos de municipio son únicos y empiezan por el de su departamento", async () => {
    const municipalities = await listMunicipalities()();

    expect(new Set(municipalities.map((m) => m.code)).size).toBe(municipalities.length);
    for (const municipality of municipalities) {
      expect(municipality.code.startsWith(municipality.departmentCode)).toBe(true);
    }
  });

  it("los municipios ofrecidos corresponden al departamento elegido", async () => {
    const chimaltenango = (await listMunicipalities()("04")).map((m) => m.name);

    expect(chimaltenango).toHaveLength(16);
    expect(chimaltenango).toContain("Tecpán Guatemala");
    expect(chimaltenango).not.toContain("Mixco");
  });

  it("solo los municipios zonificados declaran zonas", async () => {
    expect(await listZones()("0101")).toHaveLength(25);
    expect(await listZones()("0406")).toEqual([]);
  });

  it("resuelve el nombre del municipio y su departamento desde el código", () => {
    expect(findPlace("0406")).toEqual({
      municipalityCode: "0406",
      municipalityName: "Tecpán Guatemala",
      departmentCode: "04",
      departmentName: "Chimaltenango",
    });
  });

  it("un código inventado no existe en el catálogo", () => {
    expect(findPlace("9999")).toBeNull();
    expect(isKnownMunicipality("9999")).toBe(false);
    expect(isKnownMunicipality("0101")).toBe(true);
  });
});
