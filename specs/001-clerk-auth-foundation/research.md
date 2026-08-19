# Phase 0 — Research: Acceso por Invitación con Código de un Solo Uso

**Fecha**: 2026-08-18 · **Feature**: `001-clerk-auth-foundation`

Todo lo de abajo se verificó contra el registro de npm y la documentación oficial, no de memoria.

---

## R1. Archivo de red en Next.js 16: `proxy.ts`, no `middleware.ts`

**Decisión**: `clerkMiddleware()` se exporta desde `src/proxy.ts`.

**Rationale**: Next.js 16 renombró `middleware.ts` a `proxy.ts` y renombró la función exportada a
`proxy`. `middleware.ts` sigue funcionando pero está deprecado y se eliminará. Clerk ya documenta
`proxy.ts` para Next 16 y mantiene `middleware.ts` solo para Next ≤15. Como el proyecto usa
`src/`, el archivo va en `src/proxy.ts`.

**Impacto en el prompt de Clerk que entregó el usuario**: su Paso 4 dice "check `proxy.ts` or
`middleware.ts` for Next.js 15 and earlier". Para este proyecto (Next 16.3.1) es `proxy.ts`
inequívocamente.

**Alternativas consideradas**: usar `middleware.ts` — rechazado por estar deprecado desde el día
uno del proyecto.

---

## R2. Compatibilidad de versiones — verificada, sin conflictos

| Paquete          | Versión | Requisito             | Nuestro stack | Estado |
| ---------------- | ------- | --------------------- | ------------- | ------ |
| `@clerk/nextjs`  | 7.7.8   | `next: ^16.1.0-0`     | 16.3.1        | ✅     |
| `@clerk/nextjs`  | 7.7.8   | `react: ~19.2.3`      | 19.2.8        | ✅     |
| `@prisma/client` | 7.9.1   | `typescript: >=5.4.0` | 6.0.3         | ✅     |

**Por qué importaba**: el proyecto tiene TypeScript pinneado en 6.0.3 y ESLint en 9.x por
incompatibilidades del toolchain de lint (ver §Tooling de la constitución). Había riesgo real de
que Prisma exigiera TS 7. No lo hace.

**Riesgo residual**: si alguien sube TypeScript a 7.x para "modernizar", rompe el linter de
arquitectura, no Prisma. La constitución ya lo prohíbe explícitamente.

---

## R3. Cómo se cumple "solo usuarios que ya existen pueden entrar" (FR-006, FR-007)

**Decisión**: activar el modo de acceso **Restricted / Invite-only** en el dashboard de Clerk, y
no renderizar ningún componente de registro en la aplicación.

**Rationale**: Clerk tiene un modo de acceso donde el alta solo ocurre por invitación, conexión
empresarial o creación manual por un administrador. Es configuración del proveedor, no código
nuestro — que es exactamente lo que el Principio VI predice: la política de identidad vive en el
proveedor, detrás del puerto.

**Esto no se cumple solo con código**: aunque no pongamos un botón de "registrarse", si el modo de
acceso queda abierto, cualquiera puede llegar a la URL de sign-up de Clerk y crear cuenta. La
configuración del dashboard es el control real; ocultar el botón es cosmético.

**Contradicción con el prompt de Clerk del usuario**: sus Pasos 6 y "After Setup" indican agregar
`<SignUpButton />` y registrarse como primer usuario de prueba. Eso viola FR-006 y FR-007. Se
descarta ese paso y se sustituye por invitación desde el dashboard (ver R6).

**Alternativas consideradas**:

- _Allowlist por dominio de correo_ — permitiría a cualquiera con correo `@dominio` entrar sin
  invitación. Menos estricto que lo que pide la especificación.
- _Validar en nuestro código contra una tabla propia_ — duplicaría la fuente de verdad de quién
  existe, contradiciendo la decisión de arquitectura.

---

## R4. Prisma 7: generador, adaptador y ubicación del cliente generado

**Decisión**:

- Generador `prisma-client` con salida a **`prisma/generated/client`** (fuera de `src/`).
- Adaptador `@prisma/adapter-pg` con la cadena de conexión directa `postgres://`.
- `prisma.config.ts` en la raíz.

**Rationale sobre la ubicación** — este es el punto que más afecta a la arquitectura. La guía
oficial de Prisma sugiere generar el cliente en `app/generated/prisma`. **Para este repositorio
eso sería un error**: en nuestra estructura, `src/app/` es la capa de adapters del App Router.
Generar ahí significaría:

1. Miles de archivos generados clasificados como `adapter` por `boundaries/elements`.
2. Código de acceso a datos viviendo justo en la capa donde el Principio IV lo prohíbe.
3. Ruido permanente en el árbol de rutas.

Generando a `prisma/generated/client` (fuera de `src/`) el cliente queda **fuera del alcance de
`boundaries/include`**, no se clasifica, y solo `infrastructure/` lo importa mediante un alias.

**Sobre la cadena de conexión**: Prisma Postgres expone dos formatos. `@prisma/adapter-pg`
requiere el formato directo `postgres://...`. El formato `prisma+postgres://...` es de Accelerate
y necesitaría otro adaptador. Hay que tomar el correcto del dashboard.

**Alternativas consideradas**:

- _Generar dentro de `src/shared/`_ — rechazado: `shared` está declarado como primitivas sin
  dependencias, y meterle un cliente de base de datos lo contradice.
- _Salida por defecto en `node_modules`_ — deprecado en Prisma 7.

---

## R5. Sincronización del perfil de negocio: JIT en vez de webhooks

**Decisión**: sincronizar el `User` **al momento de la petición autenticada** (just-in-time
upsert), no por webhooks de Clerk.

**Rationale**:

- Cumple FR-013 y FR-014 con una sola pieza y sin exponer un endpoint público.
- No requiere túnel (ngrok/cloudflared) para desarrollo local, ni gestión de secretos de firma de
  webhook, ni reintentos idempotentes — tres fuentes de complejidad que no compran nada en esta
  entrega.
- El costo es una escritura barata en el primer request de cada sesión, mitigable comparando
  `updatedAt` de Clerk contra el perfil local antes de escribir.

**Lo que JIT no cubre**: si alguien se elimina en Clerk, su perfil local queda huérfano hasta que
un proceso lo limpie. No afecta la seguridad — Clerk deja de emitir sesión, así que no puede
entrar (FR-009) — solo deja un registro obsoleto. Aceptable en esta entrega.

**Alternativas consideradas**:

- _Webhooks de Clerk_ — la opción correcta cuando haga falta reaccionar a bajas en tiempo real o
  cuando el volumen haga costoso el upsert por request. Queda documentado como evolución natural,
  no como deuda: el puerto no cambia, solo se agrega otro adaptador que lo alimenta.

---

## R6. Arranque: la primera persona administradora (FR-025)

**Decisión**: la primera cuenta se crea **por invitación desde el dashboard de Clerk**, y el
primer rol de administrador se asigna con un script de seed de Prisma ejecutado una sola vez.

**Rationale**: con registro público desactivado y autorización que niega por omisión (FR-020), un
sistema recién desplegado no tiene forma de conceder el primer permiso a nadie. El seed rompe ese
círculo de manera explícita, auditable y versionada, en lugar de con una excepción escondida en el
código ("si no hay usuarios, el primero es admin"), que es un agujero de seguridad permanente a
cambio de una comodidad de una sola vez.

**Alternativas consideradas**:

- _Auto-promoción del primer usuario_ — rechazado: deja para siempre una ruta de escalamiento de
  privilegios si alguna vez la tabla queda vacía.
- _Variable de entorno con correo del admin_ — viable, pero mezcla configuración con datos.

---

## R7. Frontera exacta entre Clerk y nuestra capa de negocio

**Decisión**: el flujo de autenticación (pedir enlace, abrir enlace, establecer sesión) es
**100% de Clerk y vive solo en la capa de adapters**. Nuestra capa de negocio empieza _después_ de
que existe una sesión.

**Rationale**: es tentador envolver el sign-in en un caso de uso, pero sería un envoltorio vacío:
la aplicación nunca ve la credencial, ni el enlace, ni el token. Lo que sí necesita puerto es lo
que el negocio consume del proveedor: _quién es el que hace esta petición_.

Reparto concreto:

| Responsabilidad                               | Dónde vive                            | Por qué                                           |
| --------------------------------------------- | ------------------------------------- | ------------------------------------------------- |
| Pantalla de ingreso, envío y canje del enlace | `src/app/` + componentes de Clerk     | Es UI del proveedor; no hay regla de negocio      |
| Protección de rutas                           | `src/proxy.ts`                        | Frontera de red                                   |
| Leer la identidad del solicitante             | Puerto `IdentityProvider`             | El negocio no puede depender de `auth()` de Clerk |
| Sincronizar el perfil                         | Caso de uso + puerto `UserRepository` | Regla de negocio                                  |
| Decidir si puede ejecutar una acción          | Caso de uso `authorize`               | Regla de negocio (FR-019, FR-022)                 |

**Consecuencia verificable de FR-023/SC-008**: cambiar de proveedor toca `src/proxy.ts`, las
pantallas de ingreso y `ClerkIdentityProvider`. No toca `domain/`, ni los casos de uso, ni el
modelo de roles.

---

## R9. Cambio de enlace mágico a código de un solo uso (2026-08-19)

**Decisión**: el método de acceso es un **código de un solo uso** enviado por correo, no un
enlace mágico.

**Rationale**: al probar con enlace aparecieron dos fallos, uno de UX y otro potencialmente
mortal:

1. Clerk exige opcionalmente "mismo dispositivo y navegador" para los enlaces. Abrir el correo
   en otro navegador produce _"Error de cliente no coincidente"_, que fue exactamente lo que
   ocurrió en la primera prueba real.
2. Más grave: los servidores de correo institucionales suelen **pre-abrir los enlaces entrantes**
   para escanearlos. Como el enlace es de un solo uso (FR-004), el escáner lo consume antes de
   que la persona haga clic, y el acceso falla sin explicación visible para nadie.

Un código escrito a mano es inmune a ambos: no hay nada que un escáner pueda "hacer clic", y no
depende del navegador donde se abrió el correo.

**Impacto en el código**: ninguno. El flujo de autenticación vive entero en Clerk y en la capa
de adapters (§R7); cambiar de enlace a código es configuración del proveedor. Los casos de uso,
los puertos y el modelo de roles no se tocan — que es precisamente lo que el Principio VI
prometía.

**Alternativas consideradas**: desactivar "mismo dispositivo y navegador" — resolvía el fallo 1
pero dejaba intacto el 2, que es el que rompe el acceso para usuarios reales.

---

## R8. Hueco en las reglas de ESLint que este feature abre

**Decisión**: antes de instalar nada, ampliar `eslint.config.mjs`.

**Rationale**: hoy las reglas de boundaries bloquean `@prisma/client` y `next/*` en la capa de
negocio, pero **`@clerk/*` no está en ninguna lista**. Si instalamos Clerk sin tocar el linter, un
caso de uso podría importar `@clerk/nextjs/server` y llamar `auth()` directamente, y el Principio
VI quedaría sin cubrir justo en el feature que introduce el proveedor de auth.

Cambios necesarios:

| Paquete        | Lista                 | Efecto                                                                                                                         |
| -------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `@clerk/*`     | `FRAMEWORK_PACKAGES`  | Prohibido en `domain`/`application`/`sdk`; permitido en adapters (necesitan `<SignIn/>`) e infraestructura (necesita `auth()`) |
| `@prisma/*`    | `INFRA_ONLY_PACKAGES` | Cubre `@prisma/adapter-pg`, no solo `@prisma/client`                                                                           |
| `@generated/*` | `INFRA_ONLY_PACKAGES` | El alias del cliente generado, prohibido fuera de infraestructura                                                              |

**Verificación exigida**: igual que cuando se montaron las reglas, hay que comprobar con
violaciones deliberadas que cada entrada nueva dispara. Una lista ampliada sin probar es una lista
que se cree que funciona.
