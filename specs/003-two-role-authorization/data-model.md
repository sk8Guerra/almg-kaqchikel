# Phase 1 — Modelo de datos

**Feature**: `003-two-role-authorization` · **Fecha**: 2026-08-19

El cambio no es aditivo: sustituye el modelo de autorización de la feature 001.

---

## De cinco tablas a dos

```
ANTES   users ─< user_roles >─ roles ─< role_permissions >─ permissions

AHORA   users.role  (ADMIN | MEMBER)
        users ─< user_permissions          (solo para MEMBER)
```

Se eliminan `roles`, `user_roles`, `role_permissions` y `permissions` (research §R3).

---

## `users`: un campo nuevo

```prisma
enum UserRole {
  ADMIN
  MEMBER

  @@map("user_role")
}

model User {
  // … campos existentes sin cambios …
  role        UserRole         @default(MEMBER)
  permissions UserPermission[]

  @@index([role])
}
```

`@default(MEMBER)` es deliberado: si alguna vez se crea una fila sin especificar rol, el valor
seguro es el que no puede hacer nada.

`@@index([role])` sostiene la invariante del último administrador, que se comprueba en cada
degradación y cada desactivación.

## `user_permissions`: concesiones directas a la persona

```prisma
model UserPermission {
  userId    String   @map("user_id")
  key       String
  grantedAt DateTime @default(now()) @map("granted_at")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([userId, key])
  @@map("user_permissions")
}
```

- La clave primaria compuesta cumple FR-012: conceder dos veces el mismo permiso es una sola fila.
- `onDelete: Cascade` evita permisos colgando de personas eliminadas.
- `key` es texto, **no clave foránea a un catálogo**: el catálogo vive en código (research §R2).
  La integridad la da el sistema de tipos antes de llegar a la base.

**Los administradores no tienen filas aquí.** Su autoridad no se enumera (FR-006). Una fila de
`user_permissions` para un administrador no sería incorrecta, sería irrelevante: `grants` nunca
la consulta.

---

## Catálogo de áreas (en código, no en base)

```ts
export const MODULES = {
  access: { label: "Personas", actions: ["read", "create", "update", "delete"] },
} as const;

export type PermissionKey = `${keyof typeof MODULES}:${Action}`;
```

Hoy existe un área. Añadir formularios es añadir una entrada: la interfaz de selección la muestra
sola, ningún administrador cambia, y `authorize("forms:create")` pasa a compilar.

Escribir `authorize("form:raed")` deja de compilar. Ese es el motivo principal de que el catálogo
esté en código.

---

## Reglas que el modelo no expresa por sí solo

Viven en casos de uso, porque dependen de un conteo sobre el resultado de la operación y no de una
fila aislada:

- **FR-020**: no se puede degradar ni desactivar a alguien si el número de personas `ACTIVE` con
  rol `ADMIN` llegaría a cero.
- **FR-021**: nadie puede degradarse a sí mismo.
- **FR-018/FR-019**: cambiar rol y conceder permisos exigen rol `ADMIN`; no son permisos y por
  tanto no son concedibles.
- **FR-010**: dar de alta a un miembro exige al menos un permiso.

---

## Registro de actividad

```prisma
enum AdminActionType {
  USER_CREATED
  ROLE_CHANGED
  PERMISSION_GRANTED
  PERMISSION_REVOKED
  USER_DEACTIVATED
  USER_REACTIVATED

  @@map("admin_action_type")
}
```

`ROLE_ASSIGNED` y `ROLE_REVOKED` describían el modelo de muchos roles por persona y desaparecen.
El campo `roleKey` pasa a `detail`, que guarda el rol nuevo o la clave de permiso según el tipo.

---

## Migración

La base está prácticamente vacía, así que la migración es directa:

1. Añadir `users.role` con `@default(MEMBER)`.
2. Poner `ADMIN` a quien deba conservarlo (hoy: nadie, se concede con el seed).
3. Crear `user_permissions`.
4. Sustituir el enum de acciones administrativas y renombrar `role_key` a `detail`.
5. Eliminar `role_permissions`, `user_roles`, `roles`, `permissions`, en ese orden.

**No es reversible sin pérdida**: al eliminar las tablas se pierde qué rol antiguo tenía cada
persona. Es aceptable porque esos roles solo existían en datos de arranque.
