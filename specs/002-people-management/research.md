# Phase 0 — Research: Gestión de Personas desde el Panel

**Fecha**: 2026-08-19 · **Feature**: `002-people-management`

Verificado contra `@clerk/backend` 3.16.8 instalado, no de memoria.

---

## R1. Capacidades reales del proveedor (verificadas)

| Operación                    | Método                            | Notas                                                         |
| ---------------------------- | --------------------------------- | ------------------------------------------------------------- |
| Crear identidad ya existente | `users.createUser()`              | Devuelve el ID al instante. **No envía correo**               |
| Borrar identidad             | `users.deleteUser()`              | Solo para compensar un alta fallida, nunca para dar de baja   |
| Desactivar / reactivar       | `users.banUser()` / `unbanUser()` | Ya lo leemos en `ClerkIdentityProvider`                       |
| Listar y buscar              | `users.getUserList()`             | Filtro `query`, `emailAddress[]`, orden por `last_sign_in_at` |
| Saber si entró alguna vez    | campo `lastSignInAt`              |                                                               |

`createUser` **no tiene opción de notificación**: se confirmó revisando `CreateUserParams`. En
este diseño eso no es una limitación sino el comportamiento deseado (FR-008).

---

## R2. Cómo se da de alta: `createUser`, sin invitaciones ni correos _(decisión central)_

**Decisión**: el alta llama a `users.createUser()`, que devuelve el `identityId` al instante, y
con él se escribe el perfil local con sus roles en la misma operación. **No se envían correos de
ningún tipo.** La persona ingresa por su cuenta pidiendo su código en la pantalla de acceso.

**Rationale**: `createUser` devuelve el identificador de forma síncrona, lo que permite escribir
el perfil local completo —con `identityId` y roles— en un solo acto. Eso es exactamente lo que
pide FR-003, y hace innecesarias las dos complicaciones que exigiría el flujo de invitación: un
`identityId` que pueda ser nulo mientras se espera la aceptación, y un estado intermedio para
representar esa espera.

**Ventaja adicional, y no menor**: el alta deja de depender de la entrega de correo. Ese fue
precisamente el problema que obligó a cambiar el enlace mágico por el código en la feature 001;
apoyar el alta en un correo habría reintroducido la misma fragilidad por otra puerta.

**El coste**: la persona no se entera sola de que tiene acceso. Avisarle es una tarea humana de
la administradora, no del sistema (FR-008 lo declara explícitamente).

**Alternativa considerada**: `invitations.createInvitation()` con `notify: true`. Enviaba el
correo de forma nativa, pero la identidad no nace hasta que la invitación se acepta, así que
obligaba a `identityId` nullable, a un estado `INVITED`, y a que `syncSignedInUser` enlazara por
correo la invitación con la identidad al primer ingreso. Tres cambios invasivos sobre la feature
001 para obtener una notificación que se resuelve con un mensaje de WhatsApp.

---

## R3. Consistencia entre los dos sistemas (FR-007, SC-006)

**Decisión**: el orden es **proveedor → base**, con compensación por borrado si la escritura
local falla, y con el fallo residual cubierto por un comportamiento seguro en vez de por más
lógica.

```
1. identity.createUser(email) → identityId
2. users.createWithRoles(identityId, email, roles)   ← atómico dentro del repositorio
3. si (2) falla → identity.deleteIdentity(identityId) y propagar el error
```

**Rationale**: aquí el orden inverso no es posible —hasta que el proveedor no responde no hay
`identityId` que guardar—, así que la atomicidad se consigue con compensación. Borrar una
identidad recién creada que nunca ha iniciado sesión es seguro: no tiene sesiones, ni contenido,
ni referencias.

**Qué pasa si la compensación también falla** (el proveedor deja de responder justo entonces):
queda una identidad sin perfil local. Y aquí está lo importante: **ese huérfano no es un agujero
de seguridad, porque el sistema ya sabe qué hacer con él.** Si esa persona intenta entrar,
`syncSignedInUser` le crea un perfil sin ningún rol, y sin roles no puede ejecutar nada
(FR-020 de la feature 001, denegar por omisión). Entra a una pantalla vacía.

El fallo degrada a "alguien puede autenticarse y no puede hacer nada", que es el estado seguro.
Un script de reconciliación lo detecta comparando identidades del proveedor contra perfiles
locales, pero no hay urgencia porque no hay riesgo.

**Alternativa considerada**: dos fases con confirmación (crear la identidad desactivada,
escribir local, activar). Elimina la ventana, pero triplica las llamadas al proveedor y añade un
estado más al modelo para protegerse de un fallo que ya degrada de forma segura.

---

## R4. Desactivación: `banUser`, no `deleteUser`

**Decisión**: desactivar es `banUser()` en el proveedor más `status: INACTIVE` local. Nunca se
llama a `deleteUser()`.

**Rationale**: FR-017 exige conservar el trabajo y la autoría. Borrar la identidad rompería la
referencia y obligaría a decidir qué hacer con el contenido que esa persona creó. Además
`ClerkIdentityProvider` ya trata `banned` como inactivo, así que el ingreso queda bloqueado sin
tocar el código de la 001.

**Sobre el plazo de SC-007** (dejar de actuar en menos de 5 minutos): la comprobación de estado
ocurre en cada petición autenticada, no solo al iniciar sesión, así que el efecto es inmediato
para quien tenga sesión abierta.

**Alternativa considerada**: `lockUser()` — está pensado para bloqueos temporales por intentos
fallidos, no para bajas administrativas.

---

## R5. Dónde viven las dos invariantes de seguridad

**Decisión**: "no dejarse sin administradores" (FR-014) y "no autodesactivarse" (FR-019) son
**reglas de dominio**, no validaciones de interfaz.

**Rationale**: ambas producen el mismo daño irreversible —un sistema que nadie puede administrar—
y ambas son alcanzables invocando la operación directamente sin pasar por la pantalla. Una
validación en el formulario no las cubre; una regla en el caso de uso sí.

FR-014 necesita contar administradores activos **excluyendo a la persona afectada** antes de
permitir el cambio, lo que exige una consulta dedicada en el puerto de repositorio.

---

## R6. Registro de actividad administrativa (FR-022)

**Decisión**: tabla propia, solo de escritura y lectura, escrita **después** de la acción que
registra, no dentro de su transacción.

**Rationale**: meter la auditoría en la misma transacción exigiría un puerto `UnitOfWork` y que
los casos de uso orquestaran transacciones, que es justo lo que el Principio VI les evita. El
coste de no hacerlo es una ventana pequeña: si la acción se aplica y el registro falla, queda una
operación sin rastro.

Para decenas de personas en una academia, ese riesgo es aceptable y detectable; el registro sirve
para saber quién cambió qué, no como control de seguridad. Si algún día se necesita garantía
estricta, el cambio es local: la auditoría pasa a escribirse dentro del mismo método de
repositorio, sin tocar los casos de uso.

**Corrección del 2026-08-19, tras verlo fallar de verdad**: la primera implementación dejaba que
un fallo de auditoría propagara y tumbara la operación. El síntoma era peor de lo que este
apartado describía: la persona quedaba creada, el administrador veía una pantalla de error, y al
reintentar recibía "ese correo ya está registrado". Parecía corrupción de datos y no lo era.

La auditoría es ahora **best-effort**: si falla, se registra en consola y la operación continúa.
Eso es lo que este apartado siempre quiso decir —"queda una operación sin rastro"— y no lo que el
código hacía. Cubierto por `tests/unit/access/audit-is-best-effort.test.ts`.

**Alternativa considerada**: puerto `UnitOfWork` con transacción compartida. Sigue siendo la
opción correcta si algún día FR-022 debe cumplirse de forma estricta; entonces la auditoría se
confirma junto a la acción y un fallo sí debe revertirlo todo. Hoy se prefiere que el trabajo
real no dependa de que la bitácora esté disponible.

---

## R7. Extensión de los puertos existentes, sin puertos nuevos para lo mismo

**Decisión**: se extiende `IdentityProvider` con las operaciones administrativas y
`UserRepository` con las consultas nuevas. No se crea un puerto paralelo.

| Puerto               | Métodos nuevos                                                                                        |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| `IdentityProvider`   | `createIdentity`, `deleteIdentity`, `deactivateIdentity`, `reactivateIdentity`                        |
| `UserRepository`     | `findByEmail`, `list`, `create`, `markFirstSignIn`, `setStatus`, `countActiveWithPermissionExcluding` |
| `RoleRepository`     | _(sin cambios)_                                                                                       |
| `AuditLog` _(nuevo)_ | `record`                                                                                              |

**Rationale**: son el mismo recurso externo y el mismo agregado. Partirlos en
`IdentityAdminProvider` y `IdentityProvider` obligaría a la composición a cablear dos objetos
contra el mismo servicio y a mantener dos dobles en memoria coherentes entre sí.

`AuditLog` sí es puerto nuevo porque es un recurso distinto, y así podrá apuntar mañana a otro
destino sin tocar los casos de uso. **No se añade un puerto `UnitOfWork`**: la atomicidad que
hace falta cabe dentro de un solo método de repositorio (§R6).
