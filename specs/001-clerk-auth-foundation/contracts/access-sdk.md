# Contrato — SDK público del módulo `access`

**Feature**: `001-clerk-auth-foundation` · **Fecha**: 2026-08-18

Esta es la superficie que el módulo expone al resto del sistema. Todo lo que no esté en
`src/modules/access/index.ts` es privado (Principio III, verificado por `boundaries/entry-point`).

**Prueba de aceptación del contrato**: cada caso de uso debe poder ejecutarse desde un script de
Node.js plano, sin React, sin Next.js, sin contexto de petición y sin `"use server"`. Si un caso
de uso necesita algo de eso, el contrato está mal diseñado.

---

## 1. Superficie pública (`index.ts`)

```ts
// Casos de uso
export { syncSignedInUser } from "./application/use-cases/sync-signed-in-user";
export { getCurrentUser } from "./application/use-cases/get-current-user";
export { authorize } from "./application/use-cases/authorize";
export { can } from "./application/use-cases/can";
export { assignRole } from "./application/use-cases/assign-role";
export { revokeRole } from "./application/use-cases/revoke-role";

// Tipos de dominio y errores
export type { User, Role, Permission, PermissionKey, UserId, IdentityId } from "./domain";
export {
  NotAuthenticatedError,
  UserInactiveError,
  PermissionDeniedError,
  UserNotProvisionedError,
} from "./domain/errors";
```

No se exporta ningún repositorio, ningún cliente de Prisma y ningún tipo de Clerk.

---

## 2. Puertos (interfaces que la infraestructura implementa)

```ts
// application/ports/identity-provider.ts
export interface IdentityProvider {
  /** Identidad de quien hace la petición actual, o null si no hay sesión. */
  getCurrentIdentity(): Promise<ExternalIdentity | null>;
}

export type ExternalIdentity = {
  identityId: IdentityId;
  email: string;
  displayName: string | null;
  isActive: boolean;
  updatedAt: Date;
};

// application/ports/user-repository.ts
export interface UserRepository {
  findByIdentityId(identityId: IdentityId): Promise<User | null>;
  upsertFromIdentity(identity: ExternalIdentity, now: Date): Promise<User>;
  listRoles(userId: UserId): Promise<Role[]>;
}

// application/ports/role-repository.ts
export interface RoleRepository {
  findByKey(key: RoleKey): Promise<Role | null>;
  assignToUser(userId: UserId, roleId: RoleId): Promise<void>;
  revokeFromUser(userId: UserId, roleId: RoleId): Promise<void>;
}

// application/ports/clock.ts  (en src/shared, compartido)
export interface Clock {
  now(): Date;
}
```

`ExternalIdentity` está expresado en vocabulario de negocio, no de Clerk: no hay `emailAddresses[]`,
ni `primaryEmailAddressId`, ni `publicMetadata`. Traducir esa forma es trabajo del adaptador.

---

## 3. Firmas de los casos de uso

Todos son funciones que reciben sus dependencias y devuelven la operación. Sin clases, sin
`new`, sin imports de concretos.

```ts
// Sincroniza el perfil de negocio con la identidad actual. FR-012, FR-013, FR-014.
// Lanza NotAuthenticatedError si no hay sesión; UserInactiveError si está dado de baja.
syncSignedInUser(deps: { identity: IdentityProvider; users: UserRepository; clock: Clock })
  : () => Promise<User>

// Devuelve el perfil de quien hace la petición, sin escribir. Null si no hay sesión.
getCurrentUser(deps: { identity: IdentityProvider; users: UserRepository })
  : () => Promise<User | null>

// Exige un permiso. Lanza PermissionDeniedError si no lo tiene. FR-019, FR-020, FR-022.
authorize(deps: { identity: IdentityProvider; users: UserRepository })
  : (permission: PermissionKey) => Promise<User>

// Variante no lanzante, para decidir qué mostrar en la interfaz.
can(deps: { identity: IdentityProvider; users: UserRepository })
  : (permission: PermissionKey) => Promise<boolean>

// Administración de roles. FR-018, FR-021.
assignRole(deps: { users: UserRepository; roles: RoleRepository })
  : (userId: UserId, roleKey: RoleKey) => Promise<void>

revokeRole(deps: { users: UserRepository; roles: RoleRepository })
  : (userId: UserId, roleKey: RoleKey) => Promise<void>
```

`authorize` y `can` existen por separado a propósito: `authorize` es la protección real en el
servidor, `can` es para no mostrar botones inútiles. **Ocultar con `can` nunca sustituye a
`authorize`** — FR-022 exige la comprobación del lado del servidor en la acción misma.

---

## 4. Contrato de las rutas expuestas

| Ruta                  | Acceso    | Responsabilidad                                          |
| --------------------- | --------- | -------------------------------------------------------- |
| `/`                   | Pública   | Portada; enlace a ingresar                               |
| `/ingresar`           | Pública   | Pantalla de Clerk para pedir el enlace mágico (FR-001)   |
| `/ingresar/verificar` | Pública   | Canje del enlace (FR-003)                                |
| `/panel`              | Protegida | Primera pantalla autenticada; dispara `syncSignedInUser` |

`src/proxy.ts` protege todo salvo la lista pública. La protección de ruta es la primera barrera;
`authorize` en cada acción es la que realmente cuenta.

---

## 5. Lo que este contrato prohíbe explícitamente

Cada línea corresponde a una regla de ESLint ya activa o por activar (ver research §R8):

- Ningún caso de uso recibe `FormData`, `Request`, `NextRequest` ni `cookies()`.
- Ningún archivo de `domain/` o `application/` importa `@clerk/*`, `@prisma/*`, `next/*` o `react`.
- Ningún archivo de `src/app/` o `src/components/` importa `@prisma/*` ni el cliente generado.
- Las implementaciones concretas se nombran únicamente en `src/composition/`.
- `new Date()` no aparece dentro de un caso de uso; la hora entra por el puerto `Clock`.
