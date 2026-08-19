# Phase 1 — Modelo de datos

**Feature**: `001-clerk-auth-foundation` · **Fecha**: 2026-08-18

Dos modelos distintos que no hay que confundir: el **modelo de dominio** (tipos puros, sin
dependencias, en `domain/`) y el **modelo de persistencia** (Prisma, en `prisma/schema.prisma`).
El repositorio traduce entre ambos; el dominio nunca ve un tipo de Prisma.

---

## Entidades de dominio

### `User`

Perfil de negocio de una persona autorizada. **No contiene credenciales** (FR-015).

| Campo                     | Tipo                     | Reglas                                                      |
| ------------------------- | ------------------------ | ----------------------------------------------------------- |
| `id`                      | `UserId`                 | Identificador propio del sistema                            |
| `identityId`              | `IdentityId`             | Referencia estable a la identidad externa. Única. Inmutable |
| `email`                   | `Email`                  | Normalizado a minúsculas (FR-016). Único                    |
| `displayName`             | `string \| null`         | Puede faltar si el proveedor no lo tiene                    |
| `status`                  | `"active" \| "inactive"` | Refleja el estado en el proveedor (FR-009)                  |
| `createdAt` / `updatedAt` | `Date`                   | Inyectados vía puerto `Clock`, nunca `new Date()`           |

**Invariantes**:

- `identityId` es la clave de correlación con el proveedor; cambiar de proveedor implica una
  migración de este campo, y nada más del dominio.
- Un `User` con `status: "inactive"` no puede ejecutar acciones protegidas, sin importar sus roles.

### `Role`

| Campo         | Tipo           | Reglas                                                                          |
| ------------- | -------------- | ------------------------------------------------------------------------------- |
| `id`          | `RoleId`       |                                                                                 |
| `key`         | `RoleKey`      | Identificador estable en código (`admin`, `editor`, `viewer`). Único, inmutable |
| `name`        | `string`       | Etiqueta legible en español                                                     |
| `permissions` | `Permission[]` | Puede estar vacío                                                               |

`key` existe aparte de `name` a propósito: el código autoriza contra `key`, la interfaz muestra
`name`. Así renombrar un rol en pantalla no rompe ninguna comprobación de permisos.

### `Permission`

| Campo         | Tipo            | Reglas                                                      |
| ------------- | --------------- | ----------------------------------------------------------- |
| `id`          | `PermissionId`  |                                                             |
| `key`         | `PermissionKey` | Formato `recurso:acción` (`entry:create`). Único, inmutable |
| `description` | `string`        |                                                             |

### Relaciones

```
User ──< UserRole >── Role ──< RolePermission >── Permission
```

Ambas de muchos a muchos. Los permisos efectivos de una persona son la **unión** de los permisos
de todos sus roles. Sin roles → conjunto vacío → todo denegado (FR-020).

---

## Value objects y errores de dominio

```ts
// domain/values.ts — evitan pasar strings sueltos entre capas
type UserId = string & { readonly __brand: "UserId" };
type IdentityId = string & { readonly __brand: "IdentityId" };
type Email = string & { readonly __brand: "Email" };
type PermissionKey = `${string}:${string}`;

// domain/errors.ts — el dominio nombra sus fallos; nunca lanza errores de Clerk o Prisma
class NotAuthenticatedError extends Error {} // no hay sesión
class UserInactiveError extends Error {} // existe pero está desactivado (FR-009)
class PermissionDeniedError extends Error {} // autenticado pero sin permiso (FR-019)
class UserNotProvisionedError extends Error {} // identidad válida sin perfil local
```

`Email` se construye con una función que normaliza a minúsculas y valida formato, de modo que
FR-016 se cumple en el constructor y no en cada consulta.

---

## Modelo de persistencia (Prisma)

```prisma
model User {
  id          String   @id @default(cuid())
  identityId  String   @unique          // ID del proveedor externo
  email       String   @unique          // guardado en minúsculas
  displayName String?
  status      UserStatus @default(ACTIVE)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  roles       UserRole[]
  @@index([email])
}

enum UserStatus { ACTIVE INACTIVE }

model Role {
  id          String @id @default(cuid())
  key         String @unique
  name        String
  users       UserRole[]
  permissions RolePermission[]
}

model Permission {
  id          String @id @default(cuid())
  key         String @unique
  description String
  roles       RolePermission[]
}

model UserRole {
  userId String
  roleId String
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role   Role @relation(fields: [roleId], references: [id], onDelete: Cascade)
  @@id([userId, roleId])
}

model RolePermission {
  roleId       String
  permissionId String
  role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  @@id([roleId, permissionId])
}
```

**Ausencias deliberadas** — la revisión de FR-015 debe encontrar cero de estos campos:
no hay `password`, ni `passwordHash`, ni `sessionToken`, ni `mfaSecret`, ni `refreshToken`.
El esquema es la evidencia verificable de SC-004.

---

## Datos semilla

Un seed idempotente crea el catálogo inicial y rompe el círculo del primer administrador (FR-025):

| Rol      | Permisos iniciales                             |
| -------- | ---------------------------------------------- |
| `admin`  | `user:read`, `user:assign-role`, `role:manage` |
| `editor` | `user:read`                                    |
| `viewer` | _(ninguno por ahora)_                          |

El seed **no crea usuarios**. Asigna `admin` a un `identityId` que ya exista en Clerk, pasado como
parámetro. Así el alta sigue siendo por invitación y el seed solo concede el rol.

---

## Estados y transiciones

`User.status` sigue al proveedor, no se decide localmente:

```
(invitación aceptada en Clerk) → ACTIVE ──(baja en Clerk)──> INACTIVE
                                    ^                            │
                                    └────(reactivación)──────────┘
```

La transición ocurre en la sincronización JIT (R5). El sistema nunca cambia este campo por su
cuenta: es un reflejo, no una decisión.
