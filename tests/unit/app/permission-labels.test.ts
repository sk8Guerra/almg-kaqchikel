import { describe, expect, it } from "vitest";
import { groupedPermissionLabels } from "@/app/panel/personas/permission-labels";

/**
 * La tabla de personas dibuja los permisos en una sola línea: el nombre del área una vez y
 * entre paréntesis lo que puede hacer en ella. El orden es el del catálogo, no el del
 * guardado, para que dos personas con los mismos permisos se lean igual.
 */
describe("permisos agrupados por área", () => {
  it("nombra el área una vez y enumera sus operaciones", () => {
    expect(
      groupedPermissionLabels([
        "enrollment:download",
        "offering:update",
        "offering:read",
        "enrollment:read",
        "offering:create",
      ]),
    ).toEqual(["Convocatorias (Ver, Crear, Editar)", "Inscripciones (Ver, Descargar)"]);
  });

  it("omite las áreas sin ningún permiso concedido", () => {
    expect(groupedPermissionLabels(["students:read"])).toEqual(["Estudiantes (Ver)"]);
    expect(groupedPermissionLabels([])).toEqual([]);
  });

  /** SC-008: un permiso huérfano no habilita nada, pero tiene que seguir a la vista. */
  it("deja ver los permisos que ya no corresponden a ninguna área", () => {
    expect(groupedPermissionLabels(["access:read", "classes:read"])).toEqual([
      "Personas (Ver)",
      "classes:read (sin efecto)",
    ]);
  });
});
