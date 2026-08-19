---
description: "Task list for 001-clerk-auth-foundation"
---

# Tasks: Acceso por Invitación con Código de un Solo Uso

**Input**: Design documents from `/specs/001-clerk-auth-foundation/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/access-sdk.md](./contracts/access-sdk.md)

**Tests**: SÍ se incluyen. No es opcional aquí: la constitución (§Testing discipline) exige que el
dominio y los casos de uso tengan pruebas unitarias con puertos en memoria.

**Organization**: Agrupadas por historia de usuario para poder implementarlas y probarlas por
separado.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: US1, US2, US3, US4
- **[MANUAL]**: Requiere acción humana en un panel externo, no produce archivo

## Path Conventions

Según la constitución: dominio en `src/modules/access/domain/`, puertos y casos de uso en
`application/`, implementaciones en `infrastructure/`, cableado en `src/composition/`, adapters en
`src/app/` y `src/components/`. Cliente Prisma generado **fuera** de `src/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Cerrar el hueco del linter ANTES de instalar nada, y dejar el toolchain listo.

⚠️ **T001–T003 van primero a propósito.** Si Clerk entra al proyecto antes de que el linter lo
cubra, el Principio VI nace roto justo en el feature que introduce el proveedor de auth
(research §R8).

- [x] T001 Añadir `@clerk/*` a `FRAMEWORK_PACKAGES` y `@prisma/*` + `@generated/*` a `INFRA_ONLY_PACKAGES` en `eslint.config.mjs`
- [x] T002 Verificar T001 con violaciones deliberadas: crear temporalmente un archivo en `src/modules/access/application/` que importe `@clerk/nextjs/server`, confirmar que `pnpm lint` falla, y borrarlo
- [x] T003 Verificar que un adapter SÍ puede importar `@clerk/nextjs`: crear temporalmente un import en `src/app/page.tsx`, confirmar que `pnpm lint` pasa, y borrarlo
- [x] T004 Instalar dependencias de datos e identidad: `pnpm add @prisma/client @prisma/adapter-pg @clerk/nextjs` y `pnpm add -D prisma tsx`
- [x] T005 [P] Instalar y configurar Vitest en `vitest.config.ts` con alias `@/*` hacia `src/`
- [x] T006 [P] Añadir alias `@generated/*` → `./prisma/generated/*` en `tsconfig.json` (junto al `@/*` existente)
- [x] T007 [P] Añadir scripts `test`, `db:migrate`, `db:seed`, `db:studio` a `package.json` y sumar `test` al script `verify`
- [x] T008 Crear `prisma.config.ts` en la raíz cargando `.env.local` explícitamente con `dotenv` (el CLI de Prisma lee `.env` por defecto, Next.js lee `.env.local`; deben ser el mismo archivo)
- [x] T009 [MANUAL] Crear `.env.local` a partir de `.env.example` con `DATABASE_URL` (cadena `postgres://` directa, no `prisma+postgres://`) y las claves de Clerk

**Checkpoint**: `pnpm verify` pasa y el linter cubre Clerk, Prisma y el cliente generado.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Conexión a base de datos, reloj inyectable y raíz de composición. Sin modelos todavía
— cada historia trae los suyos.

**⚠️ CRITICAL**: Ninguna historia puede empezar hasta terminar esta fase.

- [x] T010 Crear `prisma/schema.prisma` con datasource `postgresql`, generador `prisma-client` y `output = "../prisma/generated/client"` (NO `app/generated/` — ver research §R4)
- [x] T011 Verificar la conexión a Prisma Postgres con `pnpm prisma db execute --stdin <<< "SELECT 1"` y confirmar que la cadena directa funciona
- [x] T012 [P] Crear el puerto `Clock` y su implementación `SystemClock` en `src/shared/clock.ts`
- [x] T013 [P] Crear tipos base de resultado y error compartidos en `src/shared/result.ts`
- [x] T014 Crear `src/composition/env.ts` que lea y valide `DATABASE_URL`, `CLERK_SECRET_KEY` y `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` al arrancar, y falle con mensaje claro si falta alguna
- [x] T015 Crear el singleton del cliente Prisma en `src/composition/prisma.ts` con el patrón global para hot-reload, usando `@prisma/adapter-pg`
- [x] T016 Crear el esqueleto del contenedor de dependencias en `src/composition/container.ts` (sin casos de uso todavía)
- [x] T017 [P] Crear los errores de dominio compartidos en `src/modules/access/domain/errors.ts`: `NotAuthenticatedError`, `UserInactiveError`, `PermissionDeniedError`, `UserNotProvisionedError`
- [x] T018 [P] Crear los value objects `UserId`, `IdentityId`, `Email` y `PermissionKey` en `src/modules/access/domain/values.ts`, con `Email` normalizando a minúsculas en su constructor (FR-016)
- [x] T019 [P] Prueba unitaria de `Email` en `tests/unit/access/values.test.ts`: `A@B.GT` y `a@b.gt` producen el mismo valor; un formato inválido es rechazado

**Checkpoint**: hay conexión a base, reloj inyectable y contenedor. Las historias pueden empezar.

---

## Phase 3: User Story 1 - Iniciar sesión con enlace mágico (Priority: P1) 🎯 MVP

**Goal**: Una persona invitada entra con enlace mágico y la aplicación la reconoce.

**Independent Test**: Con una cuenta invitada, pedir acceso en `/ingresar`, abrir el enlace del
correo y llegar a `/panel` viendo la identidad. No requiere base de datos ni roles.

**Nota de arquitectura**: esta historia es **solo adapters**. El flujo de autenticación es 100% de
Clerk y nunca toca la capa de negocio (research §R7); mostrar el nombre con `<UserButton />` es UI,
no lógica de negocio. Por eso US1 se entrega sin tocar `domain/` ni `application/`.

- [ ] T020 [US1] [MANUAL] Confirmar en el dashboard de Clerk que **email link (magic link)** está habilitado y la contraseña desactivada
- [x] T021 [US1] Crear `src/proxy.ts` exportando `clerkMiddleware()` con `config.matcher` que incluya `'/(api|trpc)(.*)'` y `'/__clerk/:path*'` (Next 16 usa `proxy.ts`, no `middleware.ts` — research §R1)
- [x] T022 [US1] Envolver la aplicación con `<ClerkProvider>` **dentro de `<body>`** en `src/app/layout.tsx`, con `localization` en español
- [x] T023 [US1] [P] Crear la pantalla de ingreso con `<SignIn />` en `src/app/ingresar/[[...rest]]/page.tsx`, sin ningún enlace ni componente de registro
- [x] T024 [US1] ~~Ruta `/ingresar/verificar` separada~~ — DESCARTADA: la ruta catch-all `[[...rest]]` de Clerk ya cubre la verificación; una página estática ahí ganaría sobre el catch-all y rompería el canje del enlace
- [x] T025 [US1] Crear la pantalla autenticada `/panel` en `src/app/panel/page.tsx` mostrando la identidad de la sesión
- [x] T026 [US1] [P] Crear los controles de sesión (`<UserButton />`, cerrar sesión) en `src/components/auth/session-controls.tsx` (FR-010)
- [x] T027 [US1] Proteger `/panel` en `src/proxy.ts` dejando públicas `/`, `/ingresar` y sus subrutas
- [ ] T028 [US1] Verificar el escenario V1 de [quickstart.md](./quickstart.md): enlace recibido, ingreso sin contraseña, y segundo uso del mismo enlace rechazado (FR-003, FR-004)

**Checkpoint**: se puede entrar y salir. MVP demostrable.

---

## Phase 4: User Story 2 - Rechazar a quien no está autorizado (Priority: P1)

**Goal**: Quien no fue invitado no entra y no se le crea cuenta.

**Independent Test**: Escribir un correo no invitado en `/ingresar` y comprobar que no hay cuenta
nueva, no hay sesión, y el mensaje no revela si el correo existe.

**Nota**: el control real es la configuración del proveedor, no el código. Ocultar el botón de
registro es cosmético (research §R3).

- [ ] T029 [US2] [MANUAL] Confirmar en el dashboard de Clerk que el Access mode es **Restricted / Invite-only**
- [x] T030 [US2] Auditar `src/app/` y `src/components/` con `grep -rn "SignUp"` y confirmar cero componentes de registro (FR-007)
- [x] T031 [US2] Configurar en `src/app/ingresar/[[...rest]]/page.tsx` que el mensaje de error sea genérico y no distinga entre correo existente e inexistente (FR-008)
- [x] T032 [US2] Verificar que la URL de sign-up de Clerk, invocada directamente, no permite crear cuenta — la prueba crítica del escenario V2 de [quickstart.md](./quickstart.md)
- [x] T033 [US2] Documentar en `src/app/ingresar/[[...rest]]/page.tsx` (comentario) que el modo solo-invitación es configuración del proveedor y que quitarlo abre el registro aunque no haya botón
- [ ] T034 [US2] Confirmar la limitación de solicitudes repetidas por correo y origen que ofrece el proveedor, y documentar el límite efectivo en [research.md](./research.md) (FR-011)

**Checkpoint**: US1 y US2 funcionan juntas. El acceso es realmente por invitación.

---

## Phase 5: User Story 3 - Perfil de negocio sincronizado (Priority: P2)

**Goal**: Al entrar, la persona tiene un perfil interno creado o actualizado, sin credenciales.

**Independent Test**: Entrar por primera vez y ver una fila en `User`; volver a entrar y que siga
habiendo una sola; cambiar el nombre en Clerk y verlo reflejado.

### Tests for User Story 3 ⚠️

> Escribir primero y confirmar que fallan antes de implementar.

- [x] T035 [P] [US3] Crear dobles en memoria `InMemoryUserRepository` y `StubIdentityProvider` en `tests/unit/access/doubles.ts`
- [x] T036 [P] [US3] Prueba de `syncSignedInUser` en `tests/unit/access/sync-signed-in-user.test.ts`: crea el perfil la primera vez, lo reutiliza la segunda (FR-013), y actualiza el nombre cuando cambia (FR-014)
- [x] T037 [P] [US3] Prueba de sesión ausente e identidad inactiva en `tests/unit/access/sync-signed-in-user-guards.test.ts`: sin sesión → `NotAuthenticatedError`, inactiva → `UserInactiveError` (FR-009)

### Implementation for User Story 3

- [x] T038 [P] [US3] Crear la entidad `User` en `src/modules/access/domain/user.ts` sin ningún campo de credencial (FR-015)
- [x] T039 [P] [US3] Definir el puerto `IdentityProvider` y el tipo `ExternalIdentity` en `src/modules/access/application/ports/identity-provider.ts`, en vocabulario de negocio y sin tipos de Clerk
- [x] T040 [P] [US3] Definir el puerto `UserRepository` en `src/modules/access/application/ports/user-repository.ts`
- [x] T041 [US3] Implementar el caso de uso `syncSignedInUser` en `src/modules/access/application/use-cases/sync-signed-in-user.ts` recibiendo `{ identity, users, clock }` (depende de T038–T040)
- [x] T042 [US3] Implementar el caso de uso `getCurrentUser` en `src/modules/access/application/use-cases/get-current-user.ts`
- [x] T043 [US3] PARCIAL (esquema escrito + cliente generado; falta `pnpm db:migrate`, bloqueado por DATABASE_URL) Añadir los modelos `User` y el enum `UserStatus` a `prisma/schema.prisma` según [data-model.md](./data-model.md), y ejecutar `pnpm db:migrate`
- [x] T044 [US3] Implementar `ClerkIdentityProvider` en `src/modules/access/infrastructure/clerk-identity-provider.ts` — único archivo del módulo que importa `@clerk/nextjs/server` y traduce su forma a `ExternalIdentity`
- [x] T045 [US3] Implementar `PrismaUserRepository` en `src/modules/access/infrastructure/prisma-user-repository.ts`, traduciendo entre filas de Prisma y la entidad de dominio
- [x] T046 [US3] Exportar `syncSignedInUser`, `getCurrentUser`, el tipo `User` y los errores desde `src/modules/access/index.ts`
- [x] T047 [US3] Cablear las concretas en `src/composition/container.ts` y exponer las fábricas de los dos casos de uso
- [x] T048 [US3] Llamar a `syncSignedInUser` desde `src/app/panel/page.tsx` y mostrar el perfil interno en lugar de la identidad cruda de Clerk
- [x] T049 [US3] Verificar el escenario V4 de [quickstart.md](./quickstart.md): `grep -riE 'password|passwordHash|sessionToken|mfaSecret' prisma/schema.prisma` sin coincidencias (SC-004)

**Checkpoint**: hay perfiles de negocio sincronizados, sin credenciales almacenadas.

---

## Phase 6: User Story 4 - Autorización por roles y permisos (Priority: P3)

**Goal**: Las acciones protegidas se permiten o niegan según los permisos de la persona.

**Independent Test**: Dos personas con roles distintos; una ejecuta una acción protegida y la otra
la recibe denegada, incluso invocando la acción directamente.

### Tests for User Story 4 ⚠️

- [x] T050 [P] [US4] Añadir `InMemoryRoleRepository` a `tests/unit/access/doubles.ts`
- [x] T051 [P] [US4] Prueba de `authorize` en `tests/unit/access/authorize.test.ts`: sin roles → `PermissionDeniedError` (FR-020); con el permiso vía rol → pasa; usuario inactivo → `UserInactiveError` aunque tenga el rol
- [x] T052 [P] [US4] Prueba de `assignRole` y `revokeRole` en `tests/unit/access/role-management.test.ts`: retirar el rol quita el permiso sin recrear la cuenta (FR-021)

### Implementation for User Story 4

- [x] T053 [P] [US4] Crear las entidades `Role` y `Permission` en `src/modules/access/domain/role.ts` y `src/modules/access/domain/permission.ts`, con `key` separado de `name` según [data-model.md](./data-model.md)
- [x] T054 [P] [US4] Definir el puerto `RoleRepository` en `src/modules/access/application/ports/role-repository.ts`
- [x] T055 [US4] Extender `UserRepository` con `listRoles(userId)` en `src/modules/access/application/ports/user-repository.ts`
- [x] T056 [US4] Implementar `authorize` en `src/modules/access/application/use-cases/authorize.ts` — lanza `PermissionDeniedError`, niega por omisión (FR-019, FR-020)
- [x] T057 [P] [US4] Implementar `can` en `src/modules/access/application/use-cases/can.ts` — variante no lanzante, solo para decidir qué mostrar
- [x] T058 [P] [US4] Implementar `assignRole` en `src/modules/access/application/use-cases/assign-role.ts`
- [x] T059 [P] [US4] Implementar `revokeRole` en `src/modules/access/application/use-cases/revoke-role.ts`
- [x] T060 [US4] PARCIAL (esquema escrito + cliente generado; falta `pnpm db:migrate`, bloqueado por DATABASE_URL) Añadir los modelos `Role`, `Permission`, `UserRole` y `RolePermission` a `prisma/schema.prisma` y ejecutar `pnpm db:migrate`
- [x] T061 [US4] Implementar `PrismaRoleRepository` en `src/modules/access/infrastructure/prisma-role-repository.ts`
- [x] T062 [US4] Extender `PrismaUserRepository` con `listRoles` en `src/modules/access/infrastructure/prisma-user-repository.ts`
- [x] T063 [US4] Exportar `authorize`, `can`, `assignRole`, `revokeRole` y los tipos `Role`/`Permission` desde `src/modules/access/index.ts`
- [x] T064 [US4] Cablear `RoleRepository` y los cuatro casos de uso en `src/composition/container.ts`
- [x] T065 [US4] Crear `prisma/seed.ts` idempotente con el catálogo `admin`/`editor`/`viewer` y sus permisos según [data-model.md](./data-model.md), que **no cree usuarios** y solo asigne `admin` a un `identityId` recibido como parámetro (FR-025)
- [x] T066 [US4] Crear una server action protegida de demostración en `src/app/panel/actions.ts` que llame a `authorize("user:read")` antes de actuar, sin lógica de negocio propia
- [x] T067 [US4] Ocultar el control correspondiente en `src/app/panel/page.tsx` usando `can`, dejando claro en un comentario que ocultar **no** sustituye a `authorize` (FR-022)
- [ ] T068 [US4] Verificar el escenario V5 de [quickstart.md](./quickstart.md) invocando la server action **directamente** con una cuenta sin permiso (FR-022)

**Checkpoint**: las cuatro historias funcionan de forma independiente.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T069 [P] Manejar la indisponibilidad del proveedor de identidad con un mensaje comprensible en `src/app/error.tsx`, sin conceder acceso ni mostrar error técnico (FR-024)
- [x] T070 [P] Crear `scripts/smoke-access.ts` que instancie el contenedor y llame a `getCurrentUser` y `authorize` **desde Node plano**, sin React ni Next — la prueba real del Principio III
- [x] T071 Verificar las cuatro violaciones de frontera de la tabla de [quickstart.md](./quickstart.md), confirmando que cada una hace fallar `pnpm lint`, y borrarlas
- [x] T072 [P] Escribir `README.md` enlazando la constitución y explicando la estructura de capas (pendiente marcado desde el sync report de la constitución)
- [x] T073 [P] Eliminar los `.gitkeep` de `src/modules`, `src/composition`, `src/shared` y `src/components` ya que tienen archivos reales
- [x] T074 Ejecutar `pnpm verify && pnpm test && pnpm build` y confirmar los cuatro gates de la constitución en verde
- [ ] T075 Recorrer los seis escenarios V1–V6 de [quickstart.md](./quickstart.md) de principio a fin

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias. **T001–T003 antes que T004** — el linter debe cubrir a
  Clerk antes de que Clerk entre al proyecto.
- **Foundational (Phase 2)**: depende de Setup. BLOQUEA todas las historias.
- **US1 (Phase 3)**: depende de Foundational. Independiente del resto — es solo adapters.
- **US2 (Phase 4)**: depende de Foundational. Se apoya en las pantallas de US1 pero se prueba sola.
- **US3 (Phase 5)**: depende de Foundational. Independiente de US1/US2 en la capa de negocio.
- **US4 (Phase 6)**: depende de Foundational y de la entidad `User` (T038) y `UserRepository`
  (T040) de US3. Es la única dependencia real entre historias.
- **Polish (Phase 7)**: depende de las historias que se quieran entregar.

### Within Each User Story

Orden obligado por la dirección de dependencias (constitución):

1. Pruebas primero, confirmando que fallan
2. Entidades de dominio antes que casos de uso
3. Puertos antes que sus implementaciones
4. Casos de uso (contra puertos, con dobles) antes que la infraestructura
5. Infraestructura antes que el cableado en `composition/`
6. Cableado antes que server actions y componentes
7. Exportar en `index.ts` antes de que cualquier adapter lo importe

### Parallel Opportunities

- T005, T006, T007 en paralelo (archivos distintos)
- T012, T013, T017, T018, T019 en paralelo (dominio y shared, sin dependencias entre sí)
- T023, T024, T026 en paralelo (pantallas y componentes distintos)
- T035, T036, T037 en paralelo (pruebas de US3)
- T038, T039, T040 en paralelo (entidad y puertos de US3)
- T050, T051, T052 en paralelo (pruebas de US4)
- T053, T054 en paralelo; T057, T058, T059 en paralelo (casos de uso en archivos distintos)
- US3 y US4 no pueden ir en paralelo entre sí: US4 necesita T038 y T040

---

## Parallel Example: User Story 3

```bash
# Pruebas de US3 juntas (fallan primero):
Task: "Dobles en memoria en tests/unit/access/doubles.ts"
Task: "Prueba de sync en tests/unit/access/sync-signed-in-user.test.ts"
Task: "Prueba de guardas en tests/unit/access/sync-signed-in-user-guards.test.ts"

# Dominio y puertos de US3 juntos:
Task: "Entidad User en src/modules/access/domain/user.ts"
Task: "Puerto IdentityProvider en src/modules/access/application/ports/identity-provider.ts"
Task: "Puerto UserRepository en src/modules/access/application/ports/user-repository.ts"
```

---

## Implementation Strategy

### MVP First (US1 + US2)

Las dos son P1 y forman una unidad: entrar, y que no entre quien no debe. Entregar solo US1 dejaría
la aplicación abierta, que es peor que no tenerla.

1. Fase 1 (Setup) — con T001–T003 antes de instalar
2. Fase 2 (Foundational)
3. Fase 3 (US1) → **validar V1**
4. Fase 4 (US2) → **validar V2, incluida la prueba de la URL directa de sign-up**
5. **PARAR Y VALIDAR**: hay acceso por invitación funcionando

### Incremental Delivery

1. Setup + Foundational → cimientos
2. - US1 + US2 → MVP: acceso controlado
3. - US3 → perfiles de negocio, base para autoría e historial
4. - US4 → autorización por roles
5. - Polish → arquitectura verificada y documentada

---

## Notes

- Cada tarea `[MANUAL]` requiere acción tuya en el dashboard de Clerk; no produce archivo
- Commits siguiendo Conventional Commits, con scope del módulo: `feat(access): ...`
- Los `.gitkeep` se borran cuando la carpeta ya tiene archivos reales (T073)
- Ninguna tarea introduce SQL, ORM ni SDK de proveedor bajo `src/app/` o `src/components/`
- La verificación de fronteras (T002, T003, T071) no es opcional: una regla no probada es una regla
  que se cree que funciona
