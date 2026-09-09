import { MODULES, isKnownPermission } from "@/modules/access";
import type { Action, ModuleKey } from "@/modules/access";

export const ACTION_LABELS: Record<Action, string> = {
  read: "Ver",
  create: "Crear",
  update: "Editar",
  delete: "Eliminar",
};

/**
 * Un permiso concedido antes de que su área dejara de ofrecerlo sigue guardado y ya no
 * habilita nada (SC-008). Se etiqueta como tal en vez de fingir que sigue vigente.
 */
export const permissionLabel = (key: string): string => {
  if (!isKnownPermission(key)) return `${key} (sin efecto)`;
  const [moduleKey, action] = key.split(":") as [ModuleKey, Action];
  return `${MODULES[moduleKey].label} — ${ACTION_LABELS[action]}`;
};
