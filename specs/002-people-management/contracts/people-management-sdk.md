# Contrato — Superficie de gestión de personas

**Feature**: `002-people-management` · **Fecha**: 2026-08-19

Amplía el SDK del módulo `access` ya existente. Sigue valiendo la prueba de aceptación de la
001: todo caso de uso debe poder ejecutarse desde un script de Node plano.

---

## 1. Añadidos a `src/modules/access/index.ts`

```ts
export { createPerson } from "./application/use-cases/create-person";
export { listPeople } from "./application/use-cases/list-people";
export { changeRoles } from "./application/use-cases/change-roles";
export { deactivatePerson } from "./application/use-cases/deactivate-person";
export { reactivatePerson } from "./application/use-cases/reactivate-person";

export {
  EmailAlreadyRegisteredError,
  LastAdministratorError,
  SelfDeactivationError,
  IdentityCreationFailedError,
} from "./domain/errors";
```

---

## 2. Puertos extendidos

```ts
export interface IdentityProvider {
  getCurrentIdentity(): Promise<ExternalIdentity | null>;

  createIdentity(email: string): Promise<IdentityId>;
  deleteIdentity(identityId: IdentityId): Promise<void>;
  deactivateIdentity(identityId: IdentityId): Promise<void>;
  reactivateIdentity(identityId: IdentityId): Promise<void>;
}

export interface UserRepository {
  findByIdentityId(identityId: IdentityId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findById(id: UserId): Promise<User | null>;
  upsertFromIdentity(identity: ExternalIdentity, now: Date): Promise<User>;
  listRoles(userId: UserId): Promise<Role[]>;

  list(filter: PeopleFilter): Promise<PersonSummary[]>;
  createWithRoles(input: NewPersonInput): Promise<User>;
  markFirstSignIn(userId: UserId, now: Date): Promise<void>;
  setStatus(userId: UserId, status: UserStatus, now: Date): Promise<void>;
  countActiveWithPermissionExcluding(permission: PermissionKey, excluded: UserId): Promise<number>;
}

export interface AuditLog {
  record(entry: AdminActionEntry): Promise<void>;
}
```

La atomicidad no aparece en ningún puerto: `createWithRoles` escribe la persona y sus roles en
una sola llamada, y la transacción es un detalle de su implementación en `infrastructure/`. Un
puerto `UnitOfWork` habría obligado a los casos de uso a orquestar transacciones, que es
precisamente lo que el Principio VI les evita.
---

## 3. Firmas de los casos de uso

```ts
createPerson(deps: {
  identity: IdentityProvider; users: UserRepository; roles: RoleRepository;
  audit: AuditLog; clock: Clock;
}): (input: { email: string; roleKeys: RoleKey[]; actor: UserId }) => Promise<User>

listPeople(deps: { users: UserRepository })
  : (filter: PeopleFilter) => Promise<PersonSummary[]>

changeRoles(deps: {
  users: UserRepository; roles: RoleRepository; audit: AuditLog; clock: Clock;
}): (input: { targetId: UserId; assign: RoleKey[]; revoke: RoleKey[] }) => Promise<void>

deactivatePerson(deps: {
  identity: IdentityProvider; users: UserRepository;
  audit: AuditLog; clock: Clock;
}): (targetId: UserId) => Promise<void>

reactivatePerson(deps: { … mismas … }): (targetId: UserId) => Promise<void>
```

Todos reciben además el usuario que actúa, resuelto por `authorize("user:manage")` en el
adapter y pasado como dato. Ningún caso de uso lee la sesión por su cuenta.

```ts
type PeopleFilter = { search?: string; status?: UserStatus };

type PersonSummary = {
  id: UserId;
  email: Email;
  displayName: string | null;
  status: UserStatus;
  roleKeys: RoleKey[];
  hasSignedIn: boolean;
};
```

`hasSignedIn` se deriva de `firstSignInAt !== null`. Se expone como booleano para que la
interfaz no tenga que conocer nada del proveedor de identidad.

---

## 4. Orden de operaciones de `createPerson`

Este orden **es** el requisito FR-007, no una nota de implementación:

```
1. authorize("user:manage")                    ← en el adapter
2. validar y normalizar el correo              ← FR-005, FR-006
3. findByEmail → si existe, EmailAlreadyRegisteredError   ← FR-004
4. identity.createIdentity(email) → identityId ← fuera de la transacción, hace falta el ID
5. users.createWithRoles({ identityId, email, roleKeys, status: ACTIVE })  ← atómico
6. si (5) lanza → identity.deleteIdentity(identityId) y propagar   ← compensación
7. audit.record(USER_CREATED)
8. devolver la persona creada
```

El paso 6 es lo que impide dejar una identidad sin perfil. Y si el propio paso 6 falla, el
resultado degrada de forma segura: esa persona podría autenticarse, pero `syncSignedInUser` le
crearía un perfil sin roles y no podría ejecutar nada (research §R3).

**No se envía ningún correo en todo el flujo** (FR-008).

## 5. Rutas

| Ruta                   | Acceso        | Responsabilidad                   |
| ---------------------- | ------------- | --------------------------------- |
| `/panel/personas`      | `user:manage` | Lista, búsqueda y alta            |
| `/panel/personas/[id]` | `user:manage` | Roles y activación de una persona |

Las server actions llaman a `authorize("user:manage")` antes de delegar. La protección de ruta
en `proxy.ts` no cuenta como control: FR-021 exige la comprobación en la operación misma.

---

## 6. Cambio de comportamiento en la feature 001

`syncSignedInUser` gana **un solo paso**: si el perfil no tiene `firstSignInAt`, lo fija con la
hora del `Clock`. Nada más. No hay enlace por correo ni estados que resolver, porque el perfil ya
existe completo desde el alta.

Las cinco pruebas existentes de `syncSignedInUser` deben seguir pasando sin modificarse. Si
alguna necesita cambiar, el cambio dejó de ser aditivo y hay que revisarlo.
