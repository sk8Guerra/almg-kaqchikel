# Contrato — Superficie de autorización

**Feature**: `003-two-role-authorization` · **Fecha**: 2026-08-19

Reemplaza la superficie de autorización de las features 001 y 002. Sigue valiendo la prueba de
aceptación: todo caso de uso debe poder ejecutarse desde un script de Node plano.

---

## 1. Catálogo de áreas y tipo de permiso

```ts
export const MODULES = {
  access: { label: "Personas", actions: ["read", "create", "update", "delete"] },
} as const;

export type ModuleKey = keyof typeof MODULES;
export type Action = "read" | "create" | "update" | "delete";
export type PermissionKey = `${ModuleKey}:${Action}`;
```

El tipo se deriva del catálogo: una clave mal escrita no compila.

## 2. La regla de autorización, en una función

```ts
export type UserRole = "admin" | "member";

export const grants = (
  person: { role: UserRole },
  granted: ReadonlySet<PermissionKey>,
  permission: PermissionKey,
): boolean => (person.role === "admin" ? true : granted.has(permission));
```

Este es el **único** punto del sistema donde el rol influye en una decisión. Todo lo demás
pregunta por permisos.

## 3. Superficie pública (`src/modules/access/index.ts`)

```ts
export { createPerson } from "./application/use-cases/create-person";
export { listPeople } from "./application/use-cases/list-people";
export { changePermissions } from "./application/use-cases/change-permissions";
export { changeRole } from "./application/use-cases/change-role";
export { deactivatePerson } from "./application/use-cases/deactivate-person";
export { reactivatePerson } from "./application/use-cases/reactivate-person";
export { authorize } from "./application/use-cases/authorize";
export { can } from "./application/use-cases/can";

export { MODULES } from "./domain/modules";
export type { PermissionKey, ModuleKey, Action, UserRole } from "./domain/modules";

export {
  PermissionDeniedError,
  AdminRequiredError,
  LastAdministratorError,
  SelfDemotionError,
  MemberWithoutPermissionsError,
  UnknownPermissionError,
} from "./domain/errors";
```

**Eliminados**: `assignRole`, `revokeRole`, `changeRoles`, y los tipos `Role` y `Permission`.

## 4. Puertos

```ts
export interface UserRepository {
  // … los existentes …
  listPermissions(userId: UserId): Promise<Set<PermissionKey>>;
  grantPermissions(userId: UserId, keys: PermissionKey[]): Promise<void>;
  revokePermissions(userId: UserId, keys: PermissionKey[]): Promise<void>;
  setRole(userId: UserId, role: UserRole, now: Date): Promise<void>;
  countActiveAdminsExcluding(excluded: UserId): Promise<number>;
  createWithRole(input: NewPersonInput): Promise<User>;
}
```

`RoleRepository` **se elimina por completo**.

```ts
type NewPersonInput = {
  identityId: IdentityId;
  email: Email;
  role: UserRole;
  permissionKeys: PermissionKey[]; // vacío obligatoriamente si role === "admin"
  now: Date;
};
```

## 5. Firmas de los casos de uso

```ts
createPerson(deps): (input: {
  email: string; role: UserRole; permissionKeys: PermissionKey[]; actor: UserId;
}) => Promise<User>

changePermissions(deps): (input: {
  targetId: UserId; grant: PermissionKey[]; revoke: PermissionKey[]; actor: UserId;
}) => Promise<void>

changeRole(deps): (input: {
  targetId: UserId; role: UserRole; permissionKeys: PermissionKey[]; actor: UserId;
}) => Promise<void>

authorize(deps): (permission: PermissionKey) => Promise<User>
can(deps): (permission: PermissionKey) => Promise<boolean>
```

`changeRole` recibe `permissionKeys` porque degradar a miembro exige indicarlos (FR-016); al
promover a administrador debe venir vacío.

## 6. Las cuatro guardas, y dónde vive cada una

| Guarda                              | Requisito      | Se comprueba en                                   |
| ----------------------------------- | -------------- | ------------------------------------------------- |
| Quien actúa debe ser administrador  | FR-018         | `changeRole`, `changePermissions`, `createPerson` |
| Debe quedar un administrador activo | FR-020         | `changeRole`, `deactivatePerson`                  |
| Nadie se degrada a sí mismo         | FR-021         | `changeRole`                                      |
| Un miembro necesita ≥1 permiso      | FR-010, FR-016 | `createPerson`, `changeRole`                      |

La primera **no usa `authorize`**: exigir el rol no es exigir un permiso. Ésa es la frontera que
impide la escalada (research §R4).

## 7. Rutas

| Ruta                   | Acceso                                               | Responsabilidad                          |
| ---------------------- | ---------------------------------------------------- | ---------------------------------------- |
| `/panel`               | Autenticado                                          | Muestra los accesos que la persona tenga |
| `/panel/personas`      | `access:read`                                        | Lista y alta                             |
| `/panel/personas/[id]` | `access:read` para ver; **rol admin** para modificar | Rol y permisos                           |

Un miembro con `access:read` ve el detalle de una persona y **no** ve los controles de rol ni de
permisos. Si invoca esas acciones directamente, la guarda de rol lo rechaza.

## 8. Lo que este contrato prohíbe

- Ningún permiso concede la capacidad de cambiar roles o permisos.
- Ningún administrador tiene filas en `user_permissions`.
- Ninguna comprobación de `role === "admin"` fuera de `grants` y de las guardas de la sección 6.
- Ninguna clave de permiso construida como texto libre: siempre del tipo derivado del catálogo.
