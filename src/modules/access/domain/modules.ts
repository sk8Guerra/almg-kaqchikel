export const ACTIONS = ["read", "create", "update", "delete"] as const;

export type Action = (typeof ACTIONS)[number];

type ModuleDefinition = {
  label: string;
  actions: readonly Action[];
};

/**
 * FR-018, FR-019. El área de personas solo concede lectura. Dar de alta, cambiar roles,
 * conceder permisos y desactivar cuentas es autoridad del rol de administración, y la
 * autoridad no se concede: ofrecer `access:create` en la matriz sería un permiso que se
 * guarda y no habilita nada.
 */
export const MODULES = {
  access: { label: "Personas", actions: ["read"] },
  enrollment: { label: "Inscripciones", actions: ACTIONS },
  students: { label: "Estudiantes", actions: ACTIONS },
} as const satisfies Record<string, ModuleDefinition>;

export type ModuleKey = keyof typeof MODULES;

export type PermissionKey = `${ModuleKey}:${Action}`;

export type UserRole = "admin" | "member";

/** Las operaciones concedibles de un área. No todas las áreas conceden las cuatro. */
export const actionsFor = (moduleKey: ModuleKey): readonly Action[] => MODULES[moduleKey].actions;

export const ALL_PERMISSION_KEYS: readonly PermissionKey[] = (
  Object.keys(MODULES) as ModuleKey[]
).flatMap((moduleKey) =>
  actionsFor(moduleKey).map((action): PermissionKey => `${moduleKey}:${action}`),
);

export const isKnownPermission = (key: string): key is PermissionKey =>
  (ALL_PERMISSION_KEYS as readonly string[]).includes(key);
