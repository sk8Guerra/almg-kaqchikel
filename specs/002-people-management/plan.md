# Implementation Plan: Gestión de Personas desde el Panel

**Branch**: `002-people-management` | **Date**: 2026-08-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-people-management/spec.md`

## Summary

Llevar la gestión de personas al panel de la aplicación: dar de alta con su rol en un solo acto,
ver quién tiene acceso, cambiar roles y desactivar. Hoy eso exige dos sistemas y dos momentos
separados, porque el perfil solo nace cuando la persona entra por primera vez.

El alta crea la identidad en el proveedor y el perfil local con sus roles **en un solo acto**,
sin invitaciones y sin enviar ningún correo. La persona entra por su cuenta cuando quiera,
pidiendo su código en la pantalla de acceso, y como ya tiene roles asignados puede trabajar desde
el primer minuto.

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict) — pin deliberado, ver constitución §Tooling

**Primary Dependencies**: Next.js 16.3.1, React 19.2.8, `@clerk/nextjs` 7.7.8
(`@clerk/backend` 3.16.8), `prisma` / `@prisma/client` 7.9.1, `@prisma/adapter-pg`

**Storage**: Prisma Postgres. Migración puramente aditiva: entidad `AdminAction` y dos campos
nuevos en `User`. Ninguna columna existente cambia

**Testing**: Vitest con puertos en memoria para dominio y casos de uso; validación manual según
[quickstart.md](./quickstart.md)

**Target Platform**: Aplicación web renderizada en servidor

**Project Type**: Aplicación full-stack única, arquitectura por capas

**Performance Goals**: Alta completa en menos de 1 minuto (SC-001); efecto de una desactivación
visible en menos de 5 minutos (SC-007)

**Constraints**: Cero credenciales en nuestro almacenamiento; el alta no envía correos (FR-008);
ningún fallo parcial puede dejar identidades sin perfil (FR-007, SC-006); imposible dejar el
sistema sin administradores (FR-014, SC-008)

**Scale/Scope**: Decenas de personas. Búsqueda simple, sin paginación compleja

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Evaluado contra `.specify/memory/constitution.md` v1.3.0. **Segunda evaluación (post-diseño
Fase 1): todos los gates siguen en verde.**

- [x] **I. Screaming Architecture**: se amplía `src/modules/access/`, la capacidad de negocio que
      ya cubre identidad y autorización. No se crea un módulo nuevo ni carpetas técnicas.
- [x] **II. Dependency Rule**: los casos de uso nuevos dependen de puertos; `domain/` sigue sin
      importar nada.
- [x] **III. SDK-First**: cinco casos de uso nuevos exportados desde `index.ts`, todos
      ejecutables desde Node plano. Ninguna firma recibe `FormData` ni `Request` — ver
      [contracts/people-management-sdk.md](./contracts/people-management-sdk.md).
- [x] **IV. Thin Adapters**: las server actions llaman `authorize("user:manage")` y delegan en un
      caso de uso. Cero acceso a datos bajo `src/app/`.
- [x] **V. Dependency Injection**: `AuditLog` entra como puerto inyectado. La hora sigue viniendo
      de `Clock`.
- [x] **VI. Ports**: las operaciones administrativas de Clerk entran por `IdentityProvider`
      extendido; ningún tipo suyo cruza fuera de `infrastructure/`.
- [x] **Testing**: las cinco reglas nuevas —incluidas FR-014 y FR-019— se prueban con dobles en
      memoria, sin base ni red.
- [x] **Convenciones**: props como `<ComponentName>Props`; sin comentarios en el código;
      identificadores en inglés con español solo en texto de pantalla; estilos en
      `.module.scss` colocalizados.
- [x] **Tooling**: no se añaden capas ni módulos nuevos, así que `boundaries/elements` no cambia.

**Sin violaciones.** La tabla de Complexity Tracking queda vacía.

## Project Structure

### Documentation (this feature)

```text
specs/002-people-management/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/people-management-sdk.md
└── checklists/requirements.md
```

### Source Code (repository root)

```text
prisma/
├── schema.prisma                       # + AdminAction, firstSignInAt
└── migrations/                         # migración aditiva

src/
├── app/panel/personas/
│   ├── page.tsx                        # Lista y búsqueda
│   ├── actions.ts                      # Server actions: authorize + delegar
│   ├── personas.module.scss
│   ├── create-person-form.tsx          # CreatePersonFormProps
│   ├── people-table.tsx                # PeopleTableProps
│   └── [id]/
│       ├── page.tsx                    # Roles y activación
│       └── actions.ts
├── modules/access/
│   ├── domain/
│   │   ├── user.ts                     # + firstSignInAt, hasSignedIn
│   │   └── errors.ts                   # + EmailAlreadyRegistered, LastAdministrator,
│   │                                   #   SelfDeactivation, IdentityCreationFailed
│   ├── application/
│   │   ├── ports/
│   │   │   ├── identity-provider.ts    # + createIdentity, deleteIdentity, deactivate, reactivate
│   │   │   ├── user-repository.ts      # + findByEmail, list, create, markFirstSignIn,
│   │   │   │                           #   setStatus, countActiveWithPermissionExcluding
│   │   │   └── audit-log.ts            # nuevo
│   │   └── use-cases/
│   │       ├── create-person.ts
│   │       ├── list-people.ts
│   │       ├── change-roles.ts
│   │       ├── deactivate-person.ts
│   │       ├── reactivate-person.ts
│   │       └── sync-signed-in-user.ts  # MODIFICADO: fija firstSignInAt la primera vez
│   ├── infrastructure/
│   │   ├── clerk-identity-provider.ts  # + createUser, deleteUser, banUser, unbanUser
│   │   ├── prisma-user-repository.ts   # + consultas nuevas
│   │   └── prisma-audit-log.ts         # nuevo
│   └── index.ts                        # + cinco casos de uso y cuatro errores
└── composition/container.ts            # cablea AuditLog

tests/unit/access/                      # create-person, change-roles, deactivate-person
```

**Structure Decision**: todo dentro de `access`. Gestionar quién entra y qué puede hacer es la
misma capacidad de negocio que la 001 ya nombra; un módulo `admin` separado tendría que importar
`User`, `Role` y `authorize` en cada operación, creando dos módulos acoplados donde hay uno.

## Complexity Tracking

> Sin violaciones que justificar.

Dos elementos podrían parecer complejidad añadida y no lo son:

| Elemento              | Por qué es necesario                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `identityId` nullable | Es lo que permite que el registro local preceda a la identidad, que es lo que hace seguro el orden de escritura (research §R2) |

## Implementation Phases

| Fase | Contenido                                                                                | Por qué va aquí                              |
| ---- | ---------------------------------------------------------------------------------------- | -------------------------------------------- |
| 1    | Migración aditiva: `firstSignInAt`, `AdminAction`, permiso `user:manage`                 | Cimiento; no rompe nada de la 001            |
| 2    | Dominio: `hasSignedIn` y los cuatro errores nuevos                                       | No depende de nada                           |
| 3    | Puerto `AuditLog` y extensión de los existentes                                          | Contra interfaces                            |
| 4    | Casos de uso con dobles en memoria, **empezando por FR-014 y FR-019**                    | Las invariantes primero: son lo irreversible |
| 5    | `createPerson` con su compensación, probada con un proveedor que falla                   | El corazón de FR-007                         |
| 6    | `sync-signed-in-user`: fijar `firstSignInAt`, con las 5 pruebas de la 001 intactas       | Cambio mínimo sobre código existente         |
| 7    | Infraestructura: `createUser`/`deleteUser`/`banUser` en Clerk, repositorios, transacción | Implementan puertos ya definidos             |
| 8    | Composición y adapters: pantallas, server actions, SCSS                                  | Consume el SDK ya probado                    |

**Sin enmiendas pendientes.** Con este diseño, FR-003 ("crear tanto la identidad como el perfil
local en un solo acto") se cumple al pie de la letra, y FR-008 declara explícitamente la ausencia
de correos. La spec y el plan coinciden.
