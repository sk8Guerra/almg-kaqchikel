export const ACTIONS = ["read", "create", "update", "delete"] as const;

export type Action = (typeof ACTIONS)[number];

export const MODULES = {
  access: { label: "Personas", actions: ACTIONS },
} as const;

export type ModuleKey = keyof typeof MODULES;

export type PermissionKey = `${ModuleKey}:${Action}`;

export type UserRole = "admin" | "member";

export const ALL_PERMISSION_KEYS: readonly PermissionKey[] = (
  Object.keys(MODULES) as ModuleKey[]
).flatMap((moduleKey) =>
  MODULES[moduleKey].actions.map((action): PermissionKey => `${moduleKey}:${action}`),
);

export const isKnownPermission = (key: string): key is PermissionKey =>
  (ALL_PERMISSION_KEYS as readonly string[]).includes(key);
