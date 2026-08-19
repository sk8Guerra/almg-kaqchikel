# Implementation Plan: Autorización de Dos Roles

**Branch**: `003-two-role-authorization` | **Date**: 2026-08-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-two-role-authorization/spec.md`

## Summary

Sustituir el modelo de roles con permisos agrupados por uno de dos roles fijos: `admin`, con
autoridad total e **implícita** sobre todas las áreas presentes y futuras, y `member`, sin nada
por omisión y con permisos concedidos explícitamente por área y operación.

La decisión que sostiene el feature es que la autoridad del administrador **no se almacena**. Si
se materializara como filas, incorporar un área obligaría a actualizar a cada administrador, y
olvidarlo fallaría en silencio: exactamente el problema que este feature elimina.

Como consecuencia, la indirección Persona → Rol → Permiso deja de agrupar nada y desaparece: de
cinco tablas de autorización se pasa a dos.

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict) — pin deliberado, ver constitución §Tooling

**Primary Dependencies**: Next.js 16.3.1, React 19.2.8, `@clerk/nextjs` 7.7.8,
`prisma` / `@prisma/client` 7.9.1, `@prisma/adapter-pg`

**Storage**: Prisma Postgres. Se añade `users.role` y `user_permissions`; se eliminan `roles`,
`user_roles`, `role_permissions` y `permissions`

**Testing**: Vitest con puertos en memoria. Las pruebas de las features 001 y 002 que dependían de
roles **deben cambiar**: el modelo que verificaban ya no existe

**Target Platform**: Aplicación web renderizada en servidor

**Performance Goals**: Alta de un miembro con permisos en menos de 2 minutos (SC-006); efecto de
un cambio de rol o permisos en menos de 5 minutos (SC-007)

**Constraints**: Ningún registro de permisos por administrador (FR-006); la capacidad de cambiar
roles y permisos no puede ser concedible (FR-018, FR-019); imposible quedarse sin administradores
(FR-020)

**Scale/Scope**: Decenas de personas. Un área hoy, catálogo preparado para crecer

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Evaluado contra `.specify/memory/constitution.md` v1.3.0. **Segunda evaluación (post-diseño
Fase 1): todos los gates siguen en verde.**

- [x] **I. Screaming Architecture**: todo cae en `src/modules/access/`, la capacidad que ya cubre
      identidad y autorización. No se crea módulo ni carpeta técnica nueva.
- [x] **II. Dependency Rule**: el catálogo de áreas y `grants` viven en `domain/` y no importan
      nada. Los casos de uso dependen de puertos.
- [x] **III. SDK-First**: ocho casos de uso exportados desde `index.ts`, todos ejecutables desde
      Node plano — ver [contracts/](./contracts/authorization-sdk.md).
- [x] **IV. Thin Adapters**: las server actions comprueban la guarda y delegan. Cero acceso a
      datos bajo `src/app/`.
- [x] **V. Dependency Injection**: sin puertos nuevos; los existentes se extienden y `Clock` sigue
      inyectado.
- [x] **VI. Ports**: el almacenamiento sigue tras `UserRepository`. El catálogo de áreas es
      dominio puro, no un recurso externo.
- [x] **Testing**: `grants` es una función pura; las cuatro guardas se prueban con dobles en
      memoria, sin base ni red.
- [x] **Convenciones**: props `<ComponentName>Props`, sin comentarios, identificadores en inglés
      con español solo en texto de pantalla, estilos en `.module.scss`.
- [x] **Tooling**: no se añaden capas ni módulos, así que `boundaries/elements` no cambia.

**Sin violaciones.**

## Project Structure

### Documentation (this feature)

```text
specs/003-two-role-authorization/
├── plan.md · spec.md · research.md · data-model.md · quickstart.md
├── contracts/authorization-sdk.md
└── checklists/requirements.md
```

### Source Code (repository root)

```text
prisma/
├── schema.prisma                       # + users.role, user_permissions; − 4 tablas
└── seed.ts                             # se reduce a conceder ADMIN al primero

src/
├── app/panel/personas/
│   ├── create-person-form.tsx          # elige rol; si member, matriz de permisos
│   ├── permission-matrix.tsx           # NUEVO — áreas × operaciones
│   ├── actions.ts
│   └── [id]/
│       ├── page.tsx · actions.ts
│       └── person-controls.tsx         # rol + permisos, visibles solo a admin
├── modules/access/
│   ├── domain/
│   │   ├── modules.ts                  # NUEVO — catálogo de áreas y PermissionKey
│   │   ├── authorization.ts            # NUEVO — grants()
│   │   ├── user.ts                     # + role
│   │   ├── errors.ts                   # + AdminRequired, SelfDemotion,
│   │   │                               #   MemberWithoutPermissions, UnknownPermission
│   │   ├── role.ts · permission.ts     # ELIMINADOS
│   │   └── index.ts
│   ├── application/
│   │   ├── ports/
│   │   │   ├── user-repository.ts      # + permisos y rol
│   │   │   └── role-repository.ts      # ELIMINADO
│   │   └── use-cases/
│   │       ├── authorize.ts · can.ts   # reescritos sobre grants()
│   │       ├── create-person.ts        # recibe rol y permisos
│   │       ├── change-permissions.ts   # NUEVO
│   │       ├── change-role.ts          # NUEVO
│   │       ├── change-roles.ts         # ELIMINADO
│   │       ├── assign-role.ts          # ELIMINADO
│   │       └── revoke-role.ts          # ELIMINADO
│   ├── infrastructure/
│   │   ├── prisma-user-repository.ts   # + permisos y rol
│   │   └── prisma-role-repository.ts   # ELIMINADO
│   └── index.ts
└── composition/container.ts            # deja de cablear RoleRepository

tests/unit/access/                      # authorization, create-person, change-role,
                                        # change-permissions, escalation
scripts/check-orphans.ts                # + permisos sobre áreas inexistentes
```

**Structure Decision**: sin cambios estructurales. Este feature redefine el contenido del módulo
`access`, no su lugar. Que un cambio de esta profundidad no mueva ninguna frontera es la señal de
que las fronteras estaban bien puestas.

## Complexity Tracking

> Sin violaciones que justificar.

Dos decisiones podrían leerse como atajos y conviene dejar por qué no lo son:

| Decisión                               | Por qué es correcta                                                                                                                                                                                                  |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `role === "admin"` decide en `grants`  | Autorizar por rol es un error cuando dispersa la política. Aquí ocurre en **un único punto** del dominio, `admin` es un superusuario explícito, y el resto del sistema sigue preguntando por permisos (research §R1) |
| Catálogo de áreas en código, sin tabla | Un área **es** código; una tabla sería una copia a sincronizar a mano. Además hace que una clave mal escrita no compile (research §R2)                                                                               |

Y una simplificación deliberada: **se eliminan cuatro tablas**. Conservarlas "por si vuelven más
roles" dejaría tablas que ninguna consulta usa, y una tabla que nadie lee se desincroniza en
silencio.

## Implementation Phases

| Fase | Contenido                                                                        | Por qué va aquí                                                         |
| ---- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1    | Catálogo `modules.ts` y `grants()` en dominio, con pruebas                       | Puro, sin dependencias; es el corazón del feature                       |
| 2    | Errores nuevos y `user.role` en el dominio                                       | No depende de nada                                                      |
| 3    | Migración: `users.role`, `user_permissions`, enum de bitácora; eliminar 4 tablas | Después del dominio para que el esquema siga a la decisión, no al revés |
| 4    | Puerto `UserRepository` extendido; eliminar `RoleRepository`                     | Contra interfaces                                                       |
| 5    | **Las cuatro guardas con dobles en memoria, incluida la prueba de escalada**     | Lo irreversible primero                                                 |
| 6    | `authorize`/`can` reescritos; `createPerson`, `changeRole`, `changePermissions`  | Sobre puertos ya definidos                                              |
| 7    | Infraestructura y composición; eliminar el repositorio de roles                  | Implementan puertos ya probados                                         |
| 8    | Adapters: elección de rol, matriz de permisos, controles solo para admin         | Consume el SDK ya funcionando                                           |
| 9    | Enmendar SC-008 en la spec y ampliar `check-orphans.ts`                          | Cierra el hueco detectado en research §R0                               |

**Enmienda pendiente** (research §R0): SC-008 dice que no debe haber permisos concedidos sin área
correspondiente, pero ningún requisito funcional lo produce. Con el catálogo en código no pueden
crearse, y si un área se retira sus permisos quedan **inertes**: `authorize` nunca los consulta.
SC-008 debe pasar de "no debe haber" a "son detectables e inertes". Se corrige en la Fase 9, no
antes, para no tocar la spec mientras el diseño podría cambiar.
