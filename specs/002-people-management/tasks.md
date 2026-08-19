---
description: "Task list for 002-people-management"
---

# Tasks: Gestión de Personas desde el Panel

**Input**: Design documents from `/specs/002-people-management/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/people-management-sdk.md)

**Tests**: SÍ, pero acotadas. La constitución (§Testing discipline) exige pruebas unitarias de
dominio y casos de uso con puertos en memoria. No se prueban repositorios ni componentes: eso se
valida a mano con [quickstart.md](./quickstart.md).

**Organization**: Agrupadas por historia de usuario para poder entregarlas por separado.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: US1, US2, US3, US4

## Path Conventions

Las de la constitución. Todo este feature vive dentro del módulo `access` ya existente: no se
crea ningún módulo nuevo.

## Convenciones obligatorias

Props `<ComponentName>Props`, cero comentarios en el código, identificadores en inglés con
español solo en texto de pantalla, estilos en `.module.scss` colocalizados.

---

## Phase 1: Setup

**Purpose**: Migración aditiva y catálogo. Nada de la feature 001 cambia de forma.

- [x] T001 Añadir `firstSignInAt DateTime?` a `User`, el modelo `AdminAction` y el enum `AdminActionType` en `prisma/schema.prisma` según [data-model.md](./data-model.md)
- [x] T002 Ejecutar `pnpm db:migrate --name people_management` y confirmar que la migración es aditiva (ninguna columna existente cambia de tipo ni de nulabilidad)
- [x] T003 Añadir el permiso `user:manage` al catálogo y asignarlo al rol `admin` en `prisma/seed.ts`, y ejecutar `pnpm db:seed`

**Checkpoint**: `pnpm verify` en verde y las 21 pruebas de la 001 siguen pasando.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Dominio y puertos que todas las historias necesitan.

**⚠️ CRITICAL**: Ninguna historia puede empezar hasta terminar esta fase.

- [x] T004 [P] Añadir `firstSignInAt` y el derivado `hasSignedIn` a la entidad `User` en `src/modules/access/domain/user.ts`
- [x] T005 [P] Añadir `EmailAlreadyRegisteredError`, `LastAdministratorError`, `SelfDeactivationError` e `IdentityCreationFailedError` en `src/modules/access/domain/errors.ts`
- [x] T006 [P] Definir el puerto `AuditLog` y el tipo `AdminActionEntry` en `src/modules/access/application/ports/audit-log.ts`
- [x] T007 Extender el puerto `IdentityProvider` con `createIdentity`, `deleteIdentity`, `deactivateIdentity` y `reactivateIdentity` en `src/modules/access/application/ports/identity-provider.ts`
- [x] T008 Extender el puerto `UserRepository` con `findByEmail`, `findById`, `list`, `createWithRoles`, `markFirstSignIn`, `setStatus` y `countActiveWithPermissionExcluding` en `src/modules/access/application/ports/user-repository.ts`
- [x] T009 Añadir `InMemoryAuditLog` y extender los dobles existentes con los métodos nuevos en `tests/unit/access/doubles.ts`

**Checkpoint**: los puertos compilan y los dobles los satisfacen. Aún no hay comportamiento.

---

## Phase 3: User Story 1 - Alta con rol en un solo acto (Priority: P1) 🎯 MVP

**Goal**: Un administrador da de alta a alguien con su rol, y esa persona puede entrar por su
cuenta y trabajar de inmediato.

**Independent Test**: Dar de alta un correo con rol `editor`, comprobar que aparece como "sin
ingresar todavía", entrar con ese correo y ejecutar una acción de `editor` sin intervención
adicional ni ningún correo del sistema.

### Tests for User Story 1 ⚠️

> Escribir primero y confirmar que fallan.

- [x] T010 [P] [US1] Prueba de `createPerson` en `tests/unit/access/create-person.test.ts`: crea identidad y perfil con sus roles en un solo acto (FR-003), y el resultado tiene `hasSignedIn: false`
- [x] T011 [P] [US1] Prueba de rechazo de duplicados en `tests/unit/access/create-person-guards.test.ts`: correo ya registrado → `EmailAlreadyRegisteredError` (FR-004), y el mismo correo en MAYÚSCULAS también (FR-006)
- [x] T012 [P] [US1] Prueba de compensación en `tests/unit/access/create-person-compensation.test.ts`: si el repositorio falla tras crear la identidad, se llama a `deleteIdentity` y no queda perfil (FR-007)

### Implementation for User Story 1

- [x] T013 [US1] Implementar `createPerson` en `src/modules/access/application/use-cases/create-person.ts` con el orden exacto de la sección 4 de [contracts/](./contracts/people-management-sdk.md), sin enviar ningún correo (FR-008)
- [x] T014 [US1] Exportar `createPerson` y los cuatro errores nuevos desde `src/modules/access/index.ts`
- [x] T015 [US1] Implementar `createIdentity` y `deleteIdentity` con `users.createUser` y `users.deleteUser` en `src/modules/access/infrastructure/clerk-identity-provider.ts`
- [x] T016 [US1] Implementar `findByEmail` y `createWithRoles` (persona y roles en una sola transacción de Prisma) en `src/modules/access/infrastructure/prisma-user-repository.ts`
- [x] T017 [US1] Implementar `PrismaAuditLog` en `src/modules/access/infrastructure/prisma-audit-log.ts`
- [x] T018 [US1] Cablear `AuditLog` y los métodos nuevos en `src/composition/container.ts`
- [x] T019 [US1] Crear la server action de alta en `src/app/panel/personas/actions.ts`, llamando a `authorize("user:manage")` antes de delegar (FR-020)
- [x] T020 [US1] Crear el formulario `CreatePersonForm` en `src/app/panel/personas/create-person-form.tsx` con selección de roles
- [x] T021 [US1] Crear la página `/panel/personas` en `src/app/panel/personas/page.tsx` y su hoja `src/app/panel/personas/personas.module.scss`

**Checkpoint**: se puede dar de alta a alguien con rol y esa persona entra y trabaja. MVP.

---

## Phase 4: User Story 2 - Ver quién tiene acceso (Priority: P1)

**Goal**: Una pantalla responde "quién puede entrar y qué puede hacer".

**Independent Test**: Con varias personas dadas de alta, ver correo, estado y roles de cada una,
buscar a alguien concreto, y distinguir a simple vista a quien nunca ingresó.

- [x] T022 [P] [US2] Prueba de `listPeople` en `tests/unit/access/list-people.test.ts`: devuelve roles y `hasSignedIn` correctos, y el filtro de búsqueda acota por correo y nombre
- [x] T023 [US2] Implementar `listPeople` en `src/modules/access/application/use-cases/list-people.ts` y exportarlo desde `src/modules/access/index.ts`
- [x] T024 [US2] Implementar `list` con búsqueda por correo o nombre en `src/modules/access/infrastructure/prisma-user-repository.ts`
- [x] T025 [US2] Crear la tabla `PeopleTable` en `src/app/panel/personas/people-table.tsx`, marcando visiblemente a quien nunca ingresó (FR-010)
- [x] T026 [US2] Añadir el campo de búsqueda a `src/app/panel/personas/page.tsx` (FR-011)

**Checkpoint**: US1 y US2 juntas dan gestión utilizable. Cierre del MVP.

---

## Phase 5: User Story 3 - Cambiar roles (Priority: P2)

**Goal**: Asignar y retirar roles sin que la persona pierda su cuenta.

**Independent Test**: Asignar un rol y comprobar que gana la capacidad; retirarlo y comprobar que
la pierde conservando el acceso.

### Tests for User Story 3 ⚠️

- [x] T027 [P] [US3] Prueba de `changeRoles` en `tests/unit/access/change-roles.test.ts`: asignar y retirar surten efecto y la persona conserva su cuenta (FR-012, FR-013)
- [x] T028 [P] [US3] Prueba de la invariante en `tests/unit/access/last-administrator.test.ts`: retirar `user:manage` al último administrador activo → `LastAdministratorError` (FR-014); con dos administradores, se permite

### Implementation for User Story 3

- [x] T029 [US3] Implementar `countActiveWithPermissionExcluding` en `src/modules/access/infrastructure/prisma-user-repository.ts`
- [x] T030 [US3] Implementar `changeRoles` en `src/modules/access/application/use-cases/change-roles.ts` con la guarda de FR-014, y exportarlo desde `src/modules/access/index.ts`
- [x] T031 [US3] Crear la página de detalle en `src/app/panel/personas/[id]/page.tsx` con la asignación de roles
- [x] T032 [US3] Crear la server action de cambio de roles en `src/app/panel/personas/[id]/actions.ts` con `authorize("user:manage")`

**Checkpoint**: los roles se administran desde la interfaz, sin poder quedarse sin administradores.

---

## Phase 6: User Story 4 - Desactivar y reactivar (Priority: P2)

**Goal**: Cortar el acceso de alguien conservando su trabajo, y poder devolvérselo.

**Independent Test**: Desactivar a alguien con sesión abierta y comprobar que deja de poder
ejecutar acciones protegidas; reactivarlo y comprobar que recupera sus roles.

### Tests for User Story 4 ⚠️

- [x] T033 [P] [US4] Prueba de `deactivatePerson` en `tests/unit/access/deactivate-person.test.ts`: desactiva en proveedor y base, y **no borra los roles**, de modo que reactivar los devuelve (FR-018)
- [x] T034 [P] [US4] Prueba de las dos guardas en `tests/unit/access/deactivate-guards.test.ts`: desactivarse a sí mismo → `SelfDeactivationError` (FR-019); desactivar al último administrador → `LastAdministratorError` (FR-014)

### Implementation for User Story 4

- [x] T035 [P] [US4] Implementar `deactivateIdentity` y `reactivateIdentity` con `users.banUser` y `users.unbanUser` en `src/modules/access/infrastructure/clerk-identity-provider.ts`
- [x] T036 [P] [US4] Implementar `setStatus` en `src/modules/access/infrastructure/prisma-user-repository.ts`
- [x] T037 [US4] Implementar `deactivatePerson` en `src/modules/access/application/use-cases/deactivate-person.ts` con las guardas de FR-019 y FR-014
- [x] T038 [US4] Implementar `reactivatePerson` en `src/modules/access/application/use-cases/reactivate-person.ts`
- [x] T039 [US4] Exportar ambos desde `src/modules/access/index.ts` y cablearlos en `src/composition/container.ts`
- [x] T040 [US4] Añadir los controles de desactivar y reactivar a `src/app/panel/personas/[id]/page.tsx` y su server action en `src/app/panel/personas/[id]/actions.ts`

**Checkpoint**: las cuatro historias funcionan.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T041 Modificar `syncSignedInUser` en `src/modules/access/application/use-cases/sync-signed-in-user.ts` para fijar `firstSignInAt` la primera vez, e implementar `markFirstSignIn` en `src/modules/access/infrastructure/prisma-user-repository.ts`
- [x] T042 Ejecutar `pnpm test tests/unit/access/sync-signed-in-user.test.ts` y confirmar que **las cinco pruebas de la 001 pasan sin modificarse**; si alguna requiere edición, el cambio dejó de ser aditivo y hay que revisar el diseño
- [x] T043 [P] Crear `scripts/smoke-people.ts` que dé de alta, cambie roles y desactive **desde Node plano**, con un `IdentityProvider` falso — la prueba del Principio III
- [x] T044 [P] Crear `scripts/check-orphans.ts` que compare identidades del proveedor contra perfiles locales y reporte huérfanos (research §R3)
- [x] T045 Verificar las violaciones de frontera: que un caso de uso no pueda importar `@clerk/*` y que `src/app/panel/personas/` no pueda importar el cliente generado; confirmar que `pnpm lint` falla en ambos casos y borrar las sondas
- [x] T046 Ejecutar `pnpm verify && pnpm build` y confirmar los gates de la constitución en verde
- [ ] T047 Recorrer los ocho escenarios de [quickstart.md](./quickstart.md), con especial atención a V5 (invariantes), V6 (autorización invocando la acción directamente) y V7 (fallo parcial)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias.
- **Foundational (Phase 2)**: depende de Setup. BLOQUEA todas las historias.
- **US1 (Phase 3)**: depende de Foundational.
- **US2 (Phase 4)**: depende de Foundational. Comparte la página con US1 pero se prueba sola.
- **US3 (Phase 5)**: depende de Foundational y de la página de detalle.
- **US4 (Phase 6)**: depende de Foundational; comparte la página de detalle con US3.
- **Polish (Phase 7)**: T041 y T042 van juntas y pueden hacerse en cuanto termine Setup.

### Within Each User Story

1. Pruebas primero, confirmando que fallan
2. Casos de uso contra puertos, con dobles
3. Infraestructura después
4. Cableado en `composition/` antes que las server actions
5. Exportar en `index.ts` antes de que cualquier adapter lo importe

### Parallel Opportunities

- T004, T005, T006 en paralelo (dominio y puerto nuevo)
- T010, T011, T012 en paralelo (pruebas de US1, archivos distintos)
- T027, T028 en paralelo; T033, T034 en paralelo
- T035, T036 en paralelo (proveedor y repositorio)
- T043, T044 en paralelo
- US3 y US4 comparten `[id]/page.tsx` y `[id]/actions.ts`: **no** son paralelizables entre sí

---

## Parallel Example: User Story 1

```bash
# Pruebas de US1 juntas (fallan primero):
Task: "createPerson en tests/unit/access/create-person.test.ts"
Task: "Duplicados en tests/unit/access/create-person-guards.test.ts"
Task: "Compensación en tests/unit/access/create-person-compensation.test.ts"
```

---

## Implementation Strategy

### MVP (US1 + US2)

Las dos son P1 y se complementan: dar de alta sin poder ver a quién diste de alta es la mitad de
una funcionalidad.

1. Fase 1 (Setup) y Fase 2 (Foundational)
2. Fase 3 (US1) → validar V1
3. Fase 4 (US2) → validar V2
4. **PARAR Y VALIDAR**: gestión de altas utilizable sin salir de la aplicación

### Incremental Delivery

1. Setup + Foundational → cimientos
2. - US1 + US2 → MVP: alta y visibilidad
3. - US3 → administración de roles en el tiempo
4. - US4 → cierre del ciclo de vida
5. - Polish → arquitectura verificada

---

## Notes

- Este feature **no crea módulos ni capas nuevas**: todo cae en `access` y en descriptores de
  `boundaries` que ya existen
- T041 es el único cambio a código de la feature 001, y T042 es su red de seguridad
- Commits con scope del módulo: `feat(access): ...`
- El sistema **no envía correos**: avisar a la persona dada de alta es una tarea humana (FR-008)
