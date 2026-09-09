import { MODULES, actionsFor, isKnownPermission } from "@/modules/access";
import type { Action, ModuleKey } from "@/modules/access";

export const ACTION_LABELS: Record<Action, string> = {
  read: "Ver",
  create: "Crear",
  update: "Editar",
  delete: "Eliminar",
  download: "Descargar",
};

/**
 * Los permisos de una persona agrupados por área — "Inscripciones (Ver, Descargar)" — en el
 * orden del catálogo, no en el que se guardaron. Una etiqueta por permiso repetía el nombre
 * del área tantas veces como operaciones tuviera y ensanchaba la tabla hasta obligar a
 * desplazarla en horizontal.
 *
 * Un permiso concedido antes de que su área dejara de ofrecerlo sigue guardado y ya no
 * habilita nada (SC-008). Se lista al final, con su clave cruda, en vez de fingir que sigue
 * vigente: la revisión tiene que poder verlo.
 */
export const groupedPermissionLabels = (keys: readonly string[]): string[] => {
  const granted = new Set(keys);

  const byModule = (Object.keys(MODULES) as ModuleKey[]).flatMap((moduleKey) => {
    const actions = actionsFor(moduleKey).filter((action) => granted.has(`${moduleKey}:${action}`));
    if (actions.length === 0) return [];
    const labels = actions.map((action) => ACTION_LABELS[action]).join(", ");
    return [`${MODULES[moduleKey].label} (${labels})`];
  });

  const orphans = keys.filter((key) => !isKnownPermission(key)).map((key) => `${key} (sin efecto)`);

  return [...byModule, ...orphans];
};
