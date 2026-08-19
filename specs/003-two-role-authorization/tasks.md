---
description: "Task list for 003-two-role-authorization"
---

# Tasks: Autorización de Dos Roles

**Input**: Design documents from `/specs/003-two-role-authorization/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/authorization-sdk.md)

**Tests**: SÍ. La constitución (§Testing discipline) exige pruebas unitarias de dominio y casos de
uso con puertos en memoria. Aquí además son la única forma de verificar las cuatro guardas.

⚠️ **Este feature NO es aditivo**: elimina el modelo de roles de las features 001 y 002. Sus
pruebas van a cambiar, y eso es correcto (research §R7).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Paralelizable (archivos distintos, sin dependencias pendientes)
- **[Story]**: US1, US2, US3, US4

## Convenciones obligatorias

Props `<ComponentName>Props`, cero comentarios, identificadores en inglés con español solo en
texto de pantalla, estilos en `.module.scss`.

---

## Phase 1: Setup — el corazón del feature, puro y sin dependencias

**Purpose**: Catálogo de áreas y regla de autorización. Todo lo demás se apoya en esto.

- [x] T001 [P] Crear el catálogo de áreas y los tipos `ModuleKey`, `Action`, `PermissionKey`, `UserRole` en `src/modules/access/domain/modules.ts`, con `access` como única área
- [x] T002 [P] Implementar `grants(person, granted, permission)` en `src/modules/access/domain/authorization.ts` según la sección 2 de [contracts/](./contracts/authorization-sdk.md)
- [x] T003 [P] Añadir `AdminRequiredError`, `SelfDemotionError`, `MemberWithoutPermissionsError` y `UnknownPermissionError` en `src/modules/access/domain/errors.ts`
- [x] T004 Prueba de `grants` en `tests/unit/access/authorization.test.ts`: un admin obtiene true para cualquier clave incluso sin permisos concedidos; un member solo para las concedidas; un member con el conjunto vacío obtiene false siempre
- [x] T005 Prueba de tipos en `tests/unit/access/permission-key.test.ts`: verificar que el catálogo genera exactamente las claves esperadas para `access`

**Checkpoint**: la regla de autorización existe y está probada, sin tocar base de datos ni UI.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Esquema, puertos y dobles. Elimina el modelo viejo.

**⚠️ CRITICAL**: Ninguna historia puede empezar hasta terminar esta fase.

- [x] T006 Añadir `UserRole` enum, `users.role` con `@default(MEMBER)`, índice por `role`, y el modelo `UserPermission` en `prisma/schema.prisma` según [data-model.md](./data-model.md)
- [x] T007 Sustituir el enum `AdminActionType` por `USER_CREATED`, `ROLE_CHANGED`, `PERMISSION_GRANTED`, `PERMISSION_REVOKED`, `USER_DEACTIVATED`, `USER_REACTIVATED` y renombrar `role_key` a `detail` en `prisma/schema.prisma`
- [x] T008 Eliminar los modelos `Role`, `Permission`, `UserRole` (join) y `RolePermission` de `prisma/schema.prisma`
- [x] T009 Ejecutar `pnpm db:migrate --name two_role_authorization` y confirmar que las cuatro tablas desaparecen y `user_permissions` existe
- [x] T010 [P] Añadir `role` a la entidad `User` en `src/modules/access/domain/user.ts` y eliminar `src/modules/access/domain/role.ts` y `src/modules/access/domain/permission.ts`
- [x] T011 [P] Actualizar `src/modules/access/domain/index.ts` para exportar el catálogo y `grants`, y dejar de exportar `Role`, `Permission`, `rolesGrant` y `permissionKeysOf`
- [x] T012 Extender `UserRepository` con `listPermissions`, `grantPermissions`, `revokePermissions`, `setRole`, `countActiveAdminsExcluding` y `createWithRole` en `src/modules/access/application/ports/user-repository.ts`, y eliminar `listRoles`
- [x] T013 Eliminar el puerto `src/modules/access/application/ports/role-repository.ts` y su implementación `src/modules/access/infrastructure/prisma-role-repository.ts`
- [x] T014 Actualizar `InMemoryUserRepository` con los métodos nuevos y eliminar `InMemoryRoleRepository` en `tests/unit/access/doubles.ts`
- [x] T015 Reescribir `authorize` sobre `grants` en `src/modules/access/application/use-cases/authorize.ts` y `can` en `src/modules/access/application/use-cases/can.ts`
- [x] T016 Eliminar los casos de uso `assign-role.ts`, `revoke-role.ts` y `change-roles.ts` de `src/modules/access/application/use-cases/`, y sus pruebas `tests/unit/access/role-management.test.ts` y `tests/unit/access/change-roles.test.ts`
- [x] T017 Actualizar la guarda de último administrador en `src/modules/access/application/use-cases/deactivate-person.ts` para contar por rol con `countActiveAdminsExcluding`
- [x] T018 Actualizar `tests/unit/access/authorize.test.ts` y `tests/unit/access/last-administrator.test.ts` al modelo nuevo, conservando su intención: negar por omisión, denegar a inactivos, no quedarse sin administradores

**Checkpoint**: el modelo viejo ya no existe, `pnpm verify` en verde con las pruebas actualizadas.

---

## Phase 3: User Story 1 - Alta de administrador en un solo paso (Priority: P1) 🎯 MVP

**Goal**: Dar de alta a un administrador sin decidir ningún permiso, y que su autoridad alcance
áreas que aún no existen.

**Independent Test**: Dar de alta a alguien como administrador sin marcar nada, comprobar que
puede operar el área existente, añadir un área nueva al catálogo y comprobar que también la opera
**sin que nadie haya tocado sus datos**.

### Tests for User Story 1 ⚠️

- [x] T019 [P] [US1] Prueba de `createPerson` con rol admin en `tests/unit/access/create-admin.test.ts`: se crea sin permisos, y `listPermissions` devuelve un conjunto vacío (FR-006)
- [x] T020 [P] [US1] Prueba de la guarda de rol en `tests/unit/access/admin-required.test.ts`: un member no puede dar de alta a nadie, ni siquiera con todos los permisos concedidos (FR-018)
- [x] T021 [P] [US1] Prueba de áreas futuras en `tests/unit/access/future-modules.test.ts`: `grants` devuelve true para una clave de un área que no estaba al crear al administrador (FR-007, SC-002)

### Implementation for User Story 1

- [x] T022 [US1] Implementar la guarda `requireAdmin(actor)` en `src/modules/access/domain/authorization.ts`, que lanza `AdminRequiredError` y no depende de permisos
- [x] T023 [US1] Reescribir `createPerson` en `src/modules/access/application/use-cases/create-person.ts` para recibir `role` y `permissionKeys`, aplicar `requireAdmin` y rechazar permisos cuando el rol es admin
- [x] T024 [US1] Implementar `createWithRole` en `src/modules/access/infrastructure/prisma-user-repository.ts`, escribiendo persona y permisos en una sola transacción
- [x] T025 [US1] Actualizar la superficie pública en `src/modules/access/index.ts` según la sección 3 de [contracts/](./contracts/authorization-sdk.md)
- [x] T026 [US1] Actualizar `src/composition/container.ts` para dejar de cablear `RoleRepository`
- [x] T027 [US1] Añadir el selector de rol a `src/app/panel/personas/create-person-form.tsx`, ocultando la selección de permisos cuando se elige administración (FR-015)
- [x] T028 [US1] Actualizar `createPersonAction` en `src/app/panel/personas/actions.ts` para pasar rol y permisos, y traducir `AdminRequiredError`
- [x] T029 [US1] Reducir `prisma/seed.ts` a conceder el rol `ADMIN` al `--admin=<identityId>` indicado, eliminando el catálogo de roles y permisos

**Checkpoint**: se puede dar de alta administradores sin enumerar permisos. Validar V1 y V2.

---

## Phase 4: User Story 2 - Alta de miembro con permisos explícitos (Priority: P1)

**Goal**: Dar de alta a un miembro obligando a marcar qué puede hacer y dónde.

**Independent Test**: Dar de alta a alguien como miembro con solo lectura en un área, comprobar
que puede leer ahí y que todo lo demás le es negado.

### Tests for User Story 2 ⚠️

- [x] T030 [P] [US2] Prueba de alta de miembro en `tests/unit/access/create-member.test.ts`: se conceden exactamente los permisos indicados, ni uno más
- [x] T031 [P] [US2] Prueba de FR-010 en `tests/unit/access/member-requires-permissions.test.ts`: dar de alta un miembro sin permisos lanza `MemberWithoutPermissionsError`
- [x] T032 [P] [US2] **Prueba de escalada** en `tests/unit/access/privilege-escalation.test.ts`: un miembro con **todos** los permisos del catálogo no puede cambiar roles ni conceder permisos (FR-019, SC-004)
- [x] T033 [P] [US2] Prueba de claves desconocidas en `tests/unit/access/unknown-permission.test.ts`: conceder una clave fuera del catálogo lanza `UnknownPermissionError`

### Implementation for User Story 2

- [x] T034 [US2] Añadir a `createPerson` la validación de FR-010 y la de claves contra el catálogo en `src/modules/access/application/use-cases/create-person.ts`
- [x] T035 [US2] Implementar `listPermissions` y `grantPermissions` en `src/modules/access/infrastructure/prisma-user-repository.ts`
- [x] T036 [US2] Crear la matriz de áreas × operaciones en `src/app/panel/personas/permission-matrix.tsx`, renderizada desde el catálogo
- [x] T037 [US2] Integrar la matriz en `src/app/panel/personas/create-person-form.tsx`, visible solo cuando el rol es miembro
- [x] T038 [US2] Añadir los estilos de la matriz a `src/app/panel/personas/personas.module.scss`
- [x] T039 [US2] Mostrar rol y permisos concedidos en `src/app/panel/personas/people-table.tsx`

**Checkpoint**: US1 y US2 juntas dan el modelo completo de alta. Validar V3 y V4. **MVP.**

---

## Phase 5: User Story 3 - Ajustar los permisos de un miembro (Priority: P2)

**Goal**: Conceder y retirar permisos después del alta.

**Independent Test**: Conceder una operación y comprobar que la gana; retirarla y comprobar que la
pierde sin perder el acceso al sistema.

- [x] T040 [P] [US3] Prueba de `changePermissions` en `tests/unit/access/change-permissions.test.ts`: conceder y retirar surten efecto, conceder dos veces no duplica (FR-012), y retirar todo conserva la cuenta (FR-013)
- [x] T041 [US3] Implementar `changePermissions` en `src/modules/access/application/use-cases/change-permissions.ts` con `requireAdmin` y validación contra el catálogo
- [x] T042 [US3] Implementar `revokePermissions` en `src/modules/access/infrastructure/prisma-user-repository.ts`
- [x] T043 [US3] Exportar `changePermissions` desde `src/modules/access/index.ts` y cablearlo en `src/composition/container.ts`
- [x] T044 [US3] Añadir la edición de permisos a `src/app/panel/personas/[id]/person-controls.tsx`, visible solo para administradores
- [x] T045 [US3] Sustituir `changeRolesAction` por `changePermissionsAction` en `src/app/panel/personas/[id]/actions.ts`

**Checkpoint**: los permisos de un miembro se administran desde la interfaz.

---

## Phase 6: User Story 4 - Cambiar el rol de una persona (Priority: P3)

**Goal**: Promover a administrador o degradar a miembro, sin poder bloquear el sistema.

**Independent Test**: Promover a un miembro y comprobar que gana todo sin seleccionar nada;
degradar a un administrador y comprobar que el sistema exige indicar permisos.

### Tests for User Story 4 ⚠️

- [x] T046 [P] [US4] Prueba de `changeRole` en `tests/unit/access/change-role.test.ts`: promover da autoridad total sin permisos; degradar exige permisos explícitos (FR-016) y no restaura los antiguos
- [x] T047 [P] [US4] Prueba de las dos guardas en `tests/unit/access/role-change-guards.test.ts`: degradar al último administrador lanza `LastAdministratorError`; degradarse a sí mismo lanza `SelfDemotionError` **aunque quede otro administrador** (FR-020, FR-021)

### Implementation for User Story 4

- [x] T048 [US4] Implementar `changeRole` en `src/modules/access/application/use-cases/change-role.ts` con las tres guardas: `requireAdmin`, último administrador y autodegradación
- [x] T049 [US4] Implementar `setRole` y `countActiveAdminsExcluding` en `src/modules/access/infrastructure/prisma-user-repository.ts`
- [x] T050 [US4] Exportar `changeRole` desde `src/modules/access/index.ts` y cablearlo en `src/composition/container.ts`
- [x] T051 [US4] Añadir el cambio de rol a `src/app/panel/personas/[id]/person-controls.tsx`, exigiendo permisos al degradar
- [x] T052 [US4] Añadir `changeRoleAction` a `src/app/panel/personas/[id]/actions.ts`, traduciendo `LastAdministratorError` y `SelfDemotionError`

**Checkpoint**: las cuatro historias funcionan. Validar V6 y V7.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T053 [P] Explicar a un miembro sin permisos por qué no ve contenido en `src/app/panel/page.tsx`, en lugar de mostrar una pantalla vacía (FR-024)
- [x] T054 [P] Registrar los tipos nuevos de acción administrativa en `src/modules/access/application/ports/audit-log.ts` y en `src/modules/access/infrastructure/prisma-audit-log.ts` (FR-025)
- [x] T055 [P] Ampliar `scripts/check-orphans.ts` para reportar permisos concedidos sobre áreas que ya no están en el catálogo (research §R0)
- [x] T056 [P] Actualizar `scripts/smoke-people.ts` al SDK nuevo: crear admin, crear member con permisos, cambiar permisos, cambiar rol
- [x] T057 Verificar que `role === "admin"` solo aparece en `src/modules/access/domain/authorization.ts`, con `grep -rn 'role === ' src/modules/access`
- [x] T058 Verificar las fronteras: que un caso de uso no pueda importar `@clerk/*` ni infraestructura, confirmando que `pnpm lint` falla, y borrar las sondas
- [x] T059 Enmendar SC-008 en `specs/003-two-role-authorization/spec.md`: los permisos huérfanos son **detectables e inertes**, no inexistentes (research §R0)
- [x] T060 Ejecutar `pnpm verify && pnpm build` y confirmar los gates de la constitución en verde
- [ ] T061 Recorrer los nueve escenarios de [quickstart.md](./quickstart.md), con atención especial a V2 (áreas futuras), V4 (escalada) y V7 (invariantes)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias. Es dominio puro.
- **Foundational (Phase 2)**: depende de Setup. BLOQUEA todas las historias. Aquí se rompe el
  modelo viejo, así que el repositorio queda inconsistente hasta terminarla.
- **US1 (Phase 3)**: depende de Foundational.
- **US2 (Phase 4)**: depende de Foundational y de T023 (`createPerson` reescrito).
- **US3 (Phase 5)**: depende de Foundational. Independiente de US1 y US2 en la capa de negocio.
- **US4 (Phase 6)**: depende de Foundational y de T022 (`requireAdmin`).
- **Polish (Phase 7)**: depende de las historias entregadas.

### Within Each User Story

1. Pruebas primero, confirmando que fallan
2. Dominio antes que casos de uso
3. Casos de uso contra puertos, con dobles
4. Infraestructura después
5. Cableado antes que server actions
6. Exportar en `index.ts` antes de que un adapter lo importe

### Parallel Opportunities

- T001, T002, T003 en paralelo (dominio puro, archivos distintos)
- T010, T011 en paralelo
- T019, T020, T021 en paralelo (pruebas de US1)
- T030 a T033 en paralelo (pruebas de US2)
- T046, T047 en paralelo
- T053 a T056 en paralelo
- US3 y US4 comparten `[id]/person-controls.tsx` y `[id]/actions.ts`: **no** paralelizables entre sí

---

## Parallel Example: User Story 2

```bash
Task: "Alta de miembro en tests/unit/access/create-member.test.ts"
Task: "FR-010 en tests/unit/access/member-requires-permissions.test.ts"
Task: "Escalada en tests/unit/access/privilege-escalation.test.ts"
Task: "Clave desconocida en tests/unit/access/unknown-permission.test.ts"
```

---

## Implementation Strategy

### MVP (US1 + US2)

Ambas son P1 y forman el modelo completo: sin US1 no hay forma barata de dar acceso total, y sin
US2 la única forma de dar acceso es darlo todo.

1. Fase 1 (dominio) y Fase 2 (esquema y puertos)
2. Fase 3 (US1) → validar **V2**, la prueba de áreas futuras
3. Fase 4 (US2) → validar **V4**, la prueba de escalada
4. **PARAR Y VALIDAR**: el modelo de dos roles funciona y no se puede eludir

### Incremental Delivery

1. Setup + Foundational → el modelo viejo desaparece
2. - US1 + US2 → MVP: los dos roles con su semántica completa
3. - US3 → ajuste de permisos en el tiempo
4. - US4 → cambio de rol con sus invariantes
5. - Polish → arquitectura verificada y spec enmendada

---

## Notes

- La Fase 2 deja el repositorio temporalmente roto: elimina el modelo viejo antes de que el nuevo
  esté completo. Es inevitable en un cambio no aditivo, y por eso es una sola fase bloqueante
- Las pruebas de 001 y 002 que dependían de roles **deben** cambiar (T016, T018); lo que debe
  sobrevivir es su intención, no su forma
- T032 y T057 son las dos verificaciones que sostienen el modelo: sin la primera, la escalada es
  posible; sin la segunda, la política de autorización se dispersa
- Commits con scope del módulo: `feat(access): ...`
