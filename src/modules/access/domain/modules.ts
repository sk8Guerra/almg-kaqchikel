export const ACTIONS = ["read", "create", "update", "delete"] as const;

export type Action = (typeof ACTIONS)[number];

type ModuleDefinition = {
  label: string;
  actions: readonly Action[];
};

/**
 * Un área declara solo las operaciones que se pueden conceder de verdad. Una que se marca,
 * se guarda y no habilita nada es un permiso que miente, y cuesta una sesión de QA
 * descubrirlo. Hay dos motivos para que una operación no esté aquí:
 *
 * - Personas: nunca lo estará. Dar de alta, cambiar roles y desactivar cuentas es la
 *   autoridad que FR-018 y FR-019 reservan a la administración, y la autoridad no se
 *   concede. Solo queda `read`.
 * - Estudiantes e inscripciones: todavía no. El sistema aún no sabe editar ni borrar un
 *   estudiante, ni borrar una convocatoria.
 *
 * La regla para el segundo caso: la operación vuelve al catálogo en el mismo commit que
 * trae la pantalla que protege, no antes. `permissions-are-enforced.test.ts` lo comprueba.
 */
export const MODULES = {
  access: { label: "Personas", actions: ["read"] },
  enrollment: { label: "Inscripciones", actions: ["read", "create", "update"] },
  students: { label: "Estudiantes", actions: ["read"] },
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
