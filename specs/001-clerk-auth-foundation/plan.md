# Implementation Plan: Acceso por Invitación con Código de un Solo Uso

**Branch**: `001-clerk-auth-foundation` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-clerk-auth-foundation/spec.md`

## Summary

Establecer la puerta de entrada del sistema y la base de datos que lo sostiene. Clerk es el
proveedor de identidad (enlace mágico, en modo solo-invitación); nuestra base de datos guarda
únicamente un perfil de negocio sincronizado más el modelo propio de roles y permisos. Todo el
acceso al proveedor y a la base pasa por puertos, de modo que las reglas de negocio no conozcan ni
a Clerk ni a Prisma.

El feature entrega tres cosas que van juntas: la infraestructura de datos (Prisma sobre la base ya
aprovisionada), la integración de identidad (Clerk en `src/proxy.ts` y pantallas de ingreso), y el
módulo de negocio `access` que sincroniza perfiles y decide autorizaciones.

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict), Node.js — pin deliberado, ver constitución §Tooling

**Primary Dependencies**: Next.js 16.3.1 (App Router), React 19.2.8, `@clerk/nextjs` ^7.7.8,
`prisma` / `@prisma/client` ^7.9.1, `@prisma/adapter-pg`

**Storage**: Prisma Postgres (nube, ya aprovisionada). Cliente generado a `prisma/generated/client`

**Testing**: Vitest para unidad de dominio y casos de uso con puertos en memoria. Validación
manual de extremo a extremo según [quickstart.md](./quickstart.md)

**Target Platform**: Aplicación web renderizada en servidor

**Project Type**: Aplicación full-stack única con arquitectura por capas (ver constitución)

**Performance Goals**: Enlace en buzón < 1 min (SC-002); ingreso completo < 2 min (SC-001).
La sincronización JIT añade como máximo una escritura por sesión

**Constraints**: TypeScript no puede subir a 7.x ni ESLint a 10.x sin romper el linter de
arquitectura. Cero credenciales o tokens en nuestro almacenamiento (FR-015, SC-004)

**Scale/Scope**: Decenas de personas del equipo ALMG, no miles. 3 roles iniciales, 4 entidades,
4 rutas

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Evaluado contra `.specify/memory/constitution.md` v1.2.0. **Segunda evaluación (post-diseño
Fase 1): todos los gates siguen en verde.**

- [x] **I. Screaming Architecture**: se crea `src/modules/access/`, nombrado por la capacidad de
      negocio (control de acceso), no por rol técnico. No se crean carpetas tipo `services/`
      o `utils/`.
- [x] **II. Dependency Rule**: `domain/` no importa nada; `application/` solo dominio y sus
      puertos; `infrastructure/` implementa puertos. Ningún import hacia afuera.
- [x] **III. SDK-First**: seis casos de uso exportados desde `src/modules/access/index.ts`,
      todos invocables desde un script de Node plano. Ninguna firma recibe `FormData`,
      `Request` ni `NextRequest` — ver [contracts/access-sdk.md](./contracts/access-sdk.md).
- [x] **IV. Thin Adapters**: las server actions traducen entrada, llaman **un** caso de uso y
      traducen salida. Cero SQL, cero cliente de Prisma y cero `fetch` a terceros bajo
      `src/app/` o `src/components/`.
- [x] **V. Dependency Injection**: los casos de uso reciben `{ identity, users, roles, clock }`
      tipados por puertos. Las concretas y `process.env` se nombran solo en `src/composition/`.
      La hora entra por el puerto `Clock`; no hay `new Date()` dentro de un caso de uso.
- [x] **VI. Ports**: base de datos tras `UserRepository`/`RoleRepository`, proveedor de identidad
      tras `IdentityProvider`. Los tipos de Clerk y Prisma no cruzan fuera de `infrastructure/`.
      Cada puerto tendrá un doble en memoria.
- [x] **Testing**: dominio y casos de uso son ejecutables con dobles en memoria, sin base de datos
      ni red.
- [x] **Tooling**: `src/modules/access/*` encaja en los descriptores existentes. **Requiere
      ampliar `eslint.config.mjs`** antes de instalar dependencias (ver research §R8); sin eso
      el Principio VI queda descubierto justo para el proveedor que este feature introduce.

**Nota sobre el prompt de Clerk aportado**: sus Pasos 6 y "After Setup" (agregar `<SignUpButton />`
y registrarse como primer usuario) **violan FR-006 y FR-007**. Se descartan y se sustituyen por
invitación desde el dashboard más seed de rol (research §R6). El resto del prompt se sigue.

## Project Structure

### Documentation (this feature)

```text
specs/001-clerk-auth-foundation/
├── plan.md              # Este archivo
├── spec.md              # Especificación
├── research.md          # Fase 0
├── data-model.md        # Fase 1
├── quickstart.md        # Fase 1
├── contracts/
│   └── access-sdk.md    # Fase 1
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
prisma/
├── schema.prisma                     # Modelos User, Role, Permission y tablas puente
├── seed.ts                           # Catálogo de roles + primer admin (FR-025)
└── generated/client/                 # Cliente generado — FUERA de src/ a propósito (R4)

prisma.config.ts                      # Requerido por Prisma 7

src/
├── proxy.ts                          # clerkMiddleware — Next 16 usa proxy.ts, no middleware.ts
├── app/
│   ├── layout.tsx                    # ClerkProvider dentro de <body>
│   ├── page.tsx                      # Portada pública
│   ├── ingresar/
│   │   ├── page.tsx                  # <SignIn /> — enlace mágico (FR-001)
│   │   └── verificar/page.tsx        # Canje del enlace (FR-003)
│   └── panel/
│       ├── page.tsx                  # Primera pantalla autenticada
│       └── actions.ts                # Server actions: traducen y delegan
├── components/
│   └── auth/                         # Controles de sesión (UserButton, cerrar sesión)
├── modules/access/
│   ├── domain/
│   │   ├── user.ts, role.ts, permission.ts
│   │   ├── values.ts                 # UserId, IdentityId, Email (normaliza minúsculas, FR-016)
│   │   └── errors.ts                 # NotAuthenticated, UserInactive, PermissionDenied…
│   ├── application/
│   │   ├── ports/                    # identity-provider.ts, user-repository.ts, role-repository.ts
│   │   └── use-cases/                # sync-signed-in-user, get-current-user, authorize, can,
│   │                                 # assign-role, revoke-role
│   ├── infrastructure/
│   │   ├── clerk-identity-provider.ts    # Único lugar con @clerk/nextjs/server
│   │   ├── prisma-user-repository.ts     # Único lugar con el cliente generado
│   │   └── prisma-role-repository.ts
│   └── index.ts                      # Superficie SDK pública
├── shared/
│   ├── clock.ts                      # Puerto Clock + SystemClock
│   └── result.ts
└── composition/
    ├── env.ts                        # Único lugar que lee process.env, validado al arrancar
    ├── prisma.ts                     # Singleton del cliente (no en lib/, va aquí por Principio V)
    └── container.ts                  # Fábricas que cablean casos de uso con concretas

tests/
├── unit/access/                      # Casos de uso con puertos en memoria
└── integration/                      # Repositorios contra base real
```

**Structure Decision**: un solo módulo de capacidad, `access`. La especificación cubre identidad,
perfil y autorización, que en esta etapa son una sola capacidad cohesionada: los permisos se
resuelven a partir del usuario sincronizado. Partirlo en `identity` y `authorization` crearía dos
módulos que se importan mutuamente en cada operación, lo que el Principio I desaconseja.

Dos decisiones fuera de lo convencional, ambas justificadas en research:

1. **El cliente de Prisma se genera en `prisma/generated/client`, no en `app/generated/prisma`**
   como sugiere la guía oficial. En este repositorio `src/app/` es la capa de adapters; generar
   ahí metería el acceso a datos exactamente donde el Principio IV lo prohíbe (research §R4).
2. **El singleton de Prisma vive en `src/composition/prisma.ts`, no en `src/lib/prisma.ts`.**
   El patrón habitual lo importa ambientalmente desde cualquier sitio; el Principio V exige que se
   inyecte y que las concretas se nombren en un único lugar.

## Complexity Tracking

> Sin violaciones. Ninguna decisión de este plan requiere excepción a la constitución.

La única desviación respecto a la documentación oficial de terceros (ubicación del cliente
generado y del singleton) **existe para cumplir la constitución**, no para saltársela, así que no
constituye deuda ni requiere justificación de complejidad.

## Implementation Phases

Orden obligado por la dirección de dependencias (constitución, tasks-template):

| Fase | Contenido                                                                                                         | Por qué va aquí                                                             |
| ---- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 0    | Ampliar `eslint.config.mjs` (`@clerk/*`, `@prisma/*`, `@generated/*`) y **verificar con violaciones deliberadas** | Antes de instalar: si el linter no cubre a Clerk, el Principio VI nace roto |
| 1    | Prisma: instalar, `schema.prisma`, `prisma.config.ts`, alias `@generated/*`, migración inicial                    | Es el cimiento de los repositorios                                          |
| 2    | Dominio: entidades, value objects con normalización de correo, errores                                            | No depende de nada                                                          |
| 3    | Puertos y casos de uso, con dobles en memoria y pruebas                                                           | Contra interfaces, sin concretas todavía                                    |
| 4    | Infraestructura: `ClerkIdentityProvider`, repositorios Prisma                                                     | Implementan puertos ya definidos                                            |
| 5    | Composición: `env.ts` validado, singleton, contenedor                                                             | Cablea lo anterior                                                          |
| 6    | Adapters: `proxy.ts`, `ClerkProvider`, pantallas de ingreso, `/panel`, server actions                             | Consume el SDK ya funcionando                                               |
| 7    | Seed de roles + primer admin; configurar Clerk en modo solo-invitación                                            | Cierra FR-025 y FR-007                                                      |

**Configuración manual requerida del usuario** (no se puede hacer desde el código):

- Dashboard de Clerk → modo de acceso **Restricted / Invite-only** (FR-006, FR-007). Sin esto,
  la aplicación queda abierta al registro aunque no mostremos ningún botón.
- Dashboard de Clerk → habilitar **email link (magic link)** y desactivar contraseña.
- Cadena de conexión **`postgres://`** de Prisma Postgres, no la variante `prisma+postgres://`,
  porque `@prisma/adapter-pg` requiere la directa (research §R4).
