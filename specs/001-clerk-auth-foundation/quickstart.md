# Quickstart — Validación del feature

**Feature**: `001-clerk-auth-foundation` · **Fecha**: 2026-08-18

Guía para comprobar que el feature funciona de extremo a extremo. No contiene implementación; los
detalles de diseño están en [plan.md](./plan.md) y [contracts/](./contracts/access-sdk.md).

---

## Prerrequisitos

1. **Cuenta de Clerk** con la aplicación `app_3I63cAe9qSRJJmryeOMZcNy5ohg` y su clave publicable
   y secreta a mano.
2. **Base de datos Prisma Postgres** aprovisionada, con la cadena **`postgres://...`** (la
   directa, no `prisma+postgres://`).
3. Variables en `.env.local` — nunca commiteadas:
   `DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`.
4. **Configuración en el dashboard de Clerk** (no se puede hacer por código):
   - Access mode → **Restricted / Invite-only**
   - Email verification **code** habilitado; enlace y contraseña desactivados

---

## Puesta en marcha

```bash
pnpm install
pnpm prisma migrate dev          # crea el esquema en la base
pnpm prisma db seed              # catálogo de roles
pnpm dev
```

---

## Escenarios de validación

### V1 — Ingreso con código de un solo uso (US1, FR-001…FR-005)

1. Invita tu correo desde el dashboard de Clerk.
2. Abre `/ingresar`, escribe ese correo y solicita acceso.
3. **Esperado**: el código llega en menos de 1 minuto (SC-002).
4. Escribe el código. **Esperado**: entras a `/panel` y ves tu identidad. Nunca se pidió contraseña.
5. Vuelve a usar el mismo código. **Esperado**: rechazado, con opción de pedir otro (FR-004).

### V2 — Rechazo de quien no está autorizado (US2, FR-006…FR-008)

1. En `/ingresar` escribe un correo **no invitado**.
2. **Esperado**: no se crea cuenta, no se obtiene sesión, y el mensaje **no revela** si el correo
   existe (FR-008).
3. Comprueba en el dashboard de Clerk que no apareció ningún usuario nuevo.
4. Recorre la aplicación buscando "registrarse" o "crear cuenta". **Esperado**: no existe (FR-007).

> **Prueba crítica de configuración**: intenta llegar a la URL de sign-up de Clerk directamente.
> Si permite crear cuenta, el modo solo-invitación **no** está activo y FR-006 no se cumple,
> aunque la interfaz no muestre ningún botón.

### V3 — Perfil sincronizado (US3, FR-012…FR-016)

1. Entra por primera vez y consulta la tabla `User`. **Esperado**: una fila con tu `identityId`.
2. Cierra sesión y vuelve a entrar. **Esperado**: sigue habiendo **una sola** fila (FR-013).
3. Cambia tu nombre en Clerk, vuelve a entrar. **Esperado**: `displayName` actualizado (FR-014).
4. Entra con el correo en mayúsculas. **Esperado**: no se crea un segundo perfil (FR-016).

### V4 — Sin credenciales almacenadas (FR-015, SC-004)

```bash
grep -riE 'password|passwordHash|sessionToken|mfaSecret|refreshToken' prisma/schema.prisma
```

**Esperado**: sin coincidencias. Después, inspecciona una fila real de `User` y confirma que solo
contiene perfil de negocio.

### V5 — Autorización (US4, FR-017…FR-022)

1. Sin roles asignados, intenta una acción protegida. **Esperado**: denegada (FR-020).
2. Asigna `admin` con el seed y repite. **Esperado**: permitida.
3. Retira el rol y repite. **Esperado**: denegada, sin recrear la cuenta (FR-021).
4. **Invoca la server action directamente**, sin pasar por la interfaz, con una cuenta sin
   permiso. **Esperado**: denegada. Este paso es el que realmente verifica FR-022 — ocultar el
   botón no es protección.

### V6 — Cuenta desactivada (FR-009)

1. Solicita un código y **no lo uses**.
2. Desactiva esa cuenta en Clerk.
3. Escribe el código. **Esperado**: acceso denegado pese a que el código no expiró.

---

## Verificación de arquitectura

Estos son los gates de la constitución; deben pasar antes de dar el feature por terminado.

```bash
pnpm verify        # prettier --check && eslint . && tsc --noEmit
pnpm test          # dominio y casos de uso con puertos en memoria
pnpm build
```

### La prueba que de verdad importa (Principio III)

Ejecutar un caso de uso **desde Node plano**, sin React, sin Next.js y sin petición HTTP:

```bash
pnpm tsx scripts/smoke-access.ts   # instancia el contenedor y llama getCurrentUser/authorize
```

Si esto requiere levantar Next.js o simular una petición, el módulo **no** cumple SDK-First y la
promesa de "cambiar React sin tocar el negocio" es falsa.

### Verificación de las reglas de frontera

Igual que cuando se montaron las reglas, hay que comprobar que las entradas nuevas disparan.
Crear temporalmente cada violación, confirmar que `pnpm lint` falla, y borrarla:

| Violación de prueba                                                              | Regla que debe dispararse                  |
| -------------------------------------------------------------------------------- | ------------------------------------------ |
| `import { auth } from "@clerk/nextjs/server"` en un caso de uso                  | `boundaries/external` (Principio III)      |
| `import { PrismaClient } from "@generated/prisma"` en `src/app/panel/page.tsx`   | `boundaries/external` (Principio IV)       |
| `import { PrismaUserRepository } from "../infrastructure/..."` en un caso de uso | `boundaries/element-types` (Principio II)  |
| `import { User } from "@/modules/access/domain/user"` en un componente           | `boundaries/element-types` (Principio III) |

Una lista de paquetes ampliada y no probada es una lista que **se cree** que funciona.
