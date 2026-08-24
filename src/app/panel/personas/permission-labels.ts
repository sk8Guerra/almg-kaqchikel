import { MODULES } from "@/modules/access";
import type { Action, ModuleKey } from "@/modules/access";

export const ACTION_LABELS: Record<Action, string> = {
  read: "Ver",
  create: "Crear",
  update: "Editar",
  delete: "Eliminar",
};

const isModuleKey = (value: string): value is ModuleKey => value in MODULES;

const isAction = (value: string): value is Action => value in ACTION_LABELS;

export const permissionLabel = (key: string): string => {
  const [moduleKey, action] = key.split(":");
  if (!isModuleKey(moduleKey) || !isAction(action)) return key;
  return `${MODULES[moduleKey].label} — ${ACTION_LABELS[action]}`;
};
